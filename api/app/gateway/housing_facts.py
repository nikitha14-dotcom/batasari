"""Housing's fixed facts: a few high-risk current facts the DS harness puts in the prompt.

One fact (the Ontario rent guideline) is always included for Housing. The others
are added when a trigger word appears in the question, the profile or the user's
earlier turns.
"""
import json

from app.gateway.router_prompts import CANONICAL_FACTS

_ALWAYS_ON = {"ontario_rent_guideline_2026"}


def select_canonical_facts(category, question, profile_context="", transcript=None) -> dict:
    if str(category).strip().lower() != "housing":
        return {}
    user_turns = [
        str(turn.get("content", "")) for turn in (transcript or []) if turn.get("role") == "user"
    ]
    combined = " ".join([question or "", profile_context or "", *user_turns]).lower()
    selected = {}
    for fact_id, payload in CANONICAL_FACTS.items():
        triggers = [str(trigger).lower() for trigger in payload.get("triggers", [])]
        if fact_id in _ALWAYS_ON or any(trigger in combined for trigger in triggers):
            selected[fact_id] = {k: v for k, v in payload.items() if k != "triggers"}
    return selected


def format_guardrails(facts: dict) -> str:
    if not facts:
        return ""
    return (
        "Relevant canonical guardrails. When one is material to the answer, verify it "
        "against the current official source before relying on it:\n"
        + json.dumps(facts, indent=2, ensure_ascii=False)
    )
