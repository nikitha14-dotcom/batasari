"""
Access control and input limits on the crime endpoints.

/crime/stats/by-address geocodes through a paid Google API before it touches
our own data, so an unauthenticated, uncounted endpoint was a way to spend our
money and exhaust the quota -- and taking the quota down takes the feature
down for everyone. These tests pin the two guards that closed that: a caller
must be identified, and each caller gets a daily ceiling.
"""

from datetime import date

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.routers import crime
from app.services.rate_limiter import InMemoryRateLimiter

client = TestClient(app)

USER = "11111111-1111-1111-1111-111111111111"
OTHER_USER = "22222222-2222-2222-2222-222222222222"
ADDRESS = "100 Queen St W, Toronto, ON"


def _payload():
    return {
        "neighbourhood": {
            "id": 165,
            "name": "Harbourfront-CityPlace",
            "rate_year": 2025,
            "estimated_population": 35321,
            "crime_rates_per_100k": {
                "assault": {
                    "neighbourhood_rate": 883.33,
                    "city_average": 767.9,
                    "difference_percentage": 15.03,
                    "incident_count": 312,
                }
            },
        },
        "crime_markers": [],
        "total_incidents_found": 4126,
    }


@pytest.fixture(autouse=True)
def fresh_limiter():
    """Each test gets its own counter, and the app's is restored after."""
    previous = getattr(app.state, "crime_limiter", None)
    app.state.crime_limiter = InMemoryRateLimiter(daily_limit=3)
    yield
    app.state.crime_limiter = previous


@pytest.fixture
def production(monkeypatch):
    """Undo conftest's development default.

    AuthMiddleware assigns `local-dev-user` to any unauthenticated request
    when ENVIRONMENT=development, so "anonymous" is never anonymous in the
    default test environment. Anything asserting a 401 has to opt out of that
    fallback, or it silently tests nothing -- which is exactly how the first
    version of these tests passed a 200.
    """
    monkeypatch.setenv("ENVIRONMENT", "production")


@pytest.fixture
def geocoded(monkeypatch):
    """Stand in for the paid geocoder; counts how often it would be called."""
    calls = []

    def fake(address: str, rate_year: int = 2025):
        calls.append(address)
        return _payload()

    monkeypatch.setattr(crime, "get_crime_data_by_address", fake)
    return calls


def test_address_lookup_requires_a_signed_in_user(production, geocoded):
    response = client.get("/crime/stats/by-address", params={"address": ADDRESS})

    assert response.status_code == 401
    # The important half: we never reached the paid API for an anonymous caller.
    assert geocoded == []


def test_address_lookup_succeeds_for_a_signed_in_user(geocoded):
    response = client.get(
        "/crime/stats/by-address",
        params={"address": ADDRESS},
        headers={"x-test-user-id": USER},
    )

    assert response.status_code == 200
    assert response.json()["neighbourhood"]["name"] == "Harbourfront-CityPlace"
    assert geocoded == [ADDRESS]


def test_daily_limit_stops_a_loop_and_spares_the_geocoder(geocoded):
    for _ in range(3):
        ok = client.get(
            "/crime/stats/by-address",
            params={"address": ADDRESS},
            headers={"x-test-user-id": USER},
        )
        assert ok.status_code == 200

    blocked = client.get(
        "/crime/stats/by-address",
        params={"address": ADDRESS},
        headers={"x-test-user-id": USER},
    )

    assert blocked.status_code == 429
    # Four requests, three geocodes: the rejected one cost nothing.
    assert len(geocoded) == 3


def test_one_user_hitting_the_limit_does_not_block_another(geocoded):
    for _ in range(3):
        client.get(
            "/crime/stats/by-address",
            params={"address": ADDRESS},
            headers={"x-test-user-id": USER},
        )

    other = client.get(
        "/crime/stats/by-address",
        params={"address": ADDRESS},
        headers={"x-test-user-id": OTHER_USER},
    )

    assert other.status_code == 200


def test_an_overlong_address_is_refused_before_the_geocoder(geocoded):
    response = client.get(
        "/crime/stats/by-address",
        params={"address": "a" * (crime.MAX_ADDRESS + 1)},
        headers={"x-test-user-id": USER},
    )

    assert response.status_code == 422
    assert geocoded == []


def test_an_address_at_the_limit_is_accepted(geocoded):
    response = client.get(
        "/crime/stats/by-address",
        params={"address": "a" * crime.MAX_ADDRESS},
        headers={"x-test-user-id": USER},
    )

    assert response.status_code == 200


def test_lat_lon_endpoint_also_requires_a_user(production, monkeypatch):
    called = []
    monkeypatch.setattr(
        crime,
        "get_crime_data",
        lambda lat, lon, rate_year=2025: called.append((lat, lon)) or _payload(),
    )

    anonymous = client.get("/crime/stats", params={"lat": 43.64, "lon": -79.39})
    assert anonymous.status_code == 401
    assert called == []


@pytest.mark.parametrize(
    "params",
    [
        {"lat": 91, "lon": -79.39},
        {"lat": 43.64, "lon": 181},
    ],
)
def test_out_of_range_coordinates_are_refused(params, monkeypatch):
    called = []
    monkeypatch.setattr(
        crime,
        "get_crime_data",
        lambda lat, lon, rate_year=2025: called.append(1) or _payload(),
    )

    response = client.get("/crime/stats", params=params, headers={"x-test-user-id": USER})

    assert response.status_code == 422
    assert called == []


def test_limiter_counts_per_day(monkeypatch):
    """A new day restores the allowance rather than locking the user out."""
    limiter = InMemoryRateLimiter(daily_limit=1)

    assert limiter.check_and_increment(USER, date(2026, 9, 28)) is True
    assert limiter.check_and_increment(USER, date(2026, 9, 28)) is False
    assert limiter.check_and_increment(USER, date(2026, 9, 29)) is True

