# ruff: noqa: E501
import asyncio
import json

from app.gateway import router_stage as rs
from app.gateway import usage_ledger


def _json(**changes):
    base = {
        "product_category": "Work", "category_confidence": "high", "category_rationale": "r",
        "safety_action": "allow", "safety_category": "none", "safety_rationale": "r",
        "classification": "clear", "should_answer_now": True, "missing_blockers": [],
        "material_unknowns": [], "classification_rationale": "r", "clarification_heading": "",
        "clarification_intro": "", "clarification_items": [],
    }
    base.update(changes)
    return json.dumps(base)


def test_clear_question_is_answered():
    route = rs.normalize_router_output(_json(), "Work")
    assert rs.decide(route) == "answer" and route["product_category"] == "Work"


def test_ambiguous_asks_first():
    route = rs.normalize_router_output(
        _json(classification="ambiguous", clarification_items=["Which visa do you hold?"]), "Work")
    assert rs.decide(route) == "clarify"
    assert "- Which visa do you hold?" in rs.render_clarification(route)


def test_safety_actions_use_the_fixed_replies():
    refuse = rs.normalize_router_output(_json(safety_action="hard_refusal", safety_category="other_safety"), "Work")
    assert rs.decide(refuse) == "safety" and "Can't Help" in rs.render_safety_response(refuse)
    sos = rs.normalize_router_output(_json(safety_action="emergency_redirect", safety_category="other_safety"), "Work")
    text = rs.render_safety_response(sos)
    assert rs.decide(sos) == "safety" and "911" in text and "9-8-8" in text
    limited = rs.normalize_router_output(_json(safety_action="limited", safety_category="other_safety"), "Work")
    assert rs.decide(limited) == "answer" and rs.render_safety_response(limited) is None


def test_bad_replies_fail_closed():
    for raw in ("not json at all", "", "[]", _json(safety_action="maybe"), _json(classification="weird")):
        assert rs.decide(rs.normalize_router_output(raw, "Work")) == "fail_closed", raw


def test_a_minor_schema_slip_does_not_block_the_answer():
    payload = json.loads(_json())
    del payload["category_confidence"]
    route = rs.normalize_router_output(json.dumps(payload), "Work")
    assert rs.decide(route) == "answer" and route["parse_fallback"] is True


def test_fenced_json_is_accepted():
    assert rs.decide(rs.normalize_router_output("```json\n" + _json() + "\n```", "Work")) == "answer"


def test_clarification_detection():
    route = rs.normalize_router_output(_json(classification="ambiguous", clarification_items=["x"]), "Work")
    assert rs.looks_like_clarification(rs.render_clarification(route))
    assert not rs.looks_like_clarification(rs.render_fail_closed())
    assert not rs.looks_like_clarification(rs.render_safety_response({"safety_action": "hard_refusal"}))
    assert not rs.looks_like_clarification("# Title\n\n## Section\n\n[a](https://x.example)")


def test_router_prompt_has_question_profile_and_transcript():
    p = rs.build_router_prompt("my question", "- Visa type: study_permit", [{"role": "user", "content": "earlier"}], "2026-10-02", "Work", "Find Jobs")
    assert "my question" in p and "study_permit" in p and "earlier" in p and "2026-10-02" in p


def test_run_router_calls_without_search_and_counts_the_cost(monkeypatch):
    seen = {}

    async def fake(system_prompt, question, **kwargs):
        seen.update(kwargs)
        return {"text": _json(), "input_tokens": 3000, "output_tokens": 200, "model": "claude-sonnet-4-6", "web_search_requests": 0}

    monkeypatch.setattr(rs, "call_internal_model", fake)
    ledger = usage_ledger.start()
    route = asyncio.run(rs.run_router("q", "Work", "Find Jobs", "", [], "2026-10-02"))
    assert rs.decide(route) == "answer"
    assert ledger["input_tokens"] == 3000 and ledger["cost_usd"] > 0


def test_previous_turn_only_when_it_was_a_clarification(monkeypatch):
    clar = rs.render_clarification(rs.normalize_router_output(_json(classification="ambiguous", clarification_items=["x"]), "Work"))
    monkeypatch.setattr(rs, "get_conversation_history", lambda *a, **k: [{"question": "q1", "answer": clar}])
    assert [t["role"] for t in rs.previous_clarification_turn(object(), "u", "Work")] == ["user", "assistant"]
    monkeypatch.setattr(rs, "get_conversation_history", lambda *a, **k: [{"question": "q1", "answer": "## long answer"}])
    assert rs.previous_clarification_turn(object(), "u", "Work") == []
    assert rs.previous_clarification_turn(None, "u", "Work") == []
