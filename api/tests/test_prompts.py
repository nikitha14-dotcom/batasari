import asyncio
import json

import pytest

from app.gateway import prompts, runner


def test_defaults_when_unset(monkeypatch):
    monkeypatch.delenv("PROMPT_VERSION", raising=False)
    assert prompts.active_prompt_version() == prompts.DEFAULT_PROMPT_VERSION


def test_blank_means_default(monkeypatch):
    monkeypatch.setenv("PROMPT_VERSION", "  ")
    assert prompts.active_prompt_version() == prompts.DEFAULT_PROMPT_VERSION


def test_env_selects_registered_version(monkeypatch):
    monkeypatch.setitem(prompts.PROMPTS, "v0", "older prompt")
    monkeypatch.setenv("PROMPT_VERSION", "v0")
    assert prompts.active_prompt_version() == "v0"


def test_unknown_version_raises(monkeypatch):
    monkeypatch.setenv("PROMPT_VERSION", "v999")
    with pytest.raises(RuntimeError, match="v999"):
        prompts.active_prompt_version()


def test_answer_uses_and_reports_active_version(monkeypatch):
    monkeypatch.setitem(prompts.PROMPTS, "v0", "OLDER PROMPT")
    monkeypatch.setenv("PROMPT_VERSION", "v0")
    seen = {}

    async def fake_call_claude(system_prompt, question):
        seen["system_prompt"] = system_prompt
        return {"text": "ok", "input_tokens": 1, "output_tokens": 1, "model": "claude-sonnet-4-6"}

    monkeypatch.setattr(runner, "call_claude", fake_call_claude)

    async def collect():
        return [e async for e in runner.run_ai_answer("q", "Housing", "Find Housing", "u1")]

    events = asyncio.run(collect())
    complete = json.loads(events[-1].split("data: ", 1)[1])

    assert seen["system_prompt"].startswith("OLDER PROMPT")
    assert complete["metadata"]["prompt_version"] == "v0"


def test_profile_context_included_when_present(monkeypatch):
    seen = {}

    async def fake_call_claude(system_prompt, question):
        seen["system_prompt"] = system_prompt
        return {"text": "ok", "input_tokens": 1, "output_tokens": 1, "model": "claude-sonnet-4-6"}

    monkeypatch.setattr(runner, "call_claude", fake_call_claude)

    async def collect():
        return [
            e
            async for e in runner.run_ai_answer(
                "q", "Housing", "Find Housing", "u1", profile_context="- Visa type: Study permit"
            )
        ]

    asyncio.run(collect())
    assert "- Visa type: Study permit" in seen["system_prompt"]


def test_no_profile_context_omits_the_section(monkeypatch):
    seen = {}

    async def fake_call_claude(system_prompt, question):
        seen["system_prompt"] = system_prompt
        return {"text": "ok", "input_tokens": 1, "output_tokens": 1, "model": "claude-sonnet-4-6"}

    monkeypatch.setattr(runner, "call_claude", fake_call_claude)

    async def collect():
        return [e async for e in runner.run_ai_answer("q", "Housing", "Find Housing", "u1")]

    asyncio.run(collect())
    assert "already told us" not in seen["system_prompt"]



def test_default_prompt_is_india_focused_batasari(monkeypatch):
    monkeypatch.delenv("PROMPT_VERSION", raising=False)
    assert prompts.active_prompt_version() == "v4"
    prompt = prompts.PROMPTS[prompts.active_prompt_version()]
    assert "Batasari" in prompt
    assert "India" in prompt
    assert "Ontario" not in prompt
