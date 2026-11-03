import asyncio
import logging
from unittest.mock import MagicMock

from app.gateway import runner


async def _answer(*_args, **_kwargs):
    return {
        "text": "answer",
        "input_tokens": 1,
        "output_tokens": 1,
        "model": "claude-sonnet-4-6",
    }


def _supabase():
    supabase = MagicMock()
    supabase.table.return_value.insert.return_value.execute.return_value = MagicMock(
        data=[{"id": "log"}]
    )
    return supabase


def test_completed_at_is_marked_only_after_complete_event_is_consumed(monkeypatch):
    monkeypatch.setattr(runner, "call_claude", _answer)
    supabase = _supabase()

    async def collect():
        return [
            event
            async for event in runner.run_ai_answer(
                "q", "Housing", "Find Housing", "u1", supabase=supabase
            )
        ]

    events = asyncio.run(collect())
    assert any(event.startswith("event: complete") for event in events)
    supabase.table.return_value.update.assert_called_once()
    supabase.table.return_value.update.return_value.eq.assert_called_with("id", "log")


def test_cancelled_at_complete_yield_is_not_marked_completed(monkeypatch):
    monkeypatch.setattr(runner, "call_claude", _answer)
    supabase = _supabase()

    async def stop_at_complete():
        stream = runner.run_ai_answer("q", "Housing", "Find Housing", "u1", supabase=supabase)
        while True:
            event = await stream.__anext__()
            if event.startswith("event: complete"):
                await stream.aclose()
                return

    asyncio.run(stop_at_complete())
    supabase.table.return_value.update.assert_not_called()


def test_failed_answer_is_not_marked_completed(monkeypatch):
    async def fail(*_args, **_kwargs):
        raise RuntimeError("provider unavailable")

    monkeypatch.setattr(runner, "call_claude", fail)
    supabase = _supabase()

    async def collect():
        return [
            event
            async for event in runner.run_ai_answer(
                "q", "Housing", "Find Housing", "u1", supabase=supabase
            )
        ]

    events = asyncio.run(collect())
    assert any(event.startswith("event: error") for event in events)
    supabase.table.return_value.update.assert_not_called()


def test_completion_marker_failure_is_an_error_with_metric_impact_logged(caplog):
    supabase = MagicMock()
    completion_update = supabase.table.return_value.update.return_value.eq.return_value
    completion_update.execute.side_effect = RuntimeError("permission denied")

    with caplog.at_level(logging.ERROR, logger="app.gateway.runner"):
        runner._mark_answer_completed(supabase, "log", "run")

    assert "quality metrics will exclude run_id=run" in caplog.text
    assert "permission denied" not in caplog.text

