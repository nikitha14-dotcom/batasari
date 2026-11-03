import json

import pandas as pd
import pytest

from app.crime import crime_data_pipeline as pipeline


@pytest.fixture(autouse=True)
def clear_crime_response_cache():
    pipeline._cached_crime_data.cache_clear()
    pipeline._load_neighbourhoods.cache_clear()
    pipeline._load_incidents.cache_clear()
    yield
    pipeline._cached_crime_data.cache_clear()
    pipeline._load_neighbourhoods.cache_clear()
    pipeline._load_incidents.cache_clear()


def _payload(year: int = 2025) -> dict:
    return {
        "neighbourhood": {"id": 165, "name": "Harbourfront", "rate_year": year},
        "crime_markers": [],
        "total_incidents_found": 1,
    }


def _use_fake_datasets(monkeypatch, signature=(100, 1)):
    monkeypatch.setattr(pipeline, "_dataset_signature", lambda _path: signature)


def test_successful_computation_is_cached_for_normalised_coordinates(monkeypatch):
    calls = []
    _use_fake_datasets(monkeypatch)

    def compute(**kwargs):
        calls.append(kwargs)
        return _payload(kwargs["rate_year"])

    monkeypatch.setattr(pipeline, "_compute_crime_data", compute)

    first = pipeline.get_crime_data(43.6426001, -79.3871001)
    second = pipeline.get_crime_data(43.6426002, -79.3871002)

    assert first == second
    assert len(calls) == 1
    assert pipeline._cached_crime_data.cache_info().hits == 1


def test_different_coordinates_are_cache_misses(monkeypatch):
    calls = []
    _use_fake_datasets(monkeypatch)
    monkeypatch.setattr(
        pipeline,
        "_compute_crime_data",
        lambda **kwargs: calls.append(kwargs) or _payload(kwargs["rate_year"]),
    )

    pipeline.get_crime_data(43.64260, -79.38710)
    pipeline.get_crime_data(43.64270, -79.38710)

    assert len(calls) == 2
    assert pipeline._cached_crime_data.cache_info().misses == 2


def test_rate_years_have_separate_cache_entries(monkeypatch):
    calls = []
    _use_fake_datasets(monkeypatch)
    monkeypatch.setattr(
        pipeline,
        "_compute_crime_data",
        lambda **kwargs: calls.append(kwargs) or _payload(kwargs["rate_year"]),
    )

    result_2024 = pipeline.get_crime_data(43.6426, -79.3871, rate_year=2024)
    result_2025 = pipeline.get_crime_data(43.6426, -79.3871, rate_year=2025)

    assert result_2024["neighbourhood"]["rate_year"] == 2024
    assert result_2025["neighbourhood"]["rate_year"] == 2025
    assert len(calls) == 2


def _write_datasets(
    geojson_path,
    csv_path,
    *,
    population: int,
    assault_rate: float,
    assault_count: int,
    marker_count: int,
):
    properties = {
        "HOOD_ID": 165,
        "AREA_NAME": "Cache Test",
        "POPULATION_2025": population,
        "REVISION_PADDING": "x" * marker_count,
    }
    for category in pipeline.CRIME_CATEGORIES:
        properties[f"{category}_RATE_2025"] = (
            assault_rate if category == "ASSAULT" else 0
        )
        properties[f"{category}_2025"] = assault_count if category == "ASSAULT" else 0

    geojson_path.write_text(
        json.dumps(
            {
                "type": "FeatureCollection",
                "features": [
                    {
                        "type": "Feature",
                        "properties": properties,
                        "geometry": {
                            "type": "Polygon",
                            "coordinates": [
                                [
                                    [-79.5, 43.5],
                                    [-79.2, 43.5],
                                    [-79.2, 43.8],
                                    [-79.5, 43.8],
                                    [-79.5, 43.5],
                                ]
                            ],
                        },
                    }
                ],
            }
        ),
        encoding="utf-8",
    )
    pd.DataFrame(
        [
            {
                "EVENT_UNIQUE_ID": f"event-{index}",
                "OFFENCE": "Assault",
                "LAT_WGS84": 43.65,
                "LONG_WGS84": -79.38,
                "HOOD_158": 165,
                "OCC_YEAR": 2025,
            }
            for index in range(marker_count)
        ]
    ).to_csv(csv_path, index=False)


def test_dataset_signature_change_reloads_dataframes_and_response(tmp_path):
    geojson_path = tmp_path / "neighbourhoods.geojson"
    csv_path = tmp_path / "incidents.csv"
    _write_datasets(
        geojson_path,
        csv_path,
        population=1_000,
        assault_rate=100,
        assault_count=18,
        marker_count=1,
    )

    before = pipeline.get_crime_data(
        43.65,
        -79.38,
        geojson_path=str(geojson_path),
        mci_csv_path=str(csv_path),
    )

    _write_datasets(
        geojson_path,
        csv_path,
        population=5_000,
        assault_rate=400,
        assault_count=63,
        marker_count=4,
    )
    after = pipeline.get_crime_data(
        43.65,
        -79.38,
        geojson_path=str(geojson_path),
        mci_csv_path=str(csv_path),
    )

    assert before["neighbourhood"]["estimated_population"] == 1_000
    assert before["neighbourhood"]["crime_rates_per_100k"]["assault"][
        "neighbourhood_rate"
    ] == 100
    assert before["total_incidents_found"] == 18
    assert len(before["crime_markers"]) == 1

    assert after["neighbourhood"]["estimated_population"] == 5_000
    assert after["neighbourhood"]["crime_rates_per_100k"]["assault"][
        "neighbourhood_rate"
    ] == 400
    assert after["total_incidents_found"] == 63
    assert len(after["crime_markers"]) == 4


def test_not_found_response_is_not_cached(monkeypatch):
    calls = []
    _use_fake_datasets(monkeypatch)
    monkeypatch.setattr(
        pipeline,
        "_compute_crime_data",
        lambda **kwargs: calls.append(kwargs) or None,
    )

    assert pipeline.get_crime_data(0, 0) is None
    assert pipeline.get_crime_data(0, 0) is None
    assert len(calls) == 2


def test_failure_is_not_cached(monkeypatch):
    calls = []
    _use_fake_datasets(monkeypatch)

    def compute(**kwargs):
        calls.append(kwargs)
        if len(calls) == 1:
            raise pipeline.CrimeDataUnavailable("temporary failure")
        return _payload(kwargs["rate_year"])

    monkeypatch.setattr(pipeline, "_compute_crime_data", compute)

    with pytest.raises(pipeline.CrimeDataUnavailable, match="temporary failure"):
        pipeline.get_crime_data(43.6426, -79.3871)

    assert pipeline.get_crime_data(43.6426, -79.3871) == _payload()
    assert len(calls) == 2


def test_cached_payload_is_returned_by_value(monkeypatch):
    calls = []
    _use_fake_datasets(monkeypatch)
    monkeypatch.setattr(
        pipeline,
        "_compute_crime_data",
        lambda **kwargs: calls.append(kwargs) or _payload(kwargs["rate_year"]),
    )

    first = pipeline.get_crime_data(43.6426, -79.3871)
    first["neighbourhood"]["name"] = "Changed"
    second = pipeline.get_crime_data(43.6426, -79.3871)

    assert second["neighbourhood"]["name"] == "Harbourfront"
    assert len(calls) == 1

