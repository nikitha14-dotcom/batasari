-- Stop anon and authenticated receiving destructive privileges on public tables.
--
-- Root cause, measured on a clean database (supabase db reset, main @ 2297dbd):
--
--   pg_default_acl for schema public, granted by postgres and supabase_admin:
--     anon=arwdDxtm  authenticated=arwdDxtm  service_role=arwdDxtm
--                ^^ D = TRUNCATE
--
--   public.profiles inherited exactly that:
--     anon  select=t  insert=t  update=t  TRUNCATE=t
--
-- This is not specific to profiles. Supabase's default privileges hand every
-- table created in `public` the full set, so any table anyone adds from now on
-- lands the same way unless something stops it.
--
-- Why TRUNCATE is the dangerous one: RLS does not apply to TRUNCATE at all.
-- The row policies in 20260831120000 correctly gate select/insert/update, and
-- DELETE is denied because no delete policy exists — but TRUNCATE bypasses the
-- whole mechanism. Anyone holding the anon key (i.e. every browser) could empty
-- a table through any SECURITY INVOKER function exposed at /rest/v1/rpc, with
-- the policies offering no protection.
--
-- DELETE is revoked alongside it. RLS blocks DELETE today only because no
-- delete policy exists; that protection vanishes the moment someone adds a
-- permissive one. Not holding the grant is the durable version. If a feature
-- ever genuinely needs users to delete their own row, re-granting it should be
-- a deliberate, reviewed change.
--
-- Two halves, because one without the other is incomplete:
--   1. fix the tables that already exist
--   2. change the default so future tables never get it in the first place
--
-- Enforcement lives in CI as well — scripts/check_db_privileges.py fails the
-- build if any public table ever grants TRUNCATE or DELETE to anon or
-- authenticated, so this cannot silently regress. See ADR 0010.

-- 1. Existing tables.
do $$
declare
  t record;
begin
  for t in
    select schemaname, tablename
    from pg_tables
    where schemaname = 'public'
  loop
    execute format(
      'revoke truncate, delete, references, trigger on %I.%I from anon, authenticated',
      t.schemaname, t.tablename
    );
  end loop;
end
$$;

-- 2. Future tables. ALTER DEFAULT PRIVILEGES only affects objects created after
-- it runs, and only those created by the named role — so this is set for both
-- roles that create tables on this project. `postgres` is what the Supabase CLI
-- connects as; `supabase_admin` is used by some managed paths.
--
-- service_role is untouched: the backend connects as service_role and needs
-- DML. It is server-side only and never reaches the browser (ADR 0004).
alter default privileges for role postgres in schema public
  revoke truncate, delete, references, trigger on tables from anon, authenticated;

do $$
begin
  execute 'alter default privileges for role supabase_admin in schema public '
          'revoke truncate, delete, references, trigger on tables from anon, authenticated';
exception
  when insufficient_privilege then
    -- Expected on hosted projects where postgres cannot alter defaults for
    -- supabase_admin. The CI guard is the backstop for anything this misses.
    raise notice 'skipped supabase_admin default privileges: insufficient privilege';
end
$$;

