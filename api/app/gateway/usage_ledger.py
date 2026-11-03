"""Cost of the extra model calls made while answering one question.

Insight extraction (and, in Stage 2, the router) is a paid model call that is
not the answer itself. Without this, the logged cost left it out and the $1
spend cap undercounted (BUG-009). The runner starts a ledger for each question;
the services that make extra calls add their usage to it right after the call,
so the cost is counted even if the reply cannot be parsed.
"""
from contextvars import ContextVar

from app.gateway.shared import estimate_cost

_current: ContextVar[dict | None] = ContextVar("overhead_usage", default=None)


def start() -> dict:
    """Begin a ledger for the question being answered and return it."""
    ledger = {"input_tokens": 0, "output_tokens": 0, "web_search_requests": 0, "cost_usd": 0.0}
    _current.set(ledger)
    return ledger


def record(result: dict) -> None:
    """Add one model call's usage (the dict call_claude returns) to the ledger."""
    ledger = _current.get()
    if ledger is None:
        return
    tokens_in = int(result.get("input_tokens") or 0)
    tokens_out = int(result.get("output_tokens") or 0)
    searches = int(result.get("web_search_requests") or 0)
    ledger["input_tokens"] += tokens_in
    ledger["output_tokens"] += tokens_out
    ledger["web_search_requests"] += searches
    ledger["cost_usd"] += estimate_cost(result.get("model", ""), tokens_in, tokens_out, searches)
