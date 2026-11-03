from types import SimpleNamespace

from app.crime import geocoding_client


def _fake_get(location_type, types):
    def get(url, params=None, timeout=None):
        body = {
            "status": "OK",
            "results": [
                {
                    "types": types,
                    "geometry": {
                        "location": {"lat": 43.65, "lng": -79.38},
                        "location_type": location_type,
                    },
                }
            ],
        }
        return SimpleNamespace(raise_for_status=lambda: None, json=lambda: body)

    return get


def _geocode(monkeypatch, location_type, types):
    monkeypatch.setattr(geocoding_client.requests, "get", _fake_get(location_type, types))
    return geocoding_client.geocode_address("x", api_key="k")


def test_street_level_matches_are_accepted(monkeypatch):
    for kind in ("ROOFTOP", "RANGE_INTERPOLATED"):
        assert _geocode(monkeypatch, kind, ["street_address"]) == (43.65, -79.38)


def test_a_large_building_is_accepted_even_as_geometric_center(monkeypatch):
    # 100 Queen St W (City Hall): a specific place, but not a rooftop point.
    assert _geocode(monkeypatch, "GEOMETRIC_CENTER", ["premise"]) == (43.65, -79.38)
    assert _geocode(monkeypatch, "GEOMETRIC_CENTER", ["establishment", "point_of_interest"]) == (
        43.65,
        -79.38,
    )


def test_streets_postal_codes_and_cities_are_refused(monkeypatch):
    assert _geocode(monkeypatch, "GEOMETRIC_CENTER", ["route"]) is None
    assert _geocode(monkeypatch, "APPROXIMATE", ["postal_code"]) is None
    assert _geocode(monkeypatch, "APPROXIMATE", ["locality", "political"]) is None
    assert _geocode(monkeypatch, None, []) is None
