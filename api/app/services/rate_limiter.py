import threading
from collections import defaultdict
from datetime import date


class InMemoryRateLimiter:
    """
    Per-user, per-calendar-day request counter.

    The check-and-increment is protected by a threading.Lock so that concurrent
    requests for the same user cannot both slip through on the last allowed slot.
    The GIL does not protect multi-step read-check-write sequences: without the
    lock, two simultaneous requests can each read count=N, each see N < limit,
    and both increment to N+1, letting one extra request through.

    The counter is in-process memory. It resets on process restart, which is
    acceptable for day-1 rate limiting and avoids a Supabase round-trip on
    every request. Old date keys are never evicted; with at most one key per
    user per day, growth is negligible for typical DAU counts.

    If multi-replica or persistence-across-restart guarantees are ever needed,
    replace this class with one backed by an atomic Supabase INSERT ... ON
    CONFLICT DO UPDATE ... RETURNING count -- the call site in ai_answer.py
    does not need to change.
    """

    def __init__(self, daily_limit: int) -> None:
        self._limit = daily_limit
        self._counts: dict[tuple[str, date], int] = defaultdict(int)
        self._lock = threading.Lock()

    def check_and_increment(self, user_id: str, today: date) -> bool:
        """
        Atomically check the counter and increment it if under the limit.

        Returns True if the request is allowed, False if the daily limit has
        been reached. The read, comparison, and increment happen inside the
        lock so no two threads can simultaneously observe count < limit for
        the same (user_id, today) key.
        """
        key = (user_id, today)
        with self._lock:
            if self._counts[key] >= self._limit:
                return False
            self._counts[key] += 1
            return True

    def reset(self) -> None:
        """Clear all counters. Used by tests to isolate test cases."""
        with self._lock:
            self._counts.clear()

