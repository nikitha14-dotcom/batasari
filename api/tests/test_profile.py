from unittest.mock import MagicMock

from fastapi.testclient import TestClient

from app.main import app


class FakeResult:
    def __init__(self, data):
        self.data = data


def _make_mock_sb():
    sb = MagicMock()
    profiles = {}

    def _get_table(name):
        table = MagicMock()

        def _select(*args):
            table._op = "select"
            return table

        def _insert(row):
            uid = row.get("user_id", "test-user-123")
            profiles.setdefault(uid, {"user_id": uid})
            table._op = "insert"
            table._pending_uid = uid
            return table

        def _update(data):
            table._op = "update"
            table._pending_update = data
            return table

        def _eq(field, value):
            table._filter_value = value
            return table

        def _execute():
            uid = getattr(table, "_filter_value", None) or getattr(table, "_pending_uid", None)
            if table._op == "insert":
                result_data = profiles.get(uid, {"user_id": uid})
                table._pending_uid = None
                return FakeResult([result_data])
            if table._op == "update" and uid:
                profiles.setdefault(uid, {"user_id": uid})
                profiles[uid].update(table._pending_update)
                table._pending_update = None
                table._filter_value = None
                return FakeResult([profiles[uid]])
            row = profiles.get(uid, {})
            table._filter_value = None
            return FakeResult([row] if row else [])

        table.select = _select
        table.insert = _insert
        table.update = _update
        table.eq = _eq
        table.execute = _execute
        return table

    sb.table = _get_table
    return sb


app.state.supabase = _make_mock_sb()
client = TestClient(app)


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_get_profile_creates_empty():
    response = client.get("/profile", headers={"x-test-user-id": "test-user-123"})
    assert response.status_code == 200
    data = response.json()
    assert "user_id" in data


def test_get_profile_uses_local_store_in_development_without_auth(monkeypatch):
    monkeypatch.setenv("ENVIRONMENT", "development")
    response = client.get("/profile")
    assert response.status_code == 200
    assert response.json()["user_id"] == "local-dev-user"


def test_patch_profile_updates_fields():
    response = client.patch(
        "/profile",
        json={"household_type": "solo"},
        headers={"x-test-user-id": "test-user-123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["household_type"] == "solo"


def test_patch_profile_can_clear_fields_with_null():
    client.patch(
        "/profile",
        json={"visa_type": "visitor"},
        headers={"x-test-user-id": "test-user-123"},
    )

    response = client.patch(
        "/profile",
        json={"visa_type": None},
        headers={"x-test-user-id": "test-user-123"},
    )

    assert response.status_code == 200
    assert response.json()["visa_type"] is None


def test_patch_profile_empty_body_returns_400():
    response = client.patch(
        "/profile",
        json={},
        headers={"x-test-user-id": "test-user-123"},
    )
    assert response.status_code == 400

