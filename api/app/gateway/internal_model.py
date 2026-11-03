"""Model calls that are not the user-facing answer: the router and insight extraction.

They follow the same PRIMARY_PROVIDER setting as the answer, so one switch moves
every model call. No web search, and plain text back (the callers parse JSON).
"""

import os

from app.gateway.claude_client import call_claude
from app.gateway.gemini_client import call_gemini


def uses_gemini() -> bool:
    return (os.getenv("PRIMARY_PROVIDER") or "claude").strip().lower() == "gemini"


async def call_internal_model(system_prompt: str, question: str, model: str | None = None) -> dict:
    if uses_gemini():
        # `model` is a Claude model name, so it does not apply to Gemini.
        return await call_gemini(system_prompt=system_prompt, question=question, web_search=False)
    kwargs = {"model": model} if model else {}
    return await call_claude(
        system_prompt=system_prompt, question=question, web_search=False, **kwargs
    )

