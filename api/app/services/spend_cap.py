"""Per-user AI spend cap for the Beta: each user gets $1 of AI usage in total."""

import os

DEFAULT_SPEND_CAP_USD = 1.00


# Read at call time, not import time: main.py loads .env after the routers are
# imported, so an import-time read would ignore a local .env override.
def spend_cap_usd() -> float:
    return float(os.getenv("AI_SPEND_CAP_USD") or DEFAULT_SPEND_CAP_USD)


def spend_cap_exempt_user_ids() -> frozenset[str]:
    """Return normalized user IDs shared by spend and Beta-time exemptions."""
    raw = os.getenv("AI_SPEND_CAP_EXEMPT_USER_IDS") or ""
    return frozenset(part.strip().lower() for part in raw.split(",") if part.strip())


def is_spend_exempt(user_id: str) -> bool:
    """Return whether a team account bypasses the spend and Beta-time limits."""
    return str(user_id).strip().lower() in spend_cap_exempt_user_ids()


def user_spend_usd(supabase, user_id: str) -> float:
    """All-time spend for one user, from the ai_spend_by_user view.

    A user with no answers yet has no row, which is $0 spent.
    """
    result = (
        supabase.table("ai_spend_by_user")
        .select("spend_usd")
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    if not result.data:
        return 0.0
    value = result.data[0]["spend_usd"]
    # PostgREST sends numeric as a JSON number (or a string, depending on
    # settings). Anything else is not a spend we can trust, so the caller
    # treats it as a failed lookup.
    if isinstance(value, bool) or not isinstance(value, (int, float, str)):
        raise TypeError(f"Unexpected spend_usd value of type {type(value).__name__}")
    return float(value)

