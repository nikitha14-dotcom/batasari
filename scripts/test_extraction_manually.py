"""
Manual test script for insight extraction — runs without the API server.

Tests the full pipeline:
  build_extraction_input → call_claude → validate → merge_deltas → save/load JSON

Usage (from repo root, requires uv):
    uv run python scripts/test_extraction_manually.py

Without uv (if you have the venv activated or packages installed):
    python scripts/test_extraction_manually.py

Set ANTHROPIC_API_KEY in your .env or environment before running.
The script reads the root .env automatically.
"""

import asyncio
import json
import os
import sys
import tempfile
from pathlib import Path

# ── resolve repo root so imports work from any working directory ──────────────
REPO_ROOT = Path(__file__).resolve().parent.parent
API_DIR = REPO_ROOT / "api"
sys.path.insert(0, str(API_DIR))

# Load .env (same pattern as the API)
from dotenv import load_dotenv  # noqa: E402
load_dotenv(REPO_ROOT / ".env")


def _section(title: str) -> None:
    print(f"\n{'=' * 60}")
    print(f"  {title}")
    print('=' * 60)


def _ok(msg: str) -> None:
    print(f"  [OK] {msg}")


def _info(msg: str) -> None:
    print(f"  -> {msg}")


async def run_test(
    question: str,
    current_insights: dict,
    category: str = "Housing",
    use_real_claude: bool = True,
) -> dict:
    """Run one extraction + merge cycle. Returns the updated insight dict."""
    from app.gateway.extraction_builder import build_extraction_input
    from app.gateway.extraction_schema import validate_insight_delta
    from app.gateway.insight_memory import merge_deltas

    _info(f"Question : {question}")
    _info(f"Category : {category}")
    _info(f"Memory in: {json.dumps(current_insights, indent=4)}")

    # 1. Build the extraction prompt
    system_prompt, user_message = build_extraction_input(
        question=question,
        category=category,
        current_insights=current_insights,
    )
    _ok("Built extraction prompt")

    if use_real_claude:
        from app.gateway.claude_client import call_claude
        _info("Calling Claude for extraction (this uses API credits)...")
        result = await call_claude(system_prompt=system_prompt, question=user_message)
        raw_text = result["text"]
        _ok(f"Claude responded ({result['input_tokens']} in / {result['output_tokens']} out tokens)")
    else:
        # Fake response for offline testing
        raw_text = '{"category": "Housing", "deltas": [{"field": "budget_range", "operation": "set", "value": "$2000 CAD"}], "confidence": 0.9}'
        _ok("Using FAKE Claude response (offline mode)")

    print(f"\n  Raw Claude output:\n  {raw_text}\n")

    # 2. Validate
    delta_response = validate_insight_delta(raw_text)
    _ok(f"Validated: {len(delta_response.deltas)} delta(s), confidence={delta_response.confidence:.2f}")

    for d in delta_response.deltas:
        print(f"       * [{d.operation.value}] {d.field} = {d.value}")

    # 3. Merge
    updated = merge_deltas(
        current=current_insights,
        deltas=delta_response.deltas,
        category=category,
    )
    _ok("Merged deltas into memory")

    return updated


async def main() -> None:
    # ── Check ANTHROPIC_API_KEY ───────────────────────────────────────────────
    has_key = bool(os.getenv("ANTHROPIC_API_KEY"))
    use_real_claude = has_key
    if not has_key:
        print("\n[WARNING] ANTHROPIC_API_KEY not found -- running in OFFLINE mode (fake responses).")
        print("   Set ANTHROPIC_API_KEY in your .env to test with real Claude.")

    # -- Use a temp dir so the test doesn't pollute your real .data/ folder ----
    with tempfile.TemporaryDirectory() as tmp:
        from app.gateway.insight_store import JsonInsightStore
        store = JsonInsightStore(data_dir=tmp)
        user_id = "manual-test-user"
        category = "Housing"
        conv_id = "test-conv-001"

        # ---------------------------------------------------------------------
        _section("TEST 1 - Extract from scratch (no prior memory)")
        q1 = "I'm looking for a 1-bedroom condo around $2000/month in the Annex."
        insights_0 = store.load_insights(user_id, category)
        insights_1 = await run_test(q1, insights_0, category, use_real_claude)
        store.save_insights(user_id, category, insights_1)
        _ok(f"Saved insights -> {Path(tmp) / 'insights' / user_id / (category + '.json')}")
        print(f"\n  Memory after turn 1:\n{json.dumps(insights_1, indent=4)}\n")

        # ---------------------------------------------------------------------
        _section("TEST 2 - Append new neighbourhood to existing memory")
        q2 = "I've also been considering Liberty Village as an option."
        insights_2 = await run_test(q2, insights_1, category, use_real_claude)
        store.save_insights(user_id, category, insights_2)
        print(f"\n  Memory after turn 2:\n{json.dumps(insights_2, indent=4)}\n")

        # ---------------------------------------------------------------------
        _section("TEST 3 - Update existing field (budget change)")
        q3 = "Actually my budget is closer to $2500 now."
        insights_3 = await run_test(q3, insights_2, category, use_real_claude)
        store.save_insights(user_id, category, insights_3)
        print(f"\n  Memory after turn 3:\n{json.dumps(insights_3, indent=4)}\n")

        # ---------------------------------------------------------------------
        _section("TEST 4 - No extractable insight")
        q4 = "What documents do landlords usually ask for in Ontario?"
        insights_4 = await run_test(q4, insights_3, category, use_real_claude)
        store.save_insights(user_id, category, insights_4)
        print(f"\n  Memory after turn 4 (should be unchanged):\n{json.dumps(insights_4, indent=4)}\n")
        changed = insights_4 != insights_3
        print(f"  Memory changed: {'YES (unexpected)' if changed else 'NO (correct)'}")

        # ---------------------------------------------------------------------
        _section("TEST 5 - Conversation history save/load")
        store.save_message(user_id, category, conv_id, "user", q1)
        store.save_message(user_id, category, conv_id, "assistant", "Here are some tips...")
        history = store.load_conversation(user_id, category, conv_id)
        _ok(f"Loaded {len(history)} message(s) from conversation history")
        for msg in history:
            print(f"       [{msg['role']}] {msg['content'][:60]}...")

        # ---------------------------------------------------------------------
        _section("WHERE THE FILES ARE STORED")
        print(f"""
  (This test used a temp dir. In the real API, files land at:)

  Insights:
    <repo>/.data/insights/<user_id>/Housing.json

  Conversation history:
    <repo>/.data/conversations/<user_id>/Housing/<conversation_id>.json

  Full path on your machine:
    C:\\Users\\TUF A15 BQ234T\\Desktop\\movingAssistant\\.data\\
        """)

        # ---------------------------------------------------------------------
        _section("READING THE REAL STORED FILES")
        real_data = Path(REPO_ROOT / ".data")
        if real_data.exists():
            print(f"  .data/ directory exists at: {real_data}")
            insight_files = list(real_data.glob("insights/**/*.json"))
            conv_files = list(real_data.glob("conversations/**/*.json"))
            print(f"  Insight files  : {len(insight_files)}")
            print(f"  Conv files     : {len(conv_files)}")
            for f in insight_files[:5]:
                print(f"    {f.relative_to(real_data)}  ->  {f.read_text()[:120]}")
        else:
            print(f"  .data/ doesn't exist yet (no real API calls have been made).")
            print(f"  It will be created at: {real_data}")

        _section("ALL TESTS PASSED")


if __name__ == "__main__":
    asyncio.run(main())

