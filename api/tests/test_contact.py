from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient

from app.main import app

USER = "contact-user-1"
VALID = {
    "name": "Jia",
    "email": "jia@example.com",
    "topic": "privacy_data",
    "message": "Please help with my data.",
}


@pytest.fixture
def client():
    previous = getattr(app.state, "supabase", None)
    rows = []
    sb = MagicMock()

    def insert(row):
        rows.append(row)
        return sb.table.return_value

    sb.table.return_value.insert.side_effect = insert
    sb.table.return_value.execute.return_value.data = [{"id": "message-id"}]
    app.state.supabase = sb
    app.state.contact_limiter.reset()
    yield TestClient(app), rows, sb
    if previous is None:
        delattr(app.state, "supabase")
    else:
        app.state.supabase = previous
    app.state.contact_limiter.reset()


def post(client, body=VALID):
    return client.post("/contact", json=body, headers={"x-test-user-id": USER})


def test_contact_message_is_stored_for_signed_in_user(client):
    http, rows, sb = client
    response = post(http)

    assert response.status_code == 201
    assert response.json() == {"id": "message-id"}
    sb.table.assert_called_with("contact_messages")
    assert rows == [{"user_id": USER, **VALID}]


def test_contact_message_preserves_paragraphs(client):
    http, rows, _ = client
    response = post(http, {**VALID, "message": "First line\r\n\r\nSecond line"})
    assert response.status_code == 201
    assert rows[0]["message"] == "First line\n\nSecond line"


def test_contact_name_cannot_store_line_breaks(client):
    http, rows, _ = client
    response = post(http, {**VALID, "name": "Jia\r\nSupport"})
    assert response.status_code == 201
    assert rows[0]["name"] == "Jia Support"


@pytest.mark.parametrize("topic", [
    "technical_issue",
    "account_sign_in",
    "privacy_data",
    "subscriptions",
    "general_question",
    "partnership",
    "other",
])
def test_contact_topics_are_accepted(client, topic):
    http, rows, _ = client
    response = post(http, {**VALID, "topic": topic})
    assert response.status_code == 201
    assert rows[0]["topic"] == topic


@pytest.mark.parametrize("change", [
    {"name": "   "},
    {"email": "not-an-email"},
    {"topic": "unknown"},
    {"topic": "subscriptions_billing"},
    {"topic": "moving_checklist"},
    {"message": ""},
    {"message": "x" * 5001},
])
def test_contact_message_validates_fields(client, change):
    http, rows, _ = client
    response = post(http, {**VALID, **change})
    assert response.status_code == 422
    assert rows == []


def test_contact_message_requires_authentication(client, monkeypatch):
    http, rows, _ = client
    monkeypatch.setenv("ENVIRONMENT", "production")
    response = http.post("/contact", json=VALID)
    assert response.status_code == 401
    assert rows == []


def test_contact_message_is_rate_limited(client):
    http, rows, _ = client
    for _ in range(10):
        assert post(http).status_code == 201
    assert post(http).status_code == 429
    assert len(rows) == 10


def test_contact_message_failure_is_reported_without_echoing_or_logging_content(client, caplog):
    http, _, sb = client
    sb.table.return_value.execute.side_effect = RuntimeError(VALID["message"])
    response = post(http)
    assert response.status_code == 503
    assert "Please help" not in response.text
    assert "Please help" not in caplog.text

