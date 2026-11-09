"""
Shared helpers for the AI Gateway.

format_context() and format_source_guidance() are lifted directly from
Gabriel's eval/pipeline/pipeline.py (DS#3) — same logic, centralized here
so /api and /eval read from one source instead of two copies drifting
apart over time. Gabriel was looped in before this landed.
"""
import logging
import re
import uuid

logger = logging.getLogger(__name__)

# High-confidence: explicit, near-unambiguous attempts to extract secrets or
# override the system prompt. These are narrow on purpose -- per the OWASP/
# Anthropic guidance, a single vague phrase should never trigger a hard block
# on its own (e.g. someone asking "what does 'ignore previous instructions'
# mean?" is a legitimate question, not an attack).
_HIGH_CONFIDENCE_PATTERNS = [
    r"reveal (your |the )?(system prompt|instructions|api key)",
    r"print (your |the |all )?(system prompt|instructions|developer messages|api keys?)",
    r"show (me )?(your |the )?(system prompt|instructions)",
    r"what (is|are) your (system prompt|instructions)",
    # Was too loose: "tell" alone matched harmless things like "tell me a
    # joke". Now requires the verb AND a sensitive target noun nearby.
    (
        r"ignore .{0,40}instructions.{0,20}(and|,).{0,60}"
        r"(reveal|print|show).{0,30}(system prompt|instructions|api key)"
    ),
]

# Ambiguous: worth logging, not worth blocking on their own. A pasted lease
# or a genuine question about prompt injection can contain these phrases
# without being an attack.
_AMBIGUOUS_PATTERNS = [
    r"ignore (all |any |the )?(previous|prior|above) instructions",
    r"disregard (all |any |the )?(previous|prior|above) instructions",
    r"you are now",
    r"new instructions?:",
    r"act as",
]

_COMPILED_HIGH = [re.compile(p, re.IGNORECASE) for p in _HIGH_CONFIDENCE_PATTERNS]
_COMPILED_AMBIGUOUS = [re.compile(p, re.IGNORECASE) for p in _AMBIGUOUS_PATTERNS]


def check_prompt_injection(text: str) -> dict:
    """
    Cheap, deterministic risk check. Not a complete defense on its own --
    a determined attempt can phrase around keyword matching -- this is a
    supplementary signal alongside tagging untrusted content (runner.py)
    and the system-prompt instruction (prompts.py), not the only gate.

    Returns {"risk": "none" | "suspicious" | "high", "matches": [...]}.
    "high" is reserved for near-unambiguous secret/system-prompt extraction
    attempts and should block. "suspicious" should be logged, not blocked --
    a single vague phrase is not enough evidence on its own.
    """
    if not text:
        return {"risk": "none", "matches": []}

    high_hits = [p.pattern for p in _COMPILED_HIGH if p.search(text)]
    if high_hits:
        return {"risk": "high", "matches": high_hits}

    ambiguous_hits = [p.pattern for p in _COMPILED_AMBIGUOUS if p.search(text)]
    if ambiguous_hits:
        return {"risk": "suspicious", "matches": ambiguous_hits}

    return {"risk": "none", "matches": []}

# Anthropic's web search tool: $10 per 1,000 searches, on top of tokens. The
# search results themselves already count as input tokens.
WEB_SEARCH_COST_USD = 0.01


def estimate_cost(
    model: str, input_tokens: int, output_tokens: int, web_search_requests: int = 0,
) -> float:
    """Estimated cost in USD, approximate pricing per model, per million tokens."""
    pricing = {
        "gpt-4o-mini": (0.150, 0.600),
        "gemini-3.6-flash": (0.75, 3.75),
        "gemini-2.5-flash-lite": (0.10, 0.40),
        # TODO: confirm real Claude Sonnet 4.6 pricing before this ships to
        # anyone who relies on it — placeholder only, don't trust this number yet.
        "claude-sonnet-4-6": (3.00, 15.000),
        # DeepInfra's listed price. It also reports a 0.5 "discount" whose
        # meaning isn't documented; the full price is used because this feeds
        # the per-user spend cap, where overcounting is the safe side.
        "zai-org/GLM-5.3-Flash": (0.15, 0.50),
        "deepseek-ai/DeepSeek-V4-Flash": (0.09, 0.18),
    }
    search_cost = web_search_requests * WEB_SEARCH_COST_USD
    rates = pricing.get(model)
    if not rates:
        return search_cost
    in_rate, out_rate = rates
    return (
        (input_tokens / 1_000_000 * in_rate)
        + (output_tokens / 1_000_000 * out_rate)
        + search_cost
    )


def format_context(context) -> str:
    """
    Accepts either a plain string or a structured dict
    (target_move_date, visa_type, etc.) and returns
    a formatted text block to insert into the prompt.
    """
    if isinstance(context, str):
        return context

    if isinstance(context, dict):
        lines = []
        for key, value in context.items():
            if key == "custom_variables" and isinstance(value, dict):
                for sub_key, sub_value in value.items():
                    lines.append(f"- {sub_key.replace('_', ' ').capitalize()}: {sub_value}")
            else:
                lines.append(f"- {key.replace('_', ' ').capitalize()}: {value}")
        return "\n".join(lines)
    return str(context)


def format_source_guidance(sources: list) -> str:
    """Formats authoritative_source_guidance list into text for the prompt."""
    if not sources:
        return ""

    lines = ["Authoritative sources you must ground your answer in:"]
    for src in sources:
        lines.append(
             f"- {src.get('source_name')} ({src.get('authority_tier')}): {src.get('source_url')}"
             )
        for fact in src.get("grounded_facts", []):
            lines.append(f"  Fact: {fact}")
    return "\n".join(lines)




def save_conversation_turn(
    supabase_client, user_id: str, category: str, subcategory: str,
    question: str, answer: str, conversation_id: str | None = None,
    run_id: str | None = None,
) -> None:
    """
    Persist one real question/answer turn. Never raises -- a failed save
    should not break the user's answer, which has already been generated
    and streamed by the time this runs.
    """
    try:
        supabase_client.table("conversation_history").insert({
            "user_id": user_id,
            "category": category,
            "subcategory": subcategory,
            "question": question,
            "answer": answer,
            # The table requires one. The frontend does not send one yet, and a
            # null here made every insert fail silently (only logged).
            "conversation_id": conversation_id or str(uuid.uuid4()),
            # Old history rows predate the stable answer identity. Keeping this
            # nullable lets them render safely without inventing an association.
            "run_id": run_id,
        }).execute()
    except Exception as e:
        # A rejected insert's error can quote the row it refused ("Failing row
        # contains (...)"), which includes the user's question and answer. Log
        # the type and code only.
        logger.error(
            "Could not save conversation turn: user_id=%s category=%s error_type=%s code=%s",
            user_id, category, type(e).__name__, getattr(e, "code", None),
        )
def get_conversation_history(
    supabase_client, user_id: str, category: str, limit: int = 20,
) -> list[dict]:
    result = (
        supabase_client.table("conversation_history")
        .select("question, answer, subcategory, run_id, created_at")
        .eq("user_id", user_id)
        .eq("category", category)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return result.data or []


def delete_conversation_history(
    supabase_client, user_id: str, category: str | None = None,
) -> None:
    """Delete this user's saved turns, for one category or all of them.

    Raises on failure, unlike save_conversation_turn: the user asked for this
    and is told it worked, so a failed delete must not look like a success.
    """
    query = supabase_client.table("conversation_history").delete().eq("user_id", user_id)
    if category:
        query = query.eq("category", category)
    query.execute()

