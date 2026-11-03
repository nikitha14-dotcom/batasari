"""
Rate-limit tests for POST /ai/answer.

The production limit is 250 requests per user per day. These tests use 5 so
we don't need to make hundreds of requests. The limiter is replaced on
app.state before each test and restored afterwards, so tests are fully
isolated from each other and from whatever limit the running app was started
with.

No real Claude call is made. call_claude is monkeypatched to return
immediately, the same technique used in test_ai_answer_profile_context.py.
"""

import threading

import pytest
from fastapi.testclient import TestClient

from app.gateway import runner
from app.main import app
from app.services.rate_limiter import InMemoryRateLimiter

_VALID_BODY = {
    "question": "Where should I live?",
    "category": "Housing",
    "subcategory": "Find Housing",
}

_USER_A = "rate-limit-user-a"
_USER_B = "rate-limit-user-b"


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


async def _fake_call_claude(system_prompt, question):
    return {"text": "ok", "input_tokens": 1, "output_tokens": 1, "model": "claude-sonnet-4-6"}


@pytest.fixture(autouse=True)
def _no_real_claude(monkeypatch):
    """Never let any rate-limit test reach the real model."""
    monkeypatch.setattr(runner, "call_claude", _fake_call_claude)


@pytest.fixture()
def limiter_5():
    """
    Replace app.state.rate_limiter with a fresh 5-request-per-day limiter for
    the duration of the test, then restore the original so the running app is
    unaffected.
    """
    original = getattr(app.state, "rate_limiter", None)
    fresh = InMemoryRateLimiter(daily_limit=5)
    app.state.rate_limiter = fresh
    yield fresh
    app.state.rate_limiter = original


@pytest.fixture()
def client():
    # ENVIRONMENT=development is set globally by conftest.py so
    # x-test-user-id is honoured.
    return TestClient(app)


def _post(client, user_id=_USER_A):
    return client.post(
        "/ai/answer",
        json=_VALID_BODY,
        headers={"x-test-user-id": user_id},
    )


# ---------------------------------------------------------------------------
# Sequential tests
# ---------------------------------------------------------------------------


def test_requests_up_to_the_limit_are_allowed(client, limiter_5):
    for i in range(5):
        r = _post(client)
        assert r.status_code == 200, f"request {i + 1} of 5 was unexpectedly rejected"


def test_request_over_the_limit_is_rejected_with_429(client, limiter_5):
    for _ in range(5):
        _post(client)

    r = _post(client)
    assert r.status_code == 429


def test_429_response_has_informative_detail(client, limiter_5):
    for _ in range(5):
        _post(client)

    r = _post(client)
    assert r.status_code == 429
    assert "limit" in r.json()["detail"].lower()


def test_different_users_have_independent_limits(client, limiter_5):
    # Exhaust user A's quota completely.
    for _ in range(5):
        _post(client, user_id=_USER_A)

    # User A is now blocked.
    assert _post(client, user_id=_USER_A).status_code == 429

    # User B has not made any requests yet — their quota is untouched.
    assert _post(client, user_id=_USER_B).status_code == 200


def test_no_model_call_is_made_after_limit_is_exceeded(client, limiter_5, monkeypatch):
    """
    A rejected request must not reach call_claude. This matters because every
    call to the model is billed, and a rate-limited user should never cost
    anything.
    """
    call_count = {"n": 0}

    async def counting_claude(system_prompt, question):
        call_count["n"] += 1
        return {"text": "ok", "input_tokens": 1, "output_tokens": 1, "model": "claude-sonnet-4-6"}

    monkeypatch.setattr(runner, "call_claude", counting_claude)

    for _ in range(5):
        _post(client)

    _post(client)  # This one should be blocked before reaching the model.

    assert call_count["n"] == 5


# ---------------------------------------------------------------------------
# Concurrent tests
# ---------------------------------------------------------------------------


def test_concurrent_requests_respect_the_limit(limiter_5):
    """
    10 threads all fire simultaneously for the same user. Exactly 5 must
    succeed; the other 5 must receive 429. Without the threading.Lock in
    InMemoryRateLimiter.check_and_increment, some threads can simultaneously
    read count < limit and both slip through.
    """
    results = []
    results_lock = threading.Lock()

    def make_request():
        # Each thread creates its own TestClient to get a separate ASGI scope;
        # sharing one client across threads is not safe with TestClient.
        r = TestClient(app).post(
            "/ai/answer",
            json=_VALID_BODY,
            headers={"x-test-user-id": _USER_A},
        )
        with results_lock:
            results.append(r.status_code)

    threads = [threading.Thread(target=make_request) for _ in range(10)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()

    assert len(results) == 10
    assert results.count(200) == 5, f"Expected 5 allowed, got {results.count(200)}: {results}"
    assert results.count(429) == 5, f"Expected 5 blocked, got {results.count(429)}: {results}"


def test_concurrent_requests_for_different_users_do_not_interfere(limiter_5):
    """
    User A and user B each fire 5 concurrent requests. Both should get all 5
    allowed, since they have independent counters.
    """
    results_a = []
    results_b = []
    results_lock = threading.Lock()

    def make_request(user_id, bucket):
        r = TestClient(app).post(
            "/ai/answer",
            json=_VALID_BODY,
            headers={"x-test-user-id": user_id},
        )
        with results_lock:
            bucket.append(r.status_code)

    threads = (
        [threading.Thread(target=make_request, args=(_USER_A, results_a)) for _ in range(5)]
        + [threading.Thread(target=make_request, args=(_USER_B, results_b)) for _ in range(5)]
    )
    for t in threads:
        t.start()
    for t in threads:
        t.join()

    assert all(s == 200 for s in results_a), f"User A: {results_a}"
    assert all(s == 200 for s in results_b), f"User B: {results_b}"


# ---------------------------------------------------------------------------
# Unit tests for InMemoryRateLimiter in isolation
# ---------------------------------------------------------------------------


def test_limiter_allows_up_to_limit():
    lim = InMemoryRateLimiter(daily_limit=3)
    from datetime import date

    today = date.today()
    assert lim.check_and_increment("u", today) is True
    assert lim.check_and_increment("u", today) is True
    assert lim.check_and_increment("u", today) is True
    assert lim.check_and_increment("u", today) is False


def test_limiter_reset_clears_all_counts():
    lim = InMemoryRateLimiter(daily_limit=2)
    from datetime import date

    today = date.today()
    lim.check_and_increment("u", today)
    lim.check_and_increment("u", today)
    assert lim.check_and_increment("u", today) is False

    lim.reset()
    assert lim.check_and_increment("u", today) is True


def test_limiter_different_dates_are_independent():
    lim = InMemoryRateLimiter(daily_limit=1)
    from datetime import date, timedelta

    today = date.today()
    yesterday = today - timedelta(days=1)

    assert lim.check_and_increment("u", today) is True
    assert lim.check_and_increment("u", today) is False
    # Yesterday's slot is separate — still has its full quota.
    assert lim.check_and_increment("u", yesterday) is True

