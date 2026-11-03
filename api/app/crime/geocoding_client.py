import os

import requests
from dotenv import load_dotenv

load_dotenv()

GEOCODING_ENDPOINT = "https://maps.googleapis.com/maps/api/geocode/json"
# Only these mean Google found a real street address. A city, a postal code or a
# long street comes back as APPROXIMATE or GEOMETRIC_CENTER: a point in the
# middle of the area, which showed crime data for the wrong neighbourhood.
PRECISE_LOCATION_TYPES = {"ROOFTOP", "RANGE_INTERPOLATED"}
# A large building (City Hall, 100 Queen St W) can come back as GEOMETRIC_CENTER,
# the same label a city or a street gets. So also trust a result Google says is a
# specific place. A street ("route"), postal code or city is not one.
PLACE_TYPES = {"street_address", "premise", "subpremise", "establishment", "point_of_interest"}


def geocode_address(address: str, api_key: str | None = None) -> tuple[float, float] | None:
    """Resolve a street address into (lat, lon) using Google Maps Geocoding API.

    Args:
        address: A user-typed address string, e.g. "300 Bremner Blvd, Toronto, ON".
        api_key: Google Maps API key. If not provided, reads from the
            GOOGLE_MAPS_API_KEY environment variable.

    Returns:
        A (lat, lon) tuple if the address was successfully resolved.
        Returns None (not an exception) if:
            - api_key is missing,
            - the request fails (network error, timeout),
            - the API returns a non-OK status (e.g. address not found,
              ambiguous/zero results, invalid key, over query limit), or
            - the response is malformed in some unexpected way.
        Callers should treat a None return as "could not resolve this
        address" and surface that to the user, not assume it's always a
        bad address specifically (could also be a transient API issue).

    Raises:
        This function does not raise; all expected failure modes are
        caught and logged via print(), returning None instead — same
        pattern as get_crime_data() in crime_data_pipeline.py.
    """
    key = api_key or os.environ.get("GOOGLE_MAPS_API_KEY")
    if not key:
        print("Geocoding error: GOOGLE_MAPS_API_KEY is not set.")
        return None

    try:
        response = requests.get(
            GEOCODING_ENDPOINT,
            params={"address": address, "key": key},
            timeout=10,
        )
        response.raise_for_status()
        data = response.json()

        status = data.get("status")
        if status != "OK":
            # Common non-OK statuses: ZERO_RESULTS (address not found),
            # OVER_QUERY_LIMIT, REQUEST_DENIED (bad key/config),
            # INVALID_REQUEST (missing address param).
            print(f"Geocoding failed for address '{address}': {status}")
            return None

        results = data.get("results", [])
        if not results:
            print(f"Geocoding returned OK but no results for address '{address}'.")
            return None

        # Only trust a street-level match (BUG-006). For "Toronto, ON", "M5V" or
        # "Yonge St", Google returns the middle of the area or street.
        result = results[0]
        precision = result.get("geometry", {}).get("location_type")
        kinds = set(result.get("types", []))
        if precision not in PRECISE_LOCATION_TYPES and not (kinds & PLACE_TYPES):
            print(
                f"Geocoding too vague for address '{address}': "
                f"location_type={precision} types={sorted(kinds)}"
            )
            return None
        location = result["geometry"]["location"]
        return location["lat"], location["lng"]

    except requests.exceptions.RequestException as e:
        # Covers connection errors, timeouts, and non-2xx HTTP responses
        # raised by raise_for_status().
        print(f"Geocoding request failed for address '{address}': {e}")
        return None
    except (KeyError, IndexError, ValueError) as e:
        # Covers unexpected/malformed response shape (e.g. missing
        # geometry/location keys, or response body not valid JSON).
        print(f"Unexpected geocoding response shape for address '{address}': {e}")
        return None


# local test
if __name__ == "__main__":
    test_address = "300 Bremner Blvd, Toronto, ON"
    print(f"Geocoding address: {test_address}")

    coords = geocode_address(test_address)

    if coords:
        lat, lon = coords
        print(f"Resolved to: lat={lat}, lon={lon}")
    else:
        print("Failed to resolve address — see error above.")
