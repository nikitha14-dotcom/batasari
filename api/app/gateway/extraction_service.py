"""
Extraction service — calls Claude to extract insights from a user message.

This is a SEPARATE Claude call from the answer-generation call.  It runs
SEQUENTIALLY BEFORE the answer is generated so that updated insights can
be fed into the answer prompt.

A failed extraction must NEVER block the answer.  Every failure path
returns None and logs a warning.
"""
from __future__ import annotations

import logging

from pydantic import ValidationError

from app.gateway import usage_ledger
from app.gateway.extraction_builder import build_extraction_input
from app.gateway.extraction_schema import (
    InsightDeltaResponse,
    validate_insight_delta,
)
from app.gateway.internal_model import call_internal_model

logger = logging.getLogger(__name__)

# Use a cheaper / faster model for extraction if desired.  Falls back to
# the default model in claude_client.py (claude-sonnet-4-6) when unset.
EXTRACTION_MODEL: str | None = None  # e.g. "claude-haiku-4-5"


async def extract_insights(
    question: str,
    category: str,
    current_insights: dict,
) -> InsightDeltaResponse | None:
    """Run insight extraction on the user's latest message.

    Returns a validated ``InsightDeltaResponse`` on success, or ``None`` on
    any failure (network error, malformed response, validation error).
    The caller should treat None as "no insights extracted" and proceed
    normally with the answer.
    """
    try:
        system_prompt, user_message = build_extraction_input(
            question=question,
            category=category,
            current_insights=current_insights,
        )

        result = await call_internal_model(
            system_prompt=system_prompt,
            question=user_message,
            model=EXTRACTION_MODEL,
        )
        usage_ledger.record(result)
        raw_text: str = result["text"]

        # Claude sometimes wraps JSON in markdown fences despite instructions.
        # Strip them if present.
        stripped = raw_text.strip()
        if stripped.startswith("```"):
            lines = stripped.split("\n")
            # Remove first line (```json) and last line (```)
            if lines[-1].strip() == "```":
                lines = lines[1:-1]
            else:
                lines = lines[1:]
            stripped = "\n".join(lines).strip()

        delta_response = validate_insight_delta(stripped)

        logger.info(
            "Extracted %d insight delta(s) for category=%s (confidence=%.2f, "
            "input_tokens=%d, output_tokens=%d)",
            len(delta_response.deltas),
            category,
            delta_response.confidence,
            result["input_tokens"],
            result["output_tokens"],
        )

        return delta_response

    except ValidationError as exc:
        # str(exc) quotes each rejected input value, and those are the
        # model's extracted insights about this user. Log where and why the
        # output failed validation, never the values themselves.
        problems = [
            f"{'.'.join(str(p) for p in err['loc']) or '<root>'}:{err['type']}"
            for err in exc.errors()
        ]
        logger.warning(
            "Insight extraction produced invalid output for category=%s: %s",
            category,
            ", ".join(problems),
        )
        return None

    except ValueError as exc:
        # Raised by validate_insight_delta for non-JSON or non-object output;
        # its message has the parse position only, not the content.
        logger.warning(
            "Insight extraction produced invalid output for category=%s: %s",
            category,
            exc,
        )
        return None

    except Exception as exc:
        # Provider errors can carry the raw response body, so log the type.
        logger.warning(
            "Insight extraction failed for category=%s: %s",
            category,
            type(exc).__name__,
        )
        return None

