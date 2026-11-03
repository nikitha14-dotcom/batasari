import asyncio

from app.gateway import housing_facts, runner
from app.gateway.prompts import category_block
from app.gateway.router_prompts import CANONICAL_FACTS


def test_housing_is_off_by_default_and_on_by_setting(monkeypatch):
    monkeypatch.delenv("CATEGORY_PROMPT_CATEGORIES", raising=False)
    assert category_block("Housing", "Find Housing") is None
    monkeypatch.setenv("CATEGORY_PROMPT_CATEGORIES", "Work, Housing")
    assert category_block("Housing", "Find Housing").startswith("CATEGORY: HOUSING")
    assert category_block("Finance", "") is None


def test_the_rent_guideline_fact_is_always_included_for_housing():
    facts = housing_facts.select_canonical_facts("Housing", "any question", "", [])
    assert "ontario_rent_guideline_2026" in facts
    assert "triggers" not in facts["ontario_rent_guideline_2026"]


def test_a_trigger_word_adds_its_fact_and_other_categories_get_none():
    fact_id, payload = next(
        (key, value)
        for key, value in CANONICAL_FACTS.items()
        if key != "ontario_rent_guideline_2026" and value.get("triggers")
    )
    trigger = payload["triggers"][0]
    assert fact_id in housing_facts.select_canonical_facts("Housing", f"about {trigger}", "", [])
    assert housing_facts.select_canonical_facts("Work", "rent guideline", "", []) == {}


def test_runner_adds_the_housing_prompt_and_facts_when_enabled(monkeypatch):
    seen = {}

    async def fake_call_claude(system_prompt, question, **kwargs):
        seen["system"] = system_prompt
        return {
            "text": "ok", "input_tokens": 1, "output_tokens": 1,
            "web_search_requests": 0, "model": "claude-sonnet-4-6", "sources": [],
        }

    monkeypatch.setattr(runner, "call_claude", fake_call_claude)
    monkeypatch.delenv("ROUTER_ENABLED", raising=False)
    monkeypatch.setenv("CATEGORY_PROMPTS_ENABLED", "true")
    monkeypatch.setenv("CATEGORY_PROMPT_CATEGORIES", "Housing")

    async def collect():
        return [e async for e in runner.run_ai_answer("q", "Housing", "Find Housing", "u1")]

    asyncio.run(collect())
    assert "CATEGORY: HOUSING" in seen["system"]
    assert "ontario_rent_guideline_2026" in seen["system"]
