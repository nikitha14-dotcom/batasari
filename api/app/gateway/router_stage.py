"""Stage 2 router: classify the question, apply the safety step, decide whether to ask first.

Ported from the DS harness (router, safety actions and fixed replies). It is one
extra model call with no web search, made before the answer. A reply that cannot
be parsed or validated fails closed: no answer call and a generic "please
rephrase" reply. The runner decides whether to use it (ROUTER_ENABLED).
"""

import json
import os
import re
from datetime import UTC, datetime, timedelta

from app.gateway import usage_ledger
from app.gateway.internal_model import call_internal_model
from app.gateway.router_prompts import (
    ALLOWED_CLASSIFICATIONS,
    ALLOWED_SAFETY_ACTIONS,
    ALLOWED_SAFETY_CATEGORIES,
    PRODUCT_CATEGORIES,
    ROUTER_CATEGORY_INSTRUCTIONS,
    ROUTER_INSTRUCTION,
)
from app.gateway.shared import get_conversation_history

_ALIASES = {
    "education and family": "Education & Family",
    "education/family": "Education & Family",
    "education & family": "Education & Family",
    "daily needs": "Daily Needs",
    "the city": "The City",
    "city": "The City",
    "moving and shipping": "Moving & Shipping",
    "moving & shipping": "Moving & Shipping",
}

_UI_CATEGORIES = {
    "housing": "Housing",
    "work": "Work",
    "family": "Education & Family",
    "education": "Education & Family",
    "education-family": "Education & Family",
    "education_family": "Education & Family",
    "finance": "Finance",
    "daily needs": "Daily Needs",
    "health": "Health",
    "immigration": "Immigration",
    "the city": "The City",
    "moving & shipping": "Moving & Shipping",
    "checklist": "Checklist",
    "other": "Other",
}

_SAFETY_HEADINGS = ("# I Can't Help With That", "# Get Immediate Help")

# Categories where we link to official sources instead of answering.
# REDIRECT_CATEGORIES (comma separated) picks which are on; "none" turns it off.
REDIRECT_REPLIES = {
    "Immigration": (
        "# Immigration Questions: Check Official Sources\n\n"
        "Immigration rules depend on your exact situation and change often, so I don't "
        "give personalized immigration advice. These official IRCC pages are the right "
        "place to check:\n\n"
        "- [Immigration and citizenship (IRCC)]"
        "(https://www.canada.ca/en/immigration-refugees-citizenship.html): visas, "
        "permits, permanent residence and citizenship\n"
        "- [Check your application status]"
        "(https://www.canada.ca/en/immigration-refugees-citizenship/services/application/check-status.html)\n"
        "- [IRCC Help Centre]"
        "(https://ircc.canada.ca/English/helpcentre/results-by-topic.asp?top=34): "
        "answers to common questions and how to contact IRCC\n\n"
        "For advice on your own case, speak with IRCC directly, or with a licensed "
        "immigration consultant or lawyer."
    ),
}


def redirect_categories() -> set[str]:
    raw = os.getenv("REDIRECT_CATEGORIES", "Immigration")
    names = {normalize_product_category(c.strip()) for c in raw.split(",") if c.strip()}
    return names & set(REDIRECT_REPLIES)


def render_redirect(route: dict) -> str:
    return REDIRECT_REPLIES[route["product_category"]]


def normalize_product_category(value, fallback="Other") -> str:
    raw = str(value or "").strip()
    if raw in PRODUCT_CATEGORIES:
        return raw
    lowered = raw.lower()
    if lowered in _ALIASES:
        return _ALIASES[lowered]
    for name in PRODUCT_CATEGORIES:
        if lowered == name.lower():
            return name
    return fallback if fallback in PRODUCT_CATEGORIES else "Other"


def product_category_from_ui(category) -> str:
    key = str(category or "").strip().lower()
    return _UI_CATEGORIES.get(key) or normalize_product_category(category, fallback="Other")


def _clean_string_list(value, max_items=12) -> list[str]:
    if not isinstance(value, list):
        return []
    cleaned = []
    for item in value:
        if item is None:
            continue
        text = str(item).strip()
        if text and text not in cleaned:
            cleaned.append(text)
        if len(cleaned) >= max_items:
            break
    return cleaned


def _extract_json_object(text) -> dict:
    text = (text or "").strip()
    if not text:
        raise ValueError("Empty JSON response")
    try:
        value = json.loads(text)
        if isinstance(value, dict):
            return value
    except json.JSONDecodeError:
        pass
    fenced = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL | re.IGNORECASE)
    if fenced:
        value = json.loads(fenced.group(1))
        if isinstance(value, dict):
            return value
    start = text.find("{")
    if start == -1:
        raise ValueError("No JSON object found")
    depth = 0
    in_string = False
    escape = False
    for idx in range(start, len(text)):
        char = text[idx]
        if in_string:
            if escape:
                escape = False
            elif char == "\\":
                escape = True
            elif char == '"':
                in_string = False
            continue
        if char == '"':
            in_string = True
        elif char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                value = json.loads(text[start : idx + 1])
                if isinstance(value, dict):
                    return value
                break
    raise ValueError("Could not parse JSON object")


def router_category_instruction(category) -> str:
    return ROUTER_CATEGORY_INSTRUCTIONS.get(str(category).strip().title(), "")


def build_router_prompt(
    question, profile_context, transcript, current_date, category, subcategory=""
):
    return f"""Current System Date: {current_date}

UI/Eval Category Hint: {category}
UI/Eval Product-Category Hint: {product_category_from_ui(category)}
UI/Eval Subcategory Hint: {subcategory or ""}

Treat these as routing priors only. Independently classify the CURRENT user message
into the product taxonomy in the system instruction. Do not infer user facts from
the UI/eval fields.

If the actual question belongs to the hinted domain, these interaction notes may help;
otherwise ignore them:
{router_category_instruction(category)}

Raw User Profile Context (only these fields are known profile facts):
{profile_context or "(none)"}

Prior Conversation Transcript:
{json.dumps(transcript or [], indent=2, ensure_ascii=False)}

Current User Message:
{question}

Return the combined product-category + interaction + safety-router JSON only.
Also include the key "continues_previous_turn" (true or false) in that JSON.
It is true only if the current user message directly answers or continues the
prior conversation transcript above. It is false if it starts a new topic or
the transcript is empty.
"""


def _fail_closed_route(product_category: str) -> dict:
    return {
        "product_category": product_category,
        "category_confidence": "low",
        "safety_action": "allow",
        "safety_category": "none",
        "classification": "ambiguous",
        "should_answer_now": False,
        "missing_blockers": [],
        "material_unknowns": [],
        "clarification_heading": "",
        "clarification_intro": "",
        "clarification_items": [],
        "parse_fallback": True,
        "fail_closed": True,
    }


def normalize_router_output(raw, fallback_product_category="Other") -> dict:
    """Validate the router's reply. A reply that cannot be trusted fails closed."""
    fallback = normalize_product_category(fallback_product_category)
    try:
        payload = _extract_json_object(raw)
    except Exception:
        return _fail_closed_route(fallback)

    classification = str(payload.get("classification", "")).strip().lower()
    safety_action = str(payload.get("safety_action", "")).strip().lower()
    if classification not in ALLOWED_CLASSIFICATIONS or safety_action not in ALLOWED_SAFETY_ACTIONS:
        return _fail_closed_route(fallback)

    parse_fallback = False
    product_category = normalize_product_category(payload.get("product_category"), fallback)
    if str(payload.get("product_category", "")).strip().lower() not in {
        name.lower() for name in PRODUCT_CATEGORIES
    } | set(_ALIASES):
        parse_fallback = True

    confidence = str(payload.get("category_confidence", "")).strip().lower()
    if confidence not in {"high", "medium", "low"}:
        confidence = "low"
        parse_fallback = True

    safety_category = str(payload.get("safety_category", "")).strip().lower()
    if safety_category not in ALLOWED_SAFETY_CATEGORIES:
        safety_category = "none" if safety_action == "allow" else "other_safety"
        parse_fallback = True

    missing_blockers = _clean_string_list(payload.get("missing_blockers"), 8)
    clarification_items = _clean_string_list(payload.get("clarification_items"), 8)
    if classification == "ambiguous":
        if not clarification_items:
            clarification_items = missing_blockers or [
                "Please clarify the key missing detail that determines the recommendation."
            ]
    else:
        clarification_items = []
        missing_blockers = []

    return {
        "product_category": product_category,
        "category_confidence": confidence,
        "safety_action": safety_action,
        "safety_category": safety_category,
        "classification": classification,
        "should_answer_now": classification != "ambiguous",
        "missing_blockers": missing_blockers,
        "material_unknowns": _clean_string_list(payload.get("material_unknowns"), 12),
        "clarification_heading": str(payload.get("clarification_heading", "")).strip(),
        "clarification_intro": str(payload.get("clarification_intro", "")).strip(),
        "clarification_items": clarification_items,
        "parse_fallback": parse_fallback,
        "fail_closed": False,
        "continues_previous_turn": payload.get("continues_previous_turn") is True,
    }


def decide(route: dict) -> str:
    """What the runner does next: fail_closed, safety, redirect, clarify or answer."""
    if route.get("fail_closed"):
        return "fail_closed"
    if route.get("safety_action") in ("hard_refusal", "emergency_redirect"):
        return "safety"
    if route.get("product_category") in redirect_categories() and route.get(
        "category_confidence"
    ) in ("high", "medium"):
        return "redirect"
    if not route.get("should_answer_now"):
        return "clarify"
    return "answer"


def render_clarification(route: dict) -> str:
    heading = route.get("clarification_heading") or "A Few Details Before I Recommend"
    intro = route.get("clarification_intro") or (
        "I can give you a useful answer once I know the following:"
    )
    items = route.get("clarification_items") or route.get("missing_blockers") or []
    lines = [f"# {heading}", "", intro]
    if items:
        lines.append("")
        lines.extend(f"- {item}" for item in items)
    return "\n".join(lines).strip()


def render_safety_response(route: dict) -> str | None:
    action = str(route.get("safety_action") or "allow").strip().lower()
    if action == "emergency_redirect":
        return (
            "# Get Immediate Help\n\n"
            "If there is immediate danger or a medical emergency, call **911 in Canada now**. "
            "If this involves suicide or self-harm, call or text **9-8-8**. If you can, move "
            "to a safer place and contact someone you trust nearby."
        )
    if action == "hard_refusal":
        return (
            "# I Can't Help With That\n\n"
            "I can't provide instructions that would meaningfully facilitate harm, illegal "
            "activity, deception, privacy invasion, abuse, or bypassing safeguards. I can "
            "help with a safe and legal alternative, prevention, verification, reporting, "
            "or recovery steps instead."
        )
    return None


def render_fail_closed() -> str:
    # Plain text on purpose: no "# " heading, so it is never mistaken for a clarification.
    return (
        "I couldn't understand that well enough to answer it safely. "
        "Could you rephrase your question, with a little more detail?"
    )


def looks_like_clarification(answer: str) -> bool:
    """True for a saved reply that was a clarifying question from render_clarification."""
    text = (answer or "").strip()
    if not text.startswith("# ") or len(text) > 1200:
        return False
    if text.startswith(_SAFETY_HEADINGS):
        return False
    return "](http" not in text and "\n## " not in text


_MAX_CLARIFICATION_AGE = timedelta(minutes=30)
# How many saved turns to look back through. Each clarification round is one
# turn, so this is also the most rounds that can be carried over.
_HISTORY_LOOKBACK = 10


def _parse_time(created_at):
    """The turn's timestamp, or None when it is missing or unreadable."""
    if not created_at:
        return None
    try:
        when = datetime.fromisoformat(str(created_at).replace("Z", "+00:00"))
    except ValueError:
        return None
    return when if when.tzinfo else when.replace(tzinfo=UTC)


def previous_clarification_turn(supabase, user_id: str, category: str) -> list[dict]:
    """Every clarification round since the last full answer, oldest first.

    Walks back from the latest saved turn while each one was a clarifying
    question, and stops at the first real answer. A turn older than 30 minutes
    (measured from the turn after it, or from now for the latest) ends the chain.
    A turn with no readable timestamp is kept, as before.
    """
    if supabase is None:
        return []
    try:
        rows = get_conversation_history(supabase, user_id, category, limit=_HISTORY_LOOKBACK)
    except Exception:
        return []
    chain = []
    newer = datetime.now(UTC)
    for row in rows:  # newest first
        if not looks_like_clarification(str(row.get("answer") or "")):
            break
        when = _parse_time(row.get("created_at"))
        if when is not None:
            if newer - when > _MAX_CLARIFICATION_AGE:
                break
            newer = when
        chain.append(row)
    transcript = []
    for row in reversed(chain):
        transcript.append({"role": "user", "content": str(row.get("question") or "")[:600]})
        transcript.append({"role": "assistant", "content": str(row.get("answer") or "")[:1500]})
    return transcript


async def run_router(
    question, category, subcategory, profile_context, transcript, current_date
) -> dict:
    """One model call, no web search. Its usage goes on the question's ledger."""
    result = await call_internal_model(
        system_prompt=ROUTER_INSTRUCTION,
        question=build_router_prompt(
            question, profile_context, transcript, current_date, category, subcategory
        ),
    )
    usage_ledger.record(result)
    return normalize_router_output(
        result["text"], fallback_product_category=product_category_from_ui(category)
    )


def router_enabled() -> bool:
    """Off unless ROUTER_ENABLED=true. Unsetting it is the rollback."""
    return os.getenv("ROUTER_ENABLED", "").strip().lower() == "true"


def _defang(text) -> str:
    # The text lands inside a labelled block. It must not be able to close it.
    return str(text).replace("<", "(").replace(">", ")")


def build_routing_context(route: dict, transcript: list[dict]) -> str:
    """The internal routing decision, plus the earlier turn if it was a clarification."""
    if not route.get("continues_previous_turn"):
        transcript = []
    lines = [
        "Internal routing decision. Never reveal it to the user.",
        f"Product category: {route.get('product_category')}",
        f"Interaction classification: {route.get('classification')}",
        f"Safety action: {route.get('safety_action')}",
    ]
    unknowns = route.get("material_unknowns") or []
    if unknowns:
        lines.append("Material unknowns:")
        lines.extend(f"- {_defang(item)}" for item in unknowns)
    if transcript:
        lines.append("")
        lines.append(
            "Earlier turns, oldest first. Use them only if the current question "
            "answers or continues them."
        )
        lines.append(
            "If the current question is about a different topic, ignore these turns "
            "completely and never mention them, or the earlier questions, in your answer."
        )
        for turn in transcript:
            who = "User" if turn.get("role") == "user" else "Assistant"
            lines.append(f"{who}: {_defang(turn.get('content', ''))}")
    return "\n".join(lines)

