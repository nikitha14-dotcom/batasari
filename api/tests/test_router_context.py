# ruff: noqa: E501
import json
from datetime import UTC, datetime, timedelta

from app.gateway import router_stage as rs


def _payload(**changes):
    base = {
        "product_category": "Education & Family", "category_confidence": "high",
        "safety_action": "allow", "safety_category": "none", "classification": "clear",
    }
    base.update(changes)
    return json.dumps(base)


def _clarification():
    route = rs.normalize_router_output(
        _payload(classification="ambiguous", clarification_items=["How old is the child?"]),
        "Education & Family",
    )
    return rs.render_clarification(route)


def test_an_old_clarification_is_not_carried_over(monkeypatch):
    clar = _clarification()
    old = (datetime.now(UTC) - timedelta(hours=2)).isoformat()
    monkeypatch.setattr(rs, "get_conversation_history", lambda *a, **k: [{"question": "childcare", "answer": clar, "created_at": old}])
    assert rs.previous_clarification_turn(object(), "u", "Education & Family") == []


def test_a_recent_clarification_is_still_carried_over(monkeypatch):
    clar = _clarification()
    recent = (datetime.now(UTC) - timedelta(minutes=2)).isoformat()
    monkeypatch.setattr(rs, "get_conversation_history", lambda *a, **k: [{"question": "childcare", "answer": clar, "created_at": recent}])
    assert len(rs.previous_clarification_turn(object(), "u", "Education & Family")) == 2


def test_the_routing_context_tells_the_model_to_ignore_an_unrelated_turn():
    route = rs.normalize_router_output(_payload(continues_previous_turn=True), "Education & Family")
    context = rs.build_routing_context(route, [{"role": "user", "content": "childcare"}])
    assert "different topic" in context
    assert "never mention them" in context


def _row(question, answer, minutes_ago):
    when = (datetime.now(UTC) - timedelta(minutes=minutes_ago)).isoformat()
    return {"question": question, "answer": answer, "created_at": when}


def _history(monkeypatch, rows):
    # get_conversation_history returns the newest turn first.
    monkeypatch.setattr(rs, "get_conversation_history", lambda *a, **k: rows)


def test_every_clarification_round_is_carried_over_oldest_first(monkeypatch):
    clar = _clarification()
    _history(monkeypatch, [
        _row("q3", clar, 1),
        _row("q2", clar, 3),
        _row("q1", clar, 5),
        _row("q0", "# Answer\n\n## Section\n\n[a](https://x.example)", 8),
    ])
    turns = rs.previous_clarification_turn(object(), "u", "Education & Family")
    assert [t["content"] for t in turns if t["role"] == "user"] == ["q1", "q2", "q3"]
    assert [t["role"] for t in turns] == ["user", "assistant"] * 3


def test_the_chain_stops_at_the_last_full_answer(monkeypatch):
    clar = _clarification()
    full = "# Answer\n\n## Section\n\n[a](https://x.example)"
    _history(monkeypatch, [_row("q2", clar, 1), _row("q1", full, 2), _row("q0", clar, 3)])
    turns = rs.previous_clarification_turn(object(), "u", "Education & Family")
    assert [t["content"] for t in turns if t["role"] == "user"] == ["q2"]


def test_a_gap_over_30_minutes_ends_the_chain(monkeypatch):
    clar = _clarification()
    _history(monkeypatch, [_row("q2", clar, 1), _row("q1", clar, 40)])
    turns = rs.previous_clarification_turn(object(), "u", "Education & Family")
    assert [t["content"] for t in turns if t["role"] == "user"] == ["q2"]


def test_a_long_chain_stays_within_the_gap_rule(monkeypatch):
    # 4 rounds spread over 60 minutes: each gap is under 30 minutes, so all are kept.
    clar = _clarification()
    _history(monkeypatch, [_row("q4", clar, 5), _row("q3", clar, 25), _row("q2", clar, 45), _row("q1", clar, 65)])
    turns = rs.previous_clarification_turn(object(), "u", "Education & Family")
    assert len([t for t in turns if t["role"] == "user"]) == 4

