import asyncio

import httpx

from app.gateway.gemini_client import SOURCE_RULES, _resolve

REDIRECT = "https://vertexaisearch.cloud.google.com/grounding-api-redirect/abc"


def _run(handler, url):
    async def go():
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as http:
            return await _resolve(http, url)

    return asyncio.run(go())


def test_reads_location_header():
    def handler(request):
        return httpx.Response(302, headers={"location": "https://www.acto.ca/page"})

    assert _run(handler, REDIRECT) == "https://www.acto.ca/page"


def test_falls_back_to_get_when_head_fails():
    def handler(request):
        if request.method == "HEAD":
            return httpx.Response(405)
        return httpx.Response(302, headers={"location": "https://cleo.on.ca/x"})

    assert _run(handler, REDIRECT) == "https://cleo.on.ca/x"


def test_drops_unresolved_redirect():
    def handler(request):
        raise httpx.ConnectTimeout("timeout")

    assert _run(handler, REDIRECT) is None


def test_keeps_normal_urls():
    def handler(request):
        raise AssertionError("should not be called")

    assert _run(handler, "https://www.cdic.ca/") == "https://www.cdic.ca/"


def test_social_and_video_are_deprioritized_not_blocked():
    assert "Deprioritize video, social media and forum posts" in SOURCE_RULES
    assert "Do not rely on" not in SOURCE_RULES

