"""Tests for extraction_schema.py — Pydantic models and validator."""
import pytest

from app.gateway.extraction_schema import (
    HousingInsights,
    InsightDelta,
    InsightDeltaResponse,
    InsightOperation,
    validate_insight_delta,
)


class TestInsightDelta:
    def test_valid_set_delta(self):
        d = InsightDelta(field="budget_range", operation="set", value="$2000 CAD")
        assert d.field == "budget_range"
        assert d.operation == InsightOperation.set
        assert d.value == "$2000 CAD"

    def test_valid_append_delta(self):
        d = InsightDelta(field="priorities", operation="append", value=["close to transit"])
        assert d.operation == InsightOperation.append
        assert d.value == ["close to transit"]

    def test_valid_clear_delta_normalizes_value(self):
        d = InsightDelta(field="budget_range", operation="clear", value="whatever")
        assert d.value is None

    def test_blank_field_rejected(self):
        with pytest.raises(ValueError, match="field name must not be empty"):
            InsightDelta(field="   ", operation="set", value="x")

    def test_invalid_operation_rejected(self):
        with pytest.raises(ValueError):
            InsightDelta(field="budget_range", operation="overwrite", value="x")


class TestInsightDeltaResponse:
    def test_valid_response(self):
        r = InsightDeltaResponse(
            category="Housing",
            deltas=[
                InsightDelta(field="budget_range", operation="set", value="$2000"),
            ],
            confidence=0.9,
        )
        assert r.category == "Housing"
        assert len(r.deltas) == 1

    def test_empty_deltas_allowed(self):
        r = InsightDeltaResponse(category="Housing", deltas=[], confidence=1.0)
        assert r.deltas == []

    def test_confidence_out_of_range(self):
        with pytest.raises(ValueError):
            InsightDeltaResponse(category="Housing", confidence=1.5)

    def test_default_confidence(self):
        r = InsightDeltaResponse(category="Housing")
        assert r.confidence == 1.0


class TestValidateInsightDelta:
    def test_valid_json(self):
        raw = (
            '{"category": "Housing", "deltas": ['
            '{"field": "budget_range", "operation": "set", "value": "$2000"}], '
            '"confidence": 0.95}'
        )
        result = validate_insight_delta(raw)
        assert isinstance(result, InsightDeltaResponse)
        assert result.category == "Housing"
        assert len(result.deltas) == 1

    def test_empty_deltas_json(self):
        raw = '{"category": "Housing", "deltas": [], "confidence": 1.0}'
        result = validate_insight_delta(raw)
        assert result.deltas == []

    def test_invalid_json(self):
        with pytest.raises(ValueError, match="not valid JSON"):
            validate_insight_delta("not json at all")

    def test_json_array_rejected(self):
        with pytest.raises(ValueError, match="Expected a JSON object"):
            validate_insight_delta('[{"field": "x"}]')

    def test_missing_category(self):
        with pytest.raises(ValueError):
            validate_insight_delta('{"deltas": []}')

    def test_invalid_operation_in_delta(self):
        raw = (
            '{"category": "Housing", "deltas": ['
            '{"field": "x", "operation": "destroy", "value": "y"}]}'
        )
        with pytest.raises(ValueError):
            validate_insight_delta(raw)


class TestHousingInsights:
    def test_defaults(self):
        h = HousingInsights()
        assert h.budget_range is None
        assert h.preferred_neighbourhoods == []
        assert h.priorities == []

    def test_populated(self):
        h = HousingInsights(
            budget_range="$2000",
            preferred_neighbourhoods=["Annex"],
            deal_breakers=["no basement"],
        )
        assert h.budget_range == "$2000"
        assert "Annex" in h.preferred_neighbourhoods

