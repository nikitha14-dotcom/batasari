-- Enable row level security on profiles, and scope every row to its owner.
--
-- Without this, `profiles` is readable and writable by anyone holding the
-- anon key — and the anon key ships to every browser. The table holds visa
-- type, household composition, children's ages, origin city and postal code,
-- so this is PII, not preference data.
--
-- The backend is unaffected: it connects with the service role key, which
-- bypasses RLS by design. These policies protect the direct PostgREST path
-- that the browser can reach.

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles
  for select
  using (auth.uid() = user_id);

create policy "profiles_insert_own"
  on public.profiles
  for insert
  with check (auth.uid() = user_id);

create policy "profiles_update_own"
  on public.profiles
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- No delete policy: profile rows are removed by the
-- `references auth.users(id) on delete cascade` on user_id.

