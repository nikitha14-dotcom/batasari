from datetime import UTC, datetime, timedelta
from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient

from app.gateway.insight_store import InMemoryInsightStore
from app.main import app
from app.services.beta_access import (
    BETA_DURATION,
    BetaAccessDecision,
    BetaAccessPolicy,
    beta_status,
    validate_beta_access_configuration,
)

NOW = datetime(2026, 9, 29, 18, 0, tzinfo=UTC)
EPOCH = datetime(2026, 9, 29, 12, 0, tzinfo=UTC)


def _settings_client(value, *, error: Exception | None = None):
    client = MagicMock()
    query = client.table.return_value.select.return_value.eq.return_value.limit.return_value
    if error:
        query.execute.side_effect = error
    else:
        query.execute.return_value = SimpleNamespace(data=[{"value": value}])
    return client


@pytest.fixture(autouse=True)
def beta_environment(monkeypatch):
    monkeypatch.setenv("BETA_ACCESS_ENABLED", "true")
    monkeypatch.setenv("BETA_ACCESS_DAYS", "3")
    monkeypatch.setenv("BETA_ACCESS_EPOCH", EPOCH.isoformat())
    monkeypatch.delenv("BETA_STOPPED_AT", raising=False)
    monkeypatch.setenv("BETA_RETENTION_DELETE_ENABLED", "false")
    monkeypatch.delenv("AI_SPEND_CAP_EXEMPT_USER_IDS", raising=False)


def _policy(*, now=NOW):
    return BetaAccessPolicy(clock=lambda: now)


def test_existing_users_receive_a_fresh_window_from_the_epoch():
    decision = _policy().evaluate(
        user_id="person-id",
        email_confirmed_at=EPOCH - timedelta(days=20),
        auth_source="supabase",
    )

    assert decision.active is True
    assert decision.started_at == EPOCH
    assert decision.expires_at == EPOCH + timedelta(days=3)


def test_users_verified_after_launch_start_from_confirmation():
    confirmed = EPOCH + timedelta(days=1)
    decision = _policy().evaluate(
        user_id="person-id",
        email_confirmed_at=confirmed,
        auth_source="supabase",
    )

    assert decision.started_at == confirmed
    assert decision.expires_at == confirmed + timedelta(days=3)


def test_access_expires_at_the_exact_72_hour_boundary():
    policy = _policy(now=EPOCH + timedelta(hours=72))
    decision = policy.evaluate(
        user_id="person-id",
        email_confirmed_at=EPOCH,
        auth_source="supabase",
    )

    assert decision.active is False
    assert decision.reason == "expired"


def test_spend_exempt_user_id_is_also_time_exempt(monkeypatch):
    monkeypatch.setenv("AI_SPEND_CAP_EXEMPT_USER_IDS", " team-id ")
    policy = _policy(now=EPOCH + timedelta(days=30))
    decision = policy.evaluate(
        user_id="TEAM-ID",
        email_confirmed_at=EPOCH,
        auth_source="supabase",
    )

    assert decision.active is True
    assert decision.unlimited_time is True
    assert decision.expires_at is None


def test_global_stop_ends_access_for_time_exempt_users(monkeypatch):
    stopped_at = EPOCH + timedelta(days=10)
    monkeypatch.setenv("BETA_STOPPED_AT", stopped_at.isoformat())
    monkeypatch.setenv("AI_SPEND_CAP_EXEMPT_USER_IDS", "team-id")
    policy = _policy(now=stopped_at)

    decision = policy.evaluate(
        user_id="team-id",
        email_confirmed_at=EPOCH,
        auth_source="supabase",
    )

    assert decision.active is False
    assert decision.reason == "expired"
    assert decision.expires_at == stopped_at
    assert decision.unlimited_time is True


def test_global_stop_shortens_an_ordinary_users_window(monkeypatch):
    stopped_at = EPOCH + timedelta(hours=12)
    monkeypatch.setenv("BETA_STOPPED_AT", stopped_at.isoformat())

    decision = _policy(now=stopped_at).evaluate(
        user_id="person-id",
        email_confirmed_at=EPOCH,
        auth_source="supabase",
    )

    assert decision.active is False
    assert decision.expires_at == stopped_at


@pytest.mark.parametrize("auth_source", ["test-header", "local-dev-fallback"])
def test_local_and_test_users_are_explicitly_unrestricted(auth_source):
    decision = _policy().evaluate(
        user_id="local-user",
        email_confirmed_at=None,
        auth_source=auth_source,
    )

    assert decision.active is True
    assert decision.reason == "unrestricted_local"


def test_missing_timestamp_fails_open():
    decision = _policy().evaluate(
        user_id="person-id",
        email_confirmed_at=None,
        auth_source="supabase",
    )

    assert decision.active is True
    assert decision.reason == "missing_confirmation_timestamp"


def test_enabled_policy_requires_a_valid_epoch(monkeypatch):
    monkeypatch.delenv("BETA_ACCESS_EPOCH")

    with pytest.raises(RuntimeError, match="BETA_ACCESS_EPOCH"):
        validate_beta_access_configuration()


def test_retention_policy_is_synchronized_for_the_cron_job(monkeypatch):
    os_exemptions = " BBB-2,aaa-1,bbb-2 "
    client = _settings_client(
        {
            "epoch": None,
            "stopped_at": "2026-09-30T00:00:00+00:00",
            "access_days": 3,
            "retention_days": 7,
        }
    )

    monkeypatch.setenv("AI_SPEND_CAP_EXEMPT_USER_IDS", os_exemptions)
    BetaAccessPolicy(client).sync_retention_configuration()

    row = client.table.return_value.upsert.call_args.args[0]
    assert row["key"] == "beta_access_retention"
    assert row["value"] == {
        "epoch": EPOCH.isoformat(),
        "stopped_at": None,
        "access_days": 3,
        "retention_days": 7,
        "deletion_enabled": False,
        "exempt_user_ids": ["aaa-1", "bbb-2"],
    }
    assert client.table.return_value.upsert.call_args.kwargs == {
        "on_conflict": "key"
    }


def test_enabled_policy_requires_a_positive_retention_window(monkeypatch):
    monkeypatch.setenv("BETA_RETENTION_DAYS", "0")

    with pytest.raises(RuntimeError, match="BETA_RETENTION_DAYS"):
        validate_beta_access_configuration()


def test_disabled_policy_does_not_query_settings(monkeypatch):
    monkeypatch.setenv("BETA_ACCESS_ENABLED", "false")
    client = _settings_client([])
    decision = BetaAccessPolicy(client).evaluate(
        user_id="person-id",
        email_confirmed_at=None,
        auth_source="supabase",
    )

    assert decision.active is True
    assert decision.reason == "disabled"
    client.table.assert_not_called()


def test_expired_decision_blocks_profile_but_not_privacy_deletions(monkeypatch):
    monkeypatch.setenv("ENVIRONMENT", "development")

    class ExpiredPolicy:
        def evaluate(self, **kwargs):
            return BetaAccessDecision(
                active=False,
                reason="expired",
                started_at=EPOCH,
                expires_at=EPOCH + timedelta(days=3),
            )

    original = app.state.beta_access_policy
    original_store = app.state.insight_store
    app.state.beta_access_policy = ExpiredPolicy()
    app.state.insight_store = InMemoryInsightStore()
    client = TestClient(app)
    try:
        profile = client.get("/profile", headers={"x-test-user-id": "u1"})
        deletion = client.request(
            "DELETE", "/ai/insights", headers={"x-test-user-id": "u1"}
        )
    finally:
        app.state.beta_access_policy = original
        app.state.insight_store = original_store

    assert profile.status_code == 403
    assert profile.json()["detail"]["code"] == "beta_access_expired"
    assert deletion.status_code != 403


class _Query:
    def __init__(self, data): self.data = data
    def select(self, *_): return self
    def eq(self, *_): return self
    def limit(self, *_): return self
    def execute(self): return SimpleNamespace(data=self.data)


class _Supabase:
    def __init__(self, confirmed_at, spend, waitlist=None, events=None):
        self.auth = SimpleNamespace(admin=SimpleNamespace(
            get_user_by_id=lambda _: SimpleNamespace(user=SimpleNamespace(
                confirmed_at=confirmed_at.isoformat(), created_at=confirmed_at.isoformat()
            ))
        ))
        self.spend = spend
        self.waitlist = waitlist or []
        self.events = events or []
        self.table_names = []
    def table(self, name):
        self.table_names.append(name)
        if name == "ai_spend_by_user":
            return _Query([{"spend_usd": self.spend}])
        if name == "beta_waitlist":
            return _Query(self.waitlist)
        if name == "beta_access_events":
            return _Query(self.events)
        return _Query([])


def test_beta_starts_at_confirmation_and_expires_at_72_hours():
    start = datetime(2026, 9, 30, tzinfo=UTC)
    sb = _Supabase(start, 0)
    assert beta_status(sb, "u", start + BETA_DURATION - timedelta(seconds=1))["state"] == "active"
    assert beta_status(sb, "u", start + BETA_DURATION)["state"] == "expired"


def test_credit_exhaustion_is_distinct_from_trial_expiry():
    start = datetime(2026, 9, 29, tzinfo=UTC)
    status = beta_status(_Supabase(start, 1.0), "u", start + timedelta(hours=1))
    assert status["state"] == "credit_exhausted"
    assert status["reason"] == "credit_limit_reached"


def test_exempt_user_skips_beta_expiry_and_credit_checks(monkeypatch):
    monkeypatch.setenv("AI_SPEND_CAP_EXEMPT_USER_IDS", "team-user")
    start = datetime(2026, 9, 29, tzinfo=UTC)
    sb = _Supabase(start, 100.0)

    status = beta_status(sb, "team-user", start + BETA_DURATION)

    assert status["state"] == "active"
    assert status["reason"] is None
    assert "ai_spend_by_user" not in sb.table_names


def test_waitlist_membership_is_returned_for_persisted_banner_state():
    start = datetime(2026, 9, 29, tzinfo=UTC)
    sb = _Supabase(start, 0, [{"email": "person@example.com"}])
    status = beta_status(sb, "u", start + BETA_DURATION)
    assert status["waitlist_joined"] is True
    assert status["waitlist_email"] == "person@example.com"


def test_decline_submission_is_returned_for_feedback_only_return_state():
    start = datetime(2026, 9, 29, tzinfo=UTC)
    status = beta_status(
        _Supabase(start, 0, events=[{"id": "event-id"}]),
        "u",
        start + BETA_DURATION,
    )
    assert status["decline_submitted"] is True

