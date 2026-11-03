import logging
import re
from datetime import date
from typing import Annotated, Literal

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, BeforeValidator, ConfigDict, Field

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/feedback", tags=["feedback"])

# Keep in step with the check constraints in
# supabase/migrations/20260923090000_feedback.sql and with FEEDBACK_TYPES in
# web/lib/feedback/feedbackTypes.ts. Three places is two too many, but the
# database is the only one that holds against a service-role writer and the
# browser list is what renders the menu.
FEEDBACK_TYPES = (
    "suggestion",
    "feature_request",
    "bug_report",
    "complaint",
    "general_feedback",
    "other",
)

MAX_MESSAGE = 2000

# Per-user submissions allowed per calendar day. The success screen invites
# another submission straight away (Feedback_4 leaves the form ready), so a
# frustrated or bored user can fire this endpoint as fast as they can click.
#
# 20 is far above any honest day's use and far below what an automated loop
# would produce. Enforced with the same InMemoryRateLimiter that guards
# /ai/answer rather than a second mechanism.
DEFAULT_DAILY_FEEDBACK_LIMIT = 20

# C0/C1 controls plus the Unicode line and paragraph separators. Unlike the
# profile fields, real feedback legitimately contains newlines -- someone
# writing three paragraphs about a bug should keep their paragraphs -- so \n
# and \r survive and only the rest are collapsed. This text is never fed to
# the model as context, so the prompt-forging concern behind the equivalent
# rule in profile.py does not apply here.
_CONTROL_CHARS = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f  ]")


def _clean_message(value):
    if value is None:
        return None
    if not isinstance(value, str):
        return value

    cleaned = _CONTROL_CHARS.sub(" ", value)
    # Normalise line endings so a Windows browser and a Mac one store the same
    # bytes for the same typing.
    cleaned = cleaned.replace("\r\n", "\n").replace("\r", "\n")
    cleaned = cleaned.strip()

    if len(cleaned) > MAX_MESSAGE:
        raise ValueError(f"must be at most {MAX_MESSAGE} characters")

    # Whitespace-only is an empty field, not an empty string, so the column
    # stays null and "did they write anything" is one check rather than two.
    return cleaned or None


FeedbackMessage = Annotated[str | None, BeforeValidator(_clean_message)]


class FeedbackCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    # Rating and type are required; free text is not. Those two are the fields
    # that can be counted across the pilot, and gating on typing effort would
    # cost submissions without adding anything countable.
    rating: int = Field(ge=1, le=5)
    feedback_type: Literal[
        "suggestion",
        "feature_request",
        "bug_report",
        "complaint",
        "general_feedback",
        "other",
    ]
    message: FeedbackMessage = None


def _get_user_id(request: Request) -> str:
    user_id = getattr(request.state, "user_id", None)
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user_id


def _get_supabase(request: Request):
    if not hasattr(request.app.state, "supabase"):
        raise HTTPException(status_code=503, detail="Supabase is not configured")
    return request.app.state.supabase


@router.post("", status_code=201)
async def create_feedback(request: Request, body: FeedbackCreate):
    user_id = _get_user_id(request)

    limiter = request.app.state.feedback_limiter
    if not limiter.check_and_increment(user_id, date.today()):
        raise HTTPException(
            status_code=429,
            detail="You have sent a lot of feedback today. Please try again tomorrow.",
        )

    sb = _get_supabase(request)

    row = {
        "user_id": user_id,
        "rating": body.rating,
        "feedback_type": body.feedback_type,
        "message": body.message,
    }

    try:
        result = sb.table("feedback").insert(row).execute()
    except Exception:
        # Database exception text can contain the submitted message.
        logger.error("Feedback insert failed for user %s", user_id)
        raise HTTPException(status_code=503, detail="Could not save your feedback") from None

    if not result.data:
        logger.error("Feedback insert returned no row for user %s", user_id)
        raise HTTPException(status_code=503, detail="Could not save your feedback")

    created = result.data[0]
    # Deliberately minimal: the client needs confirmation, not its own text
    # echoed back.
    return {"id": created.get("id"), "created_at": created.get("created_at")}

