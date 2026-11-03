from app.gateway import router_stage as rs


def _route(**changes):
    base = {
        "product_category": "Immigration",
        "category_confidence": "high",
        "safety_action": "allow",
        "safety_category": "none",
        "classification": "clear",
        "should_answer_now": True,
        "fail_closed": False,
    }
    base.update(changes)
    return base


def test_immigration_is_redirected(monkeypatch):
    monkeypatch.delenv("REDIRECT_CATEGORIES", raising=False)
    assert rs.decide(_route()) == "redirect"


def test_ambiguous_immigration_is_redirected_not_clarified(monkeypatch):
    monkeypatch.delenv("REDIRECT_CATEGORIES", raising=False)
    route = _route(classification="ambiguous", should_answer_now=False)
    assert rs.decide(route) == "redirect"


def test_low_confidence_is_answered_normally(monkeypatch):
    monkeypatch.delenv("REDIRECT_CATEGORIES", raising=False)
    assert rs.decide(_route(category_confidence="low")) == "answer"


def test_other_categories_are_unchanged(monkeypatch):
    monkeypatch.delenv("REDIRECT_CATEGORIES", raising=False)
    assert rs.decide(_route(product_category="Work")) == "answer"


def test_safety_wins_over_redirect(monkeypatch):
    monkeypatch.delenv("REDIRECT_CATEGORIES", raising=False)
    assert rs.decide(_route(safety_action="emergency_redirect")) == "safety"


def test_none_turns_the_redirect_off(monkeypatch):
    monkeypatch.setenv("REDIRECT_CATEGORIES", "none")
    assert rs.decide(_route()) == "answer"


def test_reply_links_official_sources_and_is_not_a_clarification():
    text = rs.render_redirect(_route())
    assert "canada.ca" in text
    assert not rs.looks_like_clarification(text)

