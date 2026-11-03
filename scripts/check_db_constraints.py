"""
Confirms real database constraints are actually enforced -- not just
declared in a migration file. Mocked Supabase clients in the regular test
suite don't enforce not-null, foreign keys, or RLS, so a migration can
declare a constraint that never actually gets checked. This is exactly
how #64 shipped: conversation_history.conversation_id was "not null" in
the migration, but nothing tested that against a real database, so the
column being empty-by-default went unnoticed until manually tested
against staging. See Rahul's bug tracker, item 10.

Run against the real Postgres instance db-guard already spins up via
`supabase start` in ci.yml -- reuses that same machinery, doesn't start
its own.
"""
import os
import sys

import psycopg
from psycopg import errors

DATABASE_URL = os.environ["DATABASE_URL"]

def _expect_failure(conn, description: str, sql: str, params: tuple) -> bool:
    """Returns True if the insert correctly failed with the specific
    constraint violation expected -- not just any database error. Catching
    psycopg.Error broadly would also count "table doesn't exist" or "column
    doesn't exist" as a pass, which is exactly wrong: the check would still
    report OK even if the real constraint were removed entirely."""
    try:
        with conn.cursor() as cur:
            cur.execute(sql, params)
        conn.rollback()
        print(f"FAIL: {description} -- insert succeeded, but should have been rejected")
        return False
    except errors.NotNullViolation:
        conn.rollback()
        print(f"OK:   {description}")
        return True
    except psycopg.Error as e:
        conn.rollback()
        print(f"FAIL: {description} -- wrong error, expected NotNullViolation, got {type(e).__name__}: {e}")
        return False


def main() -> int:
    conn = psycopg.connect(DATABASE_URL)
    all_passed = True

    # The exact bug from #64: conversation_id is "uuid not null", confirm
    # a missing value is actually rejected, not silently accepted.
    all_passed &= _expect_failure(
        conn,
        "conversation_history rejects a null conversation_id",
        """
        insert into public.conversation_history
        (user_id, category, subcategory, question, answer, conversation_id)
        values (gen_random_uuid(), 'Housing', 'Find Housing', 'q', 'a', null)
        """,
        (),
    )

    conn.close()
    return 0 if all_passed else 1


if __name__ == "__main__":
    sys.exit(main())
