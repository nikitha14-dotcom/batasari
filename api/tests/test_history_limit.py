# ruff: noqa: E501
import pytest
from fastapi.testclient import TestClient

from app.main import app

HEADERS = {"x-test-user-id": "u1"}


@pytest.fixture
def seen(monkeypatch):
    calls = []

    def fake_history(supabase_client, user_id, category, limit=20):
        calls.append({"category": category, "limit": limit})
        return []

    monkeypatch.setattr(app.state, "supabase", object(), raising=False)
    monkeypatch.setattr("app.routers.ai_answer.get_conversation_history", fake_history)
    return calls


def test_history_returns_up_to_100_turns_by_default(seen):
    client = TestClient(app)
    response = client.get("/ai/conversation/history", params={"category": "Housing"}, headers=HEADERS)
    assert response.status_code == 200
    assert seen[-1]["limit"] == 100


def test_the_limit_can_be_lowered_but_never_above_100(seen):
    client = TestClient(app)
    client.get("/ai/conversation/history", params={"category": "Housing", "limit": 5}, headers=HEADERS)
    assert seen[-1]["limit"] == 5
    client.get("/ai/conversation/history", params={"category": "Housing", "limit": 100000}, headers=HEADERS)
    assert seen[-1]["limit"] == 100
    client.get("/ai/conversation/history", params={"category": "Housing", "limit": 0}, headers=HEADERS)
    assert seen[-1]["limit"] == 1
