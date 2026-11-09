import asyncio
import os

import httpx
from google import genai
from google.genai import types

# Use a current model available to new projects on the free tier.
# Gemini 2.5 generation is restricted to projects with prior model usage.
DEFAULT_GEMINI_MODEL = "gemini-3.5-flash-lite"
MAX_OUTPUT_TOKENS = 4000

_client = None
SOURCE_RULES = (
    "\n\nSOURCE RULES\n"
    "- Prefer official government and regulator pages (india.gov.in, gov.in, uidai.gov.in, "
    "passportindia.gov.in, parivahan.gov.in, rbi.org.in, dicgc.org.in, "
    "and state or municipal government domains) over blogs, law-firm posts or realtor pages.\n"
    "- Do not cite court case names or statute sections unless you found them on an "
    "official page that you are linking.\n"
    "- Deprioritize video, social media and forum posts: prefer official and "
    "reputable sources, and use these only when nothing better covers the point. "
    "If you do use one, it is fine to list it as a source.\n"
)


def gemini_model() -> str:
    return os.getenv("PRIMARY_MODEL") or DEFAULT_GEMINI_MODEL


def _get_client() -> genai.Client:
    global _client
    if _client is None:
        _client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
    return _client


REDIRECT_HOST = "vertexaisearch.cloud.google.com"


async def _resolve(http: httpx.AsyncClient, url: str) -> str | None:
    # Grounding links are Google redirects. Read the real URL from the
    # Location header without visiting the target site. None = unresolved.
    if REDIRECT_HOST not in url:
        return url
    for method in ("HEAD", "GET"):
        try:
            response = await http.request(method, url, follow_redirects=False)
        except Exception:
            continue
        location = response.headers.get("location")
        if location and REDIRECT_HOST not in location:
            return location
    return None


async def call_gemini(system_prompt: str, question: str, web_search: bool = False) -> dict:
    """Gemini generation; native Search is opt-in because this project has no free Search quota."""
    model = gemini_model()
    config = types.GenerateContentConfig(
        # The source rules only make sense when the model can search the web.
        system_instruction=system_prompt + (SOURCE_RULES if web_search else ""),
        max_output_tokens=MAX_OUTPUT_TOKENS,
        tools=[types.Tool(google_search=types.GoogleSearch())] if web_search else None,
    )
    response = await _get_client().aio.models.generate_content(
        model=model, contents=question, config=config
    )
    text = response.text or ""
    if not text.strip():
        raise RuntimeError(f"Gemini model {model} returned an empty answer")

    usage = response.usage_metadata
    candidate = response.candidates[0] if response.candidates else None
    grounding = getattr(candidate, "grounding_metadata", None)
    chunks = (getattr(grounding, "grounding_chunks", None) or []) if grounding else []
    queries = (getattr(grounding, "web_search_queries", None) or []) if grounding else []

    raw = [(c.web.uri, c.web.title) for c in chunks if getattr(c, "web", None) and c.web.uri]
    async with httpx.AsyncClient(timeout=5.0) as http:
        urls = await asyncio.gather(*[_resolve(http, uri) for uri, _ in raw])
    seen, sources = set(), []
    for url, (_, title) in zip(urls, raw):
        if url is None or url in seen:
            continue  # drop unresolved Google redirects and duplicates
        seen.add(url)
        sources.append({"url": url, "title": title})

    return {
        "text": text,
        "input_tokens": usage.prompt_token_count or 0,
        # Thinking tokens are billed as output, so they count toward the cost cap.
        "output_tokens": (usage.candidates_token_count or 0) + (usage.thoughts_token_count or 0),
        "web_search_requests": len(queries),
        "model": model,
        "sources": sources,
    }
