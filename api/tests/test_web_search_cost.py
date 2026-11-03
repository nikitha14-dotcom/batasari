import asyncio
import logging
from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest

from app.gateway import claude_client, runner
from app.gateway.shared import WEB_SEARCH_COST_USD, estimate_cost


def test_each_search_adds_a_cent_on_top_of_tokens():
    tokens_only = estimate_cost("claude-sonnet-4-6", 1_000_000, 1_000_000)
    assert tokens_only == pytest.approx(18.00)
    assert estimate_cost("claude-sonnet-4-6", 1_000_000, 1_000_000, 2) == pytest.approx(18.02)
    assert WEB_SEARCH_COST_USD == 0.01


def test_no_searches_costs_the_same_as_before():
    assert estimate_cost("claude-sonnet-4-6", 1000, 500) == estimate_cost(
        "claude-sonnet-4-6", 1000, 500, 0
    )


def _fake_client(usage):
    response = SimpleNamespace(
        content=[SimpleNamespace(type="text", text="answer", citations=None)],
        usage=usage,
    )

    class _Messages:
        async def create(self, **kwargs):
            return response

    return SimpleNamespace(messages=_Messages())


@pytest.mark.parametrize(
    "server_tool_use, expected",
    [
        (SimpleNamespace(web_search_requests=3), 3),
        (None, 0),  # no server tool used
        (SimpleNamespace(web_search_requests=None), 0),
    ],
)
def test_call_claude_reports_the_search_count(monkeypatch, server_tool_use, expected):
    usage = SimpleNamespace(input_tokens=10, output_tokens=5, server_tool_use=server_tool_use)
    monkeypatch.setattr(claude_client, "_get_client", lambda: _fake_client(usage))

    result = asyncio.run(claude_client.call_claude("sys", "q"))

    assert result["web_search_requests"] == expected


def _answer(monkeypatch, result):
    async def _ok(system_prompt, question):
        return result

    monkeypatch.setattr(runner, "call_claude", _ok)
    sb = MagicMock()

    async def collect():
        return [
            e async for e in runner.run_ai_answer("q", "Housing", "Find Housing", "u1", supabase=sb)
        ]

    asyncio.run(collect())
    return next(
        c.args[0]
        for c in sb.table.return_value.insert.call_args_list
        if "model" in c.args[0]
    )


def test_the_answer_log_records_searches_and_includes_their_cost(monkeypatch):
    row = _answer(
        monkeypatch,
        {
            "text": "a",
            "input_tokens": 1_000_000,
            "output_tokens": 0,
            "web_search_requests": 4,
            "model": "claude-sonnet-4-6",
        },
    )

    assert row["web_search_requests"] == 4
    assert row["estimated_cost_usd"] == pytest.approx(3.04)


def test_a_result_without_a_search_count_logs_zero(monkeypatch):
    row = _answer(
        monkeypatch,
        {"text": "a", "input_tokens": 1, "output_tokens": 1, "model": "claude-sonnet-4-6"},
    )

    assert row["web_search_requests"] == 0


def test_an_unpriced_model_is_still_flagged_when_it_searched(monkeypatch, caplog):
    with caplog.at_level(logging.WARNING, logger="app.gateway.runner"):
        row = _answer(
            monkeypatch,
            {
                "text": "a",
                "input_tokens": 10,
                "output_tokens": 10,
                "web_search_requests": 1,
                "model": "some/unpriced",
            },
        )

    assert row["estimated_cost_usd"] == pytest.approx(0.01)
    assert any("No price configured" in r.getMessage() for r in caplog.records)

