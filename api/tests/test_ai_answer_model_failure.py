import asyncio
import json
import logging
from types import SimpleNamespace
from unittest.mock import MagicMock

import anthropic
import httpx
import pytest

from app.gateway import claude_client, fallback_client, runner
from app.gateway.shared import estimate_cost

_REQUEST = httpx.Request("POST", "https://api.anthropic.com/v1/messages")
GLM = "zai-org/GLM-5.3-Flash"
DEEPSEEK = "deepseek-ai/DeepSeek-V4-Flash"


def _status_error(cls, status, body):
    return cls(
        f"Error code: {status} - {body}",
        response=httpx.Response(status, request=_REQUEST),
        body=body,
    )


def _run(monkeypatch, exc, fallback=None):
    """Run /ai/answer with the primary model raising exc.

    fallback=None means no fallback configured; otherwise it replaces
    call_fallback.
    """

    async def _raise(system_prompt, question):
        raise exc

    monkeypatch.setattr(runner, "call_claude", _raise)
    monkeypatch.setattr(runner, "fallback_enabled", lambda: fallback is not None)
    if fallback is not None:
        monkeypatch.setattr(runner, "call_fallback", fallback)

    sb = MagicMock()

    async def collect():
        return [
            e
            async for e in runner.run_ai_answer(
                "q", "Housing", "Find Housing", "u1", supabase=sb
            )
        ]

    return asyncio.run(collect()), sb


def _error_payload(events):
    errors = [e for e in events if e.startswith("event: error")]
    assert len(errors) == 1
    return json.loads(errors[0].split("data: ", 1)[1])


def _inserted_rows(sb):
    return [c.args[0] for c in sb.table.return_value.insert.call_args_list]


@pytest.mark.parametrize(
    "exc, expected",
    [
        (anthropic.APITimeoutError(request=_REQUEST), "took too long"),
        (
            _status_error(anthropic.RateLimitError, 429, {"error": {"type": "rate_limit_error"}}),
            "busy right now",
        ),
        (
            _status_error(anthropic.OverloadedError, 529, {"error": {"type": "overloaded_error"}}),
            "busy right now",
        ),
        (
            _status_error(
                anthropic.AuthenticationError,
                401,
                {"error": {"type": "authentication_error", "message": "invalid x-api-key"}},
            ),
            "Something went wrong",
        ),
    ],
)
def test_model_failure_shows_a_plain_message_and_never_the_raw_error(monkeypatch, exc, expected):
    events, sb = _run(monkeypatch, exc)

    payload = _error_payload(events)
    assert payload["code"] == "model_error"
    assert expected in payload["message"]

    everything_sent = "".join(events)
    assert "x-api-key" not in everything_sent
    assert "Error code" not in everything_sent
    assert not any(e.startswith("event: complete") for e in events)
    # A failed answer must not be billed or saved as history.
    sb.table.assert_not_called()


def test_model_failure_is_logged_with_the_run_id(monkeypatch, caplog):
    exc = _status_error(
        anthropic.AuthenticationError, 401, {"error": {"message": "invalid x-api-key"}}
    )
    with caplog.at_level(logging.ERROR, logger="app.gateway.runner"):
        _run(monkeypatch, exc)

    failures = [r for r in caplog.records if "Model call failed" in r.getMessage()]
    assert len(failures) == 1
    message = failures[0].getMessage()
    assert "AuthenticationError status=401" in message
    # The provider's body is not logged, and no traceback repeats it.
    assert "x-api-key" not in message
    assert failures[0].exc_info is None


def test_fallback_answers_when_the_primary_fails(monkeypatch):
    seen = {}

    async def _fallback(system_prompt, question, timeout):
        seen["timeout"] = timeout
        return {
            "text": "fallback answer",
            "input_tokens": 100,
            "output_tokens": 50,
            "model": DEEPSEEK,
        }

    events, sb = _run(
        monkeypatch, _status_error(anthropic.OverloadedError, 529, {}), fallback=_fallback
    )

    complete = [e for e in events if e.startswith("event: complete")]
    assert len(complete) == 1
    assert json.loads(complete[0].split("data: ", 1)[1])["answer"] == "fallback answer"
    assert not any(e.startswith("event: error") for e in events)

    # The fallback gets what's left of the budget, never more.
    assert 0 < seen["timeout"] <= runner.MODEL_BUDGET_SECONDS

    rows = _inserted_rows(sb)
    cost_row = next(r for r in rows if "model" in r)
    assert cost_row["model"] == DEEPSEEK
    # Priced, not logged as free: this row counts toward the $1 cap.
    assert cost_row["estimated_cost_usd"] > 0
    history_row = next(r for r in rows if "question" in r)
    assert history_row["answer"] == "fallback answer"


def test_error_shown_when_the_fallback_also_fails(monkeypatch, caplog):
    async def _fallback(system_prompt, question, timeout):
        raise RuntimeError("deepinfra down")

    with caplog.at_level(logging.ERROR, logger="app.gateway.runner"):
        events, sb = _run(
            monkeypatch, anthropic.APITimeoutError(request=_REQUEST), fallback=_fallback
        )

    assert "took too long" in _error_payload(events)["message"]
    assert "deepinfra down" not in "".join(events)
    sb.table.assert_not_called()
    assert any("Fallback model call failed" in r.getMessage() for r in caplog.records)


def test_fallback_is_not_called_when_the_primary_succeeds(monkeypatch):
    async def _ok(system_prompt, question):
        return {
            "text": "primary",
            "input_tokens": 1,
            "output_tokens": 1,
            "model": "claude-sonnet-4-6",
        }

    async def _fallback(system_prompt, question, timeout):
        raise AssertionError("fallback should not run")

    monkeypatch.setattr(runner, "call_claude", _ok)
    monkeypatch.setattr(runner, "fallback_enabled", lambda: True)
    monkeypatch.setattr(runner, "call_fallback", _fallback)

    async def collect():
        return [e async for e in runner.run_ai_answer("q", "Housing", "Find Housing", "u1")]

    events = asyncio.run(collect())
    assert any(e.startswith("event: complete") for e in events)


def test_empty_fallback_answer_counts_as_a_failure(monkeypatch):
    message = SimpleNamespace(content="   ")
    response = SimpleNamespace(
        choices=[SimpleNamespace(message=message)],
        usage=SimpleNamespace(prompt_tokens=10, completion_tokens=0),
    )

    class _Completions:
        async def create(self, **kwargs):
            return response

    fake = SimpleNamespace(chat=SimpleNamespace(completions=_Completions()))
    monkeypatch.setattr(fallback_client, "_get_client", lambda: fake)

    with pytest.raises(RuntimeError, match="empty answer"):
        asyncio.run(fallback_client.call_fallback("sys", "q", timeout=10))


def test_fallback_model_is_a_config_swap(monkeypatch):
    monkeypatch.delenv("FALLBACK_MODEL", raising=False)
    assert fallback_client.fallback_model() == DEEPSEEK
    # A blank value in .env falls back to the default rather than calling "".
    monkeypatch.setenv("FALLBACK_MODEL", "")
    assert fallback_client.fallback_model() == DEEPSEEK
    monkeypatch.setenv("FALLBACK_MODEL", GLM)
    assert fallback_client.fallback_model() == GLM


def test_fallback_candidates_are_priced():
    assert estimate_cost(GLM, 1_000_000, 1_000_000) == pytest.approx(0.65)
    assert estimate_cost(DEEPSEEK, 1_000_000, 1_000_000) == pytest.approx(0.27)


def test_an_unpriced_model_is_flagged_because_it_would_escape_the_cap(monkeypatch, caplog):
    async def _fallback(system_prompt, question, timeout):
        return {"text": "ok", "input_tokens": 10, "output_tokens": 10, "model": "some/unpriced"}

    with caplog.at_level(logging.WARNING, logger="app.gateway.runner"):
        _run(monkeypatch, _status_error(anthropic.OverloadedError, 529, {}), fallback=_fallback)

    messages = [r.getMessage() for r in caplog.records]
    assert any("No price configured for model some/unpriced" in m for m in messages)


@pytest.mark.parametrize("fallback_on", [False, True])
def test_primary_client_timeout_and_retries(monkeypatch, fallback_on):
    monkeypatch.setenv("ANTHROPIC_API_KEY", "test-key")
    if fallback_on:
        monkeypatch.setenv("FALLBACK_API_KEY", "test-key")
    else:
        monkeypatch.delenv("FALLBACK_API_KEY", raising=False)
    monkeypatch.setattr(claude_client, "_client", None)

    client = claude_client._get_client()

    assert client.timeout == claude_client.REQUEST_TIMEOUT_SECONDS == 140.0
    # Two 140s tries can't fit in the copilot's 3 minutes; the fallback is the retry.
    assert client.max_retries == 0


def test_the_whole_budget_fits_inside_the_copilots_three_minutes():
    worst_case = runner.MODEL_BUDGET_SECONDS + runner.MIN_FALLBACK_SECONDS
    assert worst_case < 180


def _run_timed(monkeypatch, fallback, extraction_seconds=0.0):
    """Run /ai/answer and record the timeout the primary call was given."""
    seen = {}
    clock = {"now": 1000.0}
    monkeypatch.setattr(runner.time, "time", lambda: clock["now"])

    async def _slow_extraction(question, category, current_insights):
        clock["now"] += extraction_seconds
        return None

    class _Store:
        def load_insights(self, user_id, category):
            return {}

    async def _ok(system_prompt, question):
        return {"text": "a", "input_tokens": 1, "output_tokens": 1, "model": "claude-sonnet-4-6"}

    real_wait_for = asyncio.wait_for

    async def _recording_wait_for(awaitable, timeout):
        seen["primary_timeout"] = timeout
        return await real_wait_for(awaitable, timeout)

    monkeypatch.setattr(runner, "extract_insights", _slow_extraction)
    monkeypatch.setattr(runner, "call_claude", _ok)
    monkeypatch.setattr(runner, "fallback_enabled", lambda: fallback)
    monkeypatch.setattr(runner.asyncio, "wait_for", _recording_wait_for)

    async def collect():
        return [
            e
            async for e in runner.run_ai_answer(
                "q", "Housing", "Find Housing", "u1", insight_store=_Store()
            )
        ]

    asyncio.run(collect())
    return seen["primary_timeout"]


def test_primary_leaves_the_fallback_its_reserve(monkeypatch):
    timeout = _run_timed(monkeypatch, fallback=True)
    assert timeout == pytest.approx(
        runner.MODEL_BUDGET_SECONDS - runner.FALLBACK_RESERVE_SECONDS
    )


def test_primary_is_capped_at_the_client_timeout_without_a_fallback(monkeypatch):
    assert _run_timed(monkeypatch, fallback=False) == claude_client.REQUEST_TIMEOUT_SECONDS


def test_slow_extraction_shortens_the_primary(monkeypatch):
    timeout = _run_timed(monkeypatch, fallback=True, extraction_seconds=100)
    assert timeout == pytest.approx(
        runner.MODEL_BUDGET_SECONDS - 100 - runner.FALLBACK_RESERVE_SECONDS
    )


def test_a_primary_cut_short_by_the_budget_says_it_took_too_long(monkeypatch):
    events, sb = _run(monkeypatch, TimeoutError())
    assert "took too long" in _error_payload(events)["message"]


def test_fallback_budget_counts_time_spent_on_insight_extraction(monkeypatch):
    # Extraction runs before the answer, so it has to come out of the same 60s
    # the copilot waits, not be added on top of it.
    clock = {"now": 1000.0}
    monkeypatch.setattr(runner.time, "time", lambda: clock["now"])

    async def _slow_extraction(question, category, current_insights):
        clock["now"] += 30
        return None

    class _Store:
        def load_insights(self, user_id, category):
            return {}

    async def _raise(system_prompt, question):
        raise anthropic.APITimeoutError(request=_REQUEST)

    seen = {}

    async def _fallback(system_prompt, question, timeout):
        seen["timeout"] = timeout
        return {"text": "ok", "input_tokens": 1, "output_tokens": 1, "model": DEEPSEEK}

    monkeypatch.setattr(runner, "extract_insights", _slow_extraction)
    monkeypatch.setattr(runner, "call_claude", _raise)
    monkeypatch.setattr(runner, "fallback_enabled", lambda: True)
    monkeypatch.setattr(runner, "call_fallback", _fallback)

    async def collect():
        return [
            e
            async for e in runner.run_ai_answer(
                "q", "Housing", "Find Housing", "u1", insight_store=_Store()
            )
        ]

    asyncio.run(collect())
    assert seen["timeout"] == pytest.approx(runner.MODEL_BUDGET_SECONDS - 30)

