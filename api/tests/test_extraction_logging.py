import asyncio
import json
import logging

import pytest

from app.gateway import extraction_service

MARKER = "MARKER-2400-Scarborough"


def _extract_with(monkeypatch, caplog, model):
    monkeypatch.setattr(extraction_service, "call_internal_model", model)
    with caplog.at_level(logging.INFO, logger="app.gateway.extraction_service"):
        result = asyncio.run(
            extraction_service.extract_insights(
                question="q", category="Housing", current_insights={}
            )
        )
    return result, "\n".join(r.getMessage() for r in caplog.records)


def _returns(text):
    async def _model(**kwargs):
        return {"text": text, "input_tokens": 1, "output_tokens": 1, "model": "m"}

    return _model


@pytest.mark.parametrize(
    "output",
    [
        # A user's detail in a field that fails validation.
        {
            "category": "Housing",
            "deltas": [{"field": "budget", "operation": MARKER}],
            "confidence": 0.9,
        },
        {"category": "Housing", "deltas": [], "confidence": MARKER},
    ],
)
def test_invalid_extraction_output_is_logged_without_its_values(monkeypatch, caplog, output):
    result, logs = _extract_with(monkeypatch, caplog, _returns(json.dumps(output)))

    assert result is None
    assert "invalid output" in logs
    assert MARKER not in logs


def test_the_log_still_says_which_field_failed(monkeypatch, caplog):
    output = {
        "category": "Housing",
        "deltas": [{"field": "budget", "operation": MARKER}],
        "confidence": 0.9,
    }

    _, logs = _extract_with(monkeypatch, caplog, _returns(json.dumps(output)))

    assert "deltas.0.operation:enum" in logs


def test_non_json_output_is_still_reported(monkeypatch, caplog):
    result, logs = _extract_with(monkeypatch, caplog, _returns("not json"))

    assert result is None
    assert "not valid JSON" in logs


def test_a_provider_error_is_logged_by_type_only(monkeypatch, caplog):
    async def _fails(**kwargs):
        raise RuntimeError(f"Error code: 400 - {{'error': {{'message': '{MARKER}'}}}}")

    result, logs = _extract_with(monkeypatch, caplog, _fails)

    assert result is None
    assert "RuntimeError" in logs
    assert MARKER not in logs

