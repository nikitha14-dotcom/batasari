-- pg_cron proof of concept: prove scheduled jobs actually run on this project.
--
-- The PRD puts scheduled ingestion on pg_cron — roughly 40 public-data sources
-- fetched on a schedule, parsed, normalised, content-hash diffed and flagged
-- when they change. None of that can be built on an unproven mechanism, and
-- "the extension is available" is not the same as "a job we scheduled actually
-- fired". This proves the latter, and nothing more.
--
-- Deliberately trivial: one heartbeat row every 5 minutes. No network calls, no
-- external dependencies, nothing that can fail for an unrelated reason. If rows
-- appear, the mechanism works.
--
-- Verified before writing: pg_cron 1.6.4 is available on both local and the
-- hosted dev project. It installs into pg_catalog (the `with schema` clause is
-- ignored) and creates its own `cron` schema.
--
-- This is scaffolding, not a feature. When the real ingestion jobs land, this
-- job and table should be dropped — see the teardown at the bottom.

create extension if not exists pg_cron;

create table public.cron_heartbeat (
  id      bigint generated always as identity primary key,
  job_name text        not null,
  ran_at   timestamptz not null default now()
);

comment on table public.cron_heartbeat is
  'pg_cron proof of concept (ADR 0011). Scaffolding — drop once real scheduled '
  'ingestion jobs exist.';

-- Nothing in the browser has any business reading this. RLS on with no policies
-- means no access via PostgREST, which is the intent rather than an oversight.
alter table public.cron_heartbeat enable row level security;

-- service_role so the backend can read the heartbeat to confirm the scheduler
-- is alive. It inherits safe defaults for anon/authenticated from
-- 20260905090000, which runs before this.
grant select, insert, update on public.cron_heartbeat to service_role;

-- Every 5 minutes. Frequent enough to confirm within one sitting, and the job
-- prunes its own history so this cannot grow without bound if it outlives the
-- proof of concept.
select cron.schedule(
  'heartbeat-poc',
  '*/5 * * * *',
  $job$
    insert into public.cron_heartbeat (job_name) values ('heartbeat-poc');
    delete from public.cron_heartbeat where ran_at < now() - interval '1 day';
  $job$
);

-- Teardown, for whoever removes this:
--   select cron.unschedule('heartbeat-poc');
--   drop table public.cron_heartbeat;

