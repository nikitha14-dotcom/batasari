from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient

from app.gateway.insight_store import InMemoryInsightStore
from app.main import app


@pytest.fixture
def client(monkeypatch):
    monkeypatch.setenv("ENVIRONMENT", "development")
    monkeypatch.setattr(app.state, "insight_store", InMemoryInsightStore(), raising=False)
    return TestClient(app)


def _delete(client, body):
    return client.request(
        "DELETE", "/ai/conversations", json=body, headers={"x-test-user-id": "u1"}
    )


def test_clearing_one_category_deletes_its_saved_turns(client, monkeypatch):
    sb = MagicMock()
    monkeypatch.setattr(app.state, "supabase", sb, raising=False)

    response = _delete(client, {"category": "Housing"})

    assert response.status_code == 200
    sb.table.assert_called_once_with("conversation_history")
    delete = sb.table.return_value.delete
    delete.assert_called_once_with()
    by_user = delete.return_value.eq
    by_user.assert_called_once_with("user_id", "u1")
    by_user.return_value.eq.assert_called_once_with("category", "Housing")
    by_user.return_value.eq.return_value.execute.assert_called_once()


def test_clearing_everything_deletes_all_of_the_users_turns(client, monkeypatch):
    sb = MagicMock()
    monkeypatch.setattr(app.state, "supabase", sb, raising=False)

    response = _delete(client, {"category": None})

    assert response.status_code == 200
    by_user = sb.table.return_value.delete.return_value.eq
    by_user.assert_called_once_with("user_id", "u1")
    # Only filtered by user, never across users.
    by_user.return_value.eq.assert_not_called()
    by_user.return_value.execute.assert_called_once()


def test_a_failed_delete_is_reported_not_hidden(client, monkeypatch):
    sb = MagicMock()
    sb.table.return_value.delete.return_value.eq.return_value.eq.return_value \
        .execute.side_effect = RuntimeError("permission denied for table conversation_history")
    monkeypatch.setattr(app.state, "supabase", sb, raising=False)

    response = _delete(client, {"category": "Housing"})

    assert response.status_code == 500
    assert "permission denied" not in response.text


def test_bad_category_touches_nothing(client, monkeypatch):
    sb = MagicMock()
    monkeypatch.setattr(app.state, "supabase", sb, raising=False)

    response = _delete(client, {"category": "../victim/Housing"})

    assert response.status_code == 422
    sb.table.assert_not_called()


def test_local_dev_without_supabase_still_clears_the_store(client, monkeypatch):
    monkeypatch.setattr(app.state, "supabase", None, raising=False)
    store = app.state.insight_store
    store.save_message("u1", "Housing", "c1", role="user", content="hi")

    response = _delete(client, {"category": "Housing"})

    assert response.status_code == 200
    assert store.load_conversation("u1", "Housing", "c1") == []

