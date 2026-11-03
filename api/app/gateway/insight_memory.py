"""
Pure-function merge logic for insight deltas.

Takes a current insight dict and a list of InsightDelta objects, applies each
operation in order, and returns the updated dict.  No I/O, no side effects —
easy to test in isolation.
"""
from __future__ import annotations

import logging
from typing import Any

from app.gateway.extraction_schema import (
    CATEGORY_INSIGHT_FIELDS,
    InsightDelta,
    InsightOperation,
)

logger = logging.getLogger(__name__)


def merge_deltas(
    current: dict[str, Any],
    deltas: list[InsightDelta],
    category: str,
) -> dict[str, Any]:
    """Apply *deltas* to *current* and return the updated dict.

    Unknown fields (not in the category's schema) are logged and skipped.
    The caller's ``current`` dict is **not** mutated; a shallow copy is made.
    """
    allowed_fields = CATEGORY_INSIGHT_FIELDS.get(category, {})
    if not allowed_fields:
        logger.warning("No insight fields defined for category=%s; skipping merge", category)
        return dict(current)

    result = dict(current)

    for delta in deltas:
        if delta.field not in allowed_fields:
            logger.info(
                "Ignoring unknown insight field %r for category=%s",
                delta.field,
                category,
            )
            continue

        field_type = allowed_fields[delta.field]

        if delta.operation == InsightOperation.set:
            result[delta.field] = delta.value

        elif delta.operation == InsightOperation.append:
            _append_to_list(result, delta.field, delta.value, field_type)

        elif delta.operation == InsightOperation.remove:
            _remove_from_list(result, delta.field, delta.value, field_type)

        elif delta.operation == InsightOperation.clear:
            result[delta.field] = [] if field_type == "list" else None

    return result


def _append_to_list(
    target: dict[str, Any],
    field: str,
    value: Any,
    field_type: str,
) -> None:
    """Append *value* to a list field, deduplicating."""
    if field_type != "list":
        # For non-list fields, append degrades to set.
        target[field] = value
        return

    existing: list = list(target.get(field) or [])
    items = value if isinstance(value, list) else [value]
    for item in items:
        if item not in existing:
            existing.append(item)
    target[field] = existing


def _remove_from_list(
    target: dict[str, Any],
    field: str,
    value: Any,
    field_type: str,
) -> None:
    """Remove *value* from a list field."""
    if field_type != "list":
        # For non-list fields, remove clears.
        target[field] = None
        return

    existing: list = list(target.get(field) or [])
    items = value if isinstance(value, list) else [value]
    target[field] = [v for v in existing if v not in items]

