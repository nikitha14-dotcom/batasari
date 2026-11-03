"""
Auth boundary tests.

The regression these exist to prevent: x-test-user-id used to be honoured in
every environment, which made "become any user" a one-line curl against
staging. Anything that reintroduces that should fail here.
"""

from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient

from app.main import app

SUPABASE_USER_ID = "8f1c2b6e-0a34-4c7d-9d1e-2f5a7c9b0d31"


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def no_supabase():
    """Run with no Supabase client attached, restoring whatever was there."""
    had = hasattr(app.state, "supabase")
    previous = getattr(app.state, "supabase", None)
    if had:
        del app.state.supabase
    yield
    if had:
        app.state.supabase = previous


@pytest.fixture
def supabase_accepts_token():
    """Supabase verifies the token and returns a user."""
    previous = getattr(app.state, "supabase", None)
    sb = MagicMock()
    sb.auth.get_user.return_value = SimpleNamespace(
        user=SimpleNamespace(id=SUPABASE_USER_ID, email="jia@example.com")
    )
    app.state.supabase = sb
    yield sb
    app.state.supabase = previous


@pytest.fixture
def supabase_rejects_token():
    """Supabase raises, the way it does for an expired or foreign-project token."""
    previous = getattr(app.state, "supabase", None)
    sb = MagicMock()
    sb.auth.get_user.side_effect = Exception("invalid JWT")
    app.state.supabase = sb
    yield sb
    app.state.supabase = previous


# --- the test-header escape hatch is development-only ---------------------


def test_test_header_is_honoured_in_development(client, no_supabase):
    response = client.get("/auth/me", headers={"x-test-user-id": "test-user-123"})
    assert response.status_code == 200
    body = response.json()
    assert body["user_id"] == "test-user-123"
    assert body["auth_source"] == "test-header"


@pytest.mark.parametrize("environment", ["staging", "production", ""])
def test_test_header_is_ignored_outside_development(
    client, no_supabase, monkeypatch, environment
):
    monkeypatch.setenv("ENVIRONMENT", environment)
    response = client.get("/auth/me", headers={"x-test-user-id": "test-user-123"})
    assert response.status_code == 401


def test_test_header_cannot_reach_profile_outside_development(
    client, no_supabase, monkeypatch
):
    monkeypatch.setenv("ENVIRONMENT", "staging")
    response = client.patch(
        "/profile",
        json={"household_type": "solo"},
        headers={"x-test-user-id": "test-user-123"},
    )
    assert response.status_code == 401


# --- the no-credentials fallback is development-only ----------------------


def test_no_credentials_falls_back_to_local_user_in_development(client, no_supabase):
    response = client.get("/auth/me")
    assert response.status_code == 200
    assert response.json()["auth_source"] == "local-dev-fallback"


def test_no_credentials_is_unauthenticated_outside_development(
    client, no_supabase, monkeypatch
):
    monkeypatch.setenv("ENVIRONMENT", "staging")
    response = client.get("/auth/me")
    assert response.status_code == 401


# --- the real bearer-token path -------------------------------------------


def test_valid_bearer_token_resolves_to_the_supabase_user(
    client, supabase_accepts_token, monkeypatch
):
    monkeypatch.setenv("ENVIRONMENT", "staging")
    response = client.get("/auth/me", headers={"Authorization": "Bearer good-token"})

    assert response.status_code == 200
    body = response.json()
    assert body["user_id"] == SUPABASE_USER_ID
    assert body["email"] == "jia@example.com"
    assert body["auth_source"] == "supabase"
    supabase_accepts_token.auth.get_user.assert_called_once_with("good-token")


def test_rejected_bearer_token_is_401(client, supabase_rejects_token, monkeypatch):
    monkeypatch.setenv("ENVIRONMENT", "staging")
    response = client.get("/auth/me", headers={"Authorization": "Bearer bad-token"})
    assert response.status_code == 401


def test_bearer_token_does_not_fall_back_to_dev_user_in_development(
    client, supabase_rejects_token
):
    """
    A present-but-invalid token must not silently become local-dev-user.
    Otherwise a broken token looks like a working login on someone's laptop.
    """
    response = client.get("/auth/me", headers={"Authorization": "Bearer bad-token"})
    assert response.status_code == 401


def test_bearer_token_is_401_when_supabase_is_not_configured(client, no_supabase):
    response = client.get("/auth/me", headers={"Authorization": "Bearer any-token"})
    assert response.status_code == 401


def test_test_header_wins_over_bearer_in_development(client, supabase_accepts_token):
    """Documented precedence: the local escape hatch short-circuits first."""
    response = client.get(
        "/auth/me",
        headers={"x-test-user-id": "test-user-123", "Authorization": "Bearer good-token"},
    )
    assert response.status_code == 200
    assert response.json()["auth_source"] == "test-header"


# --- health stays public ---------------------------------------------------


def test_health_needs_no_credentials(client, no_supabase, monkeypatch):
    monkeypatch.setenv("ENVIRONMENT", "production")
    response = client.get("/health")
    assert response.status_code == 200

