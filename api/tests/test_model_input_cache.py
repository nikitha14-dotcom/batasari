from datetime import UTC, datetime, timedelta
from unittest.mock import MagicMock

import pytest

from app.services.model_input_cache import (
    DEFAULT_TTL_SECONDS,
    MAX_GENERIC_ANSWER_TTL_SECONDS,
    MAX_SOURCE_TTL_SECONDS,
    ModelInputCache,
)


class _Result:
    def __init__(self, data):
        self.data = data


class _Query:
    def __init__(self, rows):
        self.rows = rows

    def select(self, *_args):
        return self

    def eq(self, *_args):
        return self

    def execute(self):
        return _Result(self.rows)


class _SourceSupabase:
    def __init__(self, claims, content):
        self.claims = claims
        self.content = content

    def table(self, name):
        return _Query(self.claims if name == "claim_store" else self.content)


def _key(question="Where can I find housing?"):
    return ModelInputCache.build_key(
        namespace="generic_answer",
        category="Housing",
        subcategory="Find Housing",
        question=question,
        source_snapshot="snapshot-v1",
        prompt_version="v1",
        model="claude-sonnet-4-6",
    )


def test_key_is_deterministic_and_normalizes_question():
    assert _key("  WHERE   can I find housing? ") == _key("where can i find housing?")
    assert _key("Where can I compare housing?") != _key()


def test_source_prompt_and_model_changes_invalidate_key():
    common = {
        "namespace": "generic_answer",
        "category": "Housing",
        "subcategory": "Find Housing",
        "question": "Where should I look?",
        "source_snapshot": "snapshot-v1",
        "prompt_version": "v1",
        "model": "claude-sonnet-4-6",
    }
    original = ModelInputCache.build_key(**common)

    for field, value in (
        ("source_snapshot", "snapshot-v2"),
        ("prompt_version", "v2"),
        ("model", "another-model"),
    ):
        changed = {**common, field: value}
        assert ModelInputCache.build_key(**changed) != original


def test_source_policy_is_order_independent_and_changes_with_content():
    source_a = {
        "id": "source-a",
        "url": "https://example.com/a",
        "authority_tier": "A",
        "cache_ttl_seconds": 900,
    }
    source_b = {
        "id": "source-b",
        "url": "https://example.com/b",
        "authority_tier": "B",
        "cache_ttl_seconds": 1800,
    }
    claims = [
        {
            "id": "claim-b",
            "claim_value": "Second approved fact",
            "content_hash": "hash-b",
            "effective_date": "2026-09-01",
            "retrieved_at": "2026-09-18T00:00:00Z",
            "updated_at": "2026-09-18T00:00:00Z",
            "source": source_b,
        },
        {
            "id": "claim-a",
            "claim_value": "First approved fact",
            "content_hash": "hash-a",
            "effective_date": "2026-09-01",
            "retrieved_at": "2026-09-18T00:00:00Z",
            "updated_at": "2026-09-18T00:00:00Z",
            "source": source_a,
        },
    ]
    content = [
        {
            "id": "content-a",
            "section_key": "overview",
            "body_markdown": "Approved content",
            "updated_at": "2026-09-18T00:00:00Z",
            "source": source_a,
        }
    ]

    first = ModelInputCache(_SourceSupabase(claims, content)).resolve_source_policy(
        "Housing", "Find Housing"
    )
    reordered = ModelInputCache(
        _SourceSupabase(list(reversed(claims)), content)
    ).resolve_source_policy("Housing", "Find Housing")
    changed_claims = [{**claims[0], "claim_value": "Changed fact"}, claims[1]]
    changed = ModelInputCache(
        _SourceSupabase(changed_claims, content)
    ).resolve_source_policy("Housing", "Find Housing")

    assert first is not None
    assert reordered is not None
    assert changed is not None
    assert first.snapshot == reordered.snapshot
    assert first.snapshot != changed.snapshot
    assert first.ttl_seconds == DEFAULT_TTL_SECONDS


def test_memory_hit_expiry_and_cleanup():
    now = [datetime(2026, 9, 18, tzinfo=UTC)]
    cache = ModelInputCache(clock=lambda: now[0])
    key = _key()
    cache.set(
        key,
        namespace="generic_answer",
        category="Housing",
        subcategory="Find Housing",
        source_snapshot="snapshot-v1",
        payload={"answer": "Use approved listing sources."},
        ttl_seconds=900,
    )

    assert cache.get(key) == {"answer": "Use approved listing sources."}

    now[0] += timedelta(seconds=901)
    assert cache.get(key) is None
    assert cache.delete_expired() == 0  # get already removed the expired entry


def test_memory_cache_keeps_an_independent_payload_copy():
    cache = ModelInputCache()
    key = _key()
    payload = {"answer": {"text": "Use approved sources.", "sources": ["official"]}}
    cache.set(
        key,
        namespace="generic_answer",
        category="Housing",
        subcategory="Find Housing",
        source_snapshot="snapshot-v1",
        payload=payload,
    )

    payload["answer"]["sources"].append("changed after set")
    first_result = cache.get(key)
    assert first_result is not None
    first_result["answer"]["sources"].append("changed after get")

    assert cache.get(key) == {
        "answer": {"text": "Use approved sources.", "sources": ["official"]}
    }


def test_memory_cache_evicts_least_recently_used_entry():
    cache = ModelInputCache(max_items=2)
    first_key = _key("first")
    second_key = _key("second")
    third_key = _key("third")
    common = {
        "namespace": "generic_answer",
        "category": "Housing",
        "subcategory": "Find Housing",
        "source_snapshot": "snapshot-v1",
    }

    cache.set(first_key, payload={"answer": "first"}, **common)
    cache.set(second_key, payload={"answer": "second"}, **common)
    assert cache.get(first_key) == {"answer": "first"}

    cache.set(third_key, payload={"answer": "third"}, **common)

    assert cache.get(second_key) is None
    assert cache.get(first_key) == {"answer": "first"}
    assert cache.get(third_key) == {"answer": "third"}


def test_rejects_excessive_ttl_and_personalized_fields():
    cache = ModelInputCache()
    arguments = {
        "cache_key": _key(),
        "namespace": "generic_answer",
        "category": "Housing",
        "subcategory": "Find Housing",
        "source_snapshot": "snapshot-v1",
    }

    with pytest.raises(ValueError, match="ttl_seconds"):
        cache.set(
            **arguments,
            payload={"answer": "generic"},
            ttl_seconds=MAX_GENERIC_ANSWER_TTL_SECONDS + 1,
        )

    with pytest.raises(ValueError, match="ttl_seconds"):
        cache.set(**arguments, payload={"answer": "generic"}, ttl_seconds=DEFAULT_TTL_SECONDS - 1)

    with pytest.raises(ValueError, match="user_id"):
        cache.set(**arguments, payload={"answer": "generic", "user_id": "u1"})

    with pytest.raises(ValueError, match="profile_context"):
        cache.set(
            **arguments,
            payload={"answer": "generic", "metadata": {"profile_context": "private"}},
        )


def test_source_cache_accepts_longer_ttl_than_generic_answers():
    cache = ModelInputCache()
    key = ModelInputCache.build_key(
        namespace="official_excerpt",
        category="Work",
        subcategory="Employee Rights",
        source_snapshot="snapshot-v1",
    )
    arguments = {
        "cache_key": key,
        "namespace": "official_excerpt",
        "category": "Work",
        "subcategory": "Employee Rights",
        "source_snapshot": "snapshot-v1",
        "payload": {"excerpt": "Approved official guidance."},
    }

    assert cache.set(**arguments, ttl_seconds=MAX_SOURCE_TTL_SECONDS) is True

    with pytest.raises(ValueError, match="ttl_seconds"):
        cache.set(**arguments, ttl_seconds=MAX_SOURCE_TTL_SECONDS + 1)


def test_namespace_invalidation_is_scoped():
    cache = ModelInputCache()
    generic_key = _key()
    public_key = ModelInputCache.build_key(
        namespace="public_fact",
        category="Housing",
        subcategory="Find Housing",
        source_snapshot="snapshot-v1",
    )
    common = {
        "category": "Housing",
        "subcategory": "Find Housing",
        "source_snapshot": "snapshot-v1",
        "payload": {"answer": "value"},
    }
    cache.set(generic_key, namespace="generic_answer", **common)
    cache.set(public_key, namespace="public_fact", **common)

    assert cache.invalidate_namespace("generic_answer") == 1
    assert cache.get(generic_key) is None
    assert cache.get(public_key) is not None


def test_shared_store_failures_are_fail_open():
    supabase = MagicMock()
    supabase.table.side_effect = RuntimeError("database unavailable")
    cache = ModelInputCache(supabase)

    assert cache.get(_key()) is None
    assert cache.resolve_source_policy("Housing", "Find Housing") is None

    assert cache.set(
        _key(),
        namespace="generic_answer",
        category="Housing",
        subcategory="Find Housing",
        source_snapshot="snapshot-v1",
        payload={"answer": "still available from memory"},
    ) is False
    assert cache.get(_key()) == {"answer": "still available from memory"}

