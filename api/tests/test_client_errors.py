import json
import logging

import pytest
from fastapi.testclient import TestClient

from app.main import _JSONFormatter, app
from app.services.rate_limiter import InMemoryRateLimiter


@pytest.fixture
def client(monkeypatch):
    monkeypatch.setenv("ENVIRONMENT", "development")
    monkeypatch.setattr(
        app.state, "client_error_limiter", InMemoryRateLimiter(daily_limit=3), raising=False
    )
    return TestClient(app)


def _report(client, caplog, body, headers=None):
    with caplog.at_level(logging.WARNING, logger="app.routers.client_errors"):
        response = client.post("/client-errors", json=body, headers=headers or {})
    lines = [
        json.loads(_JSONFormatter().format(r))
        for r in caplog.records
        if r.getMessage() == "Frontend error"
    ]
    return response, lines


def test_a_report_is_logged_as_one_filterable_line(client, caplog):
    response, lines = _report(
        client, caplog,
        {"kind": "render", "message": "Cannot read x", "page": "/housing", "digest": "abc123"},
    )

    assert response.status_code == 204
    assert len(lines) == 1
    assert lines[0]["error_kind"] == "render"
    assert lines[0]["error_message"] == "Cannot read x"
    assert lines[0]["page"] == "/housing"
    assert lines[0]["digest"] == "abc123"
    assert lines[0]["signed_in"] is False


def test_signed_out_visitors_can_report(client, caplog):
    response, lines = _report(client, caplog, {"kind": "error", "message": "boom"})
    assert response.status_code == 204
    assert len(lines) == 1


def test_a_signed_in_report_says_so(client, caplog):
    _, lines = _report(
        client, caplog, {"kind": "error", "message": "boom"}, headers={"x-test-user-id": "u1"}
    )
    assert lines[0]["signed_in"] is True


@pytest.mark.parametrize(
    "message, leaked",
    [
        ("failed for jane.doe+test@example.com", "jane.doe+test@example.com"),
        ("auth eyJhbGciOi.eyJzdWIiOi.c2lnbmF0dXJl rejected", "eyJhbGciOi.eyJzdWIiOi.c2lnbmF0dXJl"),
        ("header Bearer abc.def-123 was sent", "abc.def-123"),
        ("used sk-ant-api03-abcdefghijk", "sk-ant-api03-abcdefghijk"),
        ("account 4111111111111111 declined", "4111111111111111"),
    ],
)
def test_user_values_are_redacted_before_logging(client, caplog, message, leaked):
    _, lines = _report(client, caplog, {"kind": "error", "message": message})
    assert leaked not in json.dumps(lines)


def test_query_strings_are_dropped_from_the_page(client, caplog):
    _, lines = _report(
        client, caplog,
        {"kind": "error", "message": "x", "page": "/housing/check?address=100+Queen+St#top"},
    )
    assert lines[0]["page"] == "/housing/check"


def test_oversized_or_unknown_reports_are_rejected(client, caplog):
    too_long, lines = _report(client, caplog, {"kind": "error", "message": "x" * 501})
    unknown, _ = _report(client, caplog, {"kind": "keylogger", "message": "x"})

    assert too_long.status_code == 422
    assert unknown.status_code == 422
    assert lines == []


def test_a_flood_is_accepted_but_not_logged(client, caplog):
    for _ in range(5):
        response, lines = _report(client, caplog, {"kind": "error", "message": "loop"})
        assert response.status_code == 204
    assert len(lines) == 3  # the limit in this test

