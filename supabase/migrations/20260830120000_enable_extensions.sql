-- Enable the Postgres extensions the product depends on.
--
-- Owner: TL Full-stack. This exists as a migration rather than a dashboard
-- click so that a fresh database can be rebuilt from `main` alone — the
-- Supabase free tier has no backups, so the repo is the only source of truth.
--
-- pgvector  — conversation memory / embeddings (text-embedding-004)
-- postgis   — address to Toronto neighbourhood resolution (158 boundaries)

create extension if not exists "vector"  with schema "extensions";
create extension if not exists "postgis" with schema "extensions";

