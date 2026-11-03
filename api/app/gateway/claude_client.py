import os

from anthropic import AsyncAnthropic

DEFAULT_MODEL = "claude-sonnet-4-6"

REQUEST_TIMEOUT_SECONDS = 140.0

# Safety net, not a target: Claude decides how many searches to run per
# answer, and nothing else stops it. In the Housing gold data one answer used
# 9 searches and cost $0.75. 7 only affects the longest multi-part questions;
# lower after Oct 5 review if needed.
MAX_WEB_SEARCHES = 7

_client = None


def _get_client() -> AsyncAnthropic:
    global _client
    if _client is None:
        _client = AsyncAnthropic(
            api_key=os.environ["ANTHROPIC_API_KEY"],
            timeout=REQUEST_TIMEOUT_SECONDS,
            max_retries=0,
        )
    return _client


async def call_claude(
    system_prompt: str, question: str, model: str = DEFAULT_MODEL, web_search: bool = True
) -> dict:
    """
    Calls Claude with the given system prompt and user question. Web search is
    on by default; internal calls that must return plain JSON (insight
    extraction) turn it off. Raises on failure -- the caller (runner.py) turns
    that into an `error` SSE event instead of crashing the whole endpoint.
    """
    extra = {}
    if web_search:
        extra["tools"] = [{
            "type": "web_search_20250305",
            "name": "web_search",
            "max_uses": MAX_WEB_SEARCHES,
        }]
    response = await _get_client().messages.create(
        model=model,
        max_tokens=4000,
        system=system_prompt,
        messages=[{"role": "user", "content": question}],
        **extra,
    )

    text_parts = []
    citations = []
    for block in response.content:
        if block.type == "text":
            text_parts.append(block.text)
            for citation in getattr(block, "citations", None) or []:
                url = getattr(citation, "url", None)
                if url:
                    citations.append({"url": url, "title": getattr(citation, "title", None)})

    # The same page is often cited several times in one answer. Keep the first
    # appearance of each URL so the sources list shows it once.
    seen = set()
    unique_sources = []
    for source in citations:
        if source["url"] not in seen:
            seen.add(source["url"])
            unique_sources.append(source)

    server_tool_use = getattr(response.usage, "server_tool_use", None)
    return {
        "text": "".join(text_parts),
        "input_tokens": response.usage.input_tokens,
        "output_tokens": response.usage.output_tokens,
        "web_search_requests": getattr(server_tool_use, "web_search_requests", None) or 0,
        "model": model,
        "sources": unique_sources,
    }
