"""
Test cases for insight extraction evaluation.

Each test case contains a user message (question), the expected insight
deltas that should be extracted, and metadata for the evaluation harness.

These are structured for the eval harness in eval/harness/eval_harness_final.py
but are also usable as unit-test fixtures.
"""

TEST_CASES = [
    # ---------------------------------------------------------------
    # 1. Basic budget extraction
    # ---------------------------------------------------------------
    {
        "case_id": "EXTRACT_001_BUDGET_BASIC",
        "category": "Housing",
        "question": "I'm looking for a 1-bedroom apartment around $1800 per month.",
        "current_insights": {},
        "expected_deltas": [
            {"field": "budget_range", "operation": "set", "value": "$1800 CAD"},
            {"field": "housing_type_preference", "operation": "set", "value": "1-bedroom apartment"},
        ],
    },
    # ---------------------------------------------------------------
    # 2. Neighbourhood extraction
    # ---------------------------------------------------------------
    {
        "case_id": "EXTRACT_002_NEIGHBOURHOOD",
        "category": "Housing",
        "question": "I'd love to live in the Annex or Kensington Market area.",
        "current_insights": {},
        "expected_deltas": [
            {"field": "preferred_neighbourhoods", "operation": "append", "value": ["Annex", "Kensington Market"]},
        ],
    },
    # ---------------------------------------------------------------
    # 3. Move timeline
    # ---------------------------------------------------------------
    {
        "case_id": "EXTRACT_003_TIMELINE",
        "category": "Housing",
        "question": "We're planning to arrive in Toronto by mid-November 2026.",
        "current_insights": {},
        "expected_deltas": [
            {"field": "move_timeline", "operation": "set", "value": "mid-November 2026"},
        ],
    },
    # ---------------------------------------------------------------
    # 4. Household + pets
    # ---------------------------------------------------------------
    {
        "case_id": "EXTRACT_004_HOUSEHOLD_PETS",
        "category": "Housing",
        "question": "It's me, my partner, and our two cats.",
        "current_insights": {},
        "expected_deltas": [
            {"field": "household_details", "operation": "set", "value": "couple"},
            {"field": "pet_situation", "operation": "set", "value": "two cats"},
        ],
    },
    # ---------------------------------------------------------------
    # 5. Commute requirements
    # ---------------------------------------------------------------
    {
        "case_id": "EXTRACT_005_COMMUTE",
        "category": "Housing",
        "question": "I'll be working at the University of Toronto St. George campus and want to take the subway.",
        "current_insights": {},
        "expected_deltas": [
            {"field": "commute_requirements", "operation": "set"},
        ],
    },
    # ---------------------------------------------------------------
    # 6. Deal breakers
    # ---------------------------------------------------------------
    {
        "case_id": "EXTRACT_006_DEALBREAKERS",
        "category": "Housing",
        "question": "I absolutely cannot live in a basement apartment and the building must allow pets.",
        "current_insights": {},
        "expected_deltas": [
            {"field": "deal_breakers", "operation": "append", "value": ["no basement", "must allow pets"]},
        ],
    },
    # ---------------------------------------------------------------
    # 7. Priorities list
    # ---------------------------------------------------------------
    {
        "case_id": "EXTRACT_007_PRIORITIES",
        "category": "Housing",
        "question": "My top priorities are being close to transit, having in-unit laundry, and a quiet neighbourhood.",
        "current_insights": {},
        "expected_deltas": [
            {"field": "priorities", "operation": "append"},
        ],
    },
    # ---------------------------------------------------------------
    # 8. Lease duration
    # ---------------------------------------------------------------
    {
        "case_id": "EXTRACT_008_LEASE",
        "category": "Housing",
        "question": "I want a short-term lease, maybe 3-6 months, until I figure out the city.",
        "current_insights": {},
        "expected_deltas": [
            {"field": "lease_duration", "operation": "set", "value": "3-6 months"},
        ],
    },
    # ---------------------------------------------------------------
    # 9. No-op — no extractable insight
    # ---------------------------------------------------------------
    {
        "case_id": "EXTRACT_009_NOOP",
        "category": "Housing",
        "question": "What documents do I need for a rental application in Ontario?",
        "current_insights": {},
        "expected_deltas": [],
    },
    # ---------------------------------------------------------------
    # 10. Multi-field extraction
    # ---------------------------------------------------------------
    {
        "case_id": "EXTRACT_010_MULTI_FIELD",
        "category": "Housing",
        "question": "I'm a single person on a work permit, budget is $2000-$2500, looking for a condo near downtown, moving in January.",
        "current_insights": {},
        "expected_deltas": [
            {"field": "budget_range", "operation": "set"},
            {"field": "household_details", "operation": "set"},
            {"field": "housing_type_preference", "operation": "set"},
            {"field": "move_timeline", "operation": "set"},
        ],
    },
    # ---------------------------------------------------------------
    # 11. Update existing budget
    # ---------------------------------------------------------------
    {
        "case_id": "EXTRACT_011_UPDATE_BUDGET",
        "category": "Housing",
        "question": "Actually, I can stretch my budget to $2200 per month.",
        "current_insights": {"budget_range": "$1800 CAD"},
        "expected_deltas": [
            {"field": "budget_range", "operation": "set"},
        ],
    },
    # ---------------------------------------------------------------
    # 12. Append to existing neighbourhoods
    # ---------------------------------------------------------------
    {
        "case_id": "EXTRACT_012_APPEND_NEIGHBOURHOOD",
        "category": "Housing",
        "question": "I've also been considering Liberty Village.",
        "current_insights": {"preferred_neighbourhoods": ["Annex", "Kensington Market"]},
        "expected_deltas": [
            {"field": "preferred_neighbourhoods", "operation": "append", "value": ["Liberty Village"]},
        ],
    },
    # ---------------------------------------------------------------
    # 13. Remove from existing list
    # ---------------------------------------------------------------
    {
        "case_id": "EXTRACT_013_REMOVE_NEIGHBOURHOOD",
        "category": "Housing",
        "question": "Actually, scratch the Annex — it's too expensive for me.",
        "current_insights": {"preferred_neighbourhoods": ["Annex", "Kensington Market", "Liberty Village"]},
        "expected_deltas": [
            {"field": "preferred_neighbourhoods", "operation": "remove", "value": ["Annex"]},
        ],
    },
    # ---------------------------------------------------------------
    # 14. Vague / low-confidence extraction
    # ---------------------------------------------------------------
    {
        "case_id": "EXTRACT_014_VAGUE",
        "category": "Housing",
        "question": "I guess somewhere not too far from things would be nice.",
        "current_insights": {},
        "expected_deltas": [],
        "notes": "Too vague to extract concrete preferences. Model should return empty deltas or low confidence.",
    },
    # ---------------------------------------------------------------
    # 15. Housing type change
    # ---------------------------------------------------------------
    {
        "case_id": "EXTRACT_015_TYPE_CHANGE",
        "category": "Housing",
        "question": "I've decided I want a shared house instead of a condo.",
        "current_insights": {"housing_type_preference": "condo"},
        "expected_deltas": [
            {"field": "housing_type_preference", "operation": "set", "value": "shared house"},
        ],
    },
    # ---------------------------------------------------------------
    # 16. Clear field explicitly
    # ---------------------------------------------------------------
    {
        "case_id": "EXTRACT_016_CLEAR",
        "category": "Housing",
        "question": "I don't really care about the neighbourhood anymore, anywhere in the GTA is fine.",
        "current_insights": {"preferred_neighbourhoods": ["Annex", "Liberty Village"]},
        "expected_deltas": [
            {"field": "preferred_neighbourhoods", "operation": "clear"},
        ],
    },
    # ---------------------------------------------------------------
    # 17. Budget range (not a single number)
    # ---------------------------------------------------------------
    {
        "case_id": "EXTRACT_017_BUDGET_RANGE",
        "category": "Housing",
        "question": "My budget is between $1500 and $2000 per month.",
        "current_insights": {},
        "expected_deltas": [
            {"field": "budget_range", "operation": "set"},
        ],
    },
    # ---------------------------------------------------------------
    # 18. Already-known info (should NOT re-extract)
    # ---------------------------------------------------------------
    {
        "case_id": "EXTRACT_018_NO_REEXTRACT",
        "category": "Housing",
        "question": "Can you tell me more about transit in the Annex?",
        "current_insights": {"preferred_neighbourhoods": ["Annex"]},
        "expected_deltas": [],
        "notes": "The user mentions Annex but it's already known. Should not re-extract.",
    },
    # ---------------------------------------------------------------
    # 19. Family with children details
    # ---------------------------------------------------------------
    {
        "case_id": "EXTRACT_019_FAMILY",
        "category": "Housing",
        "question": "We're a family of four — me, my spouse, and two kids ages 5 and 8. We need at least a 2-bedroom.",
        "current_insights": {},
        "expected_deltas": [
            {"field": "household_details", "operation": "set"},
            {"field": "housing_type_preference", "operation": "set"},
        ],
    },
    # ---------------------------------------------------------------
    # 20. Complex multi-intent message
    # ---------------------------------------------------------------
    {
        "case_id": "EXTRACT_020_COMPLEX",
        "category": "Housing",
        "question": "I'm on a study permit, arriving in September, budget max $1600, need to be near UofT, absolutely no shared rooms, and laundry in-unit is a must.",
        "current_insights": {},
        "expected_deltas": [
            {"field": "budget_range", "operation": "set"},
            {"field": "move_timeline", "operation": "set"},
            {"field": "commute_requirements", "operation": "set"},
            {"field": "deal_breakers", "operation": "append"},
            {"field": "priorities", "operation": "append"},
        ],
    },
    # ---------------------------------------------------------------
    # 21. Non-Housing question (should extract nothing)
    # ---------------------------------------------------------------
    {
        "case_id": "EXTRACT_021_WRONG_CATEGORY",
        "category": "Housing",
        "question": "How do I open a bank account in Canada without a SIN number?",
        "current_insights": {},
        "expected_deltas": [],
        "notes": "Finance question asked in Housing context — no housing insights to extract.",
    },
    # ---------------------------------------------------------------
    # 22. Long conversational message
    # ---------------------------------------------------------------
    {
        "case_id": "EXTRACT_022_LONG_MESSAGE",
        "category": "Housing",
        "question": (
            "So I've been thinking about this a lot. I'm coming from Dubai on a "
            "work permit, and I'll be working downtown near King and Bay. My "
            "company gives me a housing allowance of $2500 CAD per month. I'd "
            "prefer something modern — a condo with amenities like a gym. I "
            "definitely need parking because I'm planning to buy a car. I've "
            "heard CityPlace and Harbourfront are good areas but also heard "
            "they're noisy. I'm moving around February."
        ),
        "current_insights": {},
        "expected_deltas": [
            {"field": "budget_range", "operation": "set"},
            {"field": "housing_type_preference", "operation": "set"},
            {"field": "commute_requirements", "operation": "set"},
            {"field": "preferred_neighbourhoods", "operation": "append"},
            {"field": "move_timeline", "operation": "set"},
            {"field": "priorities", "operation": "append"},
        ],
    },
]

