import asyncio

from app.gateway import runner
from app.gateway.category_prompts import CORE_ANSWER_INSTRUCTION
from app.gateway.prompts import PROMPTS, category_block, category_prompts_enabled


def test_only_the_three_finished_categories_get_a_block():
    for name in ("Work", "Finance", "Education & Family"):
        assert category_block(name, "")
    for name in ("Housing", "Health", "Daily Needs", "Checklist", "Nonsense", ""):
        assert category_block(name, "") is None


def test_education_and_family_follow_the_subcategory():
    family = ("Child Care", "Schools in Canada")
    education = ("Colleges & Universities", "ESL Classes", "Trade Schools & Certifications")
    for sub in family:
        assert category_block("Education & Family", sub).startswith("CATEGORY: FAMILY")
    for sub in education:
        assert category_block("Education & Family", sub).startswith("CATEGORY: EDUCATION")
    both = category_block("Education & Family", "")
    assert "CATEGORY: FAMILY" in both and "CATEGORY: EDUCATION" in both


def test_the_flag_is_off_by_default(monkeypatch):
    monkeypatch.delenv("CATEGORY_PROMPTS_ENABLED", raising=False)
    assert category_prompts_enabled() is False
    monkeypatch.setenv("CATEGORY_PROMPTS_ENABLED", "true")
    assert category_prompts_enabled() is True


def test_v3_is_the_core_answer_prompt():
    assert PROMPTS["v3"] == CORE_ANSWER_INSTRUCTION


def test_system_prompt_adds_the_block_and_date_only_when_given():
    block = category_block("Work", "")
    with_block = runner._build_system_prompt("v3", "Work", "Find Jobs", category_block=block)
    assert with_block.startswith(CORE_ANSWER_INSTRUCTION)
    assert "--- ROUTED PRODUCT CATEGORY INSTRUCTIONS ---" in with_block
    assert "CATEGORY: WORK" in with_block
    assert "Current system date:" in with_block
    plain = runner._build_system_prompt("v2", "Housing", "Find Housing")
    assert "ROUTED PRODUCT CATEGORY" not in plain
    assert "Current system date:" not in plain


def _ask(monkeypatch, category, subcategory):
    seen = {}

    async def fake_call_claude(system_prompt, question, **kwargs):
        seen["system"] = system_prompt
        return {
            "text": "ok",
            "input_tokens": 1,
            "output_tokens": 1,
            "web_search_requests": 0,
            "model": "test-model",
            "sources": [],
        }

    monkeypatch.setattr(runner, "call_claude", fake_call_claude)

    async def collect():
        return [e async for e in runner.run_ai_answer("q", category, subcategory, "u1")]

    asyncio.run(collect())
    return seen["system"]


def test_runner_uses_the_category_prompt_only_when_enabled(monkeypatch):
    monkeypatch.delenv("CATEGORY_PROMPTS_ENABLED", raising=False)
    assert "CATEGORY: WORK" not in _ask(monkeypatch, "Work", "Find Jobs")
    monkeypatch.setenv("CATEGORY_PROMPTS_ENABLED", "true")
    assert "CATEGORY: WORK" in _ask(monkeypatch, "Work", "Find Jobs")
    assert "ROUTED PRODUCT CATEGORY" not in _ask(monkeypatch, "Housing", "Find Housing")
