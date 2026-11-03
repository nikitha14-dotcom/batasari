"""LLM-as-judge check: our live answer against the approved gold answer.

For the first N clear, single-turn gold cases in each category
(eval/judge/data), this asks the real /ai/answer the gold question, with the
gold case's profile when it has one. GLM-5.3 Flash on DeepInfra then compares
our answer with the gold answer under the team rubric, twice, with the order
swapped, because judges favour a position. The judge prompt, rubric and GLM
client are Gabriel's, unchanged (eval/judge, see its README).

Gold answers are hand-reviewed best versions, so ours losing overall is
expected now and then and is only a warning (WORSE). A case fails on facts:
the gold answer wins on Correctness or on Jurisdiction & Eligibility in both
orders, or the judge flags a Critical failure in our answer, or the judge's
reply can't be read. Orders that disagree are MIXED, not failed. A router-only
reply (a clarifying question, a safety reply) means the answer model never
ran, so it's reported and not judged; a run where every case was skipped fails,
since nothing was checked. A judge call that errors or takes over 120 seconds
fails that case with the error type only, and the run carries on.

All questions are answered first and judged afterwards: a long judge call
between two answers left the cached Anthropic client with a dead connection
in this test process (staging shows no such errors).

Run from api/:  uv run python ../scripts/ai_judge_check.py
Needs ANTHROPIC_API_KEY and DEEPINFRA_API_KEY. AI_JUDGE_PER_CATEGORY sets how
many cases per category (default 1). The database is a stand-in that records
writes, so nothing touches staging or production data.
"""

import json
import os
import re
import sys
import time
from types import SimpleNamespace

JUDGE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "eval", "judge"))
os.environ.setdefault("ENVIRONMENT", "development")  # enables the test user header
os.environ["RUBRIC_PATH"] = os.path.join(JUDGE_DIR, "rubrics.md")
sys.path.insert(0, os.getcwd())
sys.path.insert(0, JUDGE_DIR)

from deepinfra_client import DeepInfraClient  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from pairwise_config import build_pairwise_prompt  # noqa: E402

from app.main import app  # noqa: E402

JUDGE_MODEL = "glm-5.3-flash"
JUDGE_TIMEOUT_SECONDS = 120
FACT_DIMENSIONS = ("Correctness", "Jurisdiction & Eligibility Correctness")

# Data folder, the app's category name, a subcategory for cases without one,
# and the judge's domain wording (from Gabriel's categories.py).
CATEGORIES = [
    ("housing", "Housing", "Find Housing", "moradia/aluguel em Toronto/Ontário"),
    ("finance", "Finance", "Banking & Moving Money",
     "finanças pessoais e bancos para recém-chegados em Toronto/Canadá"),
    ("work", "Work", "General",
     "trabalho, busca de emprego e serviços de emprego para recém-chegados em Toronto/Ontário"),
    ("education_family", "Education & Family", "Understand Schools in Canada",
     "educação e vida em família para recém-chegados em Toronto/Ontário"),
]


class _FakeTable:
    """Answers reads with the rows it was given and records every insert."""

    def __init__(self, name, db, rows):
        self.name, self.db, self.rows, self.row = name, db, rows, None

    def insert(self, row):
        self.row = row
        return self

    def __getattr__(self, _):  # select, eq, order, limit, ...
        return lambda *a, **k: self

    def execute(self):
        if self.row is not None:
            self.db.setdefault(self.name, []).append(self.row)
            return SimpleNamespace(data=[self.row])
        return SimpleNamespace(data=self.rows)


class _FakeSupabase:
    def __init__(self):
        self.writes = {}
        self.profile = None

    def table(self, name):
        rows = [self.profile] if name == "profiles" and self.profile else []
        return _FakeTable(name, self.writes, rows)


def _events(text):
    out = []
    for block in text.split("\n\n"):
        lines = dict(line.split(": ", 1) for line in block.splitlines() if ": " in line)
        if "event" in lines:
            out.append((lines["event"], json.loads(lines.get("data", "{}"))))
    return out


def _parse_judge_json(text):
    """Tolerant to ```json fences and stray text, like Gabriel's llm_judge.py."""
    text = re.sub(r"^```(json)?|```$", "", (text or "").strip()).strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(0))
            except json.JSONDecodeError:
                pass
    return None


def _pick_cases(folder, per_category):
    with open(os.path.join(JUDGE_DIR, "data", folder, "qa_cases.json"), encoding="utf-8") as f:
        cases = json.load(f)
    clear = [
        c for c in cases
        if c.get("interaction_type") == "single_turn"
        and c.get("expected_classification") == "clear"
        and (c.get("final_response") or "").strip()
    ]
    return clear[:per_category]


def _ask(client, db, case, category, default_subcategory):
    db.profile = case["context"] if isinstance(case.get("context"), dict) else None
    started = time.time()
    r = client.post(
        "/ai/answer",
        headers={"x-test-user-id": "00000000-0000-0000-0000-00000000c1c2"},
        json={
            "question": case["user_question"],
            "category": category,
            "subcategory": case.get("subcategory") or default_subcategory,
        },
    )
    seconds = time.time() - started
    events = _events(r.text)
    complete = next((d for e, d in events if e == "complete"), None)
    error = next((d for e, d in events if e == "error"), None)
    return r.status_code, complete, error, seconds


def _side(verdict, gold_first):
    if verdict in ("A", "B"):
        return "gold" if (verdict == "A") == gold_first else "ours"
    return "equivalent" if verdict == "equivalent" else "unparsed"


def _judge(judge, case, ours, domain):
    """Two calls, gold as A then gold as B. Returns per-order winners, the
    dimensions gold won in both orders, our flags and the judge's evidence."""
    winners, dims, flags, evidence = [], [], [], ""
    for gold_first in (True, False):
        a, b = (case["final_response"], ours) if gold_first else (ours, case["final_response"])
        system, user, _ = build_pairwise_prompt(
            case["user_question"], a, b,
            expected_classification=case.get("expected_classification"),
            user_context=case["context"] if isinstance(case.get("context"), dict) else None,
            domain=domain,
            expectations=case.get("expectations"),
        )
        parsed = _parse_judge_json(judge.complete(JUDGE_MODEL, system, user)["text"]) or {}
        winners.append(_side(parsed.get("overall"), gold_first))
        dimensions = parsed.get("dimensions") or {}
        dims.append({d for d in FACT_DIMENSIONS if _side(dimensions.get(d), gold_first) == "gold"})
        ours_flags = parsed.get("new_flags_in_b" if gold_first else "new_flags_in_a") or []
        flags += [f for f in ours_flags if isinstance(f, dict)]
        evidence = evidence or (parsed.get("evidence") or "")
    return winners, sorted(set.intersection(*dims)), flags, evidence


def main() -> int:
    missing = [k for k in ("ANTHROPIC_API_KEY", "DEEPINFRA_API_KEY") if not os.getenv(k)]
    if missing:
        print(f"{' and '.join(missing)} not set; cannot run the judge check.")
        return 1

    per_category = int(os.getenv("AI_JUDGE_PER_CATEGORY", "1"))
    judge = DeepInfraClient()
    # A hung judge call must not hold the run until the job times out.
    judge._client = judge._client.with_options(timeout=JUDGE_TIMEOUT_SECONDS)
    db = _FakeSupabase()
    app.state.supabase = db
    app.state.rate_limiter = None  # the check itself must not hit the daily limit

    # One client keeps one event loop for the whole run (see ai_smoke.py), and
    # every answer comes before any judging (see the docstring).
    answered = []
    with TestClient(app) as client:
        for folder, category, default_subcategory, domain in CATEGORIES:
            for case in _pick_cases(folder, per_category):
                answered.append((case, category, domain,
                                 *_ask(client, db, case, category, default_subcategory)))

    rows, failures = [], []
    for case, category, domain, status, complete, error, seconds in answered:
        ours = (complete or {}).get("answer") or ""
        if status != 200 or error or not ours.strip():
            detail = f"no answer ({(error or {}).get('code') or status})"
            failures.append(f"{case['eval_id']}: {detail}")
            rows.append((case["eval_id"], category, seconds, "-", "FAIL", detail))
            continue
        if (complete or {}).get("pipeline_used") == "router-only":
            rows.append((case["eval_id"], category, seconds, "-", "SKIP",
                         "router asked to clarify, not judged"))
            continue

        try:
            winners, fact_losses, flags, evidence = _judge(judge, case, ours, domain)
        except Exception as exc:
            # The SDK's error text can carry the request body (our answer and
            # the gold one), so only the error type is reported.
            detail = f"judge call failed ({type(exc).__name__})"
            failures.append(f"{case['eval_id']}: {detail}")
            rows.append((case["eval_id"], category, seconds, "-", "FAIL", detail))
            continue
        critical = [f.get("flag") for f in flags if f.get("severity") == "Critical"]
        if "unparsed" in winners:
            result, detail = "FAIL", "the judge's reply couldn't be read"
        elif critical:
            result, detail = "FAIL", f"critical flag on our answer: {', '.join(critical)}"
        elif fact_losses:
            lost_on = ", ".join(fact_losses)
            result, detail = "FAIL", f"gold better on {lost_on} in both orders: {evidence[:160]}"
        elif winners == ["gold", "gold"]:
            result, detail = "WORSE", f"gold better overall, not on facts: {evidence[:160]}"
        elif len(set(winners)) > 1:
            result, detail = "MIXED", "the two orders disagree"
        else:
            result, detail = "PASS", "ours better" if winners[0] == "ours" else "equivalent to gold"
        if result == "FAIL":
            failures.append(f"{case['eval_id']}: {detail}")
        rows.append((case["eval_id"], category, seconds, " / ".join(winners), result, detail))

    if rows and all(r[4] == "SKIP" for r in rows):
        # Every answer was a router reply, so nothing was judged: not a pass.
        failures.append("every case was a router reply, so nothing was judged")

    lines = [
        f"## LLM judge check ({JUDGE_MODEL}, {per_category} per category)",
        "",
        "Winner per order: gold first / ours first.",
        "",
        "| Case | Category | Seconds | Winner per order | Result | Detail |",
        "|---|---|---|---|---|---|",
    ]
    lines += [
        f"| {cid} | {cat} | {s:.1f} | {w} | {res} | {d.replace('|', '/')} |"
        for cid, cat, s, w, res, d in rows
    ]
    if failures:
        lines += ["", "**Failures:**", ""] + [f"- {f}" for f in failures]
    report = "\n".join(lines)
    print(report)
    summary = os.getenv("GITHUB_STEP_SUMMARY")
    if summary:
        with open(summary, "a", encoding="utf-8") as f:
            f.write(report + "\n")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())

