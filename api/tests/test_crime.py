from fastapi.testclient import TestClient

from app.main import app
from app.routers import crime

client = TestClient(app)


def _crime_payload():
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
        "crime_markers": [
            {
                "event_id": "GO-20141263544",
                "offence": "B&E",
                "lat": 43.6400206791244,
                "lon": -79.3956427347843,
            }
        ],
        "total_incidents_found": 4126,
    }


def test_crime_stats_returns_neighbourhood_rates_and_markers(monkeypatch):
    calls = []

    def fake_get_crime_data(lat, lon, rate_year):
        calls.append({"lat": lat, "lon": lon, "rate_year": rate_year})
        return _crime_payload()

    monkeypatch.setattr(crime, "get_crime_data", fake_get_crime_data)

    response = client.get("/crime/stats?lat=43.6426&lon=-79.3871&rate_year=2025")

    assert response.status_code == 200
    data = response.json()
    assert calls == [{"lat": 43.6426, "lon": -79.3871, "rate_year": 2025}]
    assert data["neighbourhood"]["name"] == "Harbourfront-CityPlace"
    assert data["neighbourhood"]["rate_year"] == 2025
    assert data["neighbourhood"]["crime_rates_per_100k"]["assault"]["incident_count"] == 312
    assert data["crime_markers"][0]["event_id"] == "GO-20141263544"
    assert data["total_incidents_found"] == 4126


def test_crime_stats_returns_404_when_no_neighbourhood_matches(monkeypatch):
    monkeypatch.setattr(crime, "get_crime_data", lambda lat, lon, rate_year: None)

    response = client.get("/crime/stats?lat=0&lon=0")

    assert response.status_code == 404
    assert response.json()["detail"] == "No Toronto neighbourhood found for the given coordinates."


def test_crime_stats_requires_coordinates():
    response = client.get("/crime/stats")

    assert response.status_code == 422


def _raiser(exc):
    def _raise(*_args, **_kwargs):
        raise exc

    return _raise


def test_crime_stats_reports_a_missing_dataset_as_503_not_404(monkeypatch):
    # A dataset absent from the image is a deploy fault. Reporting it as 404
    # is what let this hide in staging for weeks -- it read as an address
    # outside Toronto, and monitoring saw an ordinary client error.
    monkeypatch.setattr(
        crime,
        "get_crime_data",
        _raiser(crime.CrimeDataUnavailable("Crime dataset is not available on the server.")),
    )

    response = client.get("/crime/stats?lat=43.6532&lon=-79.3832")

    assert response.status_code == 503
    assert response.json()["detail"] == "Crime dataset is not available on the server."


def test_crime_stats_reports_an_uncovered_year_as_400(monkeypatch):
    # rate_year is caller-supplied, so a year the data does not cover is a
    # bad request, not a missing neighbourhood.
    monkeypatch.setattr(
        crime,
        "get_crime_data",
        _raiser(crime.CrimeYearUnavailable("No crime data available for 1999.")),
    )

    response = client.get("/crime/stats?lat=43.6532&lon=-79.3832&rate_year=1999")

    assert response.status_code == 400
    assert response.json()["detail"] == "No crime data available for 1999."


def test_crime_stats_by_address_reports_a_missing_dataset_as_503(monkeypatch):
    monkeypatch.setattr(
        crime,
        "get_crime_data_by_address",
        _raiser(crime.CrimeDataUnavailable("Crime dataset is not available on the server.")),
    )

    response = client.get("/crime/stats/by-address?address=100+Queen+St+W")

    assert response.status_code == 503


def test_crime_stats_by_address_returns_neighbourhood_rates_and_markers(monkeypatch):
    calls = []

    def fake_get_crime_data_by_address(address, rate_year):
        calls.append({"address": address, "rate_year": rate_year})
        return _crime_payload()

    monkeypatch.setattr(crime, "get_crime_data_by_address", fake_get_crime_data_by_address)

    response = client.get(
        "/crime/stats/by-address?address=150%20Dan%20Leckie%20Way%2C%20Toronto%2C%20ON"
        "&rate_year=2025"
    )

    assert response.status_code == 200
    data = response.json()
    assert calls == [{"address": "150 Dan Leckie Way, Toronto, ON", "rate_year": 2025}]
    assert data["neighbourhood"]["name"] == "Harbourfront-CityPlace"
    assert data["neighbourhood"]["crime_rates_per_100k"]["assault"]["incident_count"] == 312
    assert data["crime_markers"][0]["event_id"] == "GO-20141263544"


def test_crime_stats_by_address_returns_404_when_address_cannot_resolve(monkeypatch):
    monkeypatch.setattr(crime, "get_crime_data_by_address", lambda address, rate_year: None)

    response = client.get("/crime/stats/by-address?address=Not%20Toronto")

    assert response.status_code == 404
    assert response.json()["detail"] == "Could not resolve that address to a Toronto neighbourhood."


def test_crime_stats_by_address_requires_address():
    response = client.get("/crime/stats/by-address")

    assert response.status_code == 422

