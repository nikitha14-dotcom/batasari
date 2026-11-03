"""
DS #2 (Syeda Tehreem Ali) All 20 Housing Clarification Policy Test Cases
Updated per feedback from:
  - Jia (TQ1-5 round 1, TQ10 note, TQ11-20 eval)
  - Linda (TQ6-10 eval sheet)

All cases were rerun against clarification_policy_v3.1 and the fresh output
is in Claude_output_all_20.md (in this PR).

Field semantics:
  - id, question, context, expected_classification: current gold test definition
  - feedback: historical reviewer feedback about the previous output/rerun
  - classification_rationale: optional note for the latest gold-label adjudication;
    when present, this explains the current expected_classification even if older
    feedback text reflects a previous policy decision
  - feedback_status: status of that historical feedback/fix only; it is NOT a
    runtime classification result. PASS means the feedback fix was confirmed,
    while NEEDS_RERUN means a known feedback gap remained in that rerun.
  - Runtime classification correctness must be tracked separately by the
    harness via actual_classification / classification_match.
"""

TEST_CASES = [
    # ========== BATCH 1: TQ1-TQ5 ==========
    {
        "id": "TQ1_WHERE_TO_LIVE",
        "question": "Where should I live?",
        "context": {
            "target_move_date": "2027-01-15",
            "visa_type": "Study Permit (Grad — MBA)",
            "household_composition": "Solo",
            "has_pets": False,
            "origin_location": "Lagos, Nigeria",
            "long_term_accommodation_ready": False,
        },
        "expected_classification": "ambiguous",
        "feedback": "PASS — bundled question (school + budget + priorities) worked well.",
        "feedback_status": "PASS",
    },
    {
        "id": "TQ2_INSPECTION_CHECKLIST",
        "question": "What should I check when inspecting a place?",
        "context": {
            "target_move_date": "2026-09-22",
            "visa_type": "Open Work Permit",
            "household_composition": "Couple",
            "has_pets": False,
            "origin_location": "Manila, Philippines",
            "long_term_accommodation_ready": True,
        },
        "expected_classification": "ambiguous",
        "feedback": (
            "Jia round 1: make clarifying question more specific — move-in inspection "
            "vs comparing multiple listings. Linda: profile anchoring missing, dense text. "
            "FIXED in v2 rerun (confirmed Sept 3). Formatting fix confirmed in v3.1 rerun."
        ),
        "feedback_status": "PASS",
    },
    {
        "id": "TQ3_REALTOR_VS_PM_VS_P2P",
        "question": "Should I use a realtor, property manager, or peer-to-peer rental platform?",
        "context": {
            "target_move_date": "2026-10-30",
            "visa_type": "Employer-Specific Work Permit",
            "household_composition": "Family (Couple + 2 kids, ages 6 and 9)",
            "has_pets": True,
            "origin_location": "Karachi, Pakistan",
            "long_term_accommodation_ready": False,
        },
        "expected_classification": "some_info_known",
        "feedback": "PASS — full comparison + rec, one follow-up at end. Team confirmed this is the right pattern.",
        "feedback_status": "PASS",
    },
    {
        "id": "TQ4_BASEMENT_APARTMENTS",
        "question": "Are basement apartments okay?",
        "context": {
            "target_move_date": "2027-01-10",
            "visa_type": "Study Permit (Grad — MBA)",
            "household_composition": "Solo",
            "has_pets": False,
            "origin_location": "Chennai, India",
            "long_term_accommodation_ready": False,
        },
        "expected_classification": "ambiguous",
        "feedback": "PASS — correctly asks budget + dealbreakers.",
        "feedback_status": "PASS",
    },
    {
        "id": "TQ5_AFFORDABLE_CONVENIENT_MULTITURN",
        "question": "Which neighbourhoods are affordable but still convenient?",
        "context": {
            "target_move_date": "2026-10-13",
            "visa_type": "Open Work Permit",
            "household_composition": "Solo",
            "has_pets": False,
            "origin_location": "São Paulo, Brazil",
            "long_term_accommodation_ready": False,
        },
        "expected_classification": "multi_turn",
        "feedback": (
            "Jia round 1: formatting issue (raw JSON) + not using websearch. "
            "FIXED in v2 rerun (confirmed Sept 3). Turn 2 answers directly without re-asking."
        ),
        "feedback_status": "PASS",
        "turn_2_input": "Work is downtown in the Financial District, I don't have a car, and I'd want to be near a subway line.",
    },

    # ========== BATCH 2: TQ6-TQ10 ==========
    {
        "id": "TQ6_GOOD_NEIGHBOURHOOD",
        "question": "What's a good neighbourhood?",
        "context": {
            "target_move_date": "2026-11-01",
            "visa_type": "Study Permit (Grad — Data Science)",
            "household_composition": "Solo",
            "has_pets": False,
            "origin_location": "Seoul, South Korea",
            "long_term_accommodation_ready": False,
        },
        "expected_classification": "ambiguous",
        "feedback": (
            "Linda [TUNE]: No profile anchoring — jumps straight into gathering info "
            "without acknowledging context. Dense text block, not scannable. "
            "Decision variables not presented independently. FIXED and confirmed in v3.1 rerun."
        ),
        "feedback_status": "PASS",
    },
    {
        "id": "TQ7_NEAR_UNIVERSITY",
        "question": "Can you help me to find housing near my university?",
        "context": {
            "target_move_date": "2027-01-05",
            "visa_type": "Study Permit (Undergrad)",
            "household_composition": "Solo",
            "has_pets": False,
            "origin_location": "Nairobi, Kenya",
            "long_term_accommodation_ready": False,
        },
        "expected_classification": "ambiguous",
        "feedback": (
            "Linda [TUNE]: Missed profile awareness from system/context. "
            "Dense block of text, decision variables not isolated. "
            "Correctly identified missing university param though. FIXED and confirmed in v3.1 rerun."
        ),
        "feedback_status": "PASS",
    },
    {
        "id": "TQ8_ALONE_OR_SHARE",
        "question": "Should I live alone or share?",
        "context": {
            "target_move_date": "2026-12-15",
            "visa_type": "Open Work Permit",
            "household_composition": "Solo",
            "has_pets": True,
            "origin_location": "Mexico City, Mexico",
            "long_term_accommodation_ready": False,
        },
        "expected_classification": "ambiguous",
        "feedback": (
            "Linda [BUG]: Guessed min/max rent without asking user's actual budget. "
            "Asked about pet type AFTER running cost comparison — should be BEFORE "
            "since pet type changes the whole comparison. Sequencing fix confirmed in v3.1 rerun "
            "— now asks pet type before any cost comparison."
        ),
        "feedback_status": "PASS",
    },
    {
        "id": "TQ9_RUSH_HOUR_COMMUTE",
        "question": "How long will the commute actually take during rush hour?",
        "context": {
            "target_move_date": "2026-10-01",
            "visa_type": "Employer-Specific Work Permit",
            "household_composition": "Couple",
            "has_pets": False,
            "origin_location": "Warsaw, Poland",
            "long_term_accommodation_ready": True,
        },
        "expected_classification": "ambiguous",
        "feedback": (
            "Linda [PASS]: Correctly identifies missing variables. "
            "Dense text formatting issue same as TQ6/7 — formatting fix confirmed in v3.1 rerun."
        ),
        "feedback_status": "PASS",
    },
    {
        "id": "TQ10_TENANT_INSURANCE",
        "question": "How much does tenant insurance cost?",
        "context": {
            "target_move_date": "2027-02-01",
            "visa_type": "Study Permit (Grad)",
            "household_composition": "Solo",
            "has_pets": False,
            "origin_location": "Ho Chi Minh City, Vietnam",
            "long_term_accommodation_ready": False,
        },
        "expected_classification": "some_info_known",
        "feedback": (
            "Linda [PASS]. Jia later noted that the answer could benefit from clarification "
            "because tenant insurance depends on property type, location, coverage amount, "
            "and provider. The v3.1 rerun therefore asked property type + coverage level first."
        ),
        "classification_rationale": (
            "Final adjudication (Syeda + Jia): some_info_known. Those missing quote inputs "
            "refine the estimate rather than materially changing the direction of the answer, "
            "so give a useful conditional answer now and ask at most one follow-up if it would "
            "materially sharpen the estimate."
        ),
        "feedback_status": "PASS",
    },

    # ========== BATCH 3: TQ11-TQ20 ==========
    {
        "id": "TQ11_FAMILY_BUDGET_ONE_INCOME",
        "question": "How much should a family with two children budget for housing if we're moving to Toronto on one income?",
        "context": {
            "target_move_date": "2027-03-01",
            "visa_type": "Employer-Specific Work Permit",
            "household_composition": "Family (couple + 2 kids)",
            "has_pets": False,
            "origin_location": "Manchester, UK",
            "long_term_accommodation_ready": False,
        },
        "expected_classification": "ambiguous",
        "feedback": (
            "Jia: treated as 1-person budget problem (30-35% rule), missed that "
            "2 dependent kids changes the risk calculus. Answer was 'ok' but "
            "oversimplified. Fix confirmed in v3.1 rerun — now uses 25-28% rule for "
            "single-income families with dependents instead of generic 30%."
        ),
        "feedback_status": "PASS",
    },
    {
        "id": "TQ12_DOWNTOWN_VS_OUTSIDE_COST",
        "question": "How much cheaper would it be to live outside downtown Toronto if I still need to commute downtown for work every day?",
        "context": {
            "target_move_date": "2026-11-15",
            "visa_type": "Open Work Permit",
            "household_composition": "Couple",
            "has_pets": False,
            "origin_location": "Dublin, Ireland",
            "long_term_accommodation_ready": False,
        },
        "expected_classification": "some_info_known",
        "feedback": (
            "Jia: would have asked for commute time/transit mode/property type, "
            "but says answer + follow-up were fine as-is. No change needed."
        ),
        "feedback_status": "PASS",
    },
    {
        "id": "TQ13_BUDGET_2000_TYPES_AREAS",
        "question": "My housing budget is CAD $2,000 a month. What types of places and areas should I realistically be looking at?",
        "context": {
            "target_move_date": "2026-12-01",
            "visa_type": "Study Permit (Grad — MEng)",
            "household_composition": "Solo",
            "has_pets": False,
            "origin_location": "Cairo, Egypt",
            "long_term_accommodation_ready": False,
        },
        "expected_classification": "ambiguous",
        "feedback": (
            "Jia FAILS this one: answer too generic, unrealistic prices for "
            "specific neighbourhoods, areas may not be relevant. Follow-up "
            "question was good but should have been a clarifying question. "
            "Fix confirmed in v3.1 rerun — now asks for campus/commute preference "
            "before listing any areas."
        ),
        "feedback_status": "PASS",
    },
    {
        "id": "TQ14_KIDS_BEYOND_RENT_CHECKLIST",
        "question": "We're moving with young children. What should we look at besides rent when comparing Toronto neighbourhoods?",
        "context": {
            "target_move_date": "2027-01-20",
            "visa_type": "Permanent Resident (PR)",
            "household_composition": "Family (couple + 2 kids, ages 5 and 8)",
            "has_pets": False,
            "origin_location": "Singapore",
            "long_term_accommodation_ready": False,
        },
        "expected_classification": "loaded",
        "feedback": "Jia: Good — correctly identified as loaded, broke it down well, good follow-up.",
        "feedback_status": "PASS",
    },
    {
        "id": "TQ15_TORONTO_VS_GTA_FAMILY",
        "question": "Is it better for a newcomer family to live in Toronto itself or somewhere else in the GTA like Mississauga, Markham, Richmond Hill, or Vaughan?",
        "context": {
            "target_move_date": "2027-02-15",
            "visa_type": "Permanent Resident (PR)",
            "household_composition": "Family (couple + 1 kid, age 10)",
            "has_pets": False,
            "origin_location": "São Paulo, Brazil",
            "long_term_accommodation_ready": False,
        },
        "expected_classification": "ambiguous",
        "feedback": (
            "Jia: prioritize clarification over loaded-decompose — too many "
            "factors (work location, school type, budget) to just answer. "
            "Follow-up was good. NOTE: v3.1 rerun still classifies this as "
            "some_info_known (answers with comparison + follow-up), not ambiguous "
            "as Jia requested. Output quality is solid but classification doesn't "
            "match her ask — flagged as known edge case in PR, not silently marked PASS."
        ),
        "feedback_status": "NEEDS_RERUN",
    },
    {
        "id": "TQ16_LISTING_MISMATCH_MAINTENANCE",
        "question": "What should I do if I arrive and discover the apartment is very different from the listing or has serious maintenance problems?",
        "context": {
            "target_move_date": "2026-10-05",
            "visa_type": "Study Permit (Grad)",
            "household_composition": "Solo",
            "has_pets": False,
            "origin_location": "Accra, Ghana",
            "long_term_accommodation_ready": True,
        },
        "expected_classification": "ambiguous",
        "feedback": (
            "Jia: should ask what specifically is different / what the problems are "
            "before advising. Sol 5.6 made the same mistake. No follow-up question. "
            "Fix confirmed in v3.1 rerun — now asks what's specifically wrong before "
            "giving any advice."
        ),
        "feedback_status": "PASS",
    },
    {
        "id": "TQ17_HOW_TO_BUY_A_HOUSE",
        "question": "How do I buy a house in Toronto?",
        "context": {
            "target_move_date": "2027-06-01",
            "visa_type": "Permanent Resident (PR)",
            "household_composition": "Couple",
            "has_pets": False,
            "origin_location": "Auckland, New Zealand",
            "long_term_accommodation_ready": True,
        },
        "expected_classification": "loaded",
        "feedback": "Jia: Good — correctly loaded, good follow-up, flagged PR/foreign-buyer-ban.",
        "feedback_status": "PASS",
    },
    {
        "id": "TQ18_MEXICO_DETAILED_MULTIPART",
        "question": (
            "I'm moving alone from Mexico to Toronto on an open work permit in two months, "
            "I have a job near Union Station paying CAD $70,000, no Canadian credit history, "
            "and a maximum housing budget of $2,400 per month—what neighbourhoods should I "
            "consider for a commute under 40 minutes, what type of apartment could I realistically "
            "afford, what documents will landlords expect, how much money will I need upfront, "
            "and how can I safely rent a place before arriving without getting scammed?"
        ),
        "context": {
            "target_move_date": "2026-11-05",
            "visa_type": "Open Work Permit",
            "household_composition": "Solo",
            "has_pets": False,
            "origin_location": "Mexico City, Mexico",
            "annual_income_cad": 70000,
            "monthly_budget_cad": 2400,
            "long_term_accommodation_ready": False,
        },
        "expected_classification": "loaded",
        "feedback": "Jia: Good — correctly loaded, good follow-up. Extra context (income/budget) noted and fine.",
        "feedback_status": "PASS",
    },
    {
        "id": "TQ19_INDIA_FAMILY_PR_DETAILED",
        "question": (
            "My spouse and I are moving from India to Toronto as permanent residents with our "
            "two children, ages 6 and 11, and we need at least three bedrooms on one income of "
            "CAD $95,000—should we live in Toronto or a nearby GTA city, which areas offer good "
            "public schools, safety, transit, parks, and access to an Indian community, how do we "
            "verify which schools the children would attend, and should we rent first or try to "
            "buy soon after arriving?"
        ),
        "context": {
            "target_move_date": "2027-04-01",
            "visa_type": "Permanent Resident (PR)",
            "household_composition": "Family (couple + 2 kids, ages 6 and 11)",
            "has_pets": False,
            "origin_location": "Pune, India",
            "annual_income_cad": 95000,
            "long_term_accommodation_ready": False,
        },
        "expected_classification": "loaded",
        "feedback": (
            "Jia: Good — correctly loaded. But missing follow-up question. "
            "Fix confirmed in v3.1 rerun — now has a follow-up question."
        ),
        "feedback_status": "PASS",
    },
    {
        "id": "TQ20_CHINA_STUDENT_DETAILED",
        "question": (
            "I'm coming from China to study at the University of Toronto, my parents overseas "
            "will pay my housing costs, and my budget is CAD $1,600 per month—should I choose a "
            "university residence, private room, shared apartment, or basement unit, how far from "
            "campus should I search, will landlords accept my parents' financial documents, do I "
            "need a Canadian guarantor or credit score, and what should I check before signing a "
            "lease with roommates?"
        ),
        "context": {
            "target_move_date": "2027-08-25",
            "visa_type": "Study Permit (Undergrad)",
            "household_composition": "Solo",
            "has_pets": False,
            "origin_location": "Shenzhen, China",
            "monthly_budget_cad": 1600,
            "long_term_accommodation_ready": False,
        },
        "expected_classification": "loaded",
        "feedback": (
            "Jia: no specific complaint, noted extra context (budget). "
            "But missing follow-up question. Fix confirmed in v3.1 rerun — "
            "now has a follow-up question."
        ),
        "feedback_status": "PASS",
    },
]

