from time import monotonic
from typing import Any


class StaticContentCache:
    def __init__(self, ttl_seconds: int = 300, max_items: int = 128):
        self.ttl_seconds = ttl_seconds
        self.max_items = max_items
        self._items: dict[tuple[str, str], tuple[float, dict[str, Any]]] = {}

    def get(self, category: str, subcategory: str) -> dict[str, Any] | None:
        key = self._key(category, subcategory)
        item = self._items.get(key)
        if not item:
            return None

        expires_at, value = item
        if expires_at <= monotonic():
            self._items.pop(key, None)
            return None

        return value

    def set(self, category: str, subcategory: str, value: dict[str, Any]) -> None:
        if self.max_items <= 0:
            return

        key = self._key(category, subcategory)
        if key not in self._items and len(self._items) >= self.max_items:
            self._items.pop(next(iter(self._items)))
        self._items[key] = (monotonic() + self.ttl_seconds, value)

    def clear(self) -> None:
        self._items.clear()

    @staticmethod
    def _key(category: str, subcategory: str) -> tuple[str, str]:
        # Strip only, no casefold: the key must match exactly what the query
        # sends to Postgres (eq is case-sensitive). Casefolding here but not in
        # the query meant a lowercase-first request cached an EMPTY section
        # list that poisoned proper-case requests for the whole TTL.
        return (category.strip(), subcategory.strip())

