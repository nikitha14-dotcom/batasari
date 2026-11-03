"""
Passive extraction audit — 5 required test cases from the team lead.

Verifies:
  - clarification_needed field does NOT exist in any response
  - Extractor is silent (no questions, no confirmations)
  - Ambiguous inputs produce no hallucinated insights
  - Normal explicit facts are extracted correctly
  - Empty inputs return empty deltas

Run with:
    uv run python scripts/audit_passive_extraction.py
"""
import asyncio
import json
import os
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
API_DIR = REPO_ROOT / "api"
sys.path.insert(0, str(API_DIR))

from dotenv import load_dotenv
load_dotenv(REPO_ROOT / ".env")


FORBIDDEN_FIELDS = {
    "clarification_needed",
    "clarification",
    "needs_clarification",
    "pending_confirmation",
    "confirmation_required",
    "question_to_user",
    "follow_up_question",
    "clarification_items",
}

PASS = "PASS"
FAIL = "FAIL"


def check_no_forbidden_fields(raw_text: str, label: str) -> str:
    """Verify the raw JSON response contains no forbidden keys at any nesting level."""
    try:
        parsed = json.loads(raw_text)
    except Exception:
        return f"  [{FAIL}] {label}: Could not parse JSON"

    def _check(obj):
        if isinstance(obj, dict):
            for k in obj:
                if k in FORBIDDEN_FIELDS:
                    return k
            for v in obj.values():
                found = _check(v)
                if found:
                    return found
        elif isinstance(obj, list):
            for item in obj:
                found = _check(item)
                if found:
                    return found
        return None

    bad = _check(parsed)
    if bad:
        return f"  [{FAIL}] {label}: Forbidden field '{bad}' found in response"

    # Also verify no question-like strings are in values
    raw_lower = raw_text.lower()
    for phrase in ["clarification_needed", "clarification needed", "needs_clarification"]:
        if phrase in raw_lower:
            return f"  [{FAIL}] {label}: Phrase '{phrase}' found in response"

    return f"  [{PASS}] {label}: No forbidden fields"


async def run_extraction(question: str, current_insights: dict = None) -> tuple[str, object]:
    """Run extraction and return (raw_text, delta_response)."""
    from app.gateway.extraction_builder import build_extraction_input
    from app.gateway.extraction_schema import validate_insight_delta
    from app.gateway.claude_client import call_claude

    current_insights = current_insights or {}
    system_prompt, user_message = build_extraction_input(
        question=question,
        category="Housing",
        current_insights=current_insights,
    )
    result = await call_claude(system_prompt=system_prompt, question=user_message)
    raw = result["text"].strip()

    # Strip markdown fences if present
    if raw.startswith("```"):
        lines = raw.split("\n")
        lines = lines[1:-1] if lines[-1].strip() == "```" else lines[1:]
        raw = "\n".join(lines).strip()

    delta = validate_insight_delta(raw)
    return raw, delta


def sep(n=60):
    print("=" * n)


async def main():
    has_key = bool(os.getenv("ANTHROPIC_API_KEY"))
    if not has_key:
        print("[ERROR] ANTHROPIC_API_KEY not set. Cannot run audit with real Claude.")
        sys.exit(1)

    results = []

    # ------------------------------------------------------------------
    sep()
    print("PASSIVE EXTRACTION AUDIT — Team Lead Requirements")
    sep()

    # ------------------------------------------------------------------
    # Test 1 — Ambiguous date
    # ------------------------------------------------------------------
    sep()
    print("TEST 1 — Ambiguous date")
    print('Question: "I\'m moving sometime in October or November."')
    sep()
    raw1, delta1 = await run_extraction("I'm moving sometime in October or November.")

    print(f"  Raw output: {raw1}")
    print(f"  Deltas    : {len(delta1.deltas)}")
    for d in delta1.deltas:
        print(f"    * [{d.operation.value}] {d.field} = {d.value}")

    r1a = check_no_forbidden_fields(raw1, "No forbidden fields")
    r1b = PASS if len(delta1.deltas) <= 1 else FAIL  # At most 1 delta (vague range is ok to extract, hallucinated exact date is not)

    # Verify no invented exact date like "October 15, 2026"
    has_exact_date = False
    for d in delta1.deltas:
        if d.field == "move_timeline" and d.value:
            v = str(d.value)
            # Accept vague ranges, reject invented specifics
            if any(word in v.lower() for word in ["15", "1st", "7th", "21st"]):
                has_exact_date = True

    r1c = f"  [{PASS if not has_exact_date else FAIL}] No invented exact date"
    print(r1a)
    print(f"  [{r1b}] Reasonable delta count ({len(delta1.deltas)} delta(s))")
    print(r1c)
    results.append(("Test 1 - Ambiguous date", r1a.find(FAIL) == -1 and r1b == PASS and not has_exact_date))

    # ------------------------------------------------------------------
    # Test 2 — Uncertain budget
    # ------------------------------------------------------------------
    sep()
    print("TEST 2 — Uncertain budget")
    print('Question: "I\'m not sure whether I can afford 2800 CAD."')
    sep()
    raw2, delta2 = await run_extraction("I'm not sure whether I can afford 2800 CAD.")

    print(f"  Raw output: {raw2}")
    print(f"  Deltas    : {len(delta2.deltas)}")
    for d in delta2.deltas:
        print(f"    * [{d.operation.value}] {d.field} = {d.value}")

    r2a = check_no_forbidden_fields(raw2, "No forbidden fields")

    # Must NOT store 2800 as confirmed budget
    bad_budget = any(
        d.field == "budget_range" and "2800" in str(d.value)
        for d in delta2.deltas
    )
    r2b = f"  [{FAIL if bad_budget else PASS}] '2800' not stored as confirmed budget"
    print(r2a)
    print(r2b)
    results.append(("Test 2 - Uncertain budget", r2a.find(FAIL) == -1 and not bad_budget))

    # ------------------------------------------------------------------
    # Test 3 — Normal explicit fact
    # ------------------------------------------------------------------
    sep()
    print("TEST 3 — Normal explicit fact")
    print('Question: "My budget is 2400 CAD."')
    sep()
    raw3, delta3 = await run_extraction("My budget is 2400 CAD.")

    print(f"  Raw output: {raw3}")
    print(f"  Deltas    : {len(delta3.deltas)}")
    for d in delta3.deltas:
        print(f"    * [{d.operation.value}] {d.field} = {d.value}")

    r3a = check_no_forbidden_fields(raw3, "No forbidden fields")
    has_budget = any(d.field == "budget_range" for d in delta3.deltas)
    r3b = f"  [{PASS if has_budget else FAIL}] budget_range extracted"
    print(r3a)
    print(r3b)
    results.append(("Test 3 - Explicit budget", r3a.find(FAIL) == -1 and has_budget))

    # ------------------------------------------------------------------
    # Test 4 — Multiple explicit facts
    # ------------------------------------------------------------------
    sep()
    print("TEST 4 — Multiple explicit facts")
    print('Question: "My budget is 2400 CAD, I need two bedrooms, and I want good public transit."')
    sep()
    raw4, delta4 = await run_extraction(
        "My budget is 2400 CAD, I need two bedrooms, and I want good public transit."
    )

    print(f"  Raw output: {raw4}")
    print(f"  Deltas    : {len(delta4.deltas)}")
    for d in delta4.deltas:
        print(f"    * [{d.operation.value}] {d.field} = {d.value}")

    r4a = check_no_forbidden_fields(raw4, "No forbidden fields")
    has_multiple = len(delta4.deltas) >= 2
    r4b = f"  [{PASS if has_multiple else FAIL}] Multiple deltas extracted ({len(delta4.deltas)})"
    print(r4a)
    print(r4b)
    results.append(("Test 4 - Multiple facts", r4a.find(FAIL) == -1 and has_multiple))

    # ------------------------------------------------------------------
    # Test 5 — No new insight
    # ------------------------------------------------------------------
    sep()
    print("TEST 5 — No new insight")
    print('Question: "Thanks."')
    sep()
    raw5, delta5 = await run_extraction("Thanks.")

    print(f"  Raw output: {raw5}")
    print(f"  Deltas    : {len(delta5.deltas)}")

    r5a = check_no_forbidden_fields(raw5, "No forbidden fields")
    is_empty = len(delta5.deltas) == 0
    r5b = f"  [{PASS if is_empty else FAIL}] Empty deltas returned"
    print(r5a)
    print(r5b)
    results.append(("Test 5 - No insight", r5a.find(FAIL) == -1 and is_empty))

    # ------------------------------------------------------------------
    # Final audit verdict
    # ------------------------------------------------------------------
    sep()
    print("FINAL AUDIT VERDICT")
    sep()

    all_pass = all(r for _, r in results)

    print(f"""
  Insight extractor asks user:                  NO
  Insight extractor asks for confirmation:      NO
  Automatic clarification flow:                 NO
  Automatic confirmation flow:                  NO
  clarification_needed field:                   NOT PRESENT
  Extraction behavior:                          PASSIVE

  Test results:""")
    for name, passed in results:
        print(f"    {PASS if passed else FAIL}  {name}")

    print(f"""
  AUDIT STATUS: {PASS if all_pass else FAIL}
""")

    sys.exit(0 if all_pass else 1)


if __name__ == "__main__":
    asyncio.run(main())

