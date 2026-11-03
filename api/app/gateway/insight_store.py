"""
Storage abstraction for user insights and conversation history.

MVP implementation uses JSON files on the local filesystem.  The abstract
base class (``InsightStoreBase``) defines the contract so a future Supabase
implementation can be dropped in without changing callers.

File layout (relative to DATA_DIR):
    insights/<user_id>/<category>.json
    conversations/<user_id>/<category>/<conversation_id>.json
"""
from __future__ import annotations

import json
import logging
import os
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

# Default to a .data directory next to the api/ package.  Override with
# the INSIGHT_DATA_DIR env var in production if the default is not writable.
_DEFAULT_DATA_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    ".data",
)

DATA_DIR = os.getenv("INSIGHT_DATA_DIR", "").strip() or _DEFAULT_DATA_DIR


# ---------------------------------------------------------------------------
# Abstract base
# ---------------------------------------------------------------------------

class InsightStoreBase(ABC):
    """Contract for insight + conversation persistence."""

    # -- Insights ----------------------------------------------------------

    @abstractmethod
    def load_insights(self, user_id: str, category: str) -> dict[str, Any]:
        """Return the accumulated insight dict, or ``{}`` if none exists."""

    @abstractmethod
    def save_insights(
        self, user_id: str, category: str, insights: dict[str, Any]
    ) -> None:
        """Persist the full insight dict (overwrite)."""

    @abstractmethod
    def delete_insights(
        self, user_id: str, category: str | None = None
    ) -> None:
        """Delete insights.  If *category* is None, delete all categories."""

    # -- Conversation history ----------------------------------------------

    @abstractmethod
    def load_conversation(
        self, user_id: str, category: str, conversation_id: str
    ) -> list[dict[str, Any]]:
        """Return the message list for one conversation, or ``[]``."""

    @abstractmethod
    def save_message(
        self,
        user_id: str,
        category: str,
        conversation_id: str,
        role: str,
        content: str,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        """Append a single message to a conversation."""

    @abstractmethod
    def delete_conversations(
        self, user_id: str, category: str | None = None
    ) -> None:
        """Delete conversation history.  If *category* is None, delete all."""


# ---------------------------------------------------------------------------
# JSON file implementation
# ---------------------------------------------------------------------------

class JsonInsightStore(InsightStoreBase):
    """JSON-file-backed store.  Not durable across container restarts — this
    is an MVP implementation choice documented in the plan."""

    def __init__(self, data_dir: str | None = None):
        self._root = Path(data_dir or DATA_DIR)

    # -- helpers -----------------------------------------------------------

    @staticmethod
    def _name(value: str) -> str:
        # category comes from the request body, and its allowed characters
        # include "/" and "." (subcategory names need them). Used as-is in a
        # path, a category of "../<other user id>/Housing" reads, writes or
        # deletes another user's files, or files anywhere on the server.
        if not value or value in (".", "..") or any(c in value for c in "/\\:\0"):
            raise ValueError(f"Not a plain name: {value!r}")
        return value

    def _path(self, *parts: str) -> Path:
        path = self._root.joinpath(*parts)
        if not path.resolve().is_relative_to(self._root.resolve()):
            raise ValueError(f"Path escapes the data directory: {parts!r}")
        return path

    def _insight_path(self, user_id: str, category: str) -> Path:
        return self._path(
            "insights", self._name(user_id), f"{self._name(category)}.json"
        )

    def _conversation_path(
        self, user_id: str, category: str, conversation_id: str
    ) -> Path:
        return self._path(
            "conversations",
            self._name(user_id),
            self._name(category),
            f"{self._name(conversation_id)}.json",
        )

    @staticmethod
    def _read_json(path: Path) -> Any:
        if not path.exists():
            return None
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError) as exc:
            logger.warning("Failed to read %s: %s", path, exc)
            return None

    @staticmethod
    def _write_json(path: Path, data: Any) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(
            json.dumps(data, indent=2, ensure_ascii=False),
            encoding="utf-8",
        )

    # -- Insights ----------------------------------------------------------

    def load_insights(self, user_id: str, category: str) -> dict[str, Any]:
        data = self._read_json(self._insight_path(user_id, category))
        return data if isinstance(data, dict) else {}

    def save_insights(
        self, user_id: str, category: str, insights: dict[str, Any]
    ) -> None:
        self._write_json(self._insight_path(user_id, category), insights)

    def delete_insights(
        self, user_id: str, category: str | None = None
    ) -> None:
        if category:
            path = self._insight_path(user_id, category)
            if path.exists():
                path.unlink()
        else:
            user_dir = self._path("insights", self._name(user_id))
            if user_dir.exists():
                for f in user_dir.glob("*.json"):
                    f.unlink()
                try:
                    user_dir.rmdir()
                except OSError:
                    pass

    # -- Conversation history ----------------------------------------------

    def load_conversation(
        self, user_id: str, category: str, conversation_id: str
    ) -> list[dict[str, Any]]:
        data = self._read_json(
            self._conversation_path(user_id, category, conversation_id)
        )
        return data if isinstance(data, list) else []

    def save_message(
        self,
        user_id: str,
        category: str,
        conversation_id: str,
        role: str,
        content: str,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        path = self._conversation_path(user_id, category, conversation_id)
        messages = self._read_json(path)
        if not isinstance(messages, list):
            messages = []
        messages.append(
            {"role": role, "content": content, "metadata": metadata or {}}
        )
        self._write_json(path, messages)

    def delete_conversations(
        self, user_id: str, category: str | None = None
    ) -> None:
        if category:
            cat_dir = self._path(
                "conversations", self._name(user_id), self._name(category)
            )
            if cat_dir.exists():
                for f in cat_dir.glob("*.json"):
                    f.unlink()
                try:
                    cat_dir.rmdir()
                except OSError:
                    pass
        else:
            user_dir = self._path("conversations", self._name(user_id))
            if user_dir.exists():
                for cat_dir in user_dir.iterdir():
                    if cat_dir.is_dir():
                        for f in cat_dir.glob("*.json"):
                            f.unlink()
                        try:
                            cat_dir.rmdir()
                        except OSError:
                            pass
                try:
                    user_dir.rmdir()
                except OSError:
                    pass


# ---------------------------------------------------------------------------
# Supabase implementation
# ---------------------------------------------------------------------------

class SupabaseInsightStore(InsightStoreBase):
    """Durable insight storage covered by the Beta retention cron job.

    Raw question/answer turns already live in ``conversation_history``. The
    message-oriented methods adapt that canonical table to the older store
    interface; ``save_message`` is intentionally a no-op because the complete
    turn is persisted once by ``save_conversation_turn`` after generation.
    """

    def __init__(self, supabase) -> None:
        self._supabase = supabase

    def load_insights(self, user_id: str, category: str) -> dict[str, Any]:
        result = (
            self._supabase.table("user_insights")
            .select("insights")
            .eq("user_id", user_id)
            .eq("category", category)
            .limit(1)
            .execute()
        )
        if not result.data:
            return {}
        insights = result.data[0].get("insights")
        return dict(insights) if isinstance(insights, dict) else {}

    def save_insights(
        self, user_id: str, category: str, insights: dict[str, Any]
    ) -> None:
        self._supabase.table("user_insights").upsert(
            {
                "user_id": user_id,
                "category": category,
                "insights": insights,
            },
            on_conflict="user_id,category",
        ).execute()

    def delete_insights(
        self, user_id: str, category: str | None = None
    ) -> None:
        query = self._supabase.table("user_insights").delete().eq("user_id", user_id)
        if category:
            query = query.eq("category", category)
        query.execute()

    def load_conversation(
        self, user_id: str, category: str, conversation_id: str
    ) -> list[dict[str, Any]]:
        result = (
            self._supabase.table("conversation_history")
            .select("question,answer,created_at")
            .eq("user_id", user_id)
            .eq("category", category)
            .eq("conversation_id", conversation_id)
            .order("created_at")
            .execute()
        )
        messages: list[dict[str, Any]] = []
        for row in result.data or []:
            messages.extend(
                [
                    {"role": "user", "content": row.get("question") or "", "metadata": {}},
                    {
                        "role": "assistant",
                        "content": row.get("answer") or "",
                        "metadata": {},
                    },
                ]
            )
        return messages

    def save_message(
        self,
        user_id: str,
        category: str,
        conversation_id: str,
        role: str,
        content: str,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        # save_conversation_turn writes the canonical complete Q&A row after a
        # successful answer. Writing individual messages here would duplicate
        # the same user content in a second retention surface.
        return None

    def delete_conversations(
        self, user_id: str, category: str | None = None
    ) -> None:
        query = self._supabase.table("conversation_history").delete().eq(
            "user_id", user_id
        )
        if category:
            query = query.eq("category", category)
        query.execute()


# ---------------------------------------------------------------------------
# In-memory implementation (for local dev / tests)
# ---------------------------------------------------------------------------

class InMemoryInsightStore(InsightStoreBase):
    """Volatile in-memory store — same as the local_profiles pattern in main.py."""

    def __init__(self) -> None:
        self._insights: dict[str, dict[str, dict]] = {}  # user_id -> category -> dict
        # user_id -> category -> conv_id -> list
        self._conversations: dict[str, dict[str, dict[str, list]]] = {}

    def load_insights(self, user_id: str, category: str) -> dict[str, Any]:
        return dict(self._insights.get(user_id, {}).get(category, {}))

    def save_insights(
        self, user_id: str, category: str, insights: dict[str, Any]
    ) -> None:
        self._insights.setdefault(user_id, {})[category] = dict(insights)

    def delete_insights(
        self, user_id: str, category: str | None = None
    ) -> None:
        if category:
            self._insights.get(user_id, {}).pop(category, None)
        else:
            self._insights.pop(user_id, None)

    def load_conversation(
        self, user_id: str, category: str, conversation_id: str
    ) -> list[dict[str, Any]]:
        return list(
            self._conversations.get(user_id, {}).get(category, {}).get(conversation_id, [])
        )

    def save_message(
        self,
        user_id: str,
        category: str,
        conversation_id: str,
        role: str,
        content: str,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        self._conversations.setdefault(user_id, {}).setdefault(
            category, {}
        ).setdefault(conversation_id, []).append(
            {"role": role, "content": content, "metadata": metadata or {}}
        )

    def delete_conversations(
        self, user_id: str, category: str | None = None
    ) -> None:
        if category:
            self._conversations.get(user_id, {}).pop(category, None)
        else:
            self._conversations.pop(user_id, None)

