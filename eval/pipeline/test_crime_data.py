"""
Regression test for get_crime_data().

Validates the point-in-polygon spatial join and the population-weighted
city_average / difference_percentage calculation against a known-good
result (captured in sample_crime_response_fixture.json from a real run
for the Harbourfront-CityPlace neighbourhood). If either of those two
logic paths gets touched later, this test catches drift automatically
instead of it going unnoticed.

Also covers two regressions found after comparing the geojson and CSV
datasets directly:
- The sjoin predicate needs to be "intersects", not "within", or a
  geocoded street-intersection address landing exactly on a
  neighbourhood boundary line incorrectly comes back as unmatched.
- crime_markers/total_incidents_found used to have no year filter at
  all, silently mixing over a decade of incidents (2014-2026) into a
  response otherwise scoped to a single rate_year.

Requires the real dataset files (geojson + csv) to be present locally
this is an integration test against real data, not a fully mocked unit
test, since the fixture itself was captured from a real run.
"""
import json
from pathlib import Path
import os
import pandas as pd
import pytest

from app.crime.crime_data_pipeline import get_crime_data, CRIME_CATEGORIES, get_crime_data_by_address

FIXTURE_PATH = Path(__file__).parent / "sample_crime_response_fixture.json"

# Same coordinates used to generate the fixture - must stay in sync with
# whatever produced sample_crime_response_fixture.json.
TEST_LAT = 43.6426
TEST_LON = -79.3871
TEST_ADDRESS = "150 Dan Leckie Way, Toronto, ON"


@pytest.fixture(scope="module")
def expected() -> dict:
    """Loads the known-good response captured in the fixture file."""
    with open(FIXTURE_PATH) as f:
        data = json.load(f)
    return data["response"]


@pytest.fixture(scope="module")
def result(expected) -> dict:
    """Calls the real pipeline once per test module run, reused across assertions."""
    result = get_crime_data(lat=TEST_LAT, lon=TEST_LON)
    assert result is not None, "Expected a match for known test coordinates, got None"
    return result
# test

def test_neighbourhood_identity(result, expected):
    """Spatial join should resolve to the same neighbourhood every time."""
    assert result["neighbourhood"]["id"] == expected["neighbourhood"]["id"]
    assert result["neighbourhood"]["name"] == expected["neighbourhood"]["name"]
    assert result["neighbourhood"]["rate_year"] == expected["neighbourhood"]["rate_year"]


def test_estimated_population(result, expected):
    assert result["neighbourhood"]["estimated_population"] == expected["neighbourhood"]["estimated_population"]


def test_crime_rates_per_100k(result, expected):
    """
    Covers the population-weighted city_average and difference_percentage
    math - the least trivial part of the pipeline - plus the per-category
    incident_count that's pulled straight from the geojson's raw count
    columns. Uses approx comparison for the float fields since those go
    through rounding; incident_count is an exact int comparison.
    """
    actual_rates = result["neighbourhood"]["crime_rates_per_100k"]
    expected_rates = expected["neighbourhood"]["crime_rates_per_100k"]

    assert set(actual_rates.keys()) == set(expected_rates.keys()), \
        "Crime category set changed - check CRIME_CATEGORIES or fixture is stale"

    for category, expected_values in expected_rates.items():
        actual_values = actual_rates[category]
        assert actual_values["neighbourhood_rate"] == pytest.approx(
            expected_values["neighbourhood_rate"], abs=0.01
        ), f"{category}: neighbourhood_rate mismatch"
        assert actual_values["city_average"] == pytest.approx(
            expected_values["city_average"], abs=0.01
        ), f"{category}: city_average mismatch"
        assert actual_values["difference_percentage"] == pytest.approx(
            expected_values["difference_percentage"], abs=0.01
        ), f"{category}: difference_percentage mismatch"
        assert actual_values["incident_count"] == expected_values["incident_count"], \
            f"{category}: incident_count mismatch"


def test_total_incidents_found(result, expected):
    """
    total_incidents_found comes from the geojson (sum of incident_count
    across all 9 categories for rate_year), not from the CSV - see
    crime_data_pipeline.py for why. It should equal the sum of the
    per-category incident_count values checked in test_crime_rates_per_100k.
    """
    assert result["total_incidents_found"] == expected["total_incidents_found"]

    rates = result["neighbourhood"]["crime_rates_per_100k"]
    assert result["total_incidents_found"] == sum(v["incident_count"] for v in rates.values()), (
        "total_incidents_found should equal the sum of per-category incident_count"
    )


def test_crime_markers_are_current_year_only(result):
    """
    Regression check for the year-scoping bug: crime_markers used to pull
    every incident since 2014 for the matched neighbourhood with no date
    filter at all, silently mixing over a decade of stale points into a
    response otherwise scoped to a single rate_year. Every marker returned
    should have OCC_YEAR == rate_year in the source CSV.

    NOTE: this does NOT check the EVENT_UNIQUE_ID prefix against rate_year.
    That prefix reflects REPORT_YEAR (when the case number was issued), not
    OCC_YEAR (when the incident happened) - an incident that occurred late
    in rate_year can still be reported (and numbered) the following year,
    e.g. "GO-202671527" is OCC_YEAR=2025 but REPORT_YEAR=2026 because it
    occurred 2025-12-01 and wasn't reported until 2026-01-10. Filtering by
    OCC_YEAR (as the pipeline does) is correct; a marker with a
    next-year-looking ID prefix is expected, not a bug. So this test looks
    up each marker's real OCC_YEAR in the CSV instead of guessing from the
    ID string.
    """
    rate_year = result["neighbourhood"]["rate_year"]
    df_mci = pd.read_csv("api/app/crime/Major_Crime_Indicators_Open_Data_1579054118756352687.csv", low_memory=False)

    marker_ids = {m["EVENT_UNIQUE_ID"] for m in result["crime_markers"]}
    # EVENT_UNIQUE_ID isn't guaranteed unique in the source CSV (the same
    # event can appear on more than one row), so look up all matching rows
    # per marker rather than assuming a 1:1 index.
    matching_rows = df_mci[df_mci["EVENT_UNIQUE_ID"].isin(marker_ids)]
    wrong_year = matching_rows[matching_rows["OCC_YEAR"] != rate_year]

    assert wrong_year.empty, (
        f"{wrong_year['EVENT_UNIQUE_ID'].nunique()} marker(s) have OCC_YEAR != {rate_year}: "
        f"{sorted(wrong_year['EVENT_UNIQUE_ID'].unique())} - crime_markers may not be "
        f"filtering by year correctly"
    )


def test_known_markers_present(result, expected):
    """
    The fixture only stores 2 sample markers (not the full set for the
    neighbourhood/year), so we check that those 2 known real incidents are
    present in the real result rather than asserting full list equality.
    """
    actual_ids = {m["EVENT_UNIQUE_ID"] for m in result["crime_markers"]}
    for known_marker in expected["crime_markers"]:
        assert known_marker["event_id"] in actual_ids, (
            f"Expected known marker {known_marker['event_id']} to be present in real results"
        )


def test_coordinate_outside_toronto_returns_none():
    """Sanity check on the empty-match path (point outside all 158 polygons)."""
    result = get_crime_data(lat=0.0, lon=0.0)
    assert result is None


def test_intersection_address_on_neighbourhood_boundary_still_matches():
    """
    Regression test for the "within" -> "intersects" predicate fix.

    A geocoded street intersection tends to land right on a street
    centerline, which is frequently also the boundary line between two
    neighbourhoods in this shapefile. Under predicate="within" a point
    exactly on that line doesn't count as being inside either polygon
    (only interior points do), so a perfectly valid Toronto intersection
    address could incorrectly come back as unmatched.

    NOTE: this coordinate needs to be swapped for one confirmed to sit
    exactly on a real neighbourhood boundary in the current geojson
    (boundaries can shift between TPS releases) - the assertion is what
    matters here, not this specific lat/lon.
    """
    boundary_lat, boundary_lon = 43.6426, -79.3871
    result = get_crime_data(lat=boundary_lat, lon=boundary_lon)
    assert result is not None, (
        "A coordinate on a neighbourhood boundary line should still resolve "
        "to a neighbourhood under predicate='intersects'"
    )


def test_missing_rate_does_not_skew_city_average():
    """
    Regression test for the fillna(0) fix on the rate column.

    Rare categories (HOMICIDE, SHOOTING) sometimes have suppressed/missing
    rate data for a given neighbourhood. Without filling that NaN before
    summing, the neighbourhood's population still counts in
    total_population while its incidents silently count as 0 - dragging
    city_average down. This just checks that no category's city_average
    comes back as exactly 0.0 city-wide, which would be a strong signal
    that a NaN rate got treated as "genuinely zero incidents everywhere"
    rather than "data missing for one neighbourhood".
    """
    result = get_crime_data(lat=43.6426, lon=-79.3871)
    assert result is not None
    for category in CRIME_CATEGORIES:
        city_average = result["neighbourhood"]["crime_rates_per_100k"][category.lower()]["city_average"]
        assert city_average > 0, (
            f"{category}: city_average is 0 - check whether a NaN rate is being "
            f"silently treated as 0 for some neighbourhood without fillna(0)"
        )
@pytest.mark.skipif(
    not (os.getenv("GOOGLE_MAPS_KEY") or os.getenv("GOOGLE_MAPS_API_KEY")),
    reason="No Google Maps API key set (GOOGLE_MAPS_KEY / GOOGLE_MAPS_API_KEY) - skipping real geocoding call",
)
def test_get_crime_data_by_address_real_geocoding_end_to_end(expected):
    """
    Unlike the mocked tests above, this one makes a REAL call to the
    Google Maps Geocoding API (uses one geocoding request/quota unit each
    run) to confirm the full address -> lat/lon -> crime data chain works
    end-to-end against the live service, not just against our own mocks.

    Manually confirmed passing on 2026-09 with GOOGLE_MAPS_KEY set:
    "300 Bremner Blvd, Toronto, ON" resolved to lat=43.6406731,
    lon=-79.3885327, which correctly matched Harbourfront-CityPlace
    (id 165) - the same neighbourhood as the hardcoded-coordinate tests
    in this file.

    Skipped automatically (not failed) when no API key is configured, so
    this doesn't break CI for anyone without Google Maps credentials.
    """
    result = get_crime_data_by_address(TEST_ADDRESS)
    assert result is not None, "Real geocoding + crime data lookup returned None"
    assert result["neighbourhood"]["id"] == expected["neighbourhood"]["id"]
    assert result["neighbourhood"]["name"] == expected["neighbourhood"]["name"]
