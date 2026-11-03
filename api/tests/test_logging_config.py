"""
The auth middleware's INFO lines have to actually be emitted.

app.main's AuthMiddleware logs at INFO to tell "no token was sent" apart from
"a token was sent and rejected" -- the distinction its docstring says a bare
401 cannot give you. Nothing configured logging, uvicorn configures only its
own loggers, and the root logger sits at WARNING with no handler, so those
records were dropped. A 401 arrived with no server-side explanation at all.
"""

import logging


def test_the_application_logger_emits_info():
    import app.main  # noqa: F401  -- importing is what configures logging

    assert logging.getLogger("app").isEnabledFor(logging.INFO)
    assert logging.getLogger("app.main").isEnabledFor(logging.INFO)


def test_the_root_logger_is_left_quiet():
    """Third-party INFO chatter stays off; only this app is turned up."""
    import app.main  # noqa: F401

    assert not logging.getLogger().isEnabledFor(logging.INFO)
    assert logging.getLogger().handlers, "a handler is needed or nothing is emitted"


def test_an_expired_token_is_explained_in_the_logs(caplog, monkeypatch):
    from fastapi.testclient import TestClient

    import app.main as main

    monkeypatch.setenv("ENVIRONMENT", "staging")
    client = TestClient(main.app)

    with caplog.at_level(logging.INFO, logger="app.main"):
        response = client.get("/profile", headers={"Authorization": "Bearer not-a-real-token"})

    assert response.status_code == 401
    assert caplog.records, "a rejected token must leave a trace for an operator"

