# ruff: noqa: E501
import asyncio
import json

from app.gateway import runner


def _data(event):
    return json.loads(event.split("data: ", 1)[1])


def test_blocked_links_never_reach_the_user(monkeypatch):
    async def fake_call_claude(system_prompt, question, **kwargs):
        return {
            "text": "Apply at [IRCC](https://ircc.com/apply) or [canada.ca](https://www.canada.ca/en.html).",
            "sources": [
                {"url": "https://ircc.com/apply", "title": "IRCC"},
                {"url": "https://www.canada.ca/en.html", "title": "Canada.ca"},
            ],
            "input_tokens": 1,
            "output_tokens": 1,
            "web_search_requests": 0,
            "model": "claude-sonnet-4-6",
        }

    monkeypatch.setattr(runner, "call_claude", fake_call_claude)
    monkeypatch.delenv("ROUTER_ENABLED", raising=False)

    async def collect():
        return [e async for e in runner.run_ai_answer("q", "Work", "Find Jobs", "u1")]

    complete = _data(asyncio.run(collect())[-1])
    assert "ircc.com" not in complete["answer"]
    assert [s["url"] for s in complete["sources"]] == ["https://www.canada.ca/en.html"]
