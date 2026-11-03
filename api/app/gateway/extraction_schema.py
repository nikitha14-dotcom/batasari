"""
Pydantic models and validators for the insight extraction pipeline.

Defines the shape of what Claude returns (InsightDelta) and the accumulated
per-category insight object (HousingInsights).  The validator turns raw JSON
text from the model into typed, validated Python objects or raises clearly.
"""
from __future__ import annotations

import json
import logging
from enum import StrEnum
from typing import Any

from pydantic import BaseModel, Field, field_validator

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Delta operations
# ---------------------------------------------------------------------------

class InsightOperation(StrEnum):
    """The four mutation verbs the extraction prompt is allowed to use."""
    set = "set"
    append = "append"
    remove = "remove"
    clear = "clear"


class InsightDelta(BaseModel):
    """One field-level mutation inside an extraction response."""
    field: str
    operation: InsightOperation
    value: Any = None

    @field_validator("field")
    @classmethod
    def _field_not_blank(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("field name must not be empty")
        return stripped

    @field_validator("value")
    @classmethod
    def _clear_needs_no_value(cls, v: Any, info) -> Any:
        # 'clear' ignores whatever value is sent — normalise it to None so
        # downstream code never has to check.
        if info.data.get("operation") == InsightOperation.clear:
            return None
        return v


class InsightDeltaResponse(BaseModel):
    """The complete extraction result from one Claude call."""
    category: str
    deltas: list[InsightDelta] = Field(default_factory=list)
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)


# ---------------------------------------------------------------------------
# Housing insight schema — the accumulated object
# ---------------------------------------------------------------------------

# These are the fields the Housing extraction prompt is trained to emit.
# Keeping them listed here lets merge_deltas reject unknown fields early.
HOUSING_INSIGHT_FIELDS: dict[str, str] = {
    "budget_range": "str",
    "preferred_neighbourhoods": "list",
    "housing_type_preference": "str",
    "lease_duration": "str",
    "move_timeline": "str",
    "household_details": "str",
    "pet_situation": "str",
    "commute_requirements": "str",
    "deal_breakers": "list",
    "priorities": "list",
}


class HousingInsights(BaseModel):
    """Accumulated housing insight state for one user."""
    budget_range: str | None = None
    preferred_neighbourhoods: list[str] = Field(default_factory=list)
    housing_type_preference: str | None = None
    lease_duration: str | None = None
    move_timeline: str | None = None
    household_details: str | None = None
    pet_situation: str | None = None
    commute_requirements: str | None = None
    deal_breakers: list[str] = Field(default_factory=list)
    priorities: list[str] = Field(default_factory=list)


# Map category names to their field definitions.  Only Housing exists today;
# the architecture is ready for more.
CATEGORY_INSIGHT_FIELDS: dict[str, dict[str, str]] = {
    "Housing": HOUSING_INSIGHT_FIELDS,
}


# ---------------------------------------------------------------------------
# Validator — raw JSON string → typed InsightDeltaResponse
# ---------------------------------------------------------------------------

def validate_insight_delta(raw_json: str) -> InsightDeltaResponse:
    """Parse Claude's raw JSON output into a validated InsightDeltaResponse.

    Raises ValueError on malformed JSON or schema violations.
    """
    try:
        parsed = json.loads(raw_json)
    except json.JSONDecodeError as exc:
        raise ValueError(f"Extraction response is not valid JSON: {exc}") from exc

    if not isinstance(parsed, dict):
        raise ValueError(
            f"Expected a JSON object, got {type(parsed).__name__}"
        )

    return InsightDeltaResponse.model_validate(parsed)

