"""Probe Gemini with native search, outside the app. Run from api/:
   $env:GEMINI_API_KEY = "..."   (never paste the key anywhere)
   uv run python ../scripts/gemini_probe.py
"""
import asyncio
import os
import sys
import time

sys.path.insert(0, os.getcwd())
from app.gateway.gemini_client import call_gemini  # noqa: E402

QUESTIONS = [
    "Can a landlord in Ontario ask me for 6 months of rent upfront?",
    "What does CDIC deposit insurance cover in Canada?",
]


async def main():
    for q in QUESTIONS:
        start = time.time()
        r = await call_gemini("Answer for a newcomer to Canada. Cite sources.", q)
        print(f"\nQ: {q}\n{time.time() - start:.1f}s  model={r['model']}  "
              f"in={r['input_tokens']} out={r['output_tokens']} searches={r['web_search_requests']}")
        print(r["text"][:600])
        for s in r["sources"]:
            print(" -", s["title"], s["url"])


asyncio.run(main())

