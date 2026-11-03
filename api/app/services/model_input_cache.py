from __future__ import annotations

import hashlib
import json
import logging
from collections import OrderedDict
from collections.abc import Callable
from copy import deepcopy
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Any

logger = logging.getLogger(__name__)

DEFAULT_TTL_SECONDS = 15 * 60
MAX_GENERIC_ANSWER_TTL_SECONDS = 30 * 60
MAX_SOURCE_TTL_SECONDS = 24 * 60 * 60
ALLOWED_NAMESPACES = {"official_excerpt", "public_fact", "generic_answer"}
_FORBIDDEN_PAYLOAD_KEYS = {
    "conversation_id",
    "profile_context",
    "preference_summary",
    "question",
    "raw_question",
    "user_id",
}


def _find_forbidden_keys(value: Any) -> set[str]:
    if isinstance(value, dict):
        found = _FORBIDDEN_PAYLOAD_KEYS.intersection(value)
        for nested in value.values():
            found.update(_find_forbidden_keys(nested))
        return found
    if isinstance(value, list):
        found: set[str] = set()
        for nested in value:
            found.update(_find_forbidden_keys(nested))
        return found
    return set()


@dataclass(frozen=True)
class SourcePolicy:
    snapshot: str
    ttl_seconds: int


@dataclass
class _MemoryEntry:
    namespace: str
    expires_at: datetime
    payload: dict[str, Any]


class ModelInputCache:
    """Bounded memory front layer plus optional shared Supabase persistence."""

    def __init__(
        self,
        supabase=None,
        *,
        max_items: int = 256,
        clock: Callable[[], datetime] | None = None,
    ):
        self.supabase = supabase
        self.max_items = max_items
        self._clock = clock or (lambda: datetime.now(UTC))
        self._items: OrderedDict[str, _MemoryEntry] = OrderedDict()

    @staticmethod
    def normalize(value: str) -> str:
        return " ".join(value.strip().casefold().split())

    @classmethod
    def question_hash(cls, question: str) -> str:
        return hashlib.sha256(cls.normalize(question).encode()).hexdigest()

    @classmethod
    def build_key(
        cls,
        *,
        namespace: str,
        category: str,
        subcategory: str,
        source_snapshot: str,
        question: str = "",
        prompt_version: str = "",
        model: str = "",
    ) -> str:
        if namespace not in ALLOWED_NAMESPACES:
            raise ValueError(f"Unsupported cache namespace: {namespace}")

        identity = {
            "namespace": namespace,
            "category": cls.normalize(category),
            "subcategory": cls.normalize(subcategory),
            "source_snapshot": source_snapshot,
            "question_hash": cls.question_hash(question) if question else "",
            "prompt_version": prompt_version,
            "model": model,
        }
        encoded = json.dumps(identity, sort_keys=True, separators=(",", ":"))
        return hashlib.sha256(encoded.encode()).hexdigest()

    def get(self, cache_key: str) -> dict[str, Any] | None:
        now = self._clock()
        memory_entry = self._items.get(cache_key)
        if memory_entry:
            if memory_entry.expires_at > now:
                self._items.move_to_end(cache_key)
                return deepcopy(memory_entry.payload)
            self._items.pop(cache_key, None)

        if self.supabase is None:
            return None

        try:
            result = (
                self.supabase.table("model_input_cache")
                .select("namespace,payload,expires_at")
                .eq("cache_key", cache_key)
                .gt("expires_at", now.isoformat())
                .limit(1)
                .execute()
            )
        except Exception:
            logger.warning("Shared model cache read failed; continuing without cache")
            return None

        if not result.data:
            return None

        row = result.data[0]
        expires_at = self._parse_datetime(row["expires_at"])
        payload = row["payload"]
        self._remember(cache_key, row["namespace"], payload, expires_at)
        return deepcopy(payload)

    def set(
        self,
        cache_key: str,
        *,
        namespace: str,
        category: str,
        subcategory: str,
        source_snapshot: str,
        payload: dict[str, Any],
        ttl_seconds: int = DEFAULT_TTL_SECONDS,
        question_hash: str | None = None,
        prompt_version: str | None = None,
        model: str | None = None,
    ) -> bool:
        if namespace not in ALLOWED_NAMESPACES:
            raise ValueError(f"Unsupported cache namespace: {namespace}")
        max_ttl_seconds = (
            MAX_GENERIC_ANSWER_TTL_SECONDS
            if namespace == "generic_answer"
            else MAX_SOURCE_TTL_SECONDS
        )
        if not DEFAULT_TTL_SECONDS <= ttl_seconds <= max_ttl_seconds:
            raise ValueError(
                "ttl_seconds must be between "
                f"{DEFAULT_TTL_SECONDS} and {max_ttl_seconds} "
                f"for {namespace}"
            )
        forbidden = _find_forbidden_keys(payload)
        if forbidden:
            names = ", ".join(sorted(forbidden))
            raise ValueError(f"Cache payload contains forbidden personalized fields: {names}")

        expires_at = self._clock() + timedelta(seconds=ttl_seconds)
        self._remember(cache_key, namespace, payload, expires_at)

        if self.supabase is None:
            return True

        row = {
            "cache_key": cache_key,
            "namespace": namespace,
            "category": category.strip(),
            "subcategory": subcategory.strip(),
            "question_hash": question_hash,
            "source_snapshot": source_snapshot,
            "prompt_version": prompt_version,
            "model": model,
            "payload": deepcopy(payload),
            "expires_at": expires_at.isoformat(),
            "updated_at": self._clock().isoformat(),
        }
        try:
            self.supabase.table("model_input_cache").upsert(
                row, on_conflict="cache_key"
            ).execute()
        except Exception:
            logger.warning("Shared model cache write failed; using memory cache only")
            return False
        return True

    def resolve_source_policy(self, category: str, subcategory: str) -> SourcePolicy | None:
        """Hash current curated rows and return the strictest source TTL."""
        if self.supabase is None:
            snapshot = self._hash_json({"sources": [], "mode": "local"})
            return SourcePolicy(snapshot=snapshot, ttl_seconds=DEFAULT_TTL_SECONDS)

        try:
            claim_rows = (
                self.supabase.table("claim_store")
                .select(
                    "id,claim_value,content_hash,effective_date,retrieved_at,updated_at,"
                    "source:trusted_sources(id,url,authority_tier,cache_ttl_seconds)"
                )
                .eq("category", category)
                .eq("subcategory", subcategory)
                .execute()
                .data
            )
            content_rows = (
                self.supabase.table("static_content")
                .select(
                    "id,section_key,body_markdown,updated_at,"
                    "source:trusted_sources(id,url,authority_tier,cache_ttl_seconds)"
                )
                .eq("category", category)
                .eq("subcategory", subcategory)
                .execute()
                .data
            )
        except Exception:
            logger.warning("Could not resolve source snapshot; skipping shared answer cache")
            return None

        claim_rows = sorted(claim_rows or [], key=lambda row: str(row.get("id", "")))
        content_rows = sorted(
            content_rows or [],
            key=lambda row: (str(row.get("section_key", "")), str(row.get("id", ""))),
        )
        rows = {"claims": claim_rows, "static_content": content_rows}
        ttls = [
            source["cache_ttl_seconds"]
            for row in [*claim_rows, *content_rows]
            if (source := row.get("source")) and source.get("cache_ttl_seconds")
        ]
        ttl_seconds = min(ttls, default=DEFAULT_TTL_SECONDS)
        ttl_seconds = min(
            max(int(ttl_seconds), DEFAULT_TTL_SECONDS),
            MAX_SOURCE_TTL_SECONDS,
        )
        return SourcePolicy(snapshot=self._hash_json(rows), ttl_seconds=ttl_seconds)

    def delete_expired(self) -> int:
        now = self._clock()
        expired_keys = [key for key, item in self._items.items() if item.expires_at <= now]
        for key in expired_keys:
            self._items.pop(key, None)

        if self.supabase is not None:
            try:
                self.supabase.table("model_input_cache").delete().lt(
                    "expires_at", now.isoformat()
                ).execute()
            except Exception:
                logger.warning("Shared model cache cleanup failed")
        return len(expired_keys)

    def invalidate_namespace(self, namespace: str) -> int:
        keys = [key for key, item in self._items.items() if item.namespace == namespace]
        for key in keys:
            self._items.pop(key, None)

        if self.supabase is not None:
            try:
                self.supabase.table("model_input_cache").delete().eq(
                    "namespace", namespace
                ).execute()
            except Exception:
                logger.warning("Shared model cache namespace invalidation failed")
        return len(keys)

    def _remember(
        self,
        cache_key: str,
        namespace: str,
        payload: dict[str, Any],
        expires_at: datetime,
    ) -> None:
        if self.max_items <= 0:
            return
        if cache_key not in self._items and len(self._items) >= self.max_items:
            self._items.popitem(last=False)
        self._items[cache_key] = _MemoryEntry(namespace, expires_at, deepcopy(payload))
        self._items.move_to_end(cache_key)

    @staticmethod
    def _parse_datetime(value: str | datetime) -> datetime:
        if isinstance(value, datetime):
            return value if value.tzinfo else value.replace(tzinfo=UTC)
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
        return parsed if parsed.tzinfo else parsed.replace(tzinfo=UTC)

    @staticmethod
    def _hash_json(value: Any) -> str:
        encoded = json.dumps(value, sort_keys=True, separators=(",", ":"), default=str)
        return hashlib.sha256(encoded.encode()).hexdigest()

