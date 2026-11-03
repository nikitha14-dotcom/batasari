import logging
from typing import Literal

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.services.beta_access import beta_status, record_event

router = APIRouter(prefix="/beta", tags=["beta"])
logger = logging.getLogger(__name__)


def _user_id(request: Request) -> str:
    value = getattr(request.state, "user_id", None)
    if not value:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return value


def _supabase(request: Request):
    return getattr(request.app.state, "supabase", None)


class Event(BaseModel):
    model_config = ConfigDict(extra="forbid")
    event_name: Literal[
        "paywall_exposure_app", "paywall_exposure_ai", "waitlist_clicked",
        "no_thanks_clicked", "feedback_clicked", "decline_reason_submitted",
    ]
    metadata: dict = Field(default_factory=dict)

    @field_validator("metadata")
    @classmethod
    def _small_metadata(cls, value):
        if len(value) > 20 or any(len(str(k)) > 80 for k in value):
            raise ValueError("metadata is too large")
        return value


class Decline(BaseModel):
    model_config = ConfigDict(extra="forbid")
    reason: str = Field(min_length=1, max_length=80)
    reasons: list[str] | None = Field(default=None, max_length=6)
    explanation: str | None = Field(default=None, max_length=2000)

    @field_validator("reasons")
    @classmethod
    def _valid_reasons(cls, value):
        if value is None:
            return value
        if not value or any(not reason.strip() or len(reason) > 80 for reason in value):
            raise ValueError("reasons must contain one to six non-empty values")
        return list(dict.fromkeys(value))


@router.get("/status")
async def get_status(request: Request):
    user_id = _user_id(request)
    status = beta_status(_supabase(request), user_id)
    return status


@router.post("/events", status_code=204)
async def create_event(request: Request, body: Event):
    record_event(_supabase(request), _user_id(request), body.event_name, body.metadata)


@router.post("/waitlist")
async def join_waitlist(request: Request):
    user_id = _user_id(request)
    email = getattr(request.state, "user_email", None)
    sb = _supabase(request)
    if sb is None:
        raise HTTPException(status_code=503, detail="Beta access is unavailable")
    try:
        existing = (
            sb.table("beta_waitlist")
            .select("user_id")
            .eq("user_id", user_id)
            .limit(1)
            .execute()
        )
        if existing.data:
            return {"status": "already_joined", "email": email}
        sb.table("beta_waitlist").insert({"user_id": user_id, "email": email}).execute()
    except Exception:
        # A concurrent click may win the unique insert. Treat that as the
        # same idempotent result rather than exposing a database error.
        try:
            existing = (
                sb.table("beta_waitlist")
                .select("user_id")
                .eq("user_id", user_id)
                .limit(1)
                .execute()
            )
            if existing.data:
                return {"status": "already_joined", "email": email}
        except Exception:
            logger.exception("Could not re-check Beta waitlist for user=%s", user_id)
            raise HTTPException(
                status_code=503,
                detail="We could not join the waitlist. Please try again.",
            ) from None
        logger.exception("Could not join Beta waitlist for user=%s", user_id)
        raise HTTPException(
            status_code=503,
            detail="We could not join the waitlist. Please try again.",
        ) from None
    record_event(sb, user_id, "waitlist_clicked")
    return {"status": "joined", "email": email}


@router.post("/decline", status_code=204)
async def decline_waitlist(request: Request, body: Decline):
    user_id = _user_id(request)
    reasons = body.reasons or [body.reason]
    try:
        record_event(
            _supabase(request),
            user_id,
            "decline_reason_submitted",
            {
                "reason": body.reason,
                "reasons": reasons,
                "has_explanation": bool(body.explanation and body.explanation.strip()),
            },
            strict=True,
        )
    except Exception:
        raise HTTPException(
            status_code=503,
            detail="We could not save your response. Please try again.",
        ) from None

