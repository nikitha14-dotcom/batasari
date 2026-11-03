import os

from openai import AsyncOpenAI

# Any OpenAI-compatible endpoint works here, so switching the fallback model or
# provider is an env change. Defaults to DeepSeek on DeepInfra: GLM took 34-55s
# per answer in testing, too slow to fit in what the primary leaves over.
DEFAULT_FALLBACK_MODEL = "deepseek-ai/DeepSeek-V4-Flash"
DEFAULT_FALLBACK_BASE_URL = "https://api.deepinfra.com/v1/openai"

_client = None


# Read at call time, not import time: main.py loads .env after the routers are
# imported, so an import-time read would ignore a local .env override.
def fallback_model() -> str:
    return os.getenv("FALLBACK_MODEL") or DEFAULT_FALLBACK_MODEL


def fallback_enabled() -> bool:
    return bool(os.getenv("FALLBACK_API_KEY"))


def _get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI(
            api_key=os.environ["FALLBACK_API_KEY"],
            base_url=os.getenv("FALLBACK_BASE_URL") or DEFAULT_FALLBACK_BASE_URL,
            max_retries=0,
        )
    return _client


async def call_fallback(system_prompt: str, question: str, timeout: float) -> dict:
    """Same return shape as call_claude. Raises on failure or an empty answer."""
    model = fallback_model()
    response = await _get_client().chat.completions.create(
        model=model,
        max_tokens=1500,
        timeout=timeout,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": question},
        ],
    )
    text = response.choices[0].message.content or ""
    if not text.strip():
        raise RuntimeError(f"Fallback model {model} returned an empty answer")
    return {
        "text": text,
        "input_tokens": response.usage.prompt_tokens,
        "output_tokens": response.usage.completion_tokens,
        "web_search_requests": 0,
        "model": model,
    }

