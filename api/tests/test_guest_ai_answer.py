import pytest
from fastapi.testclient import TestClient

from app.gateway import runner
from app.main import app
from app.services.rate_limiter import InMemoryRateLimiter


@pytest.fixture
def client(monkeypatch):
    monkeypatch.setenv("ENVIRONMENT", "production")
    original_ip = getattr(app.state, "guest_ai_ip_limiter", None)
    original_global = getattr(app.state, "guest_ai_global_limiter", None)
    app.state.guest_ai_ip_limiter = InMemoryRateLimiter(daily_limit=2)
    app.state.guest_ai_global_limiter = InMemoryRateLimiter(daily_limit=10)

    async def fake_call_claude(system_prompt, question):
        return {
            "text": "Batasari guest answer",
            "input_tokens": 1,
            "output_tokens": 1,
            "model": "claude-sonnet-4-6",
        }

    monkeypatch.setattr(runner, "call_claude", fake_call_claude)
    yield TestClient(app)
    app.state.guest_ai_ip_limiter = original_ip
    app.state.guest_ai_global_limiter = original_global


def _post(client):
    return client.post(
        "/ai/guest-answer",
        json={
            "question": "How do I plan my move in India?",
            "category": "General",
            "subcategory": "Moving and settling in India",
        },
        headers={"x-forwarded-for": "203.0.113.10, 10.0.0.1"},
    )


def test_guest_answer_works_without_authentication(client):
    response = _post(client)
    assert response.status_code == 200
    assert "Batasari guest answer" in response.text


def test_guest_answer_has_a_per_ip_daily_limit(client):
    assert _post(client).status_code == 200
    assert _post(client).status_code == 200
    assert _post(client).status_code == 429


def test_guest_answer_rejects_invalid_question_before_model(client):
    response = client.post(
        "/ai/guest-answer",
        json={
            "question": " ",
            "category": "General",
            "subcategory": "Moving",
        },
        headers={"x-forwarded-for": "203.0.113.11, 10.0.0.1"},
    )
    assert response.status_code == 422
