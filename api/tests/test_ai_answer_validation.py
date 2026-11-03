import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client(monkeypatch):
    # The dev impersonation header is only honoured when ENVIRONMENT is
    # development, and these cases must reach validation, not the 401.
    monkeypatch.setenv("ENVIRONMENT", "development")
    return TestClient(app)


def _post(client, question):
    return client.post(
        "/ai/answer",
        json={
            "question": question,
            "category": "Housing",
            "subcategory": "Find Housing",
        },
        headers={"x-test-user-id": "test-user-123"},
    )


@pytest.mark.parametrize("question", ["", "   ", "\n\t "])
def test_blank_question_is_rejected_before_the_model_is_called(client, question):
    # A blank question used to be forwarded to Anthropic, which rejected it
    # with a 400 whose raw body was streamed back to the browser as an error
    # event -- leaking provider internals and paying for a round trip to learn
    # what is checkable here.
    response = _post(client, question)

    assert response.status_code == 422
    assert "model_error" not in response.text


def test_surrounding_whitespace_is_trimmed(client):
    from app.routers.ai_answer import AIAnswerRequest

    parsed = AIAnswerRequest(
        question="  where should I live  ",
        category="Housing",
        subcategory="Find Housing",
    )
    assert parsed.question == "where should I live"

