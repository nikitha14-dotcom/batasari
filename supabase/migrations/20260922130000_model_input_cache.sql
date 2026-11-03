-- Shared cache for reusable, non-personalized AI inputs and generic answers.
-- Raw questions, user IDs, profile context, preferences, and conversations are
-- deliberately absent. Only one-way hashes and generic JSON payloads persist.

alter table public.trusted_sources
  add column if not exists cache_ttl_seconds integer not null default 900;

alter table public.trusted_sources
  drop constraint if exists trusted_sources_cache_ttl_seconds_check;

alter table public.trusted_sources
  add constraint trusted_sources_cache_ttl_seconds_check
  check (cache_ttl_seconds between 900 and 86400);

comment on column public.trusted_sources.cache_ttl_seconds is
  'Cache freshness for this source: 900 seconds by default, 86400 maximum.';

create table if not exists public.model_input_cache (
  cache_key       text        primary key,
  namespace       text        not null check (
    namespace in ('official_excerpt', 'public_fact', 'generic_answer')
  ),
  category        text        not null,
  subcategory     text        not null,
  question_hash   text,
  source_snapshot text        not null,
  prompt_version  text,
  model            text,
  payload          jsonb       not null,
  expires_at       timestamptz not null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  check (cache_key ~ '^[0-9a-f]{64}$'),
  check (question_hash is null or question_hash ~ '^[0-9a-f]{64}$')
);

create index if not exists model_input_cache_expires_idx
  on public.model_input_cache (expires_at);

create index if not exists model_input_cache_namespace_category_idx
  on public.model_input_cache (namespace, category, subcategory);

comment on table public.model_input_cache is
  'Shared non-PII cache for approved source inputs, public facts, and fully generic answers.';

alter table public.model_input_cache enable row level security;

revoke all on public.model_input_cache from anon, authenticated;
grant select, insert, update, delete on public.model_input_cache to service_role;

alter table public.ai_answer_log
  add column if not exists prompt_version text,
  add column if not exists cache_hit boolean not null default false;

