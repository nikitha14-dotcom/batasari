"""India-specific public reference data and authenticated move planning API."""

from datetime import date, datetime, timezone
from typing import Literal
from uuid import uuid4

from fastapi import APIRouter, HTTPException, Query, Request
from pydantic import BaseModel, ConfigDict, Field

from app.services.india_catalog import INDIAN_CITIES, MOVE_CHECKLISTS, MOVE_TYPES

router = APIRouter(prefix="/india", tags=["India planning"])


class MovePlanCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=1, max_length=120)
    move_type: Literal["within_india", "returning_to_india", "relocating_to_india"]
    origin_city: str | None = Field(default=None, max_length=120)
    origin_country: str | None = Field(default=None, max_length=120)
    destination_city: str = Field(min_length=1, max_length=120)
    move_date: date | None = None
    household_size: int = Field(default=1, ge=1, le=20)
    services: list[
        Literal["packers_movers", "local_transport", "storage", "international_shipping"]
    ] = Field(default_factory=list, max_length=4)
    notes: str | None = Field(default=None, max_length=1000)


class MovePlanUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str | None = Field(default=None, min_length=1, max_length=120)
    origin_city: str | None = Field(default=None, max_length=120)
    origin_country: str | None = Field(default=None, max_length=120)
    destination_city: str | None = Field(default=None, min_length=1, max_length=120)
    move_date: date | None = None
    household_size: int | None = Field(default=None, ge=1, le=20)
    services: list[
        Literal["packers_movers", "local_transport", "storage", "international_shipping"]
    ] | None = Field(default=None, max_length=4)
    notes: str | None = Field(default=None, max_length=1000)


def _user_id(request: Request) -> str:
    user_id = getattr(request.state, "user_id", None)
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return str(user_id)


def _local_store(request: Request) -> dict[str, list[dict]]:
    if not getattr(request.state, "use_local_profile_store", False):
        raise HTTPException(status_code=503, detail="Move planning requires Supabase configuration")
    if not hasattr(request.app.state, "local_move_plans"):
        request.app.state.local_move_plans = {}
    return request.app.state.local_move_plans


@router.get("/cities")
def list_cities(
    region: str | None = Query(default=None, max_length=24),
    q: str | None = Query(default=None, max_length=80),
):
    """List supported Indian city starting points, with language and region metadata."""
    cities = INDIAN_CITIES
    if region:
        cities = [city for city in cities if city["region"].casefold() == region.strip().casefold()]
    if q:
        needle = q.strip().casefold()
        cities = [city for city in cities if needle in city["name"].casefold() or needle in city["state"].casefold()]
    return {"cities": cities, "currency": "INR", "timezone": "Asia/Kolkata"}


@router.get("/checklists/{move_type}")
def get_checklist(move_type: str):
    """Return planning prompts; visa, customs, and other rules must be checked officially."""
    if move_type not in MOVE_TYPES:
        raise HTTPException(status_code=404, detail="Unknown move type")
    return {"move_type": move_type, "items": MOVE_CHECKLISTS[move_type]}


@router.get("/move-plans")
def list_move_plans(request: Request):
    user_id = _user_id(request)
    if getattr(request.state, "use_local_profile_store", False):
        return {"move_plans": _local_store(request).get(user_id, [])}
    supabase = getattr(request.app.state, "supabase", None)
    if supabase is None:
        raise HTTPException(status_code=503, detail="Supabase is not configured")
    rows = (
        supabase.table("move_plans")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return {"move_plans": rows.data or []}


@router.post("/move-plans", status_code=201)
def create_move_plan(request: Request, body: MovePlanCreate):
    user_id = _user_id(request)
    payload = body.model_dump(mode="json")
    if body.move_type == "within_india" and not body.origin_city:
        raise HTTPException(status_code=422, detail="origin_city is required for moves within India")
    if body.move_type != "within_india" and not body.origin_country:
        raise HTTPException(status_code=422, detail="origin_country is required for moves from abroad")

    if getattr(request.state, "use_local_profile_store", False):
        row = {
            **payload,
            "id": str(uuid4()),
            "user_id": user_id,
            "status": "planning",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        _local_store(request).setdefault(user_id, []).append(row)
        return row

    supabase = getattr(request.app.state, "supabase", None)
    if supabase is None:
        raise HTTPException(status_code=503, detail="Supabase is not configured")
    result = supabase.table("move_plans").insert({**payload, "user_id": user_id}).execute()
    return result.data[0]


@router.patch("/move-plans/{plan_id}")
def update_move_plan(request: Request, plan_id: str, body: MovePlanUpdate):
    user_id = _user_id(request)
    changes = body.model_dump(mode="json", exclude_unset=True, exclude_none=True)
    if not changes:
        raise HTTPException(status_code=400, detail="At least one field is required")

    if getattr(request.state, "use_local_profile_store", False):
        plans = _local_store(request).get(user_id, [])
        for plan in plans:
            if plan["id"] == plan_id:
                plan.update(changes)
                plan["updated_at"] = datetime.now(timezone.utc).isoformat()
                return plan
        raise HTTPException(status_code=404, detail="Move plan not found")

    supabase = getattr(request.app.state, "supabase", None)
    if supabase is None:
        raise HTTPException(status_code=503, detail="Supabase is not configured")
    result = (
        supabase.table("move_plans")
        .update({**changes, "updated_at": datetime.now(timezone.utc).isoformat()})
        .eq("id", plan_id)
        .eq("user_id", user_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Move plan not found")
    return result.data[0]


@router.delete("/move-plans/{plan_id}")
def delete_move_plan(request: Request, plan_id: str):
    user_id = _user_id(request)

    if getattr(request.state, "use_local_profile_store", False):
        plans = _local_store(request).get(user_id, [])
        remaining = [plan for plan in plans if plan["id"] != plan_id]
        if len(remaining) == len(plans):
            raise HTTPException(status_code=404, detail="Move plan not found")
        _local_store(request)[user_id] = remaining
        return {"deleted": True}

    supabase = getattr(request.app.state, "supabase", None)
    if supabase is None:
        raise HTTPException(status_code=503, detail="Supabase is not configured")
    result = (
        supabase.table("move_plans")
        .delete()
        .eq("id", plan_id)
        .eq("user_id", user_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Move plan not found")
    return {"deleted": True}

