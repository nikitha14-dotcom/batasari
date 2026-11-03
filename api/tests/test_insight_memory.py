"""Tests for insight_memory.py — pure merge logic."""
from app.gateway.extraction_schema import InsightDelta
from app.gateway.insight_memory import merge_deltas


class TestMergeDeltas:
    def test_set_scalar(self):
        result = merge_deltas(
            current={},
            deltas=[InsightDelta(field="budget_range", operation="set", value="$2000 CAD")],
            category="Housing",
        )
        assert result["budget_range"] == "$2000 CAD"

    def test_set_overwrites(self):
        result = merge_deltas(
            current={"budget_range": "$1500 CAD"},
            deltas=[InsightDelta(field="budget_range", operation="set", value="$2000 CAD")],
            category="Housing",
        )
        assert result["budget_range"] == "$2000 CAD"

    def test_append_to_empty_list(self):
        result = merge_deltas(
            current={},
            deltas=[
                InsightDelta(
                    field="priorities",
                    operation="append",
                    value=["close to transit"],
                )
            ],
            category="Housing",
        )
        assert result["priorities"] == ["close to transit"]

    def test_append_deduplicates(self):
        result = merge_deltas(
            current={"priorities": ["close to transit"]},
            deltas=[
                InsightDelta(
                    field="priorities",
                    operation="append",
                    value=["close to transit", "quiet"],
                )
            ],
            category="Housing",
        )
        assert result["priorities"] == ["close to transit", "quiet"]

    def test_append_single_value(self):
        result = merge_deltas(
            current={"preferred_neighbourhoods": ["Annex"]},
            deltas=[
                InsightDelta(
                    field="preferred_neighbourhoods",
                    operation="append",
                    value="Liberty Village",
                )
            ],
            category="Housing",
        )
        assert "Annex" in result["preferred_neighbourhoods"]
        assert "Liberty Village" in result["preferred_neighbourhoods"]

    def test_remove_from_list(self):
        result = merge_deltas(
            current={"preferred_neighbourhoods": ["Annex", "Kensington Market"]},
            deltas=[
                InsightDelta(
                    field="preferred_neighbourhoods",
                    operation="remove",
                    value=["Annex"],
                )
            ],
            category="Housing",
        )
        assert result["preferred_neighbourhoods"] == ["Kensington Market"]

    def test_remove_single_value(self):
        result = merge_deltas(
            current={"deal_breakers": ["no basement", "must allow pets"]},
            deltas=[InsightDelta(field="deal_breakers", operation="remove", value="no basement")],
            category="Housing",
        )
        assert result["deal_breakers"] == ["must allow pets"]

    def test_clear_list_field(self):
        result = merge_deltas(
            current={"preferred_neighbourhoods": ["Annex", "Liberty Village"]},
            deltas=[InsightDelta(field="preferred_neighbourhoods", operation="clear")],
            category="Housing",
        )
        assert result["preferred_neighbourhoods"] == []

    def test_clear_scalar_field(self):
        result = merge_deltas(
            current={"budget_range": "$2000"},
            deltas=[InsightDelta(field="budget_range", operation="clear")],
            category="Housing",
        )
        assert result["budget_range"] is None

    def test_unknown_field_skipped(self):
        result = merge_deltas(
            current={},
            deltas=[InsightDelta(field="favourite_color", operation="set", value="blue")],
            category="Housing",
        )
        assert "favourite_color" not in result

    def test_unknown_category_returns_copy(self):
        result = merge_deltas(
            current={"x": 1},
            deltas=[InsightDelta(field="x", operation="set", value=2)],
            category="UnknownCategory",
        )
        assert result == {"x": 1}

    def test_does_not_mutate_original(self):
        original = {"budget_range": "$1500"}
        merge_deltas(
            current=original,
            deltas=[InsightDelta(field="budget_range", operation="set", value="$2000")],
            category="Housing",
        )
        assert original["budget_range"] == "$1500"

    def test_chained_operations(self):
        result = merge_deltas(
            current={},
            deltas=[
                InsightDelta(
                    field="preferred_neighbourhoods",
                    operation="append",
                    value=["Annex", "Liberty Village"],
                ),
                InsightDelta(field="preferred_neighbourhoods", operation="remove", value=["Annex"]),
                InsightDelta(field="budget_range", operation="set", value="$1800"),
            ],
            category="Housing",
        )
        assert result["preferred_neighbourhoods"] == ["Liberty Village"]
        assert result["budget_range"] == "$1800"

    def test_append_on_scalar_falls_back_to_set(self):
        """Appending to a non-list field degrades to set."""
        result = merge_deltas(
            current={"budget_range": "$1500"},
            deltas=[InsightDelta(field="budget_range", operation="append", value="$2000")],
            category="Housing",
        )
        assert result["budget_range"] == "$2000"

    def test_remove_on_scalar_clears(self):
        """Removing from a non-list field clears it."""
        result = merge_deltas(
            current={"budget_range": "$1500"},
            deltas=[InsightDelta(field="budget_range", operation="remove", value="$1500")],
            category="Housing",
        )
        assert result["budget_range"] is None

