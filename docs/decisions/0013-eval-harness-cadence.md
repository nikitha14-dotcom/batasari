# 0013 — Full eval harness: nightly, not per PR (for now)

**Date:** 2026-09-10 · **Who:** Rahul Vaidhya (Platform lead) · **Status:** Proposed — for team discussion

## Context
From the Eng/DS backlog: *"running full harness in CI: a) right now: pros and cons
of running daily vs per PR; b) after we launch: pros and cons of running daily vs
per PR."*

**What exists today** (checked 2026-09-10):

- `nightly-harness.yml` runs at 00:05 UTC. Its install step,
  `uv sync --project api --locked --extra eval`, fails deterministically:
  `Extra 'eval' is not defined in the optional-dependencies table for
  moving-assistant-api`. I reproduced this locally with uv 0.12.7. The Actions run
  history is not visible from my machine, so confirm there — but with the current
  `pyproject.toml` files this step cannot pass. Kavya's `kavya-nightly-harness`
  branch (`d67b871`) switches the *run* step to
  `uv run --package moving-assistant-eval`, but the install step still passes
  `--extra eval`, so that branch would still fail at install.
- Even once fixed, it evaluates a different system from the product. It runs
  `eval_harness_final.py`: Gemini 3.6 Flash, `pilot-v1` instructions, and 2
  hardcoded questions. The product path is `app.gateway`, running Sonnet 4.6 with
  `PROMPT_VERSION`.
- The **full** harness does not exist yet. Per the week 3 plan it will be: 30
  Housing questions (then roughly 10 categories), Sonnet 4.6 with restricted web
  search, an LLM judge (GLM-5.3 Flash or DeepSeek V4 Pro, still being chosen by
  DS #3), and a gold dataset per category.

## Cost of one full run (estimate — replace with `eval_cost_log` numbers)

Sonnet 4.6 costs $3 / $15 per million input / output tokens. Web search costs $10
per 1,000 searches. Both are list prices. Search results are added to the model's
input, so assume 10–25k input tokens and about 1k output per question, plus 2–5
searches. These token counts are guesses, not measurements:

| | Per question | Housing (30 Q × 2 repeats) | All categories (~300 Q × 2) |
|---|---|---|---|
| Generation + search | ~$0.07–0.14 | **~$4–8 per run** | **~$40–80 per run** |

Judge calls on an open-weight model are small next to this and are left out.

**Run volume.** 24 PRs merged from 28 Aug to 7 Sep (`git log --merges`), with at
most 6 on the busiest day. CI runs on every push to a PR, not once per PR, so a
per-PR harness would run roughly 5–15 times a day.

## Daily vs per PR

| | Nightly (on `main`) | Per PR |
|---|---|---|
| Cost, Housing only | ~$4–8/day | ~$20–120/day |
| Cost, all categories | ~$40–80/day | not viable |
| Attribution | Batches a day's merges (up to 6); a regression needs bisecting | Pins a regression to one change |
| Relevance | Every run tests the real `main` | Most PRs (frontend, migrations, docs) cannot change answer quality, yet would pay for a run |
| Noise | Trend over many runs smooths model non-determinism | 1–2 repeats per PR: a score difference is mostly noise, and a noisy gate gets ignored (the same reasoning as ADR 0007) |
| Feedback time | Next morning | 60 model calls, each running web searches, block the PR for tens of minutes |
| Secrets | Only reviewed code on `main` touches model keys | Keys are exposed to PR workflows. Anyone who can push a branch can edit the harness to print them. Fork PRs get no secrets at all, so the run would just fail |
| External drift | Detects source/web changes even when code is unchanged | Mixes web drift into the code diff |
| Rate limits | One burst at 00:05 UTC | Bursts during working hours, on the same keys developers use |

## Recommendation

**Now (pre-launch, dev):**
1. **Fix the nightly first.** Install the eval workspace member (e.g.
   `uv sync --locked --package moving-assistant-eval`). Point it at `app.gateway`,
   so it measures the product rather than a parallel script. Log every call to
   `eval_cost_log`.
2. Nightly full run on `main`, **report-only**, plus `workflow_dispatch` so DS can
   trigger it while iterating.
3. **No per-PR full run.** At most, a path-filtered smoke run (≈5 questions, 1
   repeat) when `api/app/gateway/**` or the gold set changes, also report-only.
4. **Gate nothing** until the judge and rubric are validated against human scores
   (DS #3, week 3). Gating on an unvalidated judge would block merges for the wrong
   reasons.

**After launch:**
1. **Per-PR gated run, path-filtered** to changes that can affect answers: prompts,
   model config, retrieval, gold sets. It runs against the gold set with the chosen
   judge, with per-dimension thresholds and a repeat count sized from measured
   variance. Put it behind a GitHub Environment with a required reviewer, so model
   keys never reach unreviewed code.
2. **Nightly full run, all categories, on `main`.** This catches source drift and
   provider-side model changes that no PR introduced. It alerts rather than blocks.
3. **A new `PROMPT_VERSION` passes the full harness before it is switched on**
   (ADR 0012).

## Open
- The per-call token counts above are assumptions. Once DS #1's Sonnet runs log to
  `eval_cost_log`, re-price this table from real rows.
- `api/app/gateway/shared.py` prices Sonnet 4.6 at a `(0.0, 0.0)` placeholder, so
  any cost computed through it reads $0. That includes `/ai/answer`'s
  `estimated_cost_usd`. Fix the placeholder before re-pricing this table from real
  rows.
- With gold datasets in place, does CI still need live web search? The week 3 doc
  suggests not ("just reasoning capabilities"). If so, per-PR cost falls sharply,
  and so does the cost of the after-launch per-PR run.

