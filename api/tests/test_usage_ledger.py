import asyncio
from unittest.mock import MagicMock

import pytest

from app.gateway import runner, usage_ledger
from app.gateway.insight_store import InMemoryInsightStore
from app.gateway.shared import estimate_cost

MODEL = "claude-sonnet-4-6"


def test_record_without_a_ledger_does_nothing():
    usage_ledger._current.set(None)
    usage_ledger.record({"model": MODEL, "input_tokens": 10, "output_tokens": 10})


def test_the_ledger_adds_up_extra_calls():
    ledger = usage_ledger.start()
    usage_ledger.record({"model": MODEL, "input_tokens": 1000, "output_tokens": 100})
    usage_ledger.record({"model": MODEL, "input_tokens": 500, "output_tokens": 50})
    assert ledger["input_tokens"] == 1500
    assert ledger["output_tokens"] == 150
    assert ledger["cost_usd"] == pytest.approx(
        estimate_cost(MODEL, 1000, 100) + estimate_cost(MODEL, 500, 50)
    )
    usage_ledger._current.set(None)


def test_the_logged_cost_includes_the_extraction_call(monkeypatch):
    rows = {}
    sb = MagicMock()

    def table(name):
        t = MagicMock()

        def insert(row):
            rows.setdefault(name, []).append(row)
            return t

        t.insert.side_effect = insert
        return t

    sb.table.side_effect = table

    async def fake_call_claude(system_prompt, question, **kwargs):
        return {
            "text": "ok",
            "input_tokens": 1000,
            "output_tokens": 500,
            "web_search_requests": 0,
            "model": MODEL,
            "sources": [],
        }

    async def fake_extract(question, category, current_insights):
        usage_ledger.record({"model": MODEL, "input_tokens": 2000, "output_tokens": 100})
        return None

    monkeypatch.setattr(runner, "call_claude", fake_call_claude)
    monkeypatch.setattr(runner, "extract_insights", fake_extract)

    async def collect():
        return [
            e
            async for e in runner.run_ai_answer(
                "q",
                "Housing",
                "Find Housing",
                "u1",
                supabase=sb,
                insight_store=InMemoryInsightStore(),
            )
        ]

    asyncio.run(collect())
    expected = estimate_cost(MODEL, 1000, 500) + estimate_cost(MODEL, 2000, 100)
    assert expected > 0
    logged = rows["ai_answer_log"][0]["estimated_cost_usd"]
    assert logged == pytest.approx(round(expected, 6))
