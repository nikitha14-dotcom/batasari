"""Authoritative Beta timing, spend state, and retention configuration."""

from __future__ import annotations

import logging
import os
from collections.abc import Callable
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Any

from fastapi import HTTPException, Request

from app.services.spend_cap import (
    is_spend_exempt,
    spend_cap_exempt_user_ids,
    spend_cap_usd,
)

logger = logging.getLogger(__name__)

DEFAULT_ACCESS_DAYS = 3
DEFAULT_RETENTION_DAYS = 7
BETA_DURATION = timedelta(days=DEFAULT_ACCESS_DAYS)
LOCAL_AUTH_SOURCES = {"local-dev-fallback", "test-header"}


@dataclass(frozen=True)
class BetaAccessDecision:
    active: bool
    reason: str
    started_at: datetime | None = None
    expires_at: datetime | None = None
    unlimited_time: bool = False

    def public_dict(self) -> dict[str, Any]:
        return {
            "active": self.active,
            "reason": self.reason,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "exempt": self.unlimited_time,
        }


def _enabled() -> bool:
    return os.getenv("BETA_ACCESS_ENABLED", "false").strip().casefold() == "true"


def _retention_deletion_enabled() -> bool:
    return (
        os.getenv("BETA_RETENTION_DELETE_ENABLED", "false").strip().casefold()
        == "true"
    )


def _parse_datetime(value: object) -> datetime | None:
    if isinstance(value, datetime):
        return value.astimezone(UTC) if value.tzinfo else value.replace(tzinfo=UTC)
    if not isinstance(value, str) or not value.strip():
        return None
    try:
        parsed = datetime.fromisoformat(value.strip().replace("Z", "+00:00"))
    except ValueError:
        return None
    return parsed.astimezone(UTC) if parsed.tzinfo else parsed.replace(tzinfo=UTC)


def _positive_days(name: str, default: int) -> int:
    try:
        value = int(os.getenv(name, str(default)))
        if value <= 0:
            raise ValueError
        return value
    except ValueError as exc:
        raise RuntimeError(f"{name} must be a positive integer") from exc


def validate_beta_access_configuration() -> None:
    """Reject an enabled policy that cannot calculate a deterministic window."""
    if not _enabled():
        return
    if _parse_datetime(os.getenv("BETA_ACCESS_EPOCH")) is None:
        message = (
            "BETA_ACCESS_ENABLED=true requires BETA_ACCESS_EPOCH to be a valid "
            "ISO-8601 timestamp"
        )
        logger.error(message)
        raise RuntimeError(message)
    _positive_days("BETA_ACCESS_DAYS", DEFAULT_ACCESS_DAYS)
    _positive_days("BETA_RETENTION_DAYS", DEFAULT_RETENTION_DAYS)
    stopped_at = os.getenv("BETA_STOPPED_AT", "").strip()
    if stopped_at and _parse_datetime(stopped_at) is None:
        message = "BETA_STOPPED_AT must be a valid ISO-8601 timestamp"
        logger.error(message)
        raise RuntimeError(message)


def _time_decision(
    *,
    user_id: str,
    confirmed_at: object,
    auth_source: str,
    now: datetime,
) -> BetaAccessDecision:
    if not _enabled():
        return BetaAccessDecision(active=True, reason="disabled")
    if auth_source in LOCAL_AUTH_SOURCES:
        return BetaAccessDecision(active=True, reason="unrestricted_local")

    confirmed = _parse_datetime(confirmed_at)
    epoch = _parse_datetime(os.getenv("BETA_ACCESS_EPOCH"))
    stopped_at = _parse_datetime(os.getenv("BETA_STOPPED_AT", ""))
    if confirmed is None:
        return BetaAccessDecision(active=True, reason="missing_confirmation_timestamp")
    if epoch is None:
        return BetaAccessDecision(active=True, reason="policy_unavailable")

    started_at = max(confirmed, epoch)
    unlimited_time = is_spend_exempt(user_id)
    if unlimited_time:
        if stopped_at is None:
            return BetaAccessDecision(
                active=True,
                reason="exempt",
                started_at=started_at,
                unlimited_time=True,
            )
        active = now.astimezone(UTC) < stopped_at
        return BetaAccessDecision(
            active=active,
            reason="exempt" if active else "expired",
            started_at=started_at,
            expires_at=stopped_at,
            unlimited_time=True,
        )

    try:
        expires_at = started_at + timedelta(
            days=_positive_days("BETA_ACCESS_DAYS", DEFAULT_ACCESS_DAYS)
        )
    except RuntimeError:
        return BetaAccessDecision(active=True, reason="policy_unavailable")
    if stopped_at is not None:
        expires_at = min(expires_at, stopped_at)

    active = now.astimezone(UTC) < expires_at
    return BetaAccessDecision(
        active=active,
        reason="active" if active else "expired",
        started_at=started_at,
        expires_at=expires_at,
        unlimited_time=unlimited_time,
    )


class BetaAccessPolicy:
    """Evaluate access and synchronize the database retention policy."""

    def __init__(
        self,
        supabase=None,
        *,
        clock: Callable[[], datetime] | None = None,
    ):
        self.supabase = supabase
        self._clock = clock or (lambda: datetime.now(UTC))

    def sync_retention_configuration(self) -> None:
        if not _enabled() or self.supabase is None:
            return

        epoch = _parse_datetime(os.getenv("BETA_ACCESS_EPOCH"))
        if epoch is None:
            return

        stopped_at = _parse_datetime(os.getenv("BETA_STOPPED_AT", ""))
        try:
            result = (
                self.supabase.table("app_settings")
                .select("value")
                .eq("key", "beta_access_retention")
                .limit(1)
                .execute()
            )
            current = result.data[0]["value"] if result.data else {}
            if not isinstance(current, dict):
                current = {}
            value = {
                **current,
                "epoch": epoch.isoformat(),
                "stopped_at": stopped_at.isoformat() if stopped_at else None,
                "access_days": _positive_days(
                    "BETA_ACCESS_DAYS", DEFAULT_ACCESS_DAYS
                ),
                "retention_days": _positive_days(
                    "BETA_RETENTION_DAYS", DEFAULT_RETENTION_DAYS
                ),
                "deletion_enabled": _retention_deletion_enabled(),
                "exempt_user_ids": sorted(spend_cap_exempt_user_ids()),
            }
            self.supabase.table("app_settings").upsert(
                {"key": "beta_access_retention", "value": value},
                on_conflict="key",
            ).execute()
        except Exception:
            logger.error("Could not synchronize Beta retention configuration")

    def evaluate(
        self,
        *,
        user_id: str,
        email_confirmed_at: object,
        auth_source: str,
    ) -> BetaAccessDecision:
        return _time_decision(
            user_id=user_id,
            confirmed_at=email_confirmed_at,
            auth_source=auth_source,
            now=self._clock(),
        )


def _user_from_admin(supabase, user_id: str):
    result = supabase.auth.admin.get_user_by_id(user_id)
    return getattr(result, "user", None) or getattr(result, "data", None)


def beta_status(supabase, user_id: str, now: datetime | None = None) -> dict:
    """Return the status contract consumed by PR #119's single frontend gate."""
    now = now or datetime.now(UTC)
    exempt = is_spend_exempt(user_id)
    if supabase is None:
        return {
            "state": "active",
            "reason": None,
            "trial_started_at": None,
            "trial_ends_at": None,
            "spend_usd": 0.0,
            "credit_limit_usd": 1.0,
            "remaining_credit_usd": 1.0,
            "waitlist_joined": False,
            "waitlist_email": None,
            "decline_submitted": False,
        }

    try:
        user = _user_from_admin(supabase, user_id)
    except Exception:
        logger.warning("Could not read auth timestamps for user=%s", user_id)
        user = None

    confirmed_at = getattr(user, "confirmed_at", None) or getattr(
        user, "created_at", None
    )
    decision = _time_decision(
        user_id=user_id,
        confirmed_at=confirmed_at,
        auth_source="supabase",
        now=now,
    )

    spend = 0.0
    limit = spend_cap_usd()
    if not exempt:
        try:
            row = (
                supabase.table("ai_spend_by_user")
                .select("spend_usd")
                .eq("user_id", user_id)
                .limit(1)
                .execute()
            )
            if row.data:
                spend = float(row.data[0].get("spend_usd") or 0)
        except Exception:
            logger.warning("Could not read Beta spend for user=%s", user_id)

    waitlist_joined = False
    waitlist_email = getattr(user, "email", None)
    try:
        waitlist = (
            supabase.table("beta_waitlist")
            .select("email")
            .eq("user_id", user_id)
            .limit(1)
            .execute()
        )
        if waitlist.data:
            waitlist_joined = True
            waitlist_email = waitlist.data[0].get("email") or waitlist_email
    except Exception:
        logger.warning("Could not read Beta waitlist state for user=%s", user_id)

    decline_submitted = False
    try:
        decline = (
            supabase.table("beta_access_events")
            .select("id")
            .eq("user_id", user_id)
            .eq("event_name", "decline_reason_submitted")
            .limit(1)
            .execute()
        )
        decline_submitted = bool(decline.data)
    except Exception:
        logger.warning("Could not read Beta decline state for user=%s", user_id)

    credit_exhausted = not exempt and spend >= limit
    expired = not decision.active
    state = "expired" if expired else "credit_exhausted" if credit_exhausted else "active"
    return {
        "state": state,
        "reason": (
            "beta_expired"
            if expired
            else "credit_limit_reached"
            if credit_exhausted
            else None
        ),
        "trial_started_at": (
            decision.started_at.isoformat() if decision.started_at else None
        ),
        "trial_ends_at": decision.expires_at.isoformat() if decision.expires_at else None,
        "spend_usd": round(spend, 6),
        "credit_limit_usd": limit,
        "remaining_credit_usd": max(0.0, round(limit - spend, 6)),
        "waitlist_joined": waitlist_joined,
        "waitlist_email": waitlist_email,
        "decline_submitted": decline_submitted,
    }


def record_event(
    supabase,
    user_id: str,
    event_name: str,
    metadata: dict | None = None,
    *,
    strict: bool = False,
) -> None:
    if supabase is None:
        return
    try:
        supabase.table("beta_access_events").insert(
            {
                "user_id": user_id,
                "event_name": event_name,
                "metadata": metadata or {},
            }
        ).execute()
    except Exception:
        logger.warning("Could not record Beta event=%s user=%s", event_name, user_id)
        if strict:
            raise


def access_decision(request: Request) -> BetaAccessDecision:
    policy: BetaAccessPolicy | None = getattr(
        request.app.state, "beta_access_policy", None
    )
    if policy is None:
        return BetaAccessDecision(active=True, reason="policy_unavailable")
    return policy.evaluate(
        user_id=str(getattr(request.state, "user_id", "")),
        email_confirmed_at=getattr(request.state, "user_email_confirmed_at", None),
        auth_source=getattr(request.state, "auth_source", "anonymous"),
    )


def require_active_beta(request: Request) -> BetaAccessDecision:
    decision = access_decision(request)
    if decision.active:
        return decision
    logger.info(
        "Beta access denied for user=%s reason=%s",
        getattr(request.state, "user_id", None),
        decision.reason,
    )
    raise HTTPException(
        status_code=403,
        detail={
            "code": "beta_access_expired",
            "message": "Your Beta access has ended.",
            "expires_at": decision.expires_at.isoformat() if decision.expires_at else None,
        },
    )

