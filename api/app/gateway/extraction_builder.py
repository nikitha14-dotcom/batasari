"""
Builds the (system_prompt, user_message) pair for the extraction Claude call.

The system prompt comes from extraction_prompts.py.  The user message is
assembled here: the user's actual question plus a <current_insights> block
so the model knows what has already been captured (and avoids re-extracting
the same information).
"""
from __future__ import annotations

import json
from datetime import date

from app.gateway.extraction_prompts import (
    EXTRACTION_PROMPTS,
    active_extraction_prompt_version,
)


def build_extraction_input(
    question: str,
    category: str,
    current_insights: dict,
    today: date | None = None,
) -> tuple[str, str]:
    """Return ``(system_prompt, user_message)`` for the extraction call.

    Parameters
    ----------
    question:
        The user's latest message, as-is.
    category:
        Product category (e.g. ``"Housing"``).
    current_insights:
        The user's accumulated insights for this category so far (may be
        empty on the first turn).

    Returns
    -------
    tuple of (system_prompt, user_message) ready to pass to ``call_claude``.
    """
    version = active_extraction_prompt_version()
    system_prompt = EXTRACTION_PROMPTS[version]

    # Build the user-side message with current insights as context.
    parts: list[str] = []

    if current_insights:
        parts.append(
            "<current_insights>\n"
            f"{json.dumps(current_insights, indent=2)}\n"
            "</current_insights>"
        )
    else:
        parts.append(
            "<current_insights>\n"
            "No insights have been extracted yet.\n"
            "</current_insights>"
        )

    parts.append(
        f"<category>{category}</category>"
    )

    anchor_date = today or date.today()
    parts.append(
        f"<current_date>{anchor_date.isoformat()}</current_date>"
    )

    parts.append(
        "<user_message>\n"
        f"{question}\n"
        "</user_message>"
    )

    user_message = "\n\n".join(parts)

    return system_prompt, user_message

