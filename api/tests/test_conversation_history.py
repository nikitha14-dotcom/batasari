from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture(autouse=True)
def preserve_app_state():
    from app import main
    had_supabase = hasattr(main.app.state, "supabase")
    previous_supabase = getattr(main.app.state, "supabase", None)
    yield
    if had_supabase:
        main.app.state.supabase = previous_supabase
    elif hasattr(main.app.state, "supabase"):
        del main.app.state.supabase


@pytest.fixture
def client(monkeypatch):
    # Same dev-impersonation pattern used elsewhere: only honoured when
    # ENVIRONMENT is development, so this reaches the route, not a 401.
    monkeypatch.setenv("ENVIRONMENT", "development")
    return TestClient(app)


def _history_rows():
    return [
        {
            "question": "How does winter affect my commute?",
            "answer": "Winter can add real delays...",
            "subcategory": "Check The Place",
            "created_at": "2026-09-19T12:00:00Z",
        },
        {
            "question": "What do landlords prioritize?",
            "answer": "Steady income and references...",
            "subcategory": "Find Housing",
            "created_at": "2026-09-19T11:00:00Z",
        },
    ]


def test_returns_saved_history_for_the_users_category(monkeypatch):
    sb = MagicMock()
    sb.table.return_value.select.return_value.eq.return_value.eq.return_value \
        .order.return_value.limit.return_value.execute.return_value.data = _history_rows()

    monkeypatch.setenv("ENVIRONMENT", "development")
    client = TestClient(app)
    from app import main
    main.app.state.supabase = sb

    response = client.get(
        "/ai/conversation/history?category=Housing",
        headers={"x-test-user-id": "test-user-123"},
    )

    assert response.status_code == 200
    body = response.json()
    assert len(body["history"]) == 2
    assert body["history"][0]["question"] == "How does winter affect my commute?"


def test_returns_empty_history_when_supabase_is_not_configured(client):
    from app import main
    if hasattr(main.app.state, "supabase"):
        del main.app.state.supabase

    response = client.get(
        "/ai/conversation/history?category=Housing",
        headers={"x-test-user-id": "test-user-123"},
    )

    assert response.status_code == 200
    assert response.json() == {"history": []}


def test_rejects_a_category_with_unsafe_characters(client):
    # Same shape check used for /ai/answer -- category gets interpolated
    # into the system prompt in run_ai_answer, so it can't carry newlines,
    # braces, or angle brackets here either.
    response = client.get(
        "/ai/conversation/history?category=Housing{{injected}}",
        headers={"x-test-user-id": "test-user-123"},
    )

    assert response.status_code == 422


def test_requires_authentication(monkeypatch):
    monkeypatch.setenv("ENVIRONMENT", "production")
    client = TestClient(app)
    response = client.get("/ai/conversation/history?category=Housing")
    assert response.status_code == 401


def test_requires_a_category_query_param(client):
    response = client.get(
        "/ai/conversation/history",
        headers={"x-test-user-id": "test-user-123"},
    )
    assert response.status_code == 422

def test_a_missing_conversation_id_is_generated_not_null():
    from unittest.mock import MagicMock

    from app.gateway.shared import save_conversation_turn

    sb = MagicMock()
    save_conversation_turn(sb, "u1", "Housing", "Find Housing", "q", "a")
    row = sb.table.return_value.insert.call_args.args[0]
    assert row["conversation_id"]
    assert len(row["conversation_id"]) == 36
    
def test_a_failed_save_does_not_log_the_row_text(caplog):
    from unittest.mock import MagicMock

    from app.gateway.shared import save_conversation_turn

    sb = MagicMock()
    sb.table.return_value.insert.return_value.execute.side_effect = RuntimeError(
        "Failing row contains (PRIVATE-QUESTION-TEXT)"
    )
    save_conversation_turn(sb, "u1", "Housing", "Find Housing", "PRIVATE-QUESTION-TEXT", "a")
    assert "PRIVATE-QUESTION-TEXT" not in caplog.text
