import argparse
import json
from operator import add
import os
import re
import time
import uuid
from datetime import date, datetime, timezone

from dotenv import load_dotenv

from eval.harness.test_cases_housing_30 import test_cases

try:
    from supabase import create_client
except ImportError:
    create_client = None

try:
    from anthropic import Anthropic
except ImportError:
    Anthropic = None


load_dotenv()

# -----------------------------------------------------------------------------
# V8 scope and execution configuration
# -----------------------------------------------------------------------------

ACTIVE_PROMPT_VERSION = "production-v8"
ARCHITECTURE_VERSION = "two_stage_router_answer_v2"
SEARCH_MODE = "claude_native_open_web"

# Intentionally one run per case. This harness does not do 3x/10x repeats.
REPEATS_PER_QUESTION = 1
USE_REAL_MODEL = os.getenv("HOUSING_USE_REAL_MODEL", "1") != "0"
MAX_REPAIR_ATTEMPTS = 0

MODEL_NAME = os.getenv("HOUSING_ANSWER_MODEL", "claude-sonnet-4-6")
ROUTER_MODEL_NAME = os.getenv("HOUSING_ROUTER_MODEL", MODEL_NAME)
MODEL_PROVIDER = "anthropic" if USE_REAL_MODEL else "local-test"

ROUTER_MAX_TOKENS = 1000

# Optional reproducibility override. Example: CURRENT_SYSTEM_DATE=2026-09-13
CURRENT_SYSTEM_DATE_OVERRIDE = os.getenv("CURRENT_SYSTEM_DATE")

PRICING_PER_1M_TOKENS = {
    "claude-sonnet-4-6": (3.00, 15.00),
}

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
anthropic_client = None
if Anthropic is not None and ANTHROPIC_API_KEY:
    anthropic_client = Anthropic(api_key=ANTHROPIC_API_KEY)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase_client = None
if create_client is not None and SUPABASE_URL and SUPABASE_KEY:
    supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)

# High-signal V7 regression slice. These are the cases that exposed the primary
# failures we are fixing here: routing, profile assumptions, and high-impact
# legal/current-fact errors. Source-provider/domain experiments are deliberately
# NOT implemented in this file; those remain a separate retrieval workstream.
V7_PRIMARY_FAILURE_CASE_IDS = (
    "HOUSING_002_LANDLORD_PRIORITIES_PR",
    "HOUSING_005_MANAGED_VS_INDIVIDUAL_PETS",
    "HOUSING_006_BREAK_LEASE_ASSIGNMENT",
    "HOUSING_007_TIMING_HOUSING_SEARCH_FAR_FUTURE",
    "HOUSING_008_TEMP_VS_LONG_TERM_FAMILY",
    "TQ2_INSPECTION_CHECKLIST",
    "TQ3_REALTOR_VS_PM_VS_P2P",
    "TQ5_AFFORDABLE_CONVENIENT_MULTITURN",
    "TQ8_ALONE_OR_SHARE",
    "TQ10_TENANT_INSURANCE",
    "TQ11_FAMILY_BUDGET_ONE_INCOME",
    "TQ12_DOWNTOWN_VS_OUTSIDE_COST",
    "TQ13_BUDGET_2000_TYPES_AREAS",
    "TQ15_TORONTO_VS_GTA_FAMILY",
    "TQ16_LISTING_MISMATCH_MAINTENANCE",
    "TQ17_HOW_TO_BUY_A_HOUSE",
    "TQ19_INDIA_FAMILY_PR_DETAILED",
    "TQ20_CHINA_STUDENT_DETAILED",
)


# -----------------------------------------------------------------------------
# Canonical high-risk facts from V7 failures
#
# These are prompt guardrails, not a retrieval system. We deliberately do not
# maintain allowed-domain lists, source tiers, Tavily logic, or restricted-search
# policy here. The answer still uses Claude native open-web search and preserves
# citations so the separate retrieval/evaluation workstream can assess them.
# -----------------------------------------------------------------------------

CANONICAL_FACTS = {
    "ontario_rent_guideline_2026": {
        "fact": (
            "Ontario's 2026 rent increase guideline is 2.1%. Do not use 2.5% "
            "as the 2026 guideline, and do not project the 2026 guideline into 2027."
        ),
        "official_source": "Government of Ontario",
        "effective": "2026",
        "triggers": [
            "rent increase",
            "rent guideline",
            "rent control",
            "rent-controlled",
            "rent controlled",
        ],
    },
    "toronto_mat_2026": {
        "fact": (
            "Toronto's temporary 8.5% Municipal Accommodation Tax rate ended on "
            "August 1, 2026. The current MAT rate from that date is 6%. Do not infer "
            "federal HST treatment from the municipal MAT threshold."
        ),
        "official_source": "City of Toronto",
        "effective": "2026-08-01",
        "triggers": [
            "municipal accommodation tax",
            "accommodation tax",
            "short-term",
            "short term",
            "temporary housing",
            "hotel",
            "airbnb",
        ],
    },
    "etobicoke_is_toronto": {
        "fact": (
            "Etobicoke is within the amalgamated City of Toronto. Do not describe "
            "Etobicoke as outside Toronto for municipal land-transfer-tax analysis."
        ),
        "official_source": "City of Toronto",
        "effective": "current",
        "triggers": [
            "etobicoke",
            "land transfer tax",
            "municipal land transfer tax",
            "mltt",
            "buy a house",
            "buying a house",
        ],
    },
    "copr_vs_pr_status": {
        "fact": (
            "A Confirmation of Permanent Residence is used to complete the permanent-"
            "residence process. Do not state that PR status generally begins merely "
            "when a COPR is issued abroad."
        ),
        "official_source": "Immigration, Refugees and Citizenship Canada",
        "effective": "current",
        "triggers": [
            "copr",
            "confirmation of permanent residence",
            "permanent resident status",
            "pr status",
            "buy a house",
            "buying a house",
        ],
    },
    "assignment_n9_timing": {
        "fact": (
            "For the RTA assignment-refusal route, distinguish an immediate refusal "
            "of consent to assignment in principle from a failure to respond. An "
            "immediate refusal does not require waiting seven days; seven days is the "
            "no-response branch. Verify the current LTB instructions before giving "
            "procedural directions."
        ),
        "official_source": "Tribunals Ontario / Landlord and Tenant Board",
        "effective": "current",
        "triggers": [
            "assignment",
            "assign my lease",
            "break lease",
            "break my lease",
            "get out of the lease",
            "lease legally",
            "just leave",
            "n9",
        ],
    },
    "n11_mutual_agreement": {
        "fact": (
            "A landlord and tenant can agree to end a tenancy. Form N11 is the LTB "
            "Agreement to End the Tenancy form and is a strong written way to record "
            "the agreement, but do not say every mutual termination legally must be "
            "formalized on N11 unless current official guidance requires that."
        ),
        "official_source": "Tribunals Ontario / Landlord and Tenant Board",
        "effective": "current",
        "triggers": [
            "n11",
            "mutual agreement",
            "break lease",
            "get out of the lease",
            "end the tenancy",
        ],
    },
    "rta_shared_facilities_exception": {
        "fact": (
            "Do not say all private-market renters have identical RTA coverage. RTA "
            "coverage has exclusions, including certain owner-shared kitchen/bathroom "
            "arrangements. Verify coverage before making categorical rights statements."
        ),
        "official_source": "Ontario Residential Tenancies Act",
        "effective": "current",
        "triggers": [
            "individual owner",
            "private landlord",
            "basement apartment",
            "shared kitchen",
            "shared bathroom",
            "managed building",
        ],
    },
    "rentsafeto_threshold": {
        "fact": (
            "RentSafeTO registration applies to apartment buildings with at least "
            "three storeys and at least ten units. Do not simplify this to all "
            "buildings with three or more units."
        ),
        "official_source": "City of Toronto",
        "effective": "current",
        "triggers": ["rentsafeto", "managed building", "apartment building"],
    },
    "ohrc_rental_screening": {
        "fact": (
            "Ontario human-rights guidance says lack of rental or credit history should "
            "not be viewed negatively, and rigid rent-to-income cutoffs are not an "
            "appropriate universal private-rental screening rule. Do not present a "
            "40x-rent or fixed rent-to-income threshold as a legal or universal rule."
        ),
        "official_source": "Ontario Human Rights Commission",
        "effective": "current",
        "triggers": [
            "landlord",
            "rental application",
            "credit history",
            "income",
            "screening",
            "40x",
            "40x rent",
            "30%",
            "rent-to-income",
            "rent to income",
        ],
    },
    "cmhc_newcomer_credit": {
        "fact": (
            "CMHC newcomer mortgage-insurance guidance allows alternative credit "
            "evidence in applicable cases. Do not invent a blanket requirement for "
            "three months, 12 months, or 12-24 months of Canadian credit/tax history."
        ),
        "official_source": "Canada Mortgage and Housing Corporation",
        "effective": "current",
        "triggers": [
            "mortgage",
            "buy a house",
            "buying a house",
            "home purchase",
            "newcomer mortgage",
            "canadian credit history",
        ],
    },
    "ttc_line5_2026": {
        "fact": (
            "TTC Line 5 Eglinton began a phased start to service on February 8, 2026. "
            "If its status is material, verify against current TTC information."
        ),
        "official_source": "Toronto Transit Commission",
        "effective": "2026-02-08",
        "triggers": ["line 5", "eglinton crosstown", "eglinton line"],
    },
}


# -----------------------------------------------------------------------------
# Router prompt: no web, no Housing-answer prompt, JSON only
# -----------------------------------------------------------------------------

ROUTER_INSTRUCTION = r"""
You are the routing layer for a Toronto/Ontario newcomer Housing assistant.
Your only job is to decide whether the assistant can answer now or must first
ask one bundled clarification. Do NOT research, browse, answer the Housing
question, provide legal advice, estimate prices, or add substantive guidance.

Return ONLY one JSON object using exactly this schema:
{
  "classification": "clear|ambiguous|some_info_known|loaded",
  "should_answer_now": true,
  "missing_blockers": ["..."],
  "material_unknowns": ["..."],
  "classification_rationale": "one concise sentence",
  "clarification_heading": "short heading, only needed if ambiguous",
  "clarification_intro": "one concise sentence, only needed if ambiguous",
  "clarification_items": ["short item", "short item"]
}

ACTION-FIRST DEFINITIONS
- clear: one determinate task; existing user/profile context is sufficient for a
  useful direct answer. Background or stated intent is not a second ask. The
  answer may correct a mistaken premise without making the question loaded.
- ambiguous: one or more missing user-specific or external details could
  materially change/reverse the recommendation, make the requested answer
  unusable, or force guessing an important location/provider/property/problem
  detail. Ask before answering.
- some_info_known: enough information exists for the core answer now. Missing
  information would refine/narrow the answer but should not materially reverse
  the direction. The answer may state conditions and may ask at most one useful
  follow-up after answering.
- loaded: the user requests two or more DISTINCT deliverables/sub-questions and
  they can be answered meaningfully from current context. Merely comparing
  several alternatives inside ONE decision is NOT loaded.

- A broad end-to-end "how do I..." request can be loaded even when phrased as
  one sentence if answering it naturally requires several distinct consequential
  stages or deliverables, such as eligibility, financing, taxes/fees, and
  transaction steps.
- Use clear when the user's actual question can be answered completely without
  needing additional personal facts, even if optional preferences could make the
  answer more tailored.
- Use some_info_known when existing user/profile context materially shapes the
  answer and additional unknown personal facts remain relevant but non-blocking.
  Do not use some_info_known merely because optional personalization is possible.

BOUNDARY TEST
Ask: "If I learn the missing fact, could it materially change which option,
location, action, or remedy I recommend?" If yes, classify ambiguous. If the
missing fact mostly changes precision or the size of a rough range, use
some_info_known.

ANSWER-NOW VS CLARIFY DISCIPLINE
- A missing detail is a blocker only when a useful core answer cannot be given
  without guessing something that could materially change the user's next action.
- Do NOT block merely because more information would improve precision,
  personalization, ranking, price range, or neighbourhood fit. In those cases,
  use some_info_known and answer conditionally.
- General comparisons, search-channel questions, rough cost comparisons, and
  directional recommendations should normally be answered now when the main
  trade-offs can be explained without inventing user facts.
- Do not ask for information already entailed by the user's wording. For example,
  a question explicitly about rental channels should not trigger a rent-vs-buy
  clarification.
- Interpret the user's actual requested object carefully. "Where should I
  look/search for apartments or listings?" is about search sources/channels
  unless the user explicitly asks which neighbourhood/area they should live in.
- For rough cost questions, missing details that only change the size of the
  range are non-blocking. Exact personalized quotes may require clarification.

MULTI-TURN DISCIPLINE
- After the user answers the primary blocker from the previous turn, do not
  promote a previously secondary refinement into a new blocker unless that
  missing fact truly makes the answer unusable or could reverse the next action.
- Prefer answering with conditional branches plus at most one follow-up over
  repeatedly withholding the answer.
- Do not serially interrogate the user. Once the user has supplied the main
  decision anchor from the previous clarification, answer if the remaining
  unknowns can be handled with conditional ranges, tiers, or branches.
- A missing scalar preference such as budget, commute-time tolerance, unit size,
  or exact price ceiling is usually a refinement rather than a blocker once the
  main location/task constraints are known. Give a useful conditional answer
  and optionally ask one follow-up at the end.

WHEN CLARIFICATION REALLY IS REQUIRED
- Clarify when the user's stage in a process materially changes the checklist,
  rights, remedy, or next action. Examples of materially different stages include
  researching/viewing vs. signing vs. already moved in.
- For problem/remedy questions, clarify first when the nature or severity of the
  problem determines which legal, safety, contractual, or procedural path applies.
- Do not use these rules merely because more detail would improve an otherwise
  useful answer. The missing fact must materially change the recommended action.
- For legal, safety, payment, or remedy questions, clarification is mandatory
  when the missing facts could change whether the user should take or avoid a
  consequential action. In particular, do not choose between fraud/non-tenancy
  remedies and active-tenancy remedies until the facts needed to distinguish
  them are known.

Important adjudication rules:
- "What happens if I leave?" AND "How do I exit legally?" is loaded when both
  are answerable from existing context.
- A definitional comparison PLUS a personalized recommendation is loaded.
- "Which of these several channels/options should I use?" is one comparison
  decision, not automatically loaded.
- A general tenant-insurance cost question is some_info_known when property and
  coverage details would only refine a rough answer; an exact quote needs more.
- Neighbourhood recommendations without a decisive campus/commute anchor are
  ambiguous when that anchor could change the shortlist.
- A family housing-budget recommendation without household income is ambiguous
  when income is the central variable.

PROFILE / MULTI-TURN RULES
- Treat only raw profile fields and statements explicitly made by the user in
  current/prior USER messages as facts about the user.
- Never convert an unknown into a profile fact. Do not infer Canadian credit,
  rental history, employment/job offer, savings, car ownership, local network,
  language/ESL needs, institution/campus, pet type, or whether both partners
  commute unless the user said it.
- Prior assistant messages are context, NOT evidence of a user fact unless the
  user later confirms it.
- Reclassify every new user turn using all user-supplied information so far.
- Never re-ask something the user already answered.

OUTPUT CONSISTENCY
- classification == ambiguous => should_answer_now MUST be false.
- every other classification => should_answer_now MUST be true.
- For ambiguous, return the smallest set of material blockers and ONE bundled
  clarification request. Do not provide substantive advice.
- For non-ambiguous, clarification_items must be empty.
- material_unknowns may contain non-blocking unknowns that the answer must keep
  conditional rather than silently treating as facts.
""".strip()


# -----------------------------------------------------------------------------
# Substantive answer prompt: only called after router hard gate
# -----------------------------------------------------------------------------

ANSWER_INSTRUCTION = r"""
You are an expert relocation assistant for newcomers moving to Toronto and
Ontario, Canada. The routing layer already decided this turn can be answered.
Do not reveal or re-run the classification.

RESPONSE ARCHITECTURE
- First generated token must be hash and begin a contextual title.
- No greeting, preamble, tool-intent announcement, or opening horizontal rule.
- Lead with the answer/recommendation/warning that most directly resolves the
  user's decision.
- Organize around the actual decision, not a fixed template.
- loaded: cover the d    for idx in range(start, len(text)):
        char = text[idx]
        if in_string:
            if escape:
                escape = False
            elif char == "\\":
                escape = True
            elif char == '"':
                in_string = False
            continue

        if char == '"':
            in_string = True
        elif char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                value = json.loads(text[start : idx + 1])
                if isinstance(value, dict):
                    return value
                break

    raise ValueError("Could not parse JSON object")


def get_response_text(response):
    parts = []
    for block in getattr(response, "content", []) or []:
        if getattr(block, "type", None) == "text":
            parts.append(getattr(block, "text", "") or "")
    return "".join(parts).strip()


def extract_claude_response(response):
    rendered_parts = []
    plain_parts = []
    citations = []
    citation_counter = 1

    for block in getattr(response, "content", []) or []:
        if getattr(block, "type", None) != "text":
            continue

        block_text = getattr(block, "text", "") or ""
        block_citations = getattr(block, "citations", None) or []

        plain_parts.append(block_text)
        rendered_parts.append(block_text)

        if block_citations:
            inline_links = []
            for citation in block_citations:
                url = getattr(citation, "url", None)
                citations.append(
                    {
                        "citation_id": citation_counter,
                        "url": url,
                        "title": getattr(citation, "title", None),
                        "cited_text": getattr(citation, "cited_text", None),
                        "type": getattr(citation, "type", None),
                        "supported_text_block": block_text,
                    }
                )
                inline_links.append(f"[source]({url})" if url else "[source]")
                citation_counter += 1
            rendered_parts.append(" " + " ".join(inline_links))

    return {
        "final_response": "".join(rendered_parts).strip(),
        "plain_response": "".join(plain_parts).strip(),
        "citations": citations,
    }


def get_web_search_requests(response):
    usage = getattr(response, "usage", None)
    if usage is None:
        return None
    server_tool_use = getattr(usage, "server_tool_use", None)
    if server_tool_use is None:
        return None
    return getattr(server_tool_use, "web_search_requests", None)


def sum_optional_counts(*values):
    present = [value for value in values if value is not None]
    if not present:
        return None
    return sum(present)


def add_turn_to_citations(citations, turn_number):
    return [{"turn": turn_number, **citation} for citation in (citations or [])]


def max_answer_tokens(classification):
    if classification == "loaded":
        return 3600
    return 2600


# -----------------------------------------------------------------------------
# Canonical fact selection + local lints
# -----------------------------------------------------------------------------


def select_canonical_facts(question, context, transcript=None):
    transcript = transcript or []
    combined = " ".join(
        [
            question or "",
            json.dumps(context, ensure_ascii=False),
            *[
                str(turn.get("content", ""))
                for turn in transcript
                if turn.get("role") == "user"
            ],
        ]
    ).lower()

    # Keep this tiny. The 2026 rent guideline is a known high-risk/current fact
    # that the model may introduce while discussing rental affordability even
    # when the user did not explicitly ask about rent control.
    always_on_fact_ids = {
        "ontario_rent_guideline_2026",
    }

    selected = {}

    for fact_id, payload in CANONICAL_FACTS.items():
        triggers = [trigger.lower() for trigger in payload.get("triggers", [])]

        if fact_id in always_on_fact_ids or any(
            trigger in combined for trigger in triggers
        ):
            selected[fact_id] = {
                key: value
                for key, value in payload.items()
                if key != "triggers"
            }

    return selected


def deterministic_lint(answer, current_date_str):
    answer = answer or ""
    lower = answer.lower()
    issues = []

    def add(code, message, severity="high"):
        issues.append(
            {
                "code": code,
                "severity": severity,
                "message": message,
            }
        )

    try:
        current_date = date.fromisoformat(current_date_str)
    except Exception:
        current_date = None

        if current_date is None or current_date.year == 2026:
            for sentence in re.split(r"(?<=[.!?])\s+|\n+", lower):
                if "2.5%" not in sentence:
                    continue

                if "2026" not in sentence:
                    continue

                if not re.search(
                    r"\b(guideline|rent increase|rent cap|rent control|rent-controlled)\b",
                    sentence,
                ):
                    continue

                add(
                    "WRONG_2026_RENT_GUIDELINE",
                    "The answer uses 2.5% as the 2026 Ontario rent guideline; use 2.1% for 2026.",
                )
                break

    if "8.5%" in answer and (
        "municipal accommodation tax" in lower or re.search(r"\bmat\b", lower)
    ):
        if current_date is None or current_date >= date(2026, 8, 1):
            for sentence in re.split(r"(?<=[.!?])\s+|\n+", lower):
                if "8.5%" not in sentence:
                    continue

                if not (
                    "municipal accommodation tax" in sentence
                    or re.search(r"\bmat\b", sentence)
                ):
                    continue

                # Historical/correct references to the temporary rate are fine.
                if re.search(
                    r"\b("
                    r"ended|expired|no longer|previous|former|"
                    r"temporary[^.\n]{0,80}ended|"
                    r"reduced from|changed from"
                    r")\b",
                    sentence,
                ):
                    continue

                add(
                    "STALE_TORONTO_MAT",
                    "The answer presents 8.5% as current Toronto MAT after "
                    "2026-08-01; current guardrail is 6%.",
                )
                break

    if "etobicoke" in lower:
        bad_patterns = (
            r"etobicoke[^.\n]{0,100}(?:outside|not in|outside of)[^.\n]{0,60}toronto",
            r"outside[^.\n]{0,60}toronto[^.\n]{0,100}etobicoke",
        )

        if any(re.search(pattern, lower) for pattern in bad_patterns):
            add(
                "ETOBICOKE_JURISDICTION",
                "Etobicoke is within the City of Toronto; do not exclude it from Toronto municipal-tax jurisdiction.",
                "critical",
            )

    if "copr" in lower or "confirmation of permanent residence" in lower:
        bad_copr = re.search(
            r"(?:become|became|are|status (?:starts|begins)|pr status (?:starts|begins))"
            r"[^.\n]{0,120}(?:copr|confirmation of permanent residence)"
            r"[^.\n]{0,100}(?:issued|issuance)",
            lower,
        )

        if bad_copr:
            add(
                "COPR_STATUS_TIMING",
                "Do not equate COPR issuance abroad with the point at which PR status necessarily begins.",
                "critical",
            )

    if "assignment" in lower or "assign" in lower:
        for sentence in re.split(r"(?<=[.!?])\s+|\n+", lower):
            if (
                "refus" in sentence
                and "wait" in sentence
                and ("7 day" in sentence or "seven day" in sentence)
            ):
                add(
                    "ASSIGNMENT_REFUSAL_WAIT",
                    "An immediate refusal of assignment in principle should not be described as requiring a seven-day wait.",
                )
                break

    if "rentsafeto" in lower and re.search(
        r"(?:three|3)\s*(?:\+|or more)?\s*units",
        lower,
    ):
        add(
            "RENTSAFETO_THRESHOLD",
            "Do not simplify RentSafeTO to three-or-more units; the guardrail includes at least three storeys and at least ten units.",
        )

    if re.search(r"\b2024\s+census\b", lower):
        add(
            "FABRICATED_2024_CENSUS",
            "Do not cite '2024 Census data' as a released Canadian census dataset.",
        )

    if re.search(r"12\s*[-]\s*24\s+months", lower) and (
        "canadian credit" in lower or "mortgage" in lower or "lender" in lower
    ):
        add(
            "BLANKET_MORTGAGE_HISTORY_REQUIREMENT",
            "Do not assert a blanket 12-24 month Canadian credit/tax-history requirement for newcomer mortgages.",
            "critical",
        )

    # Catch affirmative use of a rigid 40x-rent screening rule,
    # but do not flag sentences that explicitly reject that rule.
    for sentence in re.split(r"(?<=[.!?])\s+|\n+", lower):
        if not re.search(r"\b40\s*x\b", sentence):
            continue

        if not (
            "rent" in sentence
            or "landlord" in sentence
            or "qualif" in sentence
            or "screen" in sentence
        ):
            continue

        if re.search(
            r"\b("
            r"illegal|not legal|not lawful|"
            r"should not|shouldn't|must not|mustn't|"
            r"cannot|can't|do not|don't|"
            r"not a universal|not an? (?:eligibility|screening) rule|"
            r"not required|not mandatory"
            r")\b",
            sentence,
        ):
            continue

        add(
            "RIGID_RENT_INCOME_SCREEN",
            "Do not present a 40x-rent threshold as a universal or legally valid Ontario rental-screening rule.",
            "critical",
        )
        break

    for sentence in re.split(r"(?<=[.!?])\s+|\n+", lower):
        if not re.search(r"\b30\s*%", sentence):
            continue

        if not (
            "screen" in sentence
            or "qualif" in sentence
            or "landlord" in sentence
            or "rent-to-income" in sentence
            or "rent to income" in sentence
        ):
            continue

        # Safe/critical statements rejecting a rigid threshold should not trigger.
        if re.search(
            r"\b("
            r"illegal|not legal|not lawful|"
            r"should not|shouldn't|must not|mustn't|"
            r"cannot|can't|do not|don't|"
            r"not a universal|not an? (?:eligibility|screening) rule|"
            r"not required|not mandatory"
            r")\b",
            sentence,
        ):
            continue

        add(
            "RIGID_30_PERCENT_SCREEN",
            "Do not present a rigid 30% rent-to-income cutoff as a universal Ontario landlord eligibility rule.",
            "critical",
        )
        break

    if "506" in lower and "union" in lower and (
        "direct" in lower or "goes to union" in lower or "to union station" in lower
    ):
        add(
            "TTC_506_UNION_ROUTE",
            "Verify any claim that the 506 streetcar provides a direct Union Station trip.",
        )

    if re.search(r"core legal rights (?:are|remain) identical", lower):
        add(
            "OVERBROAD_IDENTICAL_RTA_RIGHTS",
            "Do not say core legal rights are categorically identical across all private rental arrangements; RTA coverage has exceptions.",
        )

    if re.search(
        r"(?:must|required to)\s+(?:use|sign|formalize)[^.\n]{0,80}\bn11\b",
        lower,
    ):
        add(
            "MANDATORY_N11_OVERSTATEMENT",
            "Do not state that every mutual early termination legally must use Form N11.",
        )

    if re.search(
        r"(?:signed|sign(?:ed)?)\s+(?:standard\s+)?lease"
        r"[^.\n]{0,100}before[^.\n]{0,80}"
        r"(?:pay|send|transfer)[^.\n]{0,50}"
        r"(?:deposit|money)",
        lower,
    ):
        add(
            "LEASE_BEFORE_PAYMENT_OVERSTATEMENT",
            "Do not present a signed lease as a universal statutory prerequisite to every lawful rent deposit; label delay/verification as safety advice.",
        )

    if re.search(r"30\s+days?\s+or\s+longer", lower) and (
        "exempt from hst" in lower or "no hst" in lower
    ):
        add(
            "BROAD_HST_EXEMPTION",
            "Do not infer a blanket HST exemption solely from a 30-day accommodation duration without directly verifying the tax treatment.",
        )

    # High-impact safety invariant:
    # Flag affirmative advice to stop/withhold rent, while avoiding
    # ordinary phrases such as "not rent-controlled".
    for sentence in re.split(r"(?<=[.!?])\s+|\n+", lower):
        unsafe_rent_advice = re.search(
            r"\bwithhold(?:ing)? rent\b"
            r"|\bstop paying rent\b"
            r"|\bdo not pay rent\b"
            r"|\bdon't pay rent\b"
            r"|\brefuse to pay rent\b"
            r"|\b(?:do not|don't|never)\b"
            r"[^.\n]{0,80}\b(?:pay|send|transfer|hand over)\b"
            r"[^.\n]{0,80}\brent\b",
            sentence,
        )

        if not unsafe_rent_advice:
            continue

        # Warnings telling the user NOT to withhold/stop rent are safe.
        safe_warning = re.search(
            r"\b("
            r"do not withhold rent|don't withhold rent|"
            r"should not withhold rent|shouldn't withhold rent|"
            r"must not withhold rent|mustn't withhold rent|"
            r"never withhold rent|"
            r"do not stop paying rent|don't stop paying rent|"
            r"should not stop paying rent|shouldn't stop paying rent|"
            r"continue paying rent|keep paying rent"
            r")\b",
            sentence,
        )

        if safe_warning:
            continue

        add(
            "UNSAFE_RENT_WITHHOLDING_ADVICE",
            "The answer may advise withholding or stopping rent. "
            "Do not give this instruction unless the legal basis and "
            "applicable tenancy status are explicitly established.",
            "critical",
        )
        break

    return issues

def build_user_fact_text(context, transcript, question):
    parts = [json.dumps(context, ensure_ascii=False), question or ""]
    parts.extend(
        str(turn.get("content", ""))
        for turn in (transcript or [])
        if turn.get("role") == "user"
    )
    return " ".join(parts).lower()


def profile_assumption_lint(answer, context, transcript, question):
    """Catch the recurring V7 profile inventions without using another judge call."""
    answer = answer or ""
    lower = answer.lower()
    known = build_user_fact_text(context, transcript, question)
    issues = []

    def add(code, message, severity="high"):
        issues.append(
            {
                "code": code,
                "severity": severity,
                "message": message,
            }
        )

    def has_known(*markers):
        return any(marker in known for marker in markers)

    def asserted(patterns):
        for sentence in re.split(r"(?<=[.!?])\s+|\n+", lower):
            sentence = sentence.strip()
            if not sentence:
                continue
            # Explicit conditional framing is allowed.
            if re.search(r"\b(?:if|unless|depending on)\b", sentence):
                continue
            if any(re.search(pattern, sentence) for pattern in patterns):
                return sentence
        return None

    if not has_known("canadian credit", "credit history", "credit score"):
        hit = asserted(
            [
                r"\byou (?:do not|don't) have (?:a )?canadian credit",
                r"\byou have no canadian credit",
                r"\byou (?:lack|likely lack) canadian credit",
                r"\byour lack of canadian credit",
                r"\byou likely (?:will not|won't) have canadian credit",
                r"\byou(?:'re| are)[^.\n]{0,100}\bwithout canadian credit",
                r"\bgiven you(?:'re| are)[^.\n]{0,100}\bwithout canadian credit",
                r"\bwithout canadian credit(?: history| score)?\b",

                # Broader affirmative formulations
                r"\b(?:with|have|has)\s+no\s+(?:established\s+)?canadian[^.\n]{0,40}credit(?: history| file| score)?\b",
                r"\bwithout\s+(?:an?\s+)?(?:established\s+)?canadian[^.\n]{0,40}credit(?: history| file| score)?\b",
            ]
        )
        if hit:
            add(
                "INVENTED_CANADIAN_CREDIT",
                f"The answer appears to treat Canadian credit history as known even though the user did not supply it: {hit[:220]}",
            )

    if not has_known("rental history", "landlord reference", "previous landlord"):
        hit = asserted(
            [
                r"\byou (?:do not|don't) have (?:a )?canadian rental history",
                r"\byou have no canadian rental history",
                r"\byou (?:lack|likely lack) canadian rental history",
                r"\byour lack of canadian rental history",

                r"\b(?:with|have|has)\s+no\s+(?:established\s+)?canadian[^.\n]{0,40}rental history\b",
                r"\bwithout\s+(?:an?\s+)?(?:established\s+)?canadian[^.\n]{0,40}rental history\b",
                r"\bwithout[^.\n]{0,60}rental history yet\b",
            ]
        )
        if hit:
            add(
                "INVENTED_RENTAL_HISTORY",
                f"The answer appears to invent the user's Canadian rental history: {hit[:220]}",
            )

    if not has_known("job offer", "employed", "employment", "job near", "work is", "work at"):
        hit = asserted(
            [
                r"\byou (?:do not|don't) have (?:a )?canadian job",
                r"\byou have no canadian job",
                r"\byou (?:lack|likely lack) canadian employment",
                r"\bwithout canadian employment[^,]*,?\s+you\b",
                r"\byou (?:do not|don't) have (?:a )?job offer",
                r"\byou have no job offer",
            ]
        )
        if hit:
            add(
                "INVENTED_EMPLOYMENT",
                f"The answer appears to invent the user's employment/job-offer status: {hit[:220]}",
            )

    # Do not infer a current landlord/rental relationship from origin_location alone.
    if not has_known(
        "current landlord",
        "landlord reference",
        "previous landlord",
        "currently rent",
        "currently renting",
        "renting in",
        "rental history",
    ):
        hit = asserted(
            [
                r"\byour current [a-z\s-]+ landlord\b",
                r"\byour current landlord\b",
                r"\byour landlord in [a-z\s-]+\b",
                r"\breference from your current landlord\b",
                r"\breference letter from your current [a-z\s-]+ landlord\b",
                r"\bget (?:a |your )?reference letter before you leave\b",
                r"\bget (?:a |your )?(?:landlord|rental) reference before you leave\b",
                r"\b(?:a |your )?uk landlord reference\b",
            ]
        )

        if hit:
            add(
                "INVENTED_CURRENT_LANDLORD",
                f"The answer assumes the user currently has a landlord/rental relationship that was not provided: {hit[:220]}",
            )

    if not has_known("car", "vehicle", "drive"):
        hit = asserted(
            [
                r"\byou (?:do not|don't) have (?:a )?car",
                r"\byou have no car",
                r"\byou are car[- ]free",
                r"\byour car[- ]free lifestyle",
            ]
        )
        if hit:
            add(
                "INVENTED_CAR_OWNERSHIP",
                f"The answer appears to invent car ownership/access: {hit[:220]}",
            )

    if not has_known("support network", "local network", "friends in canada", "family in canada"):
        hit = asserted(
            [
                r"\byou (?:do not|don't) have (?:a )?(?:local|canadian) (?:network|support network)",
                r"\byou have no (?:local|canadian) (?:network|support network)",
                r"\bwithout a local support network[^,]*,?\s+you\b",
            ]
        )
        if hit:
            add(
                "INVENTED_LOCAL_NETWORK",
                f"The answer appears to invent the user's local support network: {hit[:220]}",
            )

    if not has_known("esl", "english language", "language support"):
        hit = asserted(
            [
                r"\b(?:you|your child|your children|your kid|your kids)[^.\n]{0,80}\bneed(?:s)?\s+(?:esl|english[- ]language support)",
                r"\b(?:esl|english[- ]language support)[^.\n]{0,80}\b(?:you|your child|your children|your kid|your kids)\b",
            ]
        )
        if hit:
            add(
                "INVENTED_LANGUAGE_NEED",
                f"The answer appears to infer a language/ESL need not supplied by the user: {hit[:220]}",
            )

    if not has_known("both commute", "both of us commute", "we both commute", "both partners commute"):
        hit = asserted(
            [
                r"\bboth (?:of you|partners) (?:commute|will commute|are commuting)",
                r"\btwo commuters\b",
            ]
        )
        if hit:
            add(
                "INVENTED_BOTH_PARTNERS_COMMUTE",
                f"The answer assumes both partners commute even though the user did not say that: {hit[:220]}",
            )

    # U of T has multiple campuses; do not silently collapse an unspecified U of T
    # campus to St. George.
    if "university of toronto" in known and "st. george" not in known and "st george" not in known:
        hit = asserted(
            [
                r"\byour (?:u of t|university of toronto) (?:st\.? george|st george) campus",
                r"\bnear (?:u of t'?s? )?(?:st\.? george|st george) campus\b",
                r"\byou(?:'re| are) (?:at|attending) (?:the )?(?:st\.? george|st george) campus",
            ]
        )
        if hit:
            add(
                "INVENTED_UT_CAMPUS",
                f"The answer assumes U of T St. George without the user specifying a campus: {hit[:220]}",
            )

    # A generic has_pets=True does not identify the animal or size.
    pet_type_known = any(
        marker in known
        for marker in (
            " dog",
            "dog ",
            " cat",
            "cat ",
            "puppy",
            "kitten",
            "breed",
            "medium dog",
            "large dog",
            "small dog",
        )
    )
    if context.get("has_pets") is True and not pet_type_known:
        hit = asserted(
            [
                r"\byour (?:dog|cat|puppy|kitten)\b",
                r"\bfor your (?:dog|cat|puppy|kitten)\b",
            ]
        )
        if hit:
            add(
                "INVENTED_PET_TYPE",
                f"The answer invents the user's pet type: {hit[:220]}",
            )

    income_known = any(
        key in context
        for key in (
            "annual_income_cad",
            "monthly_income_cad",
            "household_income_cad",
            "income_cad",
        )
    ) or has_known("income is", "income of", "salary", "earning", "paying cad")
    if not income_known:
        hit = asserted(
            [
                r"\bwith your (?:annual |household )?income of\s*(?:cad\s*)?\$?[0-9]",
                r"\byour (?:annual |household )?income is\s*(?:cad\s*)?\$?[0-9]",
            ]
        )
        if hit:
            add(
                "INVENTED_INCOME",
                f"The answer invents a specific user income: {hit[:220]}",
            )

    return issues


# -----------------------------------------------------------------------------
# Prompt builders / route parsing
# -----------------------------------------------------------------------------


def build_router_prompt(question, context, transcript, current_date_str):
    return f"""Current System Date: {current_date_str}

Raw User Profile Context (only these fields are known profile facts):
{json.dumps(context, indent=2, ensure_ascii=False)}

Prior Conversation Transcript:
{json.dumps(transcript or [], indent=2, ensure_ascii=False)}

Current User Message:
{question}

Classify this turn and return the router JSON only.
"""


def normalize_router_output(raw):
    parse_fallback = False
    try:
        payload = extract_json_object(raw)
    except Exception as exc:
        parse_fallback = True
        payload = {
            "classification": "ambiguous",
            "should_answer_now": False,
            "missing_blockers": [
                "the material details needed to answer safely and specifically"
            ],
            "material_unknowns": [],
            "classification_rationale": f"Router JSON parse failure: {exc}",
            "clarification_heading": "A Quick Detail Before I Recommend",
            "clarification_intro": (
                "I need one more detail before I can give you a reliable recommendation."
            ),
            "clarification_items": [
                "Please clarify the key situation or constraint the recommendation should be based on."
            ],
        }

    classification = str(payload.get("classification", "")).strip().lower()
    if classification not in ALLOWED_CLASSIFICATIONS:
        parse_fallback = True
        classification = "ambiguous"

    # The model cannot authorize substantive answering while calling a turn
    # ambiguous. Classification controls the hard gate.
    should_answer_now = classification != "ambiguous"

    missing_blockers = clean_string_list(payload.get("missing_blockers"), 8)
    material_unknowns = clean_string_list(payload.get("material_unknowns"), 12)
    clarification_items = clean_string_list(payload.get("clarification_items"), 8)

    if classification == "ambiguous":
        if not clarification_items:
            clarification_items = missing_blockers or [
                "Please clarify the key missing detail that determines the recommendation."
            ]
    else:
        clarification_items = []
        missing_blockers = []

    return {
        "classification": classification,
        "should_answer_now": should_answer_now,
        "missing_blockers": missing_blockers,
        "material_unknowns": material_unknowns,
        "classification_rationale": str(
            payload.get("classification_rationale", "")
        ).strip(),
        "clarification_heading": str(
            payload.get("clarification_heading", "")
        ).strip(),
        "clarification_intro": str(payload.get("clarification_intro", "")).strip(),
        "clarification_items": clarification_items,
        "parse_fallback": parse_fallback,
        "raw_router_output": raw,
    }


def render_clarification(route):
    heading = route.get("clarification_heading") or "A Few Details Before I Recommend"
    intro = route.get("clarification_intro") or (
        "I can give you a useful answer once I know the following:"
    )
    items = route.get("clarification_items") or route.get("missing_blockers") or []

    lines = [f"# {heading}", "", intro]
    if items:
        lines.append("")
        lines.extend([f"- {item}" for item in items])
    return "\n".join(lines).strip()


def build_answer_prompt(
    question,
    context,
    transcript,
    route,
    current_date_str,
    canonical_facts,
    repair_context=None,
):
    route_payload = {
        "classification": route.get("classification"),
        "material_unknowns": route.get("material_unknowns", []),
        "classification_rationale": route.get("classification_rationale"),
    }

    prompt = f"""Current System Date: {current_date_str}

Raw User Profile Context:
{json.dumps(context, indent=2, ensure_ascii=False)}

Prior Conversation Transcript:
{json.dumps(transcript or [], indent=2, ensure_ascii=False)}

Current User Message:
{question}

Routing Decision (internal; never reveal it):
{json.dumps(route_payload, indent=2, ensure_ascii=False)}

Relevant Canonical Guardrails:
{json.dumps(canonical_facts, indent=2, ensure_ascii=False)}

When a canonical guardrail is material to the user-facing answer, verify it
against the current directly responsible official source using native web search.
"""

    if repair_context:
        prompt += f"""

REPAIR MODE
The previous draft violated a local prompt/architecture guardrail. Rewrite the
COMPLETE answer from scratch. Do not discuss the critique.

Previous Draft:
{repair_context.get('previous_answer', '')}

Detected Issues:
{json.dumps(repair_context.get('issues', []), indent=2, ensure_ascii=False)}

Repair requirements:
- remove every invented user/profile fact;
- correct every listed legal/current/jurisdiction issue;
- keep unknown profile attributes conditional;
- verify exact/current/legal claims when needed;
- remove unnecessary exactness rather than replacing it with another guess;
- keep the answer shorter rather than adding new tangents.
"""

    return prompt


# -----------------------------------------------------------------------------
# Model calls
# -----------------------------------------------------------------------------


def require_anthropic_client():
    if anthropic_client is None:
        raise RuntimeError(
            "Anthropic client is not configured. Install anthropic and set ANTHROPIC_API_KEY."
        )


def call_real_router(question, context, transcript, current_date_str):
    require_anthropic_client()
    response = anthropic_client.messages.create(
        model=ROUTER_MODEL_NAME,
        max_tokens=ROUTER_MAX_TOKENS,
        system=ROUTER_INSTRUCTION,
        messages=[
            {
                "role": "user",
                "content": build_router_prompt(
                    question,
                    context,
                    transcript,
                    current_date_str,
                ),
            }
        ],
    )
    raw = get_response_text(response)
    return {
        "route": normalize_router_output(raw),
        "input_tokens": response.usage.input_tokens,
        "output_tokens": response.usage.output_tokens,
        "stop_reason": getattr(response, "stop_reason", None),
    }


def call_mock_router(question, context, transcript, current_date_str):
    del context, transcript, current_date_str
    lower = question.lower()
    ambiguous_markers = (
        "where should i live",
        "good neighbourhood",
        "near my university",
        "how long will the commute",
        "inspecting a place",
    )
    classification = (
        "ambiguous"
        if any(marker in lower for marker in ambiguous_markers)
        else "clear"
    )
    raw = json.dumps(
        {
            "classification": classification,
            "should_answer_now": classification != "ambiguous",
            "missing_blockers": ["key decision variable"] if classification == "ambiguous" else [],
            "material_unknowns": [],
            "classification_rationale": "Mock routing decision.",
            "clarification_heading": "A Quick Detail Before I Recommend",
            "clarification_intro": "I need one detail before I can answer usefully.",
            "clarification_items": ["What is the key constraint for this decision?"] if classification == "ambiguous" else [],
        }
    )
    return {
        "route": normalize_router_output(raw),
        "input_tokens": len(question) // 4 + 100,
        "output_tokens": len(raw) // 4,
        "stop_reason": "mock",
    }


def call_answer_model(
    question,
    context,
    transcript,
    route,
    current_date_str,
    canonical_facts,
    repair_context=None,
):
    if not USE_REAL_MODEL:
        answer = (
            "# Mock Housing Answer\n\n"
            f"Mock substantive answer for: {question}\n\n"
            "## What to Confirm Before You Decide\n\n"
            "Nothing material remains unresolved in this mock response."
        )
        return {
            "final_response": answer,
            "assistant_message": answer,
            "citations": [],
            "web_search_requests": 0,
            "input_tokens": 300,
            "output_tokens": len(answer) // 4,
            "stop_reason": "mock",
        }

    require_anthropic_client()
    response = anthropic_client.messages.create(
        model=MODEL_NAME,
        max_tokens=max_answer_tokens(route.get("classification")),
        system=ANSWER_INSTRUCTION,
        tools=[{"type": "web_search_20250305", "name": "web_search"}],
        messages=[
            {
                "role": "user",
                "content": build_answer_prompt(
                    question=question,
                    context=context,
                    transcript=transcript,
                    route=route,
                    current_date_str=current_date_str,
                    canonical_facts=canonical_facts,
                    repair_context=repair_context,
                ),
            }
        ],
    )
    extracted = extract_claude_response(response)
    return {
        "final_response": extracted["final_response"],
        "assistant_message": extracted["plain_response"],
        "citations": extracted["citations"],
        "web_search_requests": get_web_search_requests(response),
        "input_tokens": response.usage.input_tokens,
        "output_tokens": response.usage.output_tokens,
        "stop_reason": getattr(response, "stop_reason", None),
    }


# -----------------------------------------------------------------------------
# One-turn pipeline
# -----------------------------------------------------------------------------


def run_turn(question, context, transcript, current_date_str):
    router_result = (
        call_real_router(question, context, transcript, current_date_str)
        if USE_REAL_MODEL
        else call_mock_router(question, context, transcript, current_date_str)
    )
    route = router_result["route"]

    # Persist only raw facts as the assumption ledger. The router can identify
    # unknowns, but it is not allowed to invent new known profile facts.
    route["known_profile_facts"] = dict(context)
    route["explicit_user_messages"] = [
        turn.get("content", "")
        for turn in (transcript or [])
        if turn.get("role") == "user"
    ] + [question]

    stage_tokens = {
        "router_input_tokens": router_result.get("input_tokens", 0),
        "router_output_tokens": router_result.get("output_tokens", 0),
        "answer_input_tokens": 0,
        "answer_output_tokens": 0,
        "repair_input_tokens": 0,
        "repair_output_tokens": 0,
    }

    # Hard gate: ambiguous turns never reach Housing answer generation or web search.
    if not route["should_answer_now"]:
        clarification = render_clarification(route)
        prompt_gate_pass = not route.get("parse_fallback", False)
        return {
            "final_response": clarification,
            "assistant_message": clarification,
            "actual_classification": route["classification"],
            "should_answer_now": False,
            "route": route,
            "citations": [],
            "deterministic_lint": [],
            "profile_assumption_lint": [],
            "repair_attempts": 0,
            "web_search_requests": 0,
            "stop_reason": router_result.get("stop_reason"),
            "router_stop_reason": router_result.get("stop_reason"),
            "answer_stop_reason": None,
            "stage_tokens": stage_tokens,
            "input_tokens": stage_tokens["router_input_tokens"],
            "output_tokens": stage_tokens["router_output_tokens"],
            "prompt_architecture_gate_pass": prompt_gate_pass,
            "canonical_facts_used": {},
        }

    canonical_facts = select_canonical_facts(question, context, transcript)
    answer_result = call_answer_model(
        question=question,
        context=context,
        transcript=transcript,
        route=route,
        current_date_str=current_date_str,
        canonical_facts=canonical_facts,
    )
    stage_tokens["answer_input_tokens"] += answer_result.get("input_tokens", 0)
    stage_tokens["answer_output_tokens"] += answer_result.get("output_tokens", 0)

    final_answer = answer_result["final_response"]
    final_assistant_message = answer_result["assistant_message"]
    final_citations = answer_result.get("citations", [])
    total_web_searches = answer_result.get("web_search_requests")
    answer_stop_reason = answer_result.get("stop_reason")
    repair_attempts = 0

    def local_issues(answer_text):
        legal_current = deterministic_lint(answer_text, current_date_str)
        profile = profile_assumption_lint(
            answer_text,
            context,
            transcript,
            question,
        )
        return legal_current, profile

    final_lint, final_profile_lint = local_issues(final_answer)

    # Repair only when our own prompt/architecture guardrails catch a known V7
    # failure pattern. No separate LLM-as-a-judge call is used here.
    while (
        (final_lint or final_profile_lint)
        and repair_attempts < MAX_REPAIR_ATTEMPTS
    ):
        repair_attempts += 1
        repaired = call_answer_model(
            question=question,
            context=context,
            transcript=transcript,
            route=route,
            current_date_str=current_date_str,
            canonical_facts=canonical_facts,
            repair_context={
                "previous_answer": final_answer,
                "issues": final_lint + final_profile_lint,
            },
        )
        stage_tokens["repair_input_tokens"] += repaired.get("input_tokens", 0)
        stage_tokens["repair_output_tokens"] += repaired.get("output_tokens", 0)
        total_web_searches = sum_optional_counts(
            total_web_searches,
            repaired.get("web_search_requests"),
        )

        final_answer = repaired["final_response"]
        final_assistant_message = repaired["assistant_message"]
        final_citations = repaired.get("citations", [])
        answer_stop_reason = repaired.get("stop_reason")
        final_lint, final_profile_lint = local_issues(final_answer)

    input_tokens = sum(
        value for key, value in stage_tokens.items() if key.endswith("input_tokens")
    )
    output_tokens = sum(
        value for key, value in stage_tokens.items() if key.endswith("output_tokens")
    )

    prompt_gate_pass = (
        not route.get("parse_fallback", False)
        and not final_lint
        and not final_profile_lint
    )

    return {
        "final_response": final_answer,
        "assistant_message": final_assistant_message,
        "actual_classification": route["classification"],
        "should_answer_now": True,
        "route": route,
        "citations": final_citations,
        "deterministic_lint": final_lint,
        "profile_assumption_lint": final_profile_lint,
        "repair_attempts": repair_attempts,
        "web_search_requests": total_web_searches,
        "stop_reason": answer_stop_reason,
        "router_stop_reason": router_result.get("stop_reason"),
        "answer_stop_reason": answer_stop_reason,
        "stage_tokens": stage_tokens,
        "input_tokens": input_tokens,
        "output_tokens": output_tokens,
        "prompt_architecture_gate_pass": prompt_gate_pass,
        "canonical_facts_used": canonical_facts,
    }


# -----------------------------------------------------------------------------
# Single-turn / multi-turn runners
# -----------------------------------------------------------------------------


def run_single_turn_case(test_case, current_date_str):
    result = run_turn(
        question=test_case["question"],
        context=test_case["context"],
        transcript=[],
        current_date_str=current_date_str,
    )
    return {
        **result,
        "interaction_type": "single_turn",
        "turn_1_response": result["final_response"],
        "turn_1_citations": result.get("citations", []),
        "turn_1_route": result.get("route"),
        "turn_1_should_answer_now": result.get("should_answer_now"),
        "actual_turn_1_classification": result.get("actual_classification"),
        "turn_1_deterministic_lint": result.get("deterministic_lint", []),
        "turn_1_profile_assumption_lint": result.get("profile_assumption_lint", []),
        "turn_1_prompt_architecture_gate_pass": result.get(
            "prompt_architecture_gate_pass"
        ),
        "turn_1_repair_attempts": result.get("repair_attempts", 0),
        "turn_1_stop_reason": result.get("stop_reason"),
        "turn_1_web_search_requests": result.get("web_search_requests"),
    }


def run_multi_turn_case(test_case, current_date_str):
    question = test_case["question"]
    context = test_case["context"]
    turn_2_input = test_case["turn_2_input"]

    turn_1 = run_turn(
        question=question,
        context=context,
        transcript=[],
        current_date_str=current_date_str,
    )

    transcript = [
        {"role": "user", "content": question},
        {"role": "assistant", "content": turn_1["assistant_message"]},
    ]

    turn_2 = run_turn(
        question=turn_2_input,
        context=context,
        transcript=transcript,
        current_date_str=current_date_str,
    )

    combined_citations = (
        add_turn_to_citations(turn_1.get("citations"), 1)
        + add_turn_to_citations(turn_2.get("citations"), 2)
    )

    combined_stage_tokens = {}
    for stage_name in set(turn_1.get("stage_tokens", {})) | set(
        turn_2.get("stage_tokens", {})
    ):
        combined_stage_tokens[stage_name] = (
            turn_1.get("stage_tokens", {}).get(stage_name, 0)
            + turn_2.get("stage_tokens", {}).get(stage_name, 0)
        )

    return {
        "final_response": turn_2["final_response"],
        "assistant_message": turn_2["assistant_message"],
        "actual_classification": turn_2.get("actual_classification"),
        "should_answer_now": turn_2.get("should_answer_now"),
        "route": turn_2.get("route"),
        "citations": combined_citations,
        "deterministic_lint": (
            turn_1.get("deterministic_lint", [])
            + turn_2.get("deterministic_lint", [])
        ),
        "profile_assumption_lint": (
            turn_1.get("profile_assumption_lint", [])
            + turn_2.get("profile_assumption_lint", [])
        ),
        "repair_attempts": turn_1.get("repair_attempts", 0)
        + turn_2.get("repair_attempts", 0),
        "web_search_requests": sum_optional_counts(
            turn_1.get("web_search_requests"),
            turn_2.get("web_search_requests"),
        ),
        "input_tokens": turn_1.get("input_tokens", 0)
        + turn_2.get("input_tokens", 0),
        "output_tokens": turn_1.get("output_tokens", 0)
        + turn_2.get("output_tokens", 0),
        "stage_tokens": combined_stage_tokens,
        "stop_reason": turn_2.get("stop_reason"),
        "interaction_type": "multi_turn",
        "turn_1_response": turn_1["final_response"],
        "turn_1_citations": turn_1.get("citations", []),
        "turn_1_route": turn_1.get("route"),
        "turn_1_should_answer_now": turn_1.get("should_answer_now"),
        "actual_turn_1_classification": turn_1.get("actual_classification"),
        "turn_1_deterministic_lint": turn_1.get("deterministic_lint", []),
        "turn_1_profile_assumption_lint": turn_1.get(
            "profile_assumption_lint", []
        ),
        "turn_1_prompt_architecture_gate_pass": turn_1.get(
            "prompt_architecture_gate_pass"
        ),
        "turn_1_repair_attempts": turn_1.get("repair_attempts", 0),
        "turn_1_stop_reason": turn_1.get("stop_reason"),
        "turn_1_web_search_requests": turn_1.get("web_search_requests"),
        "turn_2_input": turn_2_input,
        "turn_2_response": turn_2["final_response"],
        "turn_2_citations": turn_2.get("citations", []),
        "turn_2_route": turn_2.get("route"),
        "turn_2_should_answer_now": turn_2.get("should_answer_now"),
        "actual_turn_2_classification": turn_2.get("actual_classification"),
        "turn_2_deterministic_lint": turn_2.get("deterministic_lint", []),
        "turn_2_profile_assumption_lint": turn_2.get(
            "profile_assumption_lint", []
        ),
        "turn_2_prompt_architecture_gate_pass": turn_2.get(
            "prompt_architecture_gate_pass"
        ),
        "turn_2_repair_attempts": turn_2.get("repair_attempts", 0),
        "turn_2_stop_reason": turn_2.get("stop_reason"),
        "turn_2_web_search_requests": turn_2.get("web_search_requests"),
        "prompt_architecture_gate_pass": bool(
            turn_1.get("prompt_architecture_gate_pass")
        )
        and bool(turn_2.get("prompt_architecture_gate_pass")),
    }


# -----------------------------------------------------------------------------
# Case execution + evaluation metadata
# -----------------------------------------------------------------------------


def run_one_call(test_case, run_number, eval_scope):
    eval_id = test_case["eval_id"]
    question = test_case["question"]
    context = test_case["context"]
    interaction_type = test_case.get("interaction_type", "single_turn")
    current_date_str = get_current_system_date()

    run_id = str(uuid.uuid4())
    start_time = time.time()
    error_message = None
    run_status = "success"

    try:
        if interaction_type == "multi_turn":
            result = run_multi_turn_case(test_case, current_date_str)
        else:
            result = run_single_turn_case(test_case, current_date_str)
    except Exception as exc:
        error_message = str(exc)
        run_status = "error"
        result = {
            "final_response": None,
            "citations": [],
            "turn_1_response": None,
            "turn_1_citations": [],
            "turn_2_input": test_case.get("turn_2_input"),
            "turn_2_response": None,
            "turn_2_citations": [],
            "actual_classification": None,
            "should_answer_now": None,
            "route": None,
            "actual_turn_1_classification": None,
            "turn_1_should_answer_now": None,
            "turn_1_route": None,
            "actual_turn_2_classification": None,
            "turn_2_should_answer_now": None,
            "turn_2_route": None,
            "deterministic_lint": [],
            "profile_assumption_lint": [],
            "turn_1_deterministic_lint": [],
            "turn_1_profile_assumption_lint": [],
            "turn_2_deterministic_lint": [],
            "turn_2_profile_assumption_lint": [],
            "prompt_architecture_gate_pass": False,
            "turn_1_prompt_architecture_gate_pass": False,
            "turn_2_prompt_architecture_gate_pass": False,
            "repair_attempts": 0,
            "turn_1_repair_attempts": 0,
            "turn_2_repair_attempts": 0,
            "input_tokens": None,
            "output_tokens": None,
            "stage_tokens": {},
            "web_search_requests": None,
            "turn_1_web_search_requests": None,
            "turn_2_web_search_requests": None,
            "stop_reason": None,
            "turn_1_stop_reason": None,
            "turn_2_stop_reason": None,
        }

    latency_ms = round((time.time() - start_time) * 1000, 1)

    expected_classification = test_case.get("expected_classification")
    expected_turn_1_classification = test_case.get(
        "expected_turn_1_classification",
        expected_classification,
    )
    expected_turn_2_classification = test_case.get(
        "expected_turn_2_classification"
    )

    actual_turn_1_classification = result.get("actual_turn_1_classification")
    actual_turn_2_classification = result.get("actual_turn_2_classification")

    turn_1_classification_match = (
        actual_turn_1_classification == expected_turn_1_classification
        if actual_turn_1_classification is not None
        else False
    )

    if interaction_type == "multi_turn":
        turn_2_classification_match = (
            actual_turn_2_classification == expected_turn_2_classification
            if (
                actual_turn_2_classification is not None
                and expected_turn_2_classification is not None
            )
            else False
        )
        classification_match = (
            turn_1_classification_match and turn_2_classification_match
        )
    else:
        turn_2_classification_match = None
        classification_match = turn_1_classification_match

    expected_turn_1_should_answer = expected_turn_1_classification != "ambiguous"
    actual_turn_1_should_answer = result.get("turn_1_should_answer_now")
    turn_1_action_match = (
        actual_turn_1_should_answer == expected_turn_1_should_answer
        if actual_turn_1_should_answer is not None
        else False
    )

    if interaction_type == "multi_turn":
        expected_turn_2_should_answer = (
            expected_turn_2_classification != "ambiguous"
            if expected_turn_2_classification is not None
            else None
        )
        actual_turn_2_should_answer = result.get("turn_2_should_answer_now")
        turn_2_action_match = (
            actual_turn_2_should_answer == expected_turn_2_should_answer
            if (
                actual_turn_2_should_answer is not None
                and expected_turn_2_should_answer is not None
            )
            else False
        )
        interaction_action_match = turn_1_action_match and turn_2_action_match
    else:
        expected_turn_2_should_answer = None
        turn_2_action_match = None
        interaction_action_match = turn_1_action_match

    prompt_architecture_gate_pass = bool(
        result.get("prompt_architecture_gate_pass")
    )
    case_prompt_gate_pass = (
        run_status == "success"
        and interaction_action_match
        and prompt_architecture_gate_pass
    )

    input_tokens = result.get("input_tokens")
    output_tokens = result.get("output_tokens")
    stage_tokens = result.get("stage_tokens", {})

    estimated_cost_usd = None

    if input_tokens is not None and output_tokens is not None:
        router_cost = estimate_cost(
            ROUTER_MODEL_NAME,
            stage_tokens.get("router_input_tokens", 0),
            stage_tokens.get("router_output_tokens", 0),
        )

        answer_cost = estimate_cost(
            MODEL_NAME,
            stage_tokens.get("answer_input_tokens", 0)
            + stage_tokens.get("repair_input_tokens", 0),
            stage_tokens.get("answer_output_tokens", 0)
            + stage_tokens.get("repair_output_tokens", 0),
        )

        known_costs = [
            cost
            for cost in (router_cost, answer_cost)
            if cost is not None
        ]

        if known_costs:
            estimated_cost_usd = round(sum(known_costs), 6)

    return {
        "status": run_status,
        "run_status": run_status,
        "final_response": result.get("final_response"),
        "citations": result.get("citations", []),
        "turn_1_response": result.get("turn_1_response"),
        "turn_1_citations": result.get("turn_1_citations", []),
        "turn_2_input": result.get("turn_2_input"),
        "turn_2_response": result.get("turn_2_response"),
        "turn_2_citations": result.get("turn_2_citations", []),
        "error_message": error_message,
        "metadata": {
            "run_id": run_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "current_system_date": current_date_str,
            "eval_scope": eval_scope,
            "eval_id": eval_id,
            "category": test_case["category"],
            "subcategory": test_case["subcategory"],
            "user_id": test_case["user_id"],
            "source_owner": test_case.get("source_owner"),
            "experiment": test_case["experiment"],
            "question": question,
            "context": context,
            "run_number": run_number,
            "model_used": MODEL_NAME,
            "router_model": ROUTER_MODEL_NAME,
            "model_provider": MODEL_PROVIDER,
            "search_mode": SEARCH_MODE,
            "prompt_version": ACTIVE_PROMPT_VERSION,
            "test_case_prompt_version": test_case.get("prompt_version"),
            "instructions_version": ACTIVE_PROMPT_VERSION,
            "architecture_version": ARCHITECTURE_VERSION,
            "interaction_type": interaction_type,
            "expected_classification": expected_classification,
            "actual_classification": result.get("actual_classification"),
            "classification_match": classification_match,
            "classification_rationale": test_case.get(
                "classification_rationale"
            ),
            "router": result.get("route"),
            "should_answer_now": result.get("should_answer_now"),
            "interaction_action_match": interaction_action_match,
            "expected_turn_1_classification": expected_turn_1_classification,
            "actual_turn_1_classification": actual_turn_1_classification,
            "turn_1_classification_match": turn_1_classification_match,
            "expected_turn_1_should_answer": expected_turn_1_should_answer,
            "actual_turn_1_should_answer": actual_turn_1_should_answer,
            "turn_1_action_match": turn_1_action_match,
            "turn_1_route": result.get("turn_1_route"),
            "expected_turn_2_classification": expected_turn_2_classification,
            "actual_turn_2_classification": actual_turn_2_classification,
            "turn_2_classification_match": turn_2_classification_match,
            "expected_turn_2_should_answer": expected_turn_2_should_answer,
            "actual_turn_2_should_answer": result.get(
                "turn_2_should_answer_now"
            ),
            "turn_2_action_match": turn_2_action_match,
            "turn_2_route": result.get("turn_2_route"),
            "feedback_status": test_case.get("feedback_status"),
            "original_status": test_case.get("feedback_status"),
            "original_feedback": test_case.get("original_feedback"),
            "deterministic_lint": result.get("deterministic_lint", []),
            "profile_assumption_lint": result.get(
                "profile_assumption_lint", []
            ),
            "prompt_architecture_gate_pass": prompt_architecture_gate_pass,
            "case_prompt_gate_pass": case_prompt_gate_pass,
            "repair_attempts": result.get("repair_attempts", 0),
            "turn_1_deterministic_lint": result.get(
                "turn_1_deterministic_lint", []
            ),
            "turn_1_profile_assumption_lint": result.get(
                "turn_1_profile_assumption_lint", []
            ),
            "turn_1_prompt_architecture_gate_pass": result.get(
                "turn_1_prompt_architecture_gate_pass"
            ),
            "turn_1_repair_attempts": result.get("turn_1_repair_attempts", 0),
            "turn_2_deterministic_lint": result.get(
                "turn_2_deterministic_lint", []
            ),
            "turn_2_profile_assumption_lint": result.get(
                "turn_2_profile_assumption_lint", []
            ),
            "turn_2_prompt_architecture_gate_pass": result.get(
                "turn_2_prompt_architecture_gate_pass"
            ),
            "turn_2_repair_attempts": result.get("turn_2_repair_attempts", 0),
            "latency_ms": latency_ms,
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "stage_tokens": stage_tokens,
            "estimated_cost_usd": estimated_cost_usd,
            "web_search_requests": result.get("web_search_requests"),
            "turn_1_web_search_requests": result.get(
                "turn_1_web_search_requests"
            ),
            "turn_2_web_search_requests": result.get(
                "turn_2_web_search_requests"
            ),
            "stop_reason": result.get("stop_reason"),
            "turn_1_stop_reason": result.get("turn_1_stop_reason"),
            "turn_2_stop_reason": result.get("turn_2_stop_reason"),
        },
    }


# -----------------------------------------------------------------------------
# Persistence / scope selection / summary
# -----------------------------------------------------------------------------


def save_to_supabase(row):
    if supabase_client is None:
        return None

    log_row = {
        "run_id": row["run_id"],
        "user_id": row["user_id"],
        "provider": row["model_provider"],
        "model": row["model_used"],
        "category": row["category"],
        "subcategory": row["subcategory"],
        "experiment": row["experiment"],
        "input_tokens": row["input_tokens"],
        "output_tokens": row["output_tokens"],
        "estimated_cost_usd": row["estimated_cost_usd"],
        "estimated_search_cost_usd": row.get("estimated_search_cost_usd"),
        "latency_ms": int(row["latency_ms"]),
        "timestamp": row["timestamp"],
    }
    return (
        supabase_client.table("eval_cost_log")
        .insert(log_row)
        .execute()
    )


def select_cases(scope, custom_ids=None):
    by_id = {case["eval_id"]: case for case in test_cases}

    if custom_ids:
        missing = [case_id for case_id in custom_ids if case_id not in by_id]
        if missing:
            raise ValueError(f"Unknown eval_id(s): {', '.join(missing)}")
        return [by_id[case_id] for case_id in custom_ids]

    if scope == "failed":
        missing = [
            case_id
            for case_id in V7_PRIMARY_FAILURE_CASE_IDS
            if case_id not in by_id
        ]
        if missing:
            raise ValueError(
                "V7 regression IDs missing from combined test set: "
                + ", ".join(missing)
            )
        return [by_id[case_id] for case_id in V7_PRIMARY_FAILURE_CASE_IDS]

    if scope == "all":
        return list(test_cases)

    raise ValueError(f"Unsupported scope: {scope}")


def default_output_path(scope, custom_ids=None):
    if custom_ids:
        return "harness_results_housing_v8_custom.json"
    if scope == "failed":
        return "harness_results_housing_v8_failed.json"
    return "harness_results_housing_30_v8.json"


def run_harness(selected_cases, output_path, eval_scope):
    all_results = []

    for test_case in selected_cases:
        # Exactly one run per case by design.
        run_number = 1
        print(f"Running: {test_case['eval_id']} (1/1)")
        result = run_one_call(test_case, run_number, eval_scope)
        all_results.append(result)

        try:
            save_to_supabase(result["metadata"])
        except Exception as exc:
            print(f"  Warning: Supabase write failed: {exc}")

    flat_rows = []
    for row in all_results:
        flat_row = {
            key: row[key]
            for key in (
                "status",
                "run_status",
                "final_response",
                "citations",
                "turn_1_response",
                "turn_1_citations",
                "turn_2_input",
                "turn_2_response",
                "turn_2_citations",
                "error_message",
            )
        }
        flat_row.update(row["metadata"])
        flat_rows.append(flat_row)

    with open(output_path, "w", encoding="utf-8") as file_handle:
        json.dump(flat_rows, file_handle, indent=2, ensure_ascii=False)

    successful = [row for row in flat_rows if row.get("run_status") == "success"]
    exact_matches = sum(
        1 for row in successful if row.get("classification_match") is True
    )
    action_matches = sum(
        1 for row in successful if row.get("interaction_action_match") is True
    )
    prompt_gate_passes = sum(
        1 for row in successful if row.get("case_prompt_gate_pass") is True
    )
    remaining_profile_issues = sum(
        len(row.get("profile_assumption_lint") or []) for row in successful
    )
    remaining_rule_issues = sum(
        len(row.get("deterministic_lint") or []) for row in successful
    )
    repairs = sum(row.get("repair_attempts", 0) or 0 for row in successful)

    turn_exact_total = 0
    turn_exact_pass = 0
    turn_action_total = 0
    turn_action_pass = 0
    for row in successful:
        turn_exact_total += 1
        turn_exact_pass += int(row.get("turn_1_classification_match") is True)
        turn_action_total += 1
        turn_action_pass += int(row.get("turn_1_action_match") is True)
        if row.get("interaction_type") == "multi_turn":
            turn_exact_total += 1
            turn_exact_pass += int(row.get("turn_2_classification_match") is True)
            turn_action_total += 1
            turn_action_pass += int(row.get("turn_2_action_match") is True)

    print(f"\nDone. {len(flat_rows)} rows saved to: {output_path}")
    print(f"Scope: {eval_scope}")
    print(f"Successful runs: {len(successful)}/{len(flat_rows)}")
    print(f"Exact classification matches (case-level): {exact_matches}/{len(successful)}")
    print(f"Exact classification matches (turn-level): {turn_exact_pass}/{turn_exact_total}")
    print(f"Correct answer-vs-clarify action (turn-level): {turn_action_pass}/{turn_action_total}")
    print(f"Prompt/architecture gates passed: {prompt_gate_passes}/{len(successful)}")
    print(f"Remaining profile-assumption lint issues: {remaining_profile_issues}")
    print(f"Remaining deterministic rule lint issues: {remaining_rule_issues}")
    print(f"Automatic repair calls used: {repairs}")

    # Per-case errors are caught so one bad case cannot abort the suite, but
    # until now they were only written to the JSON file -- a run where all 30
    # cases failed printed "Successful runs: 0/30" and still exited 0.
    failures = [row for row in flat_rows if row.get("run_status") != "success"]
    if failures:
        by_message = {}
        for row in failures:
            message = row.get("error_message") or "(no error message recorded)"
            by_message[message] = by_message.get(message, 0) + 1
        print(f"\n{len(failures)} case(s) failed:")
        for message, count in sorted(by_message.items(), key=lambda kv: -kv[1]):
            print(f"  [{count}x] {message}")

    if supabase_client is not None:
        print("Also written to Supabase eval_cost_log table.")
    else:
        print(
            "Supabase not configured "
            "(SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY not set) - skipped DB write."
        )

    if eval_scope == "failed":
        print(
            "\nReview this regression output first. Only after it looks good, run "
            "the final one-pass 30-case evaluation with: --scope all"
        )

    return all_results


def parse_args():
    parser = argparse.ArgumentParser(
        description=(
            "Housing V8 two-stage router + answer harness. Defaults to the "
            "previously failed V7 regression cases; use --scope all only after "
            "the regression slice is reviewed."
        )
    )
    parser.add_argument(
        "--scope",
        choices=("failed", "all"),
        default=os.getenv("HOUSING_EVAL_SCOPE", "failed"),
        help="failed = V7 primary-failure regression slice; all = all 30 cases once",
    )
    parser.add_argument(
        "--case",
        dest="case_ids",
        action="append",
        default=None,
        help="Run a specific eval_id. Repeat --case for multiple IDs.",
    )
    parser.add_argument(
        "--output",
        default=None,
        help="Optional JSON output path.",
    )
    return parser.parse_args()


def main():
    args = parse_args()

    # Without this the suite runs to completion against a client that cannot
    # work: every case raises, every row is written empty, and the job exits 0.
    if USE_REAL_MODEL and anthropic_client is None:
        raise SystemExit(
            "Anthropic client is not configured, so every case would fail. "
            "Set ANTHROPIC_API_KEY (and install the anthropic package), or set "
            "HOUSING_USE_REAL_MODEL=0 to run the mock path deliberately."
        )

    selected = select_cases(args.scope, args.case_ids)
    eval_scope = "custom" if args.case_ids else args.scope
    output_path = args.output or default_output_path(args.scope, args.case_ids)

    print(f"Housing V8 architecture: {ARCHITECTURE_VERSION}")
    print(f"Search mode: {SEARCH_MODE}")
    print(f"Selected cases: {len(selected)}")
    print("Repeats per case: 1")

    results = run_harness(
        selected_cases=selected,
        output_path=output_path,
        eval_scope=eval_scope,
    )

    errored = [row for row in results if row.get("run_status") != "success"]
    if errored:
        raise SystemExit(f"{len(errored)} of {len(results)} cases failed.")


if __name__ == "__main__":
    main()

