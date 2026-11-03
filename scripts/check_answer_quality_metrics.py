"""Verify Answer Quality metric views against the disposable CI Supabase DB.

The db-guard workflow starts a database rebuilt solely from migrations.  This
script uses that database, inserts fixtures in one transaction, and rolls the
transaction back.  It never targets a linked remote project.
"""

from __future__ import annotations

import os
import sys

import psycopg


def _fail(message: str) -> int:
    print(f"FAIL: {message}", file=sys.stderr)
    return 1


def main() -> int:
    dsn = os.environ.get("DATABASE_URL")
    if not dsn:
        return _fail("DATABASE_URL is not set")

    with psycopg.connect(dsn, autocommit=False) as conn:
        try:
            with conn.cursor() as cur:
                # The disposable db-guard database is owned by postgres. The
                # fixtures exercise view aggregation only, so bypass FKs for
                # synthetic user IDs rather than depending on Auth internals.
                cur.execute("set local session_replication_role = replica")
                cur.execute(
                    """
                    insert into public.ai_answer_log
                      (id, run_id, user_id, category, model, completed_at)
                    values
                      ('00000000-0000-0000-0000-000000000001', gen_random_uuid(),
                       gen_random_uuid(), 'Housing', 'test', now()),
                      ('00000000-0000-0000-0000-000000000002', gen_random_uuid(),
                       gen_random_uuid(), 'Housing', 'test', now()),
                      ('00000000-0000-0000-0000-000000000003', gen_random_uuid(),
                       gen_random_uuid(), 'Finance', 'test', now()),
                      ('00000000-0000-0000-0000-000000000004', gen_random_uuid(),
                       gen_random_uuid(), null, 'test', now()),
                      ('00000000-0000-0000-0000-000000000005', gen_random_uuid(),
                       gen_random_uuid(), 'Housing', 'test', null),
                      ('00000000-0000-0000-0000-000000000006', gen_random_uuid(),
                       gen_random_uuid(), 'Housing', 'test', now()),
                      ('00000000-0000-0000-0000-000000000007', gen_random_uuid(),
                       gen_random_uuid(), 'Housing', 'test', now())
                    """
                )
                cur.execute(
                    """
                    insert into public.ai_answer_feedback
                      (answer_log_id, user_id, rating, version)
                    values
                      ('00000000-0000-0000-0000-000000000002', gen_random_uuid(), 1, 1),
                      ('00000000-0000-0000-0000-000000000003', gen_random_uuid(), -1, 1),
                      ('00000000-0000-0000-0000-000000000004', gen_random_uuid(), null, 2),
                      ('00000000-0000-0000-0000-000000000005', gen_random_uuid(), 1, 1),
                      ('00000000-0000-0000-0000-000000000006', gen_random_uuid(), null, 2),
                      ('00000000-0000-0000-0000-000000000007', gen_random_uuid(), 1, 1),
                      ('00000000-0000-0000-0000-000000000007', gen_random_uuid(), -1, 1)
                    """
                )
                cur.execute(
                    "select total_answers_provided, total_thumbs_up, total_thumbs_down "
                    "from public.ai_answer_quality_metrics"
                )
                totals = cur.fetchone()
                expected_totals = (6, 2, 2)
                if totals != expected_totals:
                    return _fail(f"overall metrics were {totals!r}, expected {expected_totals!r}")

                cur.execute(
                    """
                    select category, thumbs_up, thumbs_down
                    from public.ai_answer_feedback_by_category
                    order by category nulls first
                    """
                )
                categories = cur.fetchall()
                expected_categories = [(None, 0, 0), ("Finance", 0, 1), ("Housing", 2, 1)]
                if categories != expected_categories:
                    return _fail(
                        f"category metrics were {categories!r}, expected {expected_categories!r}"
                    )
        finally:
            conn.rollback()

    print(
        "Answer Quality metric views correctly exclude incomplete/removed ratings "
        "and count answers once."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

