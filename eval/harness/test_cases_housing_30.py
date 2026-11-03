from eval.harness.test_cases_all_20 import TEST_CASES as SYEDA_TEST_CASES
RAHUL_TEST_CASES = [
    {
        "eval_id": "HOUSING_001_NO_CREDIT_STUDENT",
        "category": "Housing",
        "subcategory": "Find Housing",
        "user_id": "rahul_ds1",
        "experiment": "housing_30_e2e",
        "model_provider": "anthropic",
        "model_version": "claude-sonnet-4-6",
        "question": "I don't have a Canadian job offer or credit history, how do I make my rental application competitive?",
        "context": {
            "target_move_date": "2026-11-01",
            "visa_type": "Study Permit",
            "household_composition": "Solo",
            "has_pets": False,
            "origin_location": "Mumbai, India",
            "long_term_accommodation_ready": False,
        },
        "expected_classification": "clear",
        "source_owner": "rahul",
        "prompt_version": "production-v7",
    },
    {
        "eval_id": "HOUSING_002_LANDLORD_PRIORITIES_PR",
        "category": "Housing",
        "subcategory": "Find Housing",
        "user_id": "rahul_ds1",
        "experiment": "housing_30_e2e",
        "model_provider": "anthropic",
        "model_version": "claude-sonnet-4-6",
        "question": "What do landlords in Toronto actually prioritize when reviewing applications?",
        "context": {
            "target_move_date": "2026-11-15",
            "visa_type": "Permanent Resident (PR)",
            "household_composition": "Couple, no kids",
            "has_pets": False,
            "origin_location": "London, UK",
            "long_term_accommodation_ready": False,
        },
        "expected_classification": "clear",
        "source_owner": "rahul",
        "prompt_version": "production-v7",
    },
    {
        "eval_id": "HOUSING_003_DEPOSIT_SCAM_SAFETY",
        "category": "Housing",
        "subcategory": "Check The Place",
        "user_id": "rahul_ds1",
        "experiment": "housing_30_e2e",
        "model_provider": "anthropic",
        "model_version": "claude-sonnet-4-6",
        "question": "Someone is asking me to e-transfer a deposit before I've seen the unit on a live video call. Is that normal?",
        "context": {
            "target_move_date": "2026-10-15",
            "visa_type": "Open Work Permit",
            "household_composition": "Solo",
            "has_pets": False,
            "origin_location": "São Paulo, Brazil",
            "long_term_accommodation_ready": False,
        },
        "expected_classification": "clear",
        "source_owner": "rahul",
        "prompt_version": "production-v7",
    },
    {
        "eval_id": "HOUSING_004_LISTING_VERIFICATION_FAMILY",
        "category": "Housing",
        "subcategory": "Check The Place",
        "user_id": "rahul_ds1",
        "experiment": "housing_30_e2e",
        "model_provider": "anthropic",
        "model_version": "claude-sonnet-4-6",
        "question": "How do I know a listing/address is real before I send money?",
        "context": {
            "target_move_date": "2026-12-01",
            "visa_type": "Employer-Specific Work Permit",
            "household_composition": "Family (Couple + 2 young children)",
            "has_pets": False,
            "origin_location": "Chicago, USA",
            "long_term_accommodation_ready": False,
        },
        "expected_classification": "clear",
        "source_owner": "rahul",
        "prompt_version": "production-v7",
    },
    {
        "eval_id": "HOUSING_005_MANAGED_VS_INDIVIDUAL_PETS",
        "category": "Housing",
        "subcategory": "Compare Housing Options",
        "user_id": "rahul_ds1",
        "experiment": "housing_30_e2e",
        "model_provider": "anthropic",
        "model_version": "claude-sonnet-4-6",
        "question": "What's the difference between renting from a 'managed building' versus an individual owner?",
        "context": {
            "target_move_date": "2027-01-15",
            "visa_type": "Open Work Permit",
            "household_composition": "Couple with 1 medium dog",
            "has_pets": True,
            "origin_location": "Berlin, Germany",
            "long_term_accommodation_ready": False,
        },
        "expected_classification": "clear",
        "source_owner": "rahul",
        "prompt_version": "production-v7",
    },
    {
        "eval_id": "HOUSING_006_BREAK_LEASE_ASSIGNMENT",
        "category": "Housing",
        "subcategory": "Compare Housing Options",
        "user_id": "rahul_ds1",
        "experiment": "housing_30_e2e",
        "model_provider": "anthropic",
        "model_version": "claude-sonnet-4-6",
        "question": "I just signed a 1-year lease two months ago, but I lost my job and need to move to a cheaper place immediately. What happens if I just leave, and how can I get out of the lease legally?",
        "context": {
            "target_move_date": "2026-10-01",
            "visa_type": "Open Work Permit",
            "household_composition": "Solo",
            "has_pets": False,
            "origin_location": "Bogotá, Colombia",
            "long_term_accommodation_ready": True,
        },
        "expected_classification": "loaded",
        "classification_rationale": (
            "Gold adjudication: two distinct asks are present — consequences of simply leaving "
            "and how to exit the lease legally — and both are answerable from the available context."
        ),
        "source_owner": "rahul",
        "prompt_version": "production-v7",
    },
    {
        "eval_id": "HOUSING_007_TIMING_HOUSING_SEARCH_FAR_FUTURE",
        "category": "Housing",
        "subcategory": "Find Housing",
        "user_id": "rahul_ds1",
        "experiment": "housing_30_e2e",
        "model_provider": "anthropic",
        "model_version": "claude-sonnet-4-6",
        "question": "I am moving next summer and want to secure a 1-year lease now. Where should I look for available apartments?",
        "context": {
            "target_move_date": "2027-07-01",
            "visa_type": "Permanent Resident (PR)",
            "household_composition": "Couple, no kids",
            "has_pets": False,
            "origin_location": "Dublin, Ireland",
            "long_term_accommodation_ready": False,
        },
        "expected_classification": "clear",
        "classification_rationale": (
            "Gold adjudication: there is one actual ask (where to look). The far-future timing "
            "is stated intent/context, not a second ask; correcting that premise does not make it loaded."
        ),
        "source_owner": "rahul",
        "prompt_version": "production-v7",
    },
    {
        "eval_id": "HOUSING_008_TEMP_VS_LONG_TERM_FAMILY",
        "category": "Housing",
        "subcategory": "Compare Housing Options",
        "user_id": "rahul_ds1",
        "experiment": "housing_30_e2e",
        "model_provider": "anthropic",
        "model_version": "claude-sonnet-4-6",
        "question": "What's the difference between temporary, short-term, and long-term housing options, and which should I pick?",
        "context": {
            "target_move_date": "2026-11-15",
            "visa_type": "Permanent Resident (PR)",
            "household_composition": "Family (Couple + 1 toddler)",
            "has_pets": False,
            "origin_location": "Dubai, UAE",
            "long_term_accommodation_ready": False,
        },
        "expected_classification": "loaded",
        "classification_rationale": (
            "Gold adjudication: the user asks both for a definitional comparison of housing types "
            "and for a separate personalized recommendation about which to choose."
        ),
        "source_owner": "rahul",
        "prompt_version": "production-v7",
    },
    {
        "eval_id": "HOUSING_009_WINTER_COMMUTE_PLANNING",
        "category": "Housing",
        "subcategory": "Check The Place",
        "user_id": "rahul_ds1",
        "experiment": "housing_30_e2e",
        "model_provider": "anthropic",
        "model_version": "claude-sonnet-4-6",
        "question": "How does winter affect my commute planning in Toronto?",
        "context": {
            "target_move_date": "2026-12-01",
            "visa_type": "Study Permit",
            "household_composition": "Solo",
            "has_pets": False,
            "origin_location": "Cairo, Egypt",
            "long_term_accommodation_ready": False,
        },
        "expected_classification": "clear",
        "source_owner": "rahul",
        "prompt_version": "production-v7",
    },
    {
        "eval_id": "HOUSING_010_SAFETY_STATS_EVALUATION",
        "category": "Housing",
        "subcategory": "Check The Place",
        "user_id": "rahul_ds1",
        "experiment": "housing_30_e2e",
        "model_provider": "anthropic",
        "model_version": "claude-sonnet-4-6",
        "question": "What kind of safety stats should I look at when choosing an area to live in Toronto?",
        "context": {
            "target_move_date": "2026-11-15",
            "visa_type": "Open Work Permit",
            "household_composition": "Solo",
            "has_pets": False,
            "origin_location": "Mexico City, Mexico",
            "long_term_accommodation_ready": False,
        },
        "expected_classification": "clear",
        "source_owner": "rahul",
        "prompt_version": "production-v7",
    },
]


def normalize_syeda_case(case):
    expected_classification = case["expected_classification"]

    normalized = {
        "eval_id": case["id"],
        "category": "Housing",
        "subcategory": "Clarification Policy",
        "user_id": "syeda_ds2",
        "experiment": "housing_30_e2e",
        "model_provider": "anthropic",
        "model_version": "claude-sonnet-4-6",
        "question": case["question"],
        "context": case["context"],
        "source_owner": "syeda",
        "feedback_status": case.get("feedback_status"),
        "original_feedback": case.get("feedback"),
        "classification_rationale": case.get("classification_rationale"),
        "prompt_version": "production-v7",
    }

    if "turn_2_input" in case:
        normalized["interaction_type"] = "multi_turn"
        normalized["expected_classification"] = "ambiguous"
        normalized["turn_2_input"] = case["turn_2_input"]

        normalized["expected_turn_1_classification"] = "ambiguous"
        normalized["expected_turn_2_classification"] = "some_info_known"
    else:
        normalized["interaction_type"] = "single_turn"
        normalized["expected_classification"] = expected_classification

    return normalized


SYEDA_NORMALIZED_CASES = [
    normalize_syeda_case(case)
    for case in SYEDA_TEST_CASES
]


test_cases = RAHUL_TEST_CASES + SYEDA_NORMALIZED_CASES

assert len(RAHUL_TEST_CASES) == 10
assert len(SYEDA_NORMALIZED_CASES) == 20
assert len(test_cases) == 30

assert all("expected_classification" in case for case in test_cases)

ALLOWED_CLASSIFICATIONS = {
    "clear",
    "ambiguous",
    "some_info_known",
    "loaded",
}

for case in test_cases:
    assert case["expected_classification"] in ALLOWED_CLASSIFICATIONS, (
        f"Unexpected classification for {case['eval_id']}: "
        f"{case['expected_classification']}"
    )
