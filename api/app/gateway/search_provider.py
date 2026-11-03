"""
SearchProvider interface for restricted-site search.

Decision-independent on purpose: whichever model ends up calling this
(Sonnet, GLM, DeepSeek), the contract is the same -- give it a query and
an optional domain allowlist, get back passages to ground an answer in.
Model selection and fallback logic (restricted-first, open-web fallback)
are a separate, still-open decision (Kavya's ongoing evaluation) and
deliberately don't live here.
"""
from __future__ import annotations

import logging
import os
from typing import TypedDict

import requests

logger = logging.getLogger(__name__)


class SearchResult(TypedDict):
    url: str
    title: str
    passages: list[str]
    published_at: str | None
    provider: str


class SearchProvider:
    """Base interface. Concrete providers (Tavily, etc.) implement search()."""

    def search(self, query: str, allowed_domains: list[str] | None = None) -> list[SearchResult]:
        raise NotImplementedError


class TavilySearchProvider(SearchProvider):
    """
    Real implementation using Tavily's search API. allowed_domains maps to
    Tavily's include_domains param -- restricted search when a list of
    trusted sources is passed, open-web when it's None/empty.
    """

    _ENDPOINT = "https://api.tavily.com/search"

    def __init__(self, api_key: str | None = None):
        self.api_key = api_key or os.getenv("TAVILY_API_KEY")

    def search(self, query: str, allowed_domains: list[str] | None = None) -> list[SearchResult]:
        if not self.api_key:
            logger.warning("TAVILY_API_KEY not set, returning no results")
            return []

        payload = {
            "api_key": self.api_key,
            "query": query,
            "search_depth": "basic",
            "max_results": 5,
        }
        if allowed_domains:
            payload["include_domains"] = allowed_domains

        try:
            response = requests.post(self._ENDPOINT, json=payload, timeout=10)
            response.raise_for_status()
            data = response.json()
        except requests.exceptions.RequestException as e:
            logger.warning("Tavily search failed for query=%r: %s", query, e)
            return []

        results: list[SearchResult] = []
        for item in data.get("results", []):
            results.append({
                "url": item.get("url", ""),
                "title": item.get("title", ""),
                "passages": [item.get("content", "")] if item.get("content") else [],
                "published_at": item.get("published_date"),
                "provider": "tavily",
            })
        return results
