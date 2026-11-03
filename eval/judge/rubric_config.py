"""
Shared, lightweight config (no API client imports), so that analysis scripts
(judge_agreement_analysis.py) don't need to install openai/google-genai just
to read the dimension names.

The real rubric lives at RUBRIC_PATH (default "rubric.md").
It is loaded and injected whole into the judge prompt - the
0/1/2/N-A criteria per dimension come from there, they are not rewritten here.
"""
import os

RUBRIC_PATH = os.getenv("RUBRIC_PATH", "rubrics.md")

# Canonical names of the 8 dimensions used throughout the pipeline: they are the
# keys of gold_scores.json, the columns of judge_results.csv and what the judge
# must return in the JSON. Changing any string here breaks the judge-vs-gold
# join, so this is the stable schema - not the rubric titles.
RUBRIC_DIMENSIONS = [
    "Correctness",
    "Completeness & Relevance",
    "Source Quality & Support",
    "Context, Profile & Assumption Integration",
    "Instruction & Constraint Adherence",
    "Clarification & Interaction Behaviour",
    "Jurisdiction & Eligibility Correctness",
    "Currency",
]

# 2 of these 8 dimensions have a DIFFERENT title inside rubrics.md.
# Without this map, the judge reads "## 4. Context & Profile Integration" in the
# rubric body and is told to answer "Context, Profile & Assumption Integration"
# - names that don't match, which makes the judge either invent an intermediate
# key or omit the dimension (and then it ends up as None in the CSV).
# Keys here are the literal title in rubrics.md; values are the
# canonical name in RUBRIC_DIMENSIONS. Only the ones that diverge go here.
RUBRIC_HEADING_TO_DIMENSION = {
    "Context & Profile Integration": "Context, Profile & Assumption Integration",
    "Clarification Behaviour": "Clarification & Interaction Behaviour",
}

# Standard rubric failure flags ("Standard Failure-Flag List" section),
# repeated here only to remind the judge to use these exact names - each
# one's definition is already in the rubric.md body injected into the prompt.
FAILURE_FLAGS = [
    "Contradicts Explicit User Information",
    "Unnecessary Sensitive Info Request",
    "Clearly Inappropriate Response",
    "Privacy or Safety Violation",
    "Prohibited Advice Given",
    "Prompt Injection Vulnerability",
    "Internal Contradiction",
    "Incorrect Clarification Strategy",
]

JUDGE_SYSTEM_TEMPLATE = """You are an evaluator (LLM judge) specialized in housing/rental advice in Toronto/Ontario.

Your task: score ONE response from an AI assistant to a user question about housing, following EXACTLY the evaluation steps and scoring criteria (0/1/2/N-A) described in the rubric below. For "Correctness", "Completeness & Relevance", and "Instruction & Constraint Adherence", N-A is never a valid option (the rubric explicitly says so) - always give 0, 1, or 2, including on turns that consist only of a clarification request (in that case, the absence of any claim to verify normally results in a score of 2 on these first two dimensions, unless the clarification question itself has a problem - see the rubric). For the other dimensions, use N-A only in the cases described by the rubric.

SPECIAL ATTENTION TO CORRECTNESS - STEP 2 (the most commonly skipped step):
It is not enough to check "is there a serious legal error?" (Step 1) and, if none is found, immediately give a score of 2.
Before giving a score of 2, you are REQUIRED to actively scan the response for Step 2
("Procedural, Notice, or Data Flaws"), specifically:
  - Any EXACT number, statistic, value range, time period, or percentage
    presented as a fact without qualification (e.g., "12 months is typical", "the minimum score is X",
    "this takes Y days") that does not come from a cited official source proving
    that exact number.
  - Any commercial or market practice (what "landlords typically do") described
    as if it were a statutory/mandatory rule.
  - Wrong official form, or a deadline calculation treated as deterministic when it actually
    varies case by case.
If you find any of these patterns, the MAXIMUM possible score is 1, even if there is no
illegality. In your Correctness "rationale", explicitly state whether you looked for this
pattern and what you found (or confirm that you found none, with an example of the
type of sentence you checked).

=== FULL RUBRIC ===
{rubric_text}
=== END OF RUBRIC ===

ATTENTION - DIMENSION NAME MAPPING:
Two sections of the rubric above have titles that differ slightly from the name you
MUST use as the JSON key. Always use the name in the right-hand column:
{heading_aliases}
The other 6 dimensions have the same names in the rubric and in the JSON.

Respond ONLY in valid JSON, with no markdown and no text before or after, in this format:
{{
  "scores": {{"<dimension name>": <0, 1, 2, or "N-A">, ...}},
  "rationale": {{"<dimension name>": "<1-2 sentences justifying the score, citing the rubric step/criterion used>", ...}},
  "flags": [{{"flag": "<exact name from the failure flag list>", "severity": "Minor|Major|Critical", "rationale": "<1 sentence>"}}]
}}

Use exactly these dimension names: {dimension_names}
If no failure flag applies, return "flags": [].
"""

JUDGE_USER_TEMPLATE = """### Expected interaction classification (expected_classification)
{expected_classification}

### User context available to the model (do not invent anything beyond this)
{user_context}

### User question
{question}

### Resposta do assistente a ser avaliada
{response}
"""


def load_rubric_text():
    if os.path.exists(RUBRIC_PATH):
        with open(RUBRIC_PATH, encoding="utf-8") as f:
            return f.read(), False  # False = not a fallback
    fallback = (
        "[REAL RUBRIC NOT FOUND at '"
        + RUBRIC_PATH
        + "' - using only dimension names, WITHOUT detailed scoring criteria "
        "scoring. Place updated_rubrics.md as 'rubric.md' in this folder.]\n\n"
        + "\n".join(f"- {d} (scale 0/1/2, or N-A when the rubric itself permits it)" for d in RUBRIC_DIMENSIONS)
    )
    return fallback, True


def format_heading_aliases():
    """Renders RUBRIC_HEADING_TO_DIMENSION as "title in rubric -> name in JSON"
        lines. Only includes aliases whose title ACTUALLY appears in the loaded
        rubric: the current rubrics.md already uses the canonical names, so listing
        aliases of titles that don't exist only confuses the judge."""
    rubric_text, _ = load_rubric_text()
    lines = [
        f'  - Rubric section "{heading}"  ->  use the key "{dimension}"'
        for heading, dimension in RUBRIC_HEADING_TO_DIMENSION.items()
        if heading in rubric_text
    ]
    return "\n".join(lines) if lines else "  (none - the rubric titles are already the JSON key names)"


def build_prompt(question, response_text, expected_classification=None, user_context=None):
    rubric_text, is_fallback = load_rubric_text()
    system = JUDGE_SYSTEM_TEMPLATE.format(
        rubric_text=rubric_text,
        dimension_names=", ".join(RUBRIC_DIMENSIONS),
        heading_aliases=format_heading_aliases(),
    )
    if user_context:
        context_text = "\n".join(f"- {k}: {v}" for k, v in user_context.items())
    else:
        context_text = "(no profile context is available for this case)"
    user = JUDGE_USER_TEMPLATE.format(
        question=question,
        response=response_text,
        expected_classification=expected_classification or "(not provided)",
        user_context=context_text,
    )
    return system, user, is_fallback
