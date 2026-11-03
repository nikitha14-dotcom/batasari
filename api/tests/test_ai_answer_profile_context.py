from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient

from app.gateway import runner
from app.main import app


@pytest.fixture(autouse=True)
def _restore_supabase():
    # app.state.supabase is a shared global other test files (test_profile.py)
    # also depend on persisting -- restore it so these tests don't leak a
    # broken/different mock into whatever ran after them.
    original = getattr(app.state, "supabase", None)
    yield
    app.state.supabase = original


class FakeResult:
    def __init__(self, data):
        self.data = data


def _make_mock_sb(profiles):
    sb = MagicMock()

    def _get_table(name):
        table = MagicMock()

        def _select(*args):
            return table

        def _eq(field, value):
            table._uid = value
            return table

        def _execute():
            row = profiles.get(table._uid)
            return FakeResult([row] if row else [])

        table.select = _select
        table.eq = _eq
        table.execute = _execute
        return table

    sb.table = _get_table
    return sb


def _post_answer(client, user_id="test-user-123"):
    return client.post(
        "/ai/answer",
        json={
            "question": "where should I live",
            "category": "Housing",
            "subcategory": "Find Housing",
        },
        headers={"x-test-user-id": user_id},
    )


def test_ai_answer_includes_saved_profile_in_prompt(monkeypatch):
    app.state.supabase = _make_mock_sb(
        {
            "test-user-123": {
                "user_id": "test-user-123",
                "visa_type": "study_permit",
                "household_type": "solo",
                "children_ages": None,
                "created_at": "2026-01-01T00:00:00Z",
                "updated_at": "2026-01-01T00:00:00Z",
            }
        }
    )

    seen = {}

    async def fake_call_claude(system_prompt, question):
        seen["system_prompt"] = system_prompt
        return {"text": "ok", "input_tokens": 1, "output_tokens": 1, "model": "claude-sonnet-4-6"}

    monkeypatch.setattr(runner, "call_claude", fake_call_claude)

    response = _post_answer(TestClient(app))
    assert response.status_code == 200
    assert "- Visa type: study_permit" in seen["system_prompt"]
    assert "- Household type: solo" in seen["system_prompt"]
    # Metadata columns and unanswered fields must not leak into the prompt.
    assert "created_at" not in seen["system_prompt"]
    assert "children_ages" not in seen["system_prompt"].lower()


def test_ai_answer_omits_section_when_no_profile_saved(monkeypatch):
    app.state.supabase = _make_mock_sb({})

    seen = {}

    async def fake_call_claude(system_prompt, question):
        seen["system_prompt"] = system_prompt
        return {"text": "ok", "input_tokens": 1, "output_tokens": 1, "model": "claude-sonnet-4-6"}

    monkeypatch.setattr(runner, "call_claude", fake_call_claude)

    response = _post_answer(TestClient(app), user_id="never-onboarded-user")
    assert response.status_code == 200
    assert "already told us" not in seen["system_prompt"]


def test_ai_answer_survives_supabase_failure(monkeypatch):
    broken_sb = MagicMock()
    broken_sb.table.side_effect = RuntimeError("connection reset")
    app.state.supabase = broken_sb

    seen = {}

    async def fake_call_claude(system_prompt, question):
        seen["system_prompt"] = system_prompt
        return {"text": "ok", "input_tokens": 1, "output_tokens": 1, "model": "claude-sonnet-4-6"}

    monkeypatch.setattr(runner, "call_claude", fake_call_claude)

    response = _post_answer(TestClient(app))
    assert response.status_code == 200
    assert "already told us" not in seen["system_prompt"]

