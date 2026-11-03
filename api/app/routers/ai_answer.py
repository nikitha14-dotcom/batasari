import json
import logging
import re
from datetime import date

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field, field_validator

from app.gateway.runner import run_ai_answer
from app.gateway.shared import (
    delete_conversation_history,
    format_context,
    get_conversation_history,
)
from app.services.beta_access import access_decision, require_active_beta
from app.services.spend_cap import (
    is_spend_exempt,
    spend_cap_usd,
    user_spend_usd,
)

logger = logging.getLogger(__name__)


router = APIRouter(prefix="/ai", tags=["ai"])

_PROFILE_METADATA_KEYS = {"user_id", "created_at", "updated_at"}

# A question long enough to matter is well under this. The cap exists because
# every character here is billed and sent to the model: without one, a single
# authenticated caller can post megabytes per request and spend the project's
# API budget in a loop.
MAX_QUESTION = 2_000

MAX_TAXONOMY = 64
MAX_CONVERSATION_ID = 64

# category and subcategory are interpolated into the system prompt by
# run_ai_answer. They name a section of the product -- "Housing",
# "Compare Options" -- so they are letters, digits and a little punctuation.
#
# Restricting the shape rather than the values deliberately leaves the open
# question below open: nothing here asserts which categories exist, so Vu's
# enum can land without touching this. What it does remove is the ability to
# put newlines, braces or angle brackets into the system prompt, which is what
# turns an unvalidated label into a prompt takeover.
_TAXONOMY_SHAPE = re.compile(r"^[A-Za-z0-9 &/'\u2019.,()-]+$")

# Opaque client-generated id. Never interpolated into a prompt, but it is
# accepted from the network, so it gets a shape too.
_CONVERSATION_ID_SHAPE = re.compile(r"^[A-Za-z0-9_-]+$")


class AIAnswerRequest(BaseModel):
    question: str = Field(max_length=MAX_QUESTION)
    category: str = Field(max_length=MAX_TAXONOMY)
    subcategory: str = Field(max_length=MAX_TAXONOMY)
    conversation_id: str | None = Field(default=None, max_length=MAX_CONVERSATION_ID)
    # A conversation_id represents one continuous session, not one topic --
    # a user can move between categories (Housing, Work, etc.) within the
    # same conversation_id. See Sai/Jia's discussion, Sept 19.
    # TODO: category/subcategory still aren't checked against the confirmed
    # enums (e.g. Housing's 3 subcategories). Add once Vu confirms the exact
    # strings the frontend sends — don't guess at them here. The shape check
    # below is not a substitute for that; it only stops the value from
    # restructuring the prompt.

    @field_validator("question")
    @classmethod
    def _reject_blank_question(cls, value: str) -> str:
        # A blank question reaches Anthropic as an empty message, which it
        # rejects with a 400. That 400's raw body was then streamed to the
        # browser as the error event, exposing provider internals and costing
        # a round trip to learn something we can see here.
        stripped = value.strip()
        if not stripped:
            raise ValueError("question must not be empty")
        return stripped

    @field_validator("category", "subcategory")
    @classmethod
    def _reject_unshaped_taxonomy(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("must not be empty")
        if not _TAXONOMY_SHAPE.match(stripped):
            raise ValueError("must be a plain section name")
        return stripped

    @field_validator("conversation_id")
    @classmethod
    def _reject_unshaped_conversation_id(cls, value: str | None) -> str | None:
        if value is None:
            return None
        if not _CONVERSATION_ID_SHAPE.match(value):
            raise ValueError("must be an opaque identifier")
        return value


class DeleteRequest(BaseModel):
    """Request body for delete endpoints."""
    category: str | None = Field(default=None, max_length=MAX_TAXONOMY)

    @field_validator("category")
    @classmethod
    def _validate_category(cls, value: str | None) -> str | None:
        if value is None:
            return None
        stripped = value.strip()
        if not stripped:
            return None
        if not _TAXONOMY_SHAPE.match(stripped):
            raise ValueError("must be a plain section name")
        # The shape allows "/" and "." for subcategory names. A category is
        # never one of those, and here it becomes part of a file path.
        if "/" in stripped or stripped in (".", ".."):
            raise ValueError("must be a plain section name")
        return stripped


def _get_user_id(request: Request) -> str:
    # Same pattern as profile.py's _get_user_id — AuthMiddleware in main.py
    # sets request.state.user_id before this route ever runs.
    user_id = getattr(request.state, "user_id", None)
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user_id


def _get_profile_context(request: Request, user_id: str) -> str:
    """
    Already-saved onboarding answers (visa type, household, etc.), formatted
    for the prompt. Never raises -- a missing or unreadable profile just means
    no personalization for this answer, not a failed request. Only reads what
    onboarding already saved; doesn't persist anything (ADR 0006 governs
    persisting new conversation content, not reading existing profile data).
    """
    if getattr(request.state, "use_local_profile_store", False):
        profile = request.app.state.local_profiles.get("local-dev-user")
    else:
        supabase = getattr(request.app.state, "supabase", None)
        if supabase is None:
            return ""
        try:
            result = supabase.table("profiles").select("*").eq("user_id", user_id).execute()
        except Exception:
            # Personalization is optional, so the answer still streams. But
            # silence here means a key rotation or a schema change turns off
            # every profile-aware answer with no signal at all -- the six
            # onboarding screens quietly stop mattering. Warn, don't raise.
            logger.warning("Profile lookup failed for %s; answering without context", user_id)
            return ""
        profile = result.data[0] if result.data else None

    if not profile:
        return ""

    answered = {
        k: v for k, v in profile.items() if k not in _PROFILE_METADATA_KEYS and v is not None
    }
    return format_context(answered) if answered else ""


def _get_insight_store(request: Request):
    """Return the insight store from app state, or None if not configured."""
    return getattr(request.app.state, "insight_store", None )


# The user's own recent questions, so a later question like "tips for viewing a
# place" still sees that they said "that's my budget, not including my
# relatives" two turns earlier. Questions only, not answers: answers are long
# and cost tokens against the $1 cap.
# Off for now, to keep changes small before the demo: the answer model gets the
# current question plus the saved notes only. The code and its tests stay so it
# can be turned back on.
SEND_PAST_QUESTIONS = False
MAX_CONTEXT_TURNS = 5
MAX_CONTEXT_CHARS = 300


def _get_conversation_context(supabase, user_id: str, category: str) -> str:
    """Last few questions this user asked in this category, oldest first.
    Never raises: no history just means no extra context."""
    if supabase is None:
        return ""
    try:
        rows = get_conversation_history(
            supabase, user_id, category, limit=MAX_CONTEXT_TURNS
        )
    except Exception:
        logger.warning(
            "Could not load conversation history for user=%s; answering without it",
            user_id,
        )
        return ""
    lines = []
    for row in reversed(rows):
        question = " ".join(str(row.get("question") or "").split())
        if question:
            lines.append(f"- {question[:MAX_CONTEXT_CHARS]}")
    return "\n".join(lines)


async def _spend_cap_reached():
    # Wording follows the Help & FAQ page ("What happens if I use all my AI credit?").
    message = (
        "You've used all of your free AI credit for the Beta, so you can't ask "
        "new AI questions. You can keep using the rest of the app."
    )
    data = json.dumps({"code": "spend_cap_reached", "message": message})
    yield f"event: error\ndata: {data}\n\n"


async def _beta_expired():
    data = json.dumps({
        "code": "beta_expired",
        "message": "Your three-day Beta access has ended. You can no longer submit AI questions.",
    })
    yield f"event: error\ndata: {data}\n\n"


@router.post("/answer")
async def ai_answer(request: Request, body: AIAnswerRequest):
    user_id = _get_user_id(request)
    decision = access_decision(request)
    if not decision.active:
        return StreamingResponse(_beta_expired(), media_type="text/event-stream")

    # Check the per-user daily quota before doing anything billable. This is
    # intentionally before profile lookup and before run_ai_answer -- a user
    # over their limit should never reach the model.
    limiter = getattr(request.app.state, "rate_limiter", None)
    if limiter is not None and not limiter.check_and_increment(user_id, date.today()):
        raise HTTPException(status_code=429, detail="Daily request limit reached")

    # The Beta's $1 of AI usage per user, all-time (MVP Launch Plan). Sent as a
    # stream error event, not an HTTP error, because the copilot shows an
    # event's message as-is but shows an HTTP error's raw response body.
    supabase = getattr(request.app.state, "supabase", None)
    if supabase is not None and not is_spend_exempt(user_id):
        try:
            spent = user_spend_usd(supabase, user_id)
        except Exception:
            # Answer rather than block everyone while the lookup is failing;
            # the daily request limit above still applies.
            logger.warning("Could not check AI spend for user=%s; answering anyway", user_id)
            spent = 0.0
        if spent >= spend_cap_usd():
            logger.info("AI spend cap reached for user=%s (spent=%.4f)", user_id, spent)
            return StreamingResponse(_spend_cap_reached(), media_type="text/event-stream")

    profile_context = _get_profile_context(request, user_id)
    insight_store = _get_insight_store(request)
    conversation_context = (
        _get_conversation_context(supabase, user_id, body.category)
        if SEND_PAST_QUESTIONS
        else ""
    )

    return StreamingResponse(
        run_ai_answer(
            question=body.question,
            category=body.category,
            subcategory=body.subcategory,
            user_id=user_id,
            profile_context=profile_context,
            conversation_context=conversation_context,
            conversation_id=body.conversation_id,
            supabase=getattr(request.app.state, "supabase", None),
            insight_store=insight_store,
            model_input_cache=getattr(request.app.state, "model_input_cache", None),
        ),
        media_type="text/event-stream",
    )


MAX_HISTORY_TURNS = 100


@router.get("/conversation/history")
async def conversation_history(
    request: Request, category: str, limit: int = MAX_HISTORY_TURNS
):
    """
    Returns this user's saved question/answer pairs for one category,
    most recent first. Retrieval is by category (the UI-passed page
    section), not by topic classification -- matches how history is
    saved in run_ai_answer, and how it's meant to be displayed: a user
    on the Housing page sees their Housing history, nothing else.
    """
    user_id = _get_user_id(request)
    require_active_beta(request)
    stripped_category = category.strip()
    if not stripped_category or not _TAXONOMY_SHAPE.match(stripped_category):
        raise HTTPException(status_code=422, detail="category must be a plain section name")

    supabase = getattr(request.app.state, "supabase", None)
    if supabase is None:
        return {"history": []}

    history = get_conversation_history(
        supabase_client=supabase,
        user_id=user_id,
        category=stripped_category,
        limit=max(1, min(limit, MAX_HISTORY_TURNS)),
    )
    return {"history": history}


@router.delete("/insights")
async def delete_insights(request: Request, body: DeleteRequest | None = None):
    """Delete derived insights for the authenticated user.

    If ``category`` is provided, deletes only that category's insights.
    If omitted, deletes all insights across all categories.

    Intentionally available after Beta expiry so users retain the deletion
    rights required by ADR 0006 and ADR 0015.
    """
    user_id = _get_user_id(request)
    insight_store = _get_insight_store(request)
    if insight_store is None:
        raise HTTPException(status_code=503, detail="Insight store is not configured")

    category = body.category if body else None
    try:
        insight_store.delete_insights(user_id, category=category)
    except ValueError:
        raise HTTPException(status_code=422, detail="category must be a plain section name")
    return {"status": "ok", "deleted": "all" if category is None else category}


@router.delete("/conversations")
async def delete_conversations(request: Request, body: DeleteRequest | None = None):
    """Delete conversation history for the authenticated user.

    If ``category`` is provided, deletes only that category's history.
    If omitted, deletes all conversation history.

    Intentionally available after Beta expiry so users retain the deletion
    rights required by ADR 0006 and ADR 0015.
    """
    user_id = _get_user_id(request)
    insight_store = _get_insight_store(request)
    if insight_store is None:
        raise HTTPException(status_code=503, detail="Insight store is not configured")

    category = body.category if body else None
    try:
        insight_store.delete_conversations(user_id, category=category)
    except ValueError:
        raise HTTPException(status_code=422, detail="category must be a plain section name")

    # /ai/answer also saves every turn to conversation_history, which is what
    # the history endpoint reads, so clearing only the insight store left the
    # user's questions and answers in the database.
    supabase = getattr(request.app.state, "supabase", None)
    if supabase is not None:
        try:
            delete_conversation_history(supabase, user_id, category=category)
        except Exception:
            logger.exception("Could not delete conversation history for user=%s", user_id)
            raise HTTPException(
                status_code=500, detail="Could not delete conversation history"
            )
    return {"status": "ok", "deleted": "all" if category is None else category}

