import asyncio
from types import SimpleNamespace

from app.gateway import claude_client


def _client(blocks):
    usage = SimpleNamespace(input_tokens=1, output_tokens=1, server_tool_use=None)
    response = SimpleNamespace(content=blocks, usage=usage)

    class _Messages:
        async def create(self, **kwargs):
            return response

    return SimpleNamespace(messages=_Messages())


def _block(*urls):
    citations = [SimpleNamespace(url=url, title=url) for url in urls]
    return SimpleNamespace(type="text", text="answer", citations=citations)


def test_the_same_link_is_listed_once(monkeypatch):
    block = _block("https://a.example/x", "https://a.example/x", "https://b.example/y")
    monkeypatch.setattr(claude_client, "_get_client", lambda: _client([block]))
    result = asyncio.run(claude_client.call_claude("sys", "q"))
    assert [s["url"] for s in result["sources"]] == [
        "https://a.example/x",
        "https://b.example/y",
    ]


def test_a_link_repeated_across_text_blocks_is_listed_once(monkeypatch):
    blocks = [_block("https://a.example/x"), _block("https://a.example/x", "https://c.example/z")]
    monkeypatch.setattr(claude_client, "_get_client", lambda: _client(blocks))
    result = asyncio.run(claude_client.call_claude("sys", "q"))
    assert [s["url"] for s in result["sources"]] == [
        "https://a.example/x",
        "https://c.example/z",
    ]
