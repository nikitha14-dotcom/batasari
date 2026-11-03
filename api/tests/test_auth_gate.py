from unittest.mock import MagicMock

from fastapi.testclient import TestClient

from app.main import app


class _StubResult:
    def __init__(self, data):
        self.data = data


def _stub_supabase(user_id: str):
    """Minimal Supabase stub where a profile row already exists for user_id."""
    table = MagicMock()
    table.select.return_value = table
    table.eq.return_value = table
    table.execute.return_value = _StubResult([{"user_id": user_id}])

    sb = MagicMock()
    sb.table.return_value = table
    return sb


def test_impersonation_header_is_ignored_outside_development(monkeypatch):
    """The x-test-user-id header must not authenticate anyone in staging or prod.

    Regression test: this header was briefly honoured in every environment,
    which let any caller read or write any user's profile by setting it.

    Supabase is stubbed so that a 401 can only come from the auth gate — not
    from Supabase being unconfigured.
    """
    monkeypatch.setenv("ENVIRONMENT", "staging")
    monkeypatch.setattr(app.state, "supabase", _stub_supabase("someone-else"), raising=False)

    client = TestClient(app)
    response = client.get("/profile", headers={"x-test-user-id": "someone-elses-user-id"})

    assert response.status_code == 401


def test_impersonation_header_still_works_in_development(monkeypatch):
    """It must keep working locally, since tests and local dev depend on it.

    Asserts the returned identity rather than "not 401" — otherwise this passes
    on a 503 from missing Supabase config and proves nothing about the header.
    """
    monkeypatch.setenv("ENVIRONMENT", "development")
    monkeypatch.setattr(app.state, "supabase", _stub_supabase("local-user"), raising=False)

    client = TestClient(app)
    response = client.get("/profile", headers={"x-test-user-id": "local-user"})

    assert response.status_code == 200
    assert response.json()["user_id"] == "local-user"

