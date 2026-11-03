from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient

from app.main import app

USER = "feedback-user-1"


class FakeResult:
    def __init__(self, data):
        self.data = data


def _make_mock_sb(rows, fail=False, empty=False, failure_text="connection reset"):
    sb = MagicMock()

    def _get_table(name):
        assert name == "feedback"
        table = MagicMock()

        def _insert(row):
            table._row = row
            return table

        def _execute():
            if fail:
                raise RuntimeError(failure_text)
            if empty:
                return FakeResult([])
            rows.append(table._row)
            return FakeResult(
                [{"id": "11111111-1111-1111-1111-111111111111", **table._row,
                  "created_at": "2026-09-23T10:00:00+00:00"}]
            )

        table.insert = _insert
        table.execute = _execute
        return table

    sb.table = _get_table
    return sb


@pytest.fixture
def rows():
    return []


@pytest.fixture(autouse=True)
def isolated_app_state():
    """Put app.state.supabase back when the test ends.

    app.state is process-global and other test modules install their own
    Supabase double at import time. Swapping it here without restoring made
    test_profile fail depending on file order -- a failure in a file this one
    does not touch, which is the worst kind to debug.
    """
    previous = getattr(app.state, "supabase", None)
    app.state.feedback_limiter.reset()
    yield
    if previous is None:
        if hasattr(app.state, "supabase"):
            delattr(app.state, "supabase")
    else:
        app.state.supabase = previous
    app.state.feedback_limiter.reset()


@pytest.fixture
def client(rows):
    app.state.supabase = _make_mock_sb(rows)
    return TestClient(app)


def _post(client, body, user=USER):
    return client.post("/feedback", json=body, headers={"x-test-user-id": user})


def test_valid_submission_is_stored(client, rows):
    response = _post(client, {"rating": 4, "feedback_type": "bug_report", "message": "Broken"})

    assert response.status_code == 201
    assert response.json()["id"]
    assert rows == [
        {"user_id": USER, "rating": 4, "feedback_type": "bug_report", "message": "Broken"}
    ]


def test_message_is_optional(client, rows):
    response = _post(client, {"rating": 5, "feedback_type": "general_feedback"})

    assert response.status_code == 201
    assert rows[0]["message"] is None


def test_blank_message_is_stored_as_null(client, rows):
    response = _post(client, {"rating": 3, "feedback_type": "other", "message": "   \n  "})

    assert response.status_code == 201
    assert rows[0]["message"] is None


def test_message_is_trimmed(client, rows):
    _post(client, {"rating": 3, "feedback_type": "other", "message": "  hello  "})

    assert rows[0]["message"] == "hello"


def test_newlines_in_message_survive(client, rows):
    _post(client, {"rating": 3, "feedback_type": "other", "message": "one\r\ntwo"})

    assert rows[0]["message"] == "one\ntwo"


def test_control_characters_are_removed(client, rows):
    _post(client, {"rating": 3, "feedback_type": "other", "message": "a\x00b"})

    assert "\x00" not in rows[0]["message"]


@pytest.mark.parametrize("rating", [0, 6, -1, 99])
def test_rating_outside_one_to_five_is_rejected(client, rows, rating):
    response = _post(client, {"rating": rating, "feedback_type": "other"})

    assert response.status_code == 422
    assert rows == []


def test_rating_is_required(client, rows):
    response = _post(client, {"feedback_type": "other"})

    assert response.status_code == 422
    assert rows == []


def test_feedback_type_is_required(client, rows):
    response = _post(client, {"rating": 3})

    assert response.status_code == 422
    assert rows == []


def test_unknown_feedback_type_is_rejected(client, rows):
    response = _post(client, {"rating": 3, "feedback_type": "praise"})

    assert response.status_code == 422
    assert rows == []


def test_extra_fields_are_rejected(client, rows):
    response = _post(client, {"rating": 3, "feedback_type": "other", "user_id": "someone-else"})

    assert response.status_code == 422
    assert rows == []


def test_over_length_message_is_rejected(client, rows):
    response = _post(client, {"rating": 3, "feedback_type": "other", "message": "x" * 2001})

    assert response.status_code == 422
    assert rows == []


def test_message_at_the_limit_is_accepted(client, rows):
    response = _post(client, {"rating": 3, "feedback_type": "other", "message": "x" * 2000})

    assert response.status_code == 201


def test_anonymous_request_is_rejected(rows):
    """No impersonation header and no bearer token: the route must not store."""
    app.state.supabase = _make_mock_sb(rows)
    with TestClient(app) as anon:
        response = anon.post(
            "/feedback",
            json={"rating": 3, "feedback_type": "other"},
            # ENVIRONMENT=development would otherwise hand us local-dev-user.
            headers={"authorization": "Bearer "},
        )

    assert response.status_code == 401
    assert rows == []


def test_rate_limit_returns_429(client, rows):
    for _ in range(20):
        assert _post(client, {"rating": 3, "feedback_type": "other"}).status_code == 201

    response = _post(client, {"rating": 3, "feedback_type": "other"})

    assert response.status_code == 429
    assert len(rows) == 20


def test_rate_limit_is_per_user(client, rows):
    for _ in range(20):
        _post(client, {"rating": 3, "feedback_type": "other"})

    other = _post(client, {"rating": 3, "feedback_type": "other"}, user="feedback-user-2")

    assert other.status_code == 201


def test_database_failure_returns_503(rows):
    app.state.supabase = _make_mock_sb(rows, fail=True)
    client = TestClient(app)

    response = _post(client, {"rating": 3, "feedback_type": "other"})

    assert response.status_code == 503
    assert rows == []


def test_database_exception_does_not_log_submitted_text(rows, caplog):
    private_text = "private message from user"
    app.state.supabase = _make_mock_sb(rows, fail=True, failure_text=private_text)
    client = TestClient(app)

    response = _post(client, {"rating": 3, "feedback_type": "other", "message": private_text})

    assert response.status_code == 503
    assert private_text not in caplog.text


def test_insert_returning_nothing_returns_503(rows):
    app.state.supabase = _make_mock_sb(rows, empty=True)
    client = TestClient(app)

    response = _post(client, {"rating": 3, "feedback_type": "other"})

    assert response.status_code == 503


def test_response_does_not_echo_the_message(client, rows):
    response = _post(
        client, {"rating": 3, "feedback_type": "other", "message": "something private"}
    )

    assert "something private" not in response.text

