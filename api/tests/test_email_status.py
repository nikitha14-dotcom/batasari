"""POST /auth/email-status: Sign Up's "already registered?" check."""

from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.routers.auth import EMAIL_STATUS_LIMIT, email_status_limiter

REGISTERED = {"amy@example.com"}


def _fake_supabase(fail: bool = False):
    sb = MagicMock()

    def _rpc(name, params):
        assert name == "is_email_registered"
        call = MagicMock()
        if fail:
            call.execute.side_effect = RuntimeError("db down")
        else:
            call.execute.return_value = SimpleNamespace(
                data=params["p_email"].lower() in REGISTERED
            )
        return call

    sb.rpc.side_effect = _rpc
    return sb


@pytest.fixture(autouse=True)
def _reset_limiter():
    email_status_limiter.reset()
    yield
    email_status_limiter.reset()


@pytest.fixture
def client():
    previous = getattr(app.state, "supabase", None)
    app.state.supabase = _fake_supabase()
    yield TestClient(app)
    app.state.supabase = previous


def test_registered_email(client):
    r = client.post("/auth/email-status", json={"email": "  Amy@Example.com "})
    assert r.status_code == 200
    assert r.json() == {"registered": True}


def test_new_email(client):
    r = client.post("/auth/email-status", json={"email": "new@example.com"})
    assert r.status_code == 200
    assert r.json() == {"registered": False}


def test_passes_trimmed_email_to_the_database(client):
    client.post("/auth/email-status", json={"email": "  new@example.com  "})
    args = app.state.supabase.rpc.call_args
    assert args.args == ("is_email_registered", {"p_email": "new@example.com"})


@pytest.mark.parametrize("bad", ["", "not-an-email", "a@b", "a b@c.co", "x" * 250 + "@example.com"])
def test_rejects_malformed_email_without_querying(client, bad):
    r = client.post("/auth/email-status", json={"email": bad})
    assert r.status_code == 422
    app.state.supabase.rpc.assert_not_called()


def test_rate_limited_per_client(client):
    for _ in range(EMAIL_STATUS_LIMIT):
        r = client.post("/auth/email-status", json={"email": "new@example.com"})
        assert r.status_code == 200
    r = client.post("/auth/email-status", json={"email": "new@example.com"})
    assert r.status_code == 429


def test_limit_is_keyed_on_forwarded_client(client):
    headers_a = {"x-forwarded-for": "203.0.113.1"}
    headers_b = {"x-forwarded-for": "203.0.113.2, 10.0.0.1"}
    for _ in range(EMAIL_STATUS_LIMIT):
        client.post("/auth/email-status", json={"email": "new@example.com"}, headers=headers_a)
    body = {"email": "n@example.com"}
    assert client.post("/auth/email-status", json=body, headers=headers_a).status_code == 429
    assert client.post("/auth/email-status", json=body, headers=headers_b).status_code == 200


def test_database_failure_is_503_not_500():
    previous = getattr(app.state, "supabase", None)
    app.state.supabase = _fake_supabase(fail=True)
    try:
        r = TestClient(app).post("/auth/email-status", json={"email": "new@example.com"})
        assert r.status_code == 503
    finally:
        app.state.supabase = previous


def test_no_supabase_is_503():
    had = hasattr(app.state, "supabase")
    previous = getattr(app.state, "supabase", None)
    if had:
        del app.state.supabase
    try:
        r = TestClient(app).post("/auth/email-status", json={"email": "new@example.com"})
        assert r.status_code == 503
    finally:
        if had:
            app.state.supabase = previous

