"""
Minimal client to call any model hosted on DeepInfra.
DeepInfra exposes an OpenAI-compatible API, so we use the `openai` lib
just swapping the base_url.

pip install openai --break-system-packages
"""
import os
import time

from openai import OpenAI

DEEPINFRA_BASE_URL = "https://api.deepinfra.com/v1/openai"

DEEPINFRA_MODEL_SLUGS = {
    "glm-5.3-flash": "zai-org/GLM-5.3-Flash",
    "deepseek-v4-pro-0813": "deepseek-ai/DeepSeek-V4-Pro-0813",
    "nemotron-3-ultra": "nvidia/NVIDIA-Nemotron-3-Ultra-550B-A55B", 
}


class DeepInfraClient:
    def __init__(self, api_key=None):
        api_key = api_key or os.getenv("DEEPINFRA_API_KEY")
        if not api_key:
            raise ValueError("DEEPINFRA_API_KEY não configurada (env var ou .env)")
        self._client = OpenAI(api_key=api_key, base_url=DEEPINFRA_BASE_URL)

    def complete(self, model_key, system_prompt, user_prompt, temperature=0.0, max_tokens=2000):
        """model_key: one of the keys of DEEPINFRA_MODEL_SLUGS."""
        slug = DEEPINFRA_MODEL_SLUGS.get(model_key)
        if slug is None:
            raise ValueError(
                f"Modelo '{model_key}' não está em DEEPINFRA_MODEL_SLUGS. "
                f"Disponíveis: {list(DEEPINFRA_MODEL_SLUGS)}"
            )
        t0 = time.perf_counter()
        response = self._client.chat.completions.create(
            model=slug,
            temperature=temperature,
            max_tokens=max_tokens,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        )
        latency_ms = (time.perf_counter() - t0) * 1000
        choice = response.choices[0]
        return {
            "text": choice.message.content,
            "finish_reason": choice.finish_reason,
            "input_tokens": response.usage.prompt_tokens if response.usage else None,
            "output_tokens": response.usage.completion_tokens if response.usage else None,
            "latency_ms": latency_ms,
            "model_slug": slug,
        }


if __name__ == "__main__":
    # manual smoke test: python3 deepinfra_client.py glm-5.3-flash
    import sys

    client = DeepInfraClient()
    model_key = sys.argv[1] if len(sys.argv) > 1 else "glm-5.3-flash"
    result = client.complete(
        model_key,
        system_prompt="Responda em uma frase.",
        user_prompt="Qual a capital do Canadá?",
    )
    print(result)

