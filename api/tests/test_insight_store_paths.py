import json

import pytest
from fastapi.testclient import TestClient

from app.gateway import runner
from app.gateway.insight_store import JsonInsightStore
from app.main import app

ATTACKER = "attacker-user"
VICTIM = "victim-user"


@pytest.fixture
def store(tmp_path, monkeypatch):
    root = tmp_path / "data"
    s = JsonInsightStore(str(root))
    monkeypatch.setattr(app.state, "insight_store", s, raising=False)
    monkeypatch.setattr(app.state, "supabase", None, raising=False)
    return s


@pytest.fixture
def client(monkeypatch):
    monkeypatch.setenv("ENVIRONMENT", "development")
    return TestClient(app)


def _as(user):
    return {"x-test-user-id": user}


def test_deleting_insights_cannot_reach_another_users_files(store, client):
    store.save_insights(VICTIM, "Housing", {"budget": "2000"})

    response = client.request(
        "DELETE",
        "/ai/insights",
        json={"category": f"../{VICTIM}/Housing"},
        headers=_as(ATTACKER),
    )

    assert response.status_code == 422
    assert store.load_insights(VICTIM, "Housing") == {"budget": "2000"}


def test_deleting_conversations_cannot_reach_another_users_files(store, client):
    store.save_message(VICTIM, "Housing", "c1", role="user", content="hi")

    response = client.request(
        "DELETE",
        "/ai/conversations",
        json={"category": f"../{VICTIM}/Housing"},
        headers=_as(ATTACKER),
    )

    assert response.status_code == 422
    assert store.load_conversation(VICTIM, "Housing", "c1") != []


def test_answer_cannot_write_outside_the_data_directory(store, client, monkeypatch, tmp_path):
    async def _ok(system_prompt, question):
        return {"text": "a", "input_tokens": 1, "output_tokens": 1, "model": "m"}

    monkeypatch.setattr(runner, "call_claude", _ok)

    response = client.post(
        "/ai/answer",
        json={
            "question": "q",
            "category": "../../../escaped",
            "subcategory": "Find Housing",
            "conversation_id": "c1",
        },
        headers=_as(ATTACKER),
    )
    assert response.status_code == 200

    # The message is not saved anywhere outside the store's own directory.
    assert not (tmp_path / "escaped").exists()
    assert list(tmp_path.glob("**/c1.json")) == []


@pytest.mark.parametrize(
    "category", ["..", "../x", "a/b", "a\\b", "Housing/..", "./Housing", ""]
)
def test_store_rejects_categories_that_are_not_a_single_name(store, category):
    with pytest.raises(ValueError):
        store.save_insights(ATTACKER, category, {"x": 1})
    with pytest.raises(ValueError):
        store.delete_insights(ATTACKER, category=category or "..")
    with pytest.raises(ValueError):
        store.save_message(ATTACKER, category, "c1", role="user", content="hi")


@pytest.mark.parametrize("user_id", ["..", "../victim-user", "a/b"])
def test_store_rejects_unsafe_user_ids(store, user_id):
    with pytest.raises(ValueError):
        store.delete_insights(user_id)
    with pytest.raises(ValueError):
        store.delete_conversations(user_id)


def test_normal_names_still_work(store):
    # Real category names contain spaces, "&" and commas.
    store.save_insights(ATTACKER, "Education & Family", {"kids": 2})
    store.save_message(ATTACKER, "Taxes, Benefits & Pay", "c1", role="user", content="hi")

    assert store.load_insights(ATTACKER, "Education & Family") == {"kids": 2}
    saved = store.load_conversation(ATTACKER, "Taxes, Benefits & Pay", "c1")
    assert json.loads(json.dumps(saved))[0]["content"] == "hi"

    store.delete_insights(ATTACKER, category="Education & Family")
    store.delete_conversations(ATTACKER, category="Taxes, Benefits & Pay")
    assert store.load_insights(ATTACKER, "Education & Family") == {}
    assert store.load_conversation(ATTACKER, "Taxes, Benefits & Pay", "c1") == []

