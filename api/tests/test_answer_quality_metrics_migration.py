from pathlib import Path

MIGRATION = (
    Path(__file__).parents[2]
    / "supabase/migrations/20261017120000_answer_quality_metrics.sql"
)
HARDENING_MIGRATION = (
    Path(__file__).parents[2]
    / "supabase/migrations/20261017130000_answer_quality_completion_and_ordering.sql"
)
COMPLETION_GRANT_MIGRATION = (
    Path(__file__).parents[2]
    / "supabase/migrations/20261017140000_answer_quality_completion_grant.sql"
)
DISTINCT_COUNT_MIGRATION = (
    Path(__file__).parents[2]
    / "supabase/migrations/20261019120000_answer_quality_metrics_distinct_completed_answers.sql"
)


def test_answer_quality_migration_has_current_rating_and_private_metrics_views():
    sql = MIGRATION.read_text(encoding="utf-8").lower()
    assert "create table if not exists public.ai_answer_feedback" in sql
    assert "unique (answer_log_id, user_id)" in sql
    assert "check (rating in (-1, 1))" in sql
    assert "references public.ai_answer_log(id) on delete cascade" in sql
    assert "create or replace view public.ai_answer_quality_metrics" in sql
    assert "create or replace view public.ai_answer_feedback_by_category" in sql
    assert "security_invoker = true" in sql
    assert (
        "revoke all on public.ai_answer_quality_metrics, public.ai_answer_feedback_by_category"
        in sql
    )


def test_hardening_migration_counts_only_completed_rows_and_derives_run_ids():
    sql = HARDENING_MIGRATION.read_text(encoding="utf-8").lower()
    assert "add column if not exists completed_at timestamptz" in sql
    assert "where answer.completed_at is not null" in sql
    assert "alter column rating drop not null" in sql
    assert "add column if not exists version bigint not null default 0" in sql
    assert "drop column if exists answer_run_id" in sql
    assert "set_ai_answer_feedback" in sql
    assert "answer.run_id as answer_run_id" in sql


def test_completion_grant_migration_allows_only_completed_at_updates():
    # Static coverage only: PostgreSQL must still apply this migration in an
    # integration environment to verify the effective privilege.
    sql = COMPLETION_GRANT_MIGRATION.read_text(encoding="utf-8").lower()
    assert "grant update (completed_at) on public.ai_answer_log to service_role" in sql


def test_metrics_count_distinct_completed_answer_logs_after_feedback_join():
    sql = DISTINCT_COUNT_MIGRATION.read_text(encoding="utf-8").lower()
    assert "count(distinct answer.id) as total_answers_provided" in sql
    assert "where answer.completed_at is not null" in sql
    assert "grant select on public.ai_answer_quality_metrics to service_role" in sql

