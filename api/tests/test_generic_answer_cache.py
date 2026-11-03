import asyncio
import json
from datetime import UTC, datetime, timedelta
from types import SimpleNamespace

import pytest

from app.gateway import router_stage, runner
from app.gateway.extraction_schema import InsightDeltaResponse
from app.services.model_input_cache import ModelInputCache, SourcePolicy


def _event_name(event: str) -> str:
    return event.splitlines()[0].removeprefix("event: ")


def _event_data(event: str) -> dict:
    return json.loads(event.split("data: ", 1)[1])


async def _collect(
    cache,
    *,
    question="Where can I find official housing resources?",
    user_id="u1",
    category="Housing",
    subcategory="Find Housing",
    **kwargs,
):
    return [
        event
        async for event in runner.run_ai_answer(
            question,
            category,
            subcategory,
            user_id,
            model_input_cache=cache,
            **kwargs,
        )
    ]


@pytest.fixture
def fake_model(monkeypatch):
    calls = []

    async def call_claude(system_prompt, question):
        calls.append((system_prompt, question))
        return {
            "text": "Use official housing resources.",
            "sources": [{"url": "https://example.test", "title": "Official source"}],
            "input_tokens": 12,
            "output_tokens": 6,
            "web_search_requests": 0,
            "model": runner.DEFAULT_MODEL,
        }

    monkeypatch.setattr(runner, "call_claude", call_claude)
    monkeypatch.setattr(runner, "fallback_enabled", lambda: False)
    return calls


def test_generic_answer_cache_is_disabled_by_default(monkeypatch, fake_model):
    monkeypatch.delenv("GENERIC_ANSWER_CACHE_ENABLED", raising=False)
    cache = ModelInputCache()

    first = asyncio.run(_collect(cache))
    second = asyncio.run(_collect(cache, user_id="u2"))

    assert len(fake_model) == 2
    assert _event_data(first[-1])["metadata"]["cache_hit"] is False
    assert _event_data(second[-1])["metadata"]["cache_hit"] is False


def test_generic_answer_cache_hit_preserves_sse_contract(monkeypatch, fake_model):
    monkeypatch.setenv("GENERIC_ANSWER_CACHE_ENABLED", "true")
    cache = ModelInputCache()

    first = asyncio.run(_collect(cache))
    second = asyncio.run(_collect(cache, user_id="u2"))

    assert len(fake_model) == 1
    assert [_event_name(event) for event in first] == ["stage", "complete"]
    assert [_event_name(event) for event in second] == ["stage", "complete"]
    assert _event_data(first[0]) == {"stage": "generating"}
    assert _event_data(second[0]) == {"stage": "generating"}
    assert _event_data(first[-1])["metadata"]["cache_hit"] is False
    cached = _event_data(second[-1])
    assert cached["answer"] == "Use official housing resources."
    assert cached["sources"] == [
        {"url": "https://example.test", "title": "Official source"}
    ]
    assert cached["metadata"]["cache_hit"] is True
    assert cached["metadata"]["input_tokens"] == 0
    assert cached["metadata"]["output_tokens"] == 0
    assert cached["metadata"]["estimated_cost_usd"] == 0


@pytest.mark.parametrize(
    "context",
    [
        {"profile_context": "- Visa type: Study permit"},
        {"conversation_context": "- My budget is $2,000."},
    ],
)
def test_personalized_context_bypasses_generic_cache(monkeypatch, fake_model, context):
    monkeypatch.setenv("GENERIC_ANSWER_CACHE_ENABLED", "true")
    cache = ModelInputCache()

    first = asyncio.run(_collect(cache, **context))
    second = asyncio.run(_collect(cache, **context))

    assert len(fake_model) == 2
    assert _event_data(first[-1])["metadata"]["cache_hit"] is False
    assert _event_data(second[-1])["metadata"]["cache_hit"] is False


def test_prompt_version_change_is_a_cache_miss(monkeypatch, fake_model):
    monkeypatch.setenv("GENERIC_ANSWER_CACHE_ENABLED", "true")
    cache = ModelInputCache()

    monkeypatch.setenv("PROMPT_VERSION", "v1")
    first = asyncio.run(_collect(cache))
    monkeypatch.setenv("PROMPT_VERSION", "v2")
    second = asyncio.run(_collect(cache))

    assert len(fake_model) == 2
    assert _event_data(first[-1])["metadata"]["cache_hit"] is False
    assert _event_data(second[-1])["metadata"]["cache_hit"] is False


def test_category_change_is_a_cache_miss(monkeypatch, fake_model):
    monkeypatch.setenv("GENERIC_ANSWER_CACHE_ENABLED", "true")
    cache = ModelInputCache()

    first = asyncio.run(_collect(cache, category="Housing"))
    second = asyncio.run(_collect(cache, category="Work", subcategory="Find Jobs"))

    assert len(fake_model) == 2
    assert _event_data(first[-1])["metadata"]["cache_hit"] is False
    assert _event_data(second[-1])["metadata"]["cache_hit"] is False


def test_router_flag_change_is_a_cache_miss(monkeypatch, fake_model):
    monkeypatch.setenv("GENERIC_ANSWER_CACHE_ENABLED", "true")
    monkeypatch.delenv("ROUTER_ENABLED", raising=False)
    cache = ModelInputCache()

    first = asyncio.run(_collect(cache))

    async def routed_answer(*args, **kwargs):
        return {
            "product_category": "Housing",
            "category_confidence": "high",
            "safety_action": "allow",
            "safety_category": "none",
            "classification": "clear",
            "should_answer_now": True,
            "missing_blockers": [],
            "material_unknowns": [],
            "clarification_heading": "",
            "clarification_intro": "",
            "clarification_items": [],
            "parse_fallback": False,
            "fail_closed": False,
        }

    monkeypatch.setattr(router_stage, "run_router", routed_answer)
    monkeypatch.setenv("ROUTER_ENABLED", "true")
    second = asyncio.run(_collect(cache, user_id="u2"))

    assert len(fake_model) == 2
    assert _event_data(first[-1])["metadata"]["cache_hit"] is False
    assert _event_data(second[-1])["metadata"]["cache_hit"] is False


def test_category_prompts_flag_change_is_a_cache_miss(monkeypatch, fake_model):
    monkeypatch.setenv("GENERIC_ANSWER_CACHE_ENABLED", "true")
    monkeypatch.delenv("CATEGORY_PROMPTS_ENABLED", raising=False)
    monkeypatch.setattr(runner, "category_block", lambda *args: None)
    cache = ModelInputCache()

    first = asyncio.run(_collect(cache))
    monkeypatch.setenv("CATEGORY_PROMPTS_ENABLED", "true")
    second = asyncio.run(_collect(cache, user_id="u2"))

    assert len(fake_model) == 2
    assert _event_data(first[-1])["metadata"]["cache_hit"] is False
    assert _event_data(second[-1])["metadata"]["cache_hit"] is False


@pytest.mark.parametrize(
    "route",
    [
        {
            "product_category": "Housing",
            "safety_action": "hard_refusal",
            "classification": "clear",
            "should_answer_now": True,
            "fail_closed": False,
        },
        {
            "product_category": "Housing",
            "safety_action": "allow",
            "classification": "ambiguous",
            "should_answer_now": False,
            "clarification_items": ["Which city are you moving to?"],
            "fail_closed": False,
        },
        {
            "product_category": "Housing",
            "safety_action": "allow",
            "classification": "ambiguous",
            "should_answer_now": False,
            "fail_closed": True,
        },
    ],
)
def test_router_only_replies_never_touch_cache(monkeypatch, fake_model, route):
    monkeypatch.setenv("GENERIC_ANSWER_CACHE_ENABLED", "true")
    monkeypatch.setenv("ROUTER_ENABLED", "true")

    async def fixed_route(*args, **kwargs):
        return route

    class TrackingCache(ModelInputCache):
        reads = 0
        writes = 0

        def get(self, cache_key):
            self.reads += 1
            return super().get(cache_key)

        def set(self, cache_key, **kwargs):
            self.writes += 1
            return super().set(cache_key, **kwargs)

    monkeypatch.setattr(router_stage, "run_router", fixed_route)
    cache = TrackingCache()
    events = asyncio.run(_collect(cache))

    assert len(fake_model) == 0
    assert cache.reads == 0
    assert cache.writes == 0
    assert _event_name(events[-1]) == "complete"


def test_saved_router_transcript_bypasses_generic_cache(monkeypatch, fake_model):
    monkeypatch.setenv("GENERIC_ANSWER_CACHE_ENABLED", "true")
    monkeypatch.setenv("ROUTER_ENABLED", "true")

    async def routed_answer(*args, **kwargs):
        return {
            "product_category": "Housing",
            "category_confidence": "high",
            "safety_action": "allow",
            "safety_category": "none",
            "classification": "clear",
            "should_answer_now": True,
            "missing_blockers": [],
            "material_unknowns": [],
            "clarification_heading": "",
            "clarification_intro": "",
            "clarification_items": [],
            "parse_fallback": False,
            "fail_closed": False,
        }

    monkeypatch.setattr(router_stage, "run_router", routed_answer)
    monkeypatch.setattr(
        router_stage,
        "previous_clarification_turn",
        lambda *args: [
            {"role": "user", "content": "My budget is $2,000."},
            {"role": "assistant", "content": "Which city are you moving to?"},
        ],
    )
    cache = ModelInputCache()

    first = asyncio.run(_collect(cache))
    second = asyncio.run(_collect(cache, user_id="u2"))

    assert len(fake_model) == 2
    assert _event_data(first[-1])["metadata"]["cache_hit"] is False
    assert _event_data(second[-1])["metadata"]["cache_hit"] is False


def test_model_change_is_a_cache_miss(monkeypatch, fake_model):
    monkeypatch.setenv("GENERIC_ANSWER_CACHE_ENABLED", "true")
    cache = ModelInputCache()

    first = asyncio.run(_collect(cache))
    monkeypatch.setattr(runner, "DEFAULT_MODEL", "replacement-model")
    second = asyncio.run(_collect(cache))

    assert len(fake_model) == 2
    assert _event_data(first[-1])["metadata"]["cache_hit"] is False
    assert _event_data(second[-1])["metadata"]["cache_hit"] is False


def test_source_snapshot_change_is_a_cache_miss(monkeypatch, fake_model):
    monkeypatch.setenv("GENERIC_ANSWER_CACHE_ENABLED", "true")

    class MutablePolicyCache(ModelInputCache):
        snapshot = "snapshot-1"

        def resolve_source_policy(self, category, subcategory):
            return SourcePolicy(snapshot=self.snapshot, ttl_seconds=900)

    cache = MutablePolicyCache()
    first = asyncio.run(_collect(cache))
    cache.snapshot = "snapshot-2"
    second = asyncio.run(_collect(cache))

    assert len(fake_model) == 2
    assert _event_data(first[-1])["metadata"]["cache_hit"] is False
    assert _event_data(second[-1])["metadata"]["cache_hit"] is False


def test_saved_insights_bypass_generic_cache(monkeypatch, fake_model):
    monkeypatch.setenv("GENERIC_ANSWER_CACHE_ENABLED", "true")

    class InsightStore:
        def load_insights(self, user_id, category):
            return {"budget_range": "$2,000"}

        def save_insights(self, user_id, category, insights):
            raise AssertionError("No new insight should be saved")

    async def no_new_insights(**kwargs):
        return InsightDeltaResponse(category="Housing", deltas=[])

    monkeypatch.setattr(runner, "extract_insights", no_new_insights)
    cache = ModelInputCache()

    first = asyncio.run(_collect(cache, insight_store=InsightStore()))
    second = asyncio.run(_collect(cache, insight_store=InsightStore()))

    assert len(fake_model) == 2
    assert _event_data(first[-1])["metadata"]["cache_hit"] is False
    assert _event_data(second[-1])["metadata"]["cache_hit"] is False


def test_empty_production_insight_store_hits_before_extraction(monkeypatch, fake_model):
    monkeypatch.setenv("GENERIC_ANSWER_CACHE_ENABLED", "true")
    extraction_calls = []

    class EmptyInsightStore:
        def load_insights(self, user_id, category):
            return {}

        def save_insights(self, user_id, category, insights):
            raise AssertionError("No new insight should be saved")

    async def no_insights(**kwargs):
        extraction_calls.append(kwargs)
        return InsightDeltaResponse(category="Housing", deltas=[])

    monkeypatch.setattr(runner, "extract_insights", no_insights)
    cache = ModelInputCache()

    first = asyncio.run(_collect(cache, insight_store=EmptyInsightStore()))
    second = asyncio.run(_collect(cache, insight_store=EmptyInsightStore()))

    assert len(fake_model) == 1
    assert len(extraction_calls) == 1
    assert _event_data(first[-1])["metadata"]["cache_hit"] is False
    assert _event_data(second[0]) == {"stage": "generating"}
    assert _event_data(second[-1])["metadata"]["cache_hit"] is True


def test_apparent_personal_information_bypasses_generic_cache(
    monkeypatch, fake_model
):
    monkeypatch.setenv("GENERIC_ANSWER_CACHE_ENABLED", "true")
    cache = ModelInputCache()
    question = "I'm a 25yo student with a cat moving to Jersey City, what do I need?"

    first = asyncio.run(_collect(cache, question=question))
    second = asyncio.run(_collect(cache, question=question, user_id="u2"))

    assert len(fake_model) == 2
    assert _event_data(first[-1])["metadata"]["cache_hit"] is False
    assert _event_data(second[-1])["metadata"]["cache_hit"] is False


@pytest.mark.parametrize(
    "question",
    [
        "What documents do I need to move to Toronto?",
        "What are my rights as a tenant?",
        "Tell us about the landlord and tenant board",
        "Where do I register my address after moving?",
        "Tell me about security deposits",
    ],
)
def test_common_first_person_questions_remain_cacheable(question):
    assert runner._question_is_generic_cache_safe(question)


@pytest.mark.parametrize(
    "question",
    [
        "Email me at newcomer@example.com",
        "My postal code is M5V 3A8",
        "I am an international student",
        "I have two children and a cat",
        "My budget is $2,000",
    ],
)
def test_identifying_or_personal_facts_are_not_cacheable(question):
    assert not runner._question_is_generic_cache_safe(question)


def test_insight_extraction_failure_prevents_cache_write(monkeypatch, fake_model):
    monkeypatch.setenv("GENERIC_ANSWER_CACHE_ENABLED", "true")

    class EmptyInsightStore:
        def load_insights(self, user_id, category):
            return {}

    async def failed_extraction(**kwargs):
        raise RuntimeError("extractor unavailable")

    monkeypatch.setattr(runner, "extract_insights", failed_extraction)
    cache = ModelInputCache()

    first = asyncio.run(_collect(cache, insight_store=EmptyInsightStore()))
    second = asyncio.run(_collect(cache, insight_store=EmptyInsightStore()))

    assert len(fake_model) == 2
    assert _event_data(first[-1])["metadata"]["cache_hit"] is False
    assert _event_data(second[-1])["metadata"]["cache_hit"] is False


def test_runner_clamps_generic_answer_ttl_to_thirty_minutes(
    monkeypatch, fake_model
):
    monkeypatch.setenv("GENERIC_ANSWER_CACHE_ENABLED", "true")
    now = [datetime(2026, 9, 29, tzinfo=UTC)]

    class LongSourcePolicyCache(ModelInputCache):
        def resolve_source_policy(self, category, subcategory):
            return SourcePolicy(snapshot="stable-snapshot", ttl_seconds=24 * 60 * 60)

    cache = LongSourcePolicyCache(clock=lambda: now[0])
    first = asyncio.run(_collect(cache))
    now[0] += timedelta(seconds=1799)
    second = asyncio.run(_collect(cache, user_id="u2"))
    now[0] += timedelta(seconds=2)
    third = asyncio.run(_collect(cache, user_id="u3"))

    assert len(fake_model) == 2
    assert _event_data(first[-1])["metadata"]["cache_hit"] is False
    assert _event_data(second[-1])["metadata"]["cache_hit"] is True
    assert _event_data(third[-1])["metadata"]["cache_hit"] is False


class _SharedSupabaseQuery:
    def __init__(self, client, table):
        self.client = client
        self.table = table
        self.filters = {}
        self.greater_than_filters = {}
        self.upsert_row = None

    def select(self, fields):
        return self

    def eq(self, field, value):
        self.filters[field] = value
        return self

    def gt(self, field, value):
        self.greater_than_filters[field] = value
        return self

    def limit(self, count):
        return self

    def upsert(self, row, on_conflict=None):
        self.upsert_row = row
        return self

    def execute(self):
        if self.upsert_row is not None:
            self.client.cache_rows[self.upsert_row["cache_key"]] = self.upsert_row
            return SimpleNamespace(data=[self.upsert_row])
        if self.table in {"claim_store", "static_content"}:
            return SimpleNamespace(data=[])
        row = self.client.cache_rows.get(self.filters.get("cache_key"))
        if row and any(
            row.get(field, "") <= value
            for field, value in self.greater_than_filters.items()
        ):
            row = None
        return SimpleNamespace(data=[row] if row else [])


class _SharedSupabase:
    def __init__(self):
        self.cache_rows = {}

    def table(self, name):
        return _SharedSupabaseQuery(self, name)


def test_fresh_cache_instance_reads_shared_supabase_entry(monkeypatch, fake_model):
    monkeypatch.setenv("GENERIC_ANSWER_CACHE_ENABLED", "true")
    supabase = _SharedSupabase()

    first = asyncio.run(_collect(ModelInputCache(supabase)))
    second = asyncio.run(_collect(ModelInputCache(supabase), user_id="u2"))

    assert len(fake_model) == 1
    assert supabase.cache_rows
    assert _event_data(first[-1])["metadata"]["cache_hit"] is False
    assert _event_data(second[0]) == {"stage": "generating"}
    assert _event_data(second[-1])["metadata"]["cache_hit"] is True


def test_expired_shared_supabase_entry_is_not_served(monkeypatch, fake_model):
    monkeypatch.setenv("GENERIC_ANSWER_CACHE_ENABLED", "true")
    supabase = _SharedSupabase()
    now = datetime(2026, 9, 29, tzinfo=UTC)

    first = asyncio.run(
        _collect(ModelInputCache(supabase, clock=lambda: now))
    )
    second = asyncio.run(
        _collect(
            ModelInputCache(
                supabase,
                clock=lambda: now + timedelta(seconds=901),
            ),
            user_id="u2",
        )
    )

    assert len(fake_model) == 2
    assert _event_data(first[-1])["metadata"]["cache_hit"] is False
    assert _event_data(second[-1])["metadata"]["cache_hit"] is False


def test_cache_failure_falls_back_to_live_generation(monkeypatch, fake_model):
    monkeypatch.setenv("GENERIC_ANSWER_CACHE_ENABLED", "true")

    class BrokenCache(ModelInputCache):
        def get(self, cache_key):
            raise RuntimeError("cache unavailable")

        def set(self, cache_key, **kwargs):
            raise RuntimeError("cache unavailable")

    events = asyncio.run(_collect(BrokenCache()))

    assert len(fake_model) == 1
    assert [_event_name(event) for event in events] == ["stage", "complete"]
    assert _event_data(events[-1])["metadata"]["cache_hit"] is False

