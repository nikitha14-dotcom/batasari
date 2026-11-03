# 0011 — pg_cron proven with a heartbeat job

**Date:** 2026-09-05 · **Who:** Rahul Vaidhya (Platform lead) · **Status:** Accepted

## Context
The PRD puts scheduled ingestion on pg_cron: roughly 40 public-data sources
fetched on a schedule, parsed, normalised, content-hash diffed, and flagged when
they change. The Tech Stacks doc lists `pg_cron (Supabase)` as the ingestion job
scheduler.

Nothing had been built on it, and "the extension is listed as available" is a
much weaker claim than "a job we scheduled actually fired". The difference
matters: pg_cron needs its background worker in `shared_preload_libraries`, and
if it isn't there the extension installs happily and jobs silently never run.
That failure mode is invisible until someone notices stale data.

## Decision
Prove the mechanism with the smallest thing that can prove it, before any real
ingestion work depends on it.

`20260905100000_pg_cron_poc.sql` enables `pg_cron`, creates
`public.cron_heartbeat`, and schedules one job writing a row every five minutes.
No network calls, no external services, nothing that can fail for a reason
unrelated to the scheduler.

Verified on a database rebuilt from scratch:

```
shared_preload_libraries: ... pg_cron, pg_net ...   -> worker present
cron.job: id=1 heartbeat-poc '*/5 * * * *' active=t db=postgres
13:35:02  heartbeat rows = 1                        -> job actually fired
```

pg_cron 1.6.4 is available on both local and the hosted dev project. It installs
into `pg_catalog` — the `with schema` clause is ignored — and creates its own
`cron` schema.

The job prunes rows older than a day, so it cannot grow without bound if it
outlives its usefulness.

## Consequences
- Ingestion work can now be built on a scheduler that is known to run, rather
  than assumed to.
- `public.cron_heartbeat` has RLS enabled with no policies — nothing reads it
  from the browser. It passes the ADR 0010 guard, which is a useful sign the
  guard applies to my own migrations and not only other people's.
- **This is scaffolding, not a feature.** The job and table should be dropped
  when real ingestion jobs land. Teardown is written at the bottom of the
  migration so whoever removes it does not have to work it out.
- A heartbeat every five minutes is deliberately more frequent than anything in
  production would be. Real jobs follow the team convention of midnight UTC,
  staggered a few minutes apart so several jobs do not contend for the same
  third-party rate limits.

## Unresolved
Whether pg_cron on the hosted project runs jobs under the same role and settings
as local. It was confirmed *available* on hosted dev but the job has only been
observed firing locally. Worth confirming after this reaches dev, before
ingestion depends on it.

