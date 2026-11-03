import asyncio

from app.gateway import internal_model


def _fake(name, calls):
    async def fake(**kwargs):
        calls.append((name, kwargs))
        return {"text": "{}", "input_tokens": 1, "output_tokens": 1, "model": name}

    return fake


def _run(monkeypatch, provider, model=None):
    calls = []
    if provider is None:
        monkeypatch.delenv("PRIMARY_PROVIDER", raising=False)
    else:
        monkeypatch.setenv("PRIMARY_PROVIDER", provider)
    monkeypatch.setattr(internal_model, "call_claude", _fake("claude", calls))
    monkeypatch.setattr(internal_model, "call_gemini", _fake("gemini", calls))
    asyncio.run(internal_model.call_internal_model("sys", "q", model=model))
    return calls


def test_gemini_when_primary_provider_is_gemini(monkeypatch):
    calls = _run(monkeypatch, "gemini", model="claude-haiku-4-5")
    assert [c[0] for c in calls] == ["gemini"]
    assert calls[0][1]["web_search"] is False
    assert "model" not in calls[0][1]


def test_claude_by_default_and_for_claude_value(monkeypatch):
    for value in (None, "claude", ""):
        calls = _run(monkeypatch, value)
        assert [c[0] for c in calls] == ["claude"]
        assert calls[0][1]["web_search"] is False


def test_claude_model_override_is_passed_on(monkeypatch):
    calls = _run(monkeypatch, "claude", model="claude-haiku-4-5")
    assert calls[0][1]["model"] == "claude-haiku-4-5"

