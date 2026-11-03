import asyncio
import uuid
from unittest.mock import MagicMock

from app.gateway import runner


async def _fake_call_claude(system_prompt, question):
    return {
        "text": "answer text",
        "input_tokens": 100,
        "output_tokens": 50,
        "model": "claude-sonnet-4-6",
    }


def test_logs_cost_when_supabase_is_configured(monkeypatch):
    monkeypatch.setattr(runner, "call_claude", _fake_call_claude)

    insert_calls = []
    sb = MagicMock()

    def _insert(row):
        insert_calls.append(row)
        return sb.table.return_value

    sb.table.return_value.insert.side_effect = _insert
    sb.table.return_value.execute.return_value = MagicMock()

    async def collect():
        return [
            e
            async for e in runner.run_ai_answer(
                "q", "Housing", "Find Housing", "u1", supabase=sb
            )
        ]

    events = asyncio.run(collect())

    assert any(e.startswith("event: complete") for e in events)
    # run_ai_answer now writes two rows: the cost log (ai_answer_log) and the
    # conversation history turn (conversation_history). Distinguish them by
    # shape rather than order, since both go through the same mocked insert.
    assert len(insert_calls) == 2

    cost_row = next(row for row in insert_calls if "model" in row)
    assert cost_row["user_id"] == "u1"
    assert cost_row["category"] == "Housing"
    assert cost_row["model"] == "claude-sonnet-4-6"
    assert cost_row["input_tokens"] == 100
    assert cost_row["output_tokens"] == 50
    assert cost_row["estimated_cost_usd"] is not None
    uuid.UUID(cost_row["run_id"])  # does not raise

    history_row = next(row for row in insert_calls if "question" in row)
    assert history_row["user_id"] == "u1"
    assert history_row["category"] == "Housing"
    assert history_row["question"] == "q"
    assert history_row["answer"] == "answer text"
    assert history_row["run_id"] == cost_row["run_id"]


def test_skips_logging_silently_when_supabase_is_none(monkeypatch):
    # Local dev (use_local_profile_store) never has a supabase client. This
    # must not raise.
    monkeypatch.setattr(runner, "call_claude", _fake_call_claude)

    async def collect():
        return [
            e async for e in runner.run_ai_answer("q", "Housing", "Find Housing", "u1")
        ]

    events = asyncio.run(collect())
    assert any(e.startswith("event: complete") for e in events)


def test_answer_still_streams_when_the_log_write_fails(monkeypatch):
    # Best-effort logging: a Supabase outage or a bad write must never turn
    # a working answer into a failed request.
    monkeypatch.setattr(runner, "call_claude", _fake_call_claude)

    sb = MagicMock()
    sb.table.return_value.insert.return_value.execute.side_effect = Exception("db down")

    async def collect():
        return [
            e
            async for e in runner.run_ai_answer(
                "q", "Housing", "Find Housing", "u1", supabase=sb
            )
        ]

    events = asyncio.run(collect())

    assert any(e.startswith("event: complete") for e in events)
    assert not any(e.startswith("event: error") for e in events)

