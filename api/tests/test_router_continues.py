# ruff: noqa: E501
import json

from app.gateway import router_stage as rs


def _payload(**changes):
    base = {
        "product_category": "Work", "category_confidence": "high",
        "safety_action": "allow", "safety_category": "none", "classification": "clear",
    }
    base.update(changes)
    return json.dumps(base)


def test_the_flag_is_read_strictly():
    assert rs.normalize_router_output(_payload(continues_previous_turn=True), "Work")["continues_previous_turn"] is True
    for value in ("true", 1, None):
        assert rs.normalize_router_output(_payload(continues_previous_turn=value), "Work")["continues_previous_turn"] is False
    assert rs.normalize_router_output(_payload(), "Work")["continues_previous_turn"] is False


def test_the_earlier_turn_is_shown_only_when_the_router_says_it_continues():
    turn = [{"role": "user", "content": "childcare"}, {"role": "assistant", "content": "How old is the child?"}]
    unrelated = rs.normalize_router_output(_payload(continues_previous_turn=False), "Work")
    assert "childcare" not in rs.build_routing_context(unrelated, turn)
    continuing = rs.normalize_router_output(_payload(continues_previous_turn=True), "Work")
    context = rs.build_routing_context(continuing, turn)
    assert "childcare" in context and "different topic" in context


def test_the_router_is_asked_whether_the_message_continues_the_earlier_turn():
    assert "continues_previous_turn" in rs.build_router_prompt("q", "", [], "2026-10-04", "Work", "")
