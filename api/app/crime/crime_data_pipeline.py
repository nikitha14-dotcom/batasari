import logging
import os
from copy import deepcopy
from functools import lru_cache
from pathlib import Path
from typing import Any

import geopandas as gpd
import pandas as pd
from shapely import Point

from app.crime.geocoding_client import geocode_address

logger = logging.getLogger(__name__)

_DATA_DIR = Path(__file__).parent
_CRIME_RESPONSE_CACHE_SIZE = 64
_COORDINATE_PRECISION = 5


class CrimeDataError(Exception):
    """Base for failures that are ours, not the caller's."""


class CrimeDataUnavailable(CrimeDataError):
    """The datasets could not be read -- missing from the image, or corrupt."""


class CrimeYearUnavailable(CrimeDataError):
    """The datasets do not cover the requested rate_year."""


class _CrimeDataNotFound(Exception):
    """Internal signal that keeps genuine misses out of functools.lru_cache."""

# The 9 offence categories traked by TPS's Neighbourhood Crime Rates datasets.
# Used to build column names like "ASSAULT_RATE_2025" and to build the
# per-category breakdown in the response payload
CRIME_CATEGORIES = [
    "ASSAULT",
    "AUTOTHEFT",
    "BIKETHEFT",
    "BREAKENTER",
    "ROBBERY",
    "THEFTOVER",
    "HOMICIDE",
    "SHOOTING",
    "THEFTFROMMV",
]


# The only incident columns the response payload uses. The source CSV has 31
# columns over 486k rows: reading all of them builds a 605MB frame, reading
# these six builds 109MB. The container has 2Gi, so the difference is the
# difference between two concurrent requests being fine and being an OOM.
_MCI_COLUMNS = [
    "EVENT_UNIQUE_ID",
    "OFFENCE",
    "LAT_WGS84",
    "LONG_WGS84",
    "HOOD_158",
    "OCC_YEAR",
]


# Both datasets are read-only reference data. They are loaded once per file
# signature rather than per request, so replacing either extract invalidates
# the parsed frame as well as the computed response. Callers must treat what
# comes back as frozen, a mutation here is visible to every later request.
@lru_cache(maxsize=2)
def _load_incidents(
    mci_csv_path: str,
    mci_signature: tuple[int, int],
) -> pd.DataFrame:
    del mci_signature
    incidents = pd.read_csv(mci_csv_path, usecols=_MCI_COLUMNS, low_memory=False)
    # Normalised once, not per request. HOOD_158 arrives float-like ("165.0")
    # while HOOD_ID from the geojson is a clean int, so both go to "165".
    incidents["HOOD_158_str"] = (
        incidents["HOOD_158"].astype(str).str.replace(r"\.0$", "", regex=True).str.strip()
    )
    return incidents


# Keyed on rate_year and signature as well as path: the column list below is
# year-specific, and a replacement dataset must produce a fresh frame.
@lru_cache(maxsize=4)
def _load_neighbourhoods(
    geojson_path: str,
    rate_year: int,
    geojson_signature: tuple[int, int],
) -> gpd.GeoDataFrame:
    del geojson_signature
    rate_columns = [f"{cat}_RATE_{rate_year}" for cat in CRIME_CATEGORIES]
    count_columns = [f"{cat}_{rate_year}" for cat in CRIME_CATEGORIES]
    population_column = f"POPULATION_{rate_year}"
    return gpd.read_file(
        geojson_path,
        columns=[
            "HOOD_ID",
            "AREA_NAME",
            population_column,
            *rate_columns,
            *count_columns,
            "geometry",
        ],
    )


def _dataset_signature(path: str) -> tuple[int, int]:
    """Return a cheap signature that changes when a bundled dataset is replaced."""
    stat = Path(path).stat()
    return stat.st_size, stat.st_mtime_ns


def _normalise_coordinate(value: float) -> float:
    normalised = round(float(value), _COORDINATE_PRECISION)
    return 0.0 if normalised == 0 else normalised


# NOTE: despite the generic function name, the underlying datasets and the
# 158-neighbourhood join logic are Toronto specific for now.
def _compute_crime_data(
        lat: float,
        lon: float,
        geojson_path: str = str(
            _DATA_DIR / "Neighbourhood_Crime_Rates_Open_Data_179142238816317979.geojson"
        ),
        mci_csv_path: str = str(
            _DATA_DIR / "Major_Crime_Indicators_Open_Data_1579054118756352687.csv"
        ),
        rate_year: int = 2025,
        *,
        geojson_signature: tuple[int, int],
        mci_signature: tuple[int, int],
) -> dict[str, Any] | None:
    """ Resolve a coordinate to a toronto neighborhood and return enriched crime data.
    
    Given a latitude/longitude, this function:
    1. Loads the neighbourhood boundaries + per-neighbourhood crime rates.
    2. Finds which of the 158 Toronto neighbourhoods contains the point
       (point-in-polygon spatial join)
    3. For each of the 9 crime categories, computes the city-wide average rate(population-weighted)
       and how far the matched neighbourhood's rate differs from that average, as a percentage.
    4. Loads individual incident-level records (for map plotting) and filters them down to
       just the matched neighbourhood
    """
    try:
        population_column = f"POPULATION_{rate_year}"

        gdp_neighborhoods = _load_neighbourhoods(
            geojson_path,
            rate_year,
            geojson_signature,
        )

        # Wrap the input coordinate as a GeoDataFrame so we can spatially
        user_point = Point(lon,lat)
        gpd_user_location = gpd.GeoDataFrame([{'geometry': user_point}], crs="EPSG:4326")


        # point-in-polygon join: fin which neighbourhood polygon contains
        # our point. how="inner" == if the point isn't inside any polygon
        # matched_hood comes back empty
        matched_hood = gpd.sjoin(
            gpd_user_location, gdp_neighborhoods, how="inner", predicate="intersects"
            )

        if matched_hood.empty:
            # The one genuine "not found": the point is outside all 158
            # neighbourhoods. This is the only case that should reach a 404.
            logger.info("No Toronto neighbourhood contains (%s, %s)", lat, lon)
            return None

        hood_id = int(matched_hood['HOOD_ID'].iloc[0])
        area_name = matched_hood['AREA_NAME'].iloc[0]

        # Per-category rate enrichment: for each of the 9 categories, compute
        # (a) this neighbourhood rate, (b) the city-wide average rate, and
        # (c) how far (a) differs from (b) as a percentage.
        crime_rates_enriched = {}

        # city-wide total population, used as the denominator for the
        # population-weighted average below
        total_population = gdp_neighborhoods[population_column].fillna(0).sum()

        for category in CRIME_CATEGORIES:
            rate_col= f"{category}_RATE_{rate_year}"
            count_col = f"{category}_{rate_year}"

            hood_rate = float(matched_hood[rate_col].iloc[0])

            # population-weighted city average: convert each neighbourhood's
            # per-100k rate back into an estimated raw incident count
            # (rate * population / 100_000), sum those counts city-wide,
            # then re-express as a rate per 100k over the total population.
            # This avoids simply averaging the 158 neighbourhood rates
            # unweighted, wich would let small neighbourhoods skew the
            # "city average" as musch as large one.

            rates_filled = gdp_neighborhoods[rate_col].fillna(0)
            total_city_incidents = (
                (rates_filled * gdp_neighborhoods[population_column]) / 100_000
            ).sum()
            if total_population > 0:
                city_avg_rate = (total_city_incidents / total_population) * 100_000
            else:
                city_avg_rate = 0.0

            # Guard against division by zero when city_avg_rate is 0 (e.g.
            # a category with no reported incidents city-wide that year).
            if city_avg_rate > 0:
                diff_percent = ((hood_rate - city_avg_rate) / city_avg_rate) * 100
            else:
                diff_percent = 0.0


            hood_count = matched_hood[count_col].iloc[0]
            hood_count = 0 if pd.isna(hood_count) else int(hood_count)

            crime_rates_enriched[category.lower()] = {
                "neighbourhood_rate": float(round(hood_rate, 2)),
                "city_average": float(round(city_avg_rate, 2)),
                "difference_percentage": float(round(diff_percent, 2)),
                "incident_count": hood_count,
            }

        total_incidents_found = sum(
            crime_rates_enriched[category.lower()]["incident_count"]
            for category in CRIME_CATEGORIES #
        )

        # Incident-level records for map plotting, filtered to the matched
        # neighbourhood. HOOD_158_str is normalised in the loader.
        df_mci = _load_incidents(mci_csv_path, mci_signature)

        hood_id_str = str(int(float(hood_id))).strip()

        local_crimes = (
            df_mci[(df_mci['HOOD_158_str'] == hood_id_str) & (df_mci['OCC_YEAR'] == rate_year)]
        )

        response_payload= {
            "neighbourhood": {
                "id": hood_id,
                "name": area_name,
                "rate_year": rate_year,
                "estimated_population": int(matched_hood[population_column].iloc[0]),
                "crime_rates_per_100k": crime_rates_enriched
            },
            # NOTE: LAT_WGS84/LONG_WGS84 here are privacy-offset by TPS to
            #       the nearest road intersection - not the exact incident address.
            "crime_markers": local_crimes[
                ['EVENT_UNIQUE_ID', 'OFFENCE', 'LAT_WGS84', 'LONG_WGS84']
            ].to_dict(orient='records'),
            "total_incidents_found": total_incidents_found
        }

        return response_payload

    except FileNotFoundError as exc:
        # The datasets ship in the image, so absence is a deploy problem, not
        # anything the caller did. Returning None here is what let the missing
        # crime data in staging look like "address not in Toronto" for weeks.
        logger.error("Crime dataset file missing: %s", exc)
        raise CrimeDataUnavailable("Crime dataset is not available on the server.") from exc
    except KeyError as exc:
        # rate_year is caller-supplied, and the geojson only carries
        # "<CATEGORY>_RATE_<year>" / "POPULATION_<year>" for the years it covers.
        logger.warning("Crime dataset has no columns for rate_year=%s: %s", rate_year, exc)
        raise CrimeYearUnavailable(
            f"No crime data available for {rate_year}."
        ) from exc
    except Exception as exc:
        # Malformed geometry, a corrupted file, anything unforeseen. Still
        # caught so one bad request cannot take the process down, but it is
        # reported as a server fault rather than a missing neighbourhood.
        logger.exception("Unexpected failure building crime stats")
        raise CrimeDataUnavailable("Could not build crime statistics.") from exc


@lru_cache(maxsize=_CRIME_RESPONSE_CACHE_SIZE)
def _cached_crime_data(
    lat: float,
    lon: float,
    geojson_path: str,
    mci_csv_path: str,
    rate_year: int,
    geojson_signature: tuple[int, int],
    mci_signature: tuple[int, int],
) -> dict[str, Any]:
    # The signatures invalidate both this response and the parsed dataframes
    # used by the computation when either bundled dataset is replaced.
    result = _compute_crime_data(
        lat=lat,
        lon=lon,
        geojson_path=geojson_path,
        mci_csv_path=mci_csv_path,
        rate_year=rate_year,
        geojson_signature=geojson_signature,
        mci_signature=mci_signature,
    )
    if result is None:
        raise _CrimeDataNotFound
    return result


def get_crime_data(
    lat: float,
    lon: float,
    geojson_path: str = str(
        _DATA_DIR / "Neighbourhood_Crime_Rates_Open_Data_179142238816317979.geojson"
    ),
    mci_csv_path: str = str(
        _DATA_DIR / "Major_Crime_Indicators_Open_Data_1579054118756352687.csv"
    ),
    rate_year: int = 2025,
) -> dict[str, Any] | None:
    """Return crime data, reusing successful computations for unchanged datasets."""
    try:
        result = _cached_crime_data(
            _normalise_coordinate(lat),
            _normalise_coordinate(lon),
            geojson_path,
            mci_csv_path,
            rate_year,
            _dataset_signature(geojson_path),
            _dataset_signature(mci_csv_path),
        )
    except _CrimeDataNotFound:
        return None
    except OSError as exc:
        logger.error("Crime dataset file unavailable: %s", exc)
        raise CrimeDataUnavailable("Crime dataset is not available on the server.") from exc

    return deepcopy(result)

def get_crime_data_by_address(
        address: str,
        geojson_path: str = str(
            _DATA_DIR / "Neighbourhood_Crime_Rates_Open_Data_179142238816317979.geojson"
        ),
        mci_csv_path: str = str(
            _DATA_DIR / "Major_Crime_Indicators_Open_Data_1579054118756352687.csv"
        ),
        rate_year: int = 2025,
) -> dict[str, Any] | None:

    coords = geocode_address(address, api_key=os.getenv("GOOGLE_MAPS_API_KEY"))
    if coords is None:
        return None
    lat,lon = coords
    return get_crime_data(
        lat=lat,
        lon=lon,
        geojson_path=geojson_path,
        mci_csv_path=mci_csv_path,
        rate_year=rate_year,
    )


# local test
if __name__ == "__main__":
    test_lat = 43.6426
    test_lon = -79.3871
 
    print(f"Scanning coordinates: Lat {test_lat}, Lon {test_lon}...")
 
    result = get_crime_data(
        lat=test_lat,
        lon=test_lon,
    )
    if result:
        print("Match Found")
        name = result['neighbourhood']['name']
        hood_id = result['neighbourhood']['id']
        print(f"Neighbourhood: {name} (ID: {hood_id})")
        print(f"Estimated Population: {result['neighbourhood']['estimated_population']}")
        print(f"Crime rates ({result['neighbourhood']['rate_year']}, per 100,000 residents):")
        for category, rate in result["neighbourhood"]["crime_rates_per_100k"].items():
            print(f"  {category}: {rate}")
        total = result['total_incidents_found']
        print(f"Total individual crime records available to plot: {total}")
        print("\nSample map markers data (for frontend rendering):")
        print(result["crime_markers"][:2])
 
    # Test 2: new end-to-end path with a real typed address (requires
    # GOOGLE_MAPS_KEY to be set in the environment/.env).
    print("\n" + "=" * 60)
    test_address = "300 Bremner Blvd, Toronto, ON"
    print(f"Resolving address end-to-end: {test_address}")
 
    result_from_address = get_crime_data_by_address(test_address)
 
    if result_from_address:
        name = result_from_address['neighbourhood']['name']
        hood_id = result_from_address['neighbourhood']['id']
        print("Match Found (via address)")
        print(f"Neighbourhood: {name} (ID: {hood_id})")
    else:
        print("Failed to resolve address end-to-end — see error above (geocoding or spatial join).")

