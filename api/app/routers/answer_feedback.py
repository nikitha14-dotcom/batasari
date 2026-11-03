"""Authenticated persistence for the thumbs controls on AI answers."""

import logging
from typing import Literal
from uuid import UUID

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field

from app.services.beta_access import require_active_beta

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai/answer-feedback", tags=["ai"])


class RatingUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    rating: Literal[-1, 1]
    expected_version: int = Field(ge=0)


class RatingRemoval(BaseModel):
    model_config = ConfigDict(extra="forbid")

    expected_version: int = Field(ge=0)


class RatingStatusRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    answer_run_ids: list[UUID] = Field(max_length=100)


def _get_user_id(request: Request) -> str:
    user_id = getattr(request.state, "user_id", None)
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user_id


def _get_supabase(request: Request):
    supabase = getattr(request.app.state, "supabase", None)
    if supabase is None:
        raise HTTPException(status_code=503, detail="Supabase is not configured")
    return supabase


def _find_owned_answer_log(supabase, user_id: str, answer_run_id: UUID) -> dict:
    """Resolve the opaque browser run ID without trusting it for ownership."""
    try:
        result = (
            supabase.table("ai_answer_log")
            .select("id, run_id")
            .eq("run_id", str(answer_run_id))
            .eq("user_id", user_id)
            .limit(2)
            .execute()
        )
    except Exception:
        logger.error("Could not look up AI answer for feedback: user_id=%s", user_id)
        raise HTTPException(status_code=503, detail="Could not save answer feedback") from None

    # The original ai_answer_log migration did not constrain run_id. Do not
    # choose arbitrarily if an unexpected historical duplicate exists.
    if len(result.data or []) != 1:
        raise HTTPException(status_code=404, detail="AI answer was not found")
    return result.data[0]


def _current_rating_state(supabase, user_id: str, answer_run_id: UUID) -> dict:
    result = (
        supabase.table("ai_answer_feedback_status")
        .select("rating, version")
        .eq("user_id", user_id)
        .eq("answer_run_id", str(answer_run_id))
        .limit(1)
        .execute()
    )
    return (result.data or [{}])[0]


def _set_rating(
    supabase, user_id: str, answer_log_id: str, answer_run_id: UUID, rating: int | None,
    expected_version: int,
):
    try:
        result = supabase.rpc(
            "set_ai_answer_feedback",
            {
                "p_answer_log_id": answer_log_id,
                "p_user_id": user_id,
                "p_rating": rating,
                "p_expected_version": expected_version,
            },
        ).execute()
    except Exception:
        logger.error("Could not save AI answer feedback: user_id=%s", user_id)
        raise HTTPException(status_code=503, detail="Could not save answer feedback") from None

    if result.data:
        state = result.data[0]
        return {
            "answer_run_id": str(answer_run_id),
            "rating": state["rating"],
            "version": state["version"],
        }

    try:
        current = _current_rating_state(supabase, user_id, answer_run_id)
    except Exception:
        logger.error("Could not read conflicting AI answer feedback: user_id=%s", user_id)
        raise HTTPException(status_code=503, detail="Could not save answer feedback") from None
    return JSONResponse(
        status_code=409,
        content={
            "detail": "Answer feedback changed elsewhere",
            "answer_run_id": str(answer_run_id),
            "rating": current.get("rating"),
            "version": current.get("version", 0),
        },
    )


@router.put("/{answer_run_id}")
async def save_answer_rating(request: Request, answer_run_id: UUID, body: RatingUpdate):
    user_id = _get_user_id(request)
    require_active_beta(request)
    supabase = _get_supabase(request)
    answer_log = _find_owned_answer_log(supabase, user_id, answer_run_id)

    try:
        return _set_rating(
            supabase, user_id, answer_log["id"], answer_run_id, body.rating, body.expected_version
        )
    except HTTPException:
        raise


@router.delete("/{answer_run_id}")
async def remove_answer_rating(request: Request, answer_run_id: UUID, body: RatingRemoval):
    user_id = _get_user_id(request)
    require_active_beta(request)
    supabase = _get_supabase(request)
    answer_log = _find_owned_answer_log(supabase, user_id, answer_run_id)

    return _set_rating(
        supabase, user_id, answer_log["id"], answer_run_id, None, body.expected_version
    )


@router.post("/status")
async def answer_rating_status(request: Request, body: RatingStatusRequest):
    user_id = _get_user_id(request)
    require_active_beta(request)
    run_ids = list(dict.fromkeys(str(run_id) for run_id in body.answer_run_ids))
    if not run_ids:
        return {"ratings": {}}

    supabase = _get_supabase(request)
    try:
        result = (
            supabase.table("ai_answer_feedback_status")
            .select("answer_run_id, rating, version")
            .eq("user_id", user_id)
            .in_("answer_run_id", run_ids)
            .execute()
        )
    except Exception:
        logger.error("Could not load AI answer feedback: user_id=%s", user_id)
        raise HTTPException(status_code=503, detail="Could not load answer feedback") from None

    return {
        "ratings": {
            row["answer_run_id"]: {"rating": row["rating"], "version": row["version"]}
            for row in (result.data or [])
            if row.get("answer_run_id") in run_ids and row.get("rating") in (-1, 1, None)
        }
    }

