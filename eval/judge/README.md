# LLM judge

The judge that grades our live answers against the approved gold answers.

## Where it comes from

Gabriel's judge pipeline, which picked GLM-5.3 Flash as the judge by checking
which candidate notices when a gold answer has been made worse. These files
are copied from it unchanged:

- `pairwise_config.py`: the pairwise prompt, "is Answer A or B better under the rubric"
- `rubric_config.py`: the 8 rubric dimensions, the failure flags, the rubric loader
- `rubrics.md`: the team rubric
- `deepinfra_client.py`: the GLM client
- `data/<category>/qa_cases.json`: the gold cases (question, approved answer,
  expected classification, reviewer expectations, and the user profile for Housing)

Not copied: the variant builders, the judge-selection runs and their results,
the analysis scripts and the source documents. Those live in Gabriel's
`judge_pipeline` and are only needed to re-run the judge selection.

## What the check does

`scripts/ai_judge_check.py` takes the first N clear, single-turn gold cases per
category (Housing, Finance, Work, Education & Family). For each one it asks the
real `/ai/answer` the gold question, with the gold profile for Housing, using
the same router and category-prompt switches as staging. GLM then compares our
answer with the gold answer twice, with the order swapped, because judges
favour a position.

| Result | Meaning | Fails the run? |
|---|---|---|
| PASS | Ours is better or equivalent in both orders | No |
| MIXED | The two orders disagree | No |
| WORSE | Gold is better overall in both orders, but not on the facts | No |
| FAIL | Gold wins on Correctness or Jurisdiction & Eligibility in both orders, a Critical flag on our answer, no answer, an unreadable judge reply, or a judge call that errors or takes over 120 seconds (only the error type is shown) | Yes |
| SKIP | The router asked a clarifying question, so the answer model didn't run | No, unless every case is skipped |

Gold answers are hand-reviewed best versions, so losing to gold overall now
and then is expected. That's why only a loss on the facts fails the run.

## How to run it

On GitHub: Actions, then "LLM judge check", then Run workflow, and choose the
cases per category. It uses the same router and category-prompt switches as
staging; keep them in step with staging when those change. The results table
is in the run's summary. It needs the `ANTHROPIC_API_KEY` and
`DEEPINFRA_API_KEY` repo secrets.

Locally, from `api/`:

```bash
export ANTHROPIC_API_KEY=... DEEPINFRA_API_KEY=...
export ROUTER_ENABLED=true CATEGORY_PROMPTS_ENABLED=true
export CATEGORY_PROMPT_CATEGORIES="Work,Finance,Education & Family,Housing"
uv run python ../scripts/ai_judge_check.py
```

`AI_JUDGE_PER_CATEGORY=3` judges 3 cases per category.

## Cost and limits

- About $0.60 per run at 1 case per category, mostly the four live answers.
- Live answers vary from run to run, so one case per category is a signal, not
  a verdict. Use 3 or more per category before deciding anything.
- Finance, Work and Education & Family gold cases have no profile, so the
  context dimension isn't really tested there.
- Gemini isn't used: on its free tier Google may train on the prompts, and the
  Housing cases include profile details.

