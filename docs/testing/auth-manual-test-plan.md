# Auth test plan — Supabase email magic link

Run against the **dev** Supabase project. Nothing here touches staging.

Work top to bottom. Every step says what a pass looks like, so a failure is obvious rather
than ambiguous. Step 2 is scripted; the rest need a browser, an inbox, or the SQL editor,
and cannot be automated.

---

# Before you start

### Fill in `.env`

Three values from the shared secrets note, in the repo-root `.env` (never paste them into
chat or a PR):

```
NEXT_PUBLIC_SUPABASE_URL=https://<dev-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<dev anon key>
SUPABASE_SERVICE_ROLE_KEY=<dev service role key>
ENVIRONMENT=development
```

Leave `NEXT_PUBLIC_TEST_USER_ID` blank. With it set, the browser bypasses sign-in and you
will be testing nothing.

### Install the Supabase CLI

```bash
brew install supabase/tap/supabase
supabase --version
```

### Configure the Supabase dashboard

> These are **fields you type into on the Supabase website**. Nothing here is a link to
> open, and none of it involves running the app. Sign in at supabase.com, open the dev
> project, and go to **Authentication** in the left sidebar.

| Where | Field | Value to enter |
|---|---|---|
| Authentication → URL Configuration | Site URL | `http://localhost:3000` |
| Authentication → URL Configuration | Redirect URLs → Add URL | `http://localhost:3000/auth/callback` |
| Authentication → Sign In / Providers → Email | Enable Email provider | on |

`http://localhost:3000` does not need to be running. You are telling Supabase where it is
*allowed* to send people back to after they click a sign-in link. A redirect URL missing
from that list fails **when the link is clicked**, not when it is sent — the email arrives
fine and then the callback shows an error. If Step 4 fails, check this list first.

### Where these commands run

Everything below runs in **your own terminal**, from the repo root, unless a step says
"SQL editor" or "DevTools". Homebrew tools live on your machine and are not visible to a
Cowork session, so Claude cannot run the `supabase` steps for you.

---

# Step 1 — Apply the migrations to dev

`<dev-ref>` is the subdomain of your `SUPABASE_URL`. For
`https://abcdefghijklmnop.supabase.co`, the ref is `abcdefghijklmnop`.

```bash
supabase login               # opens a browser to authorise the CLI
supabase link --project-ref <dev-ref>
supabase migration list      # what dev has vs what the repo has
supabase db push
```

> `supabase link` asks for the **database password** — the Postgres password set when the
> project was created, not your Supabase account password. It is not recoverable; if
> nobody has it, reset it under Project Settings → Database. Ask first, since a reset
> invalidates any connection string already in use.

**Pass:** `supabase migration list` afterwards shows every local version also present
under Remote:

| Local | Remote |
|---|---|
| `001` | `001` |
| `20260830120000` | `20260830120000` |
| `20260831120000` | `20260831120000` |
| `20260904140000` | `20260904140000` |

**Watch for:** if `001` shows under Local but not Remote while `profiles` already exists in
dev, the table was created by hand in the dashboard. `db push` will still work — the
migration is `create table if not exists` — but it means dev cannot be rebuilt from `main`,
which is the failure ADR 0002 exists to prevent. Raise it rather than letting it pass.

---

# Step 2 — Run the automated checks

```bash
./scripts/verify-auth.sh
```

The script starts its own API on port 8001 with `ENVIRONMENT=staging`. That does not
disturb a dev server on 8000, and staging is the behaviour that matters: it is where the
`x-test-user-id` bypass would have been exploitable.

**Pass:** `7 passed, 0 failed`.

What each check proves, and what a failure means:

| Check | What it proves | If it fails |
|---|---|---|
| anon read of `profiles` is refused | The anon key — public, in every browser bundle — cannot read or write other people's profiles | `20260831120000` was not pushed. Every user's profile is world-readable *and world-writable*. Go back to Step 1 |
| `/health` needs no credentials | Public endpoints stayed public | Something in `AuthMiddleware` started rejecting broadly |
| no credentials → 401 | The no-auth dev fallback is off outside development | `ENVIRONMENT` is being read as `development` when it should not be |
| `x-test-user-id` → 401 | **The impersonation bypass is closed.** This is the regression that mattered | The header gate in `AuthMiddleware` is not holding. Treat as urgent — before this branch, one curl against staging became any user |
| `x-test-user-id` on `/profile` → 401 | The gate holds on a real data endpoint, not just the debug one | Same as above |
| garbage bearer token → 401 | An unverifiable token is rejected rather than trusted | `supabase.auth.get_user()` is not being consulted, or its failure is being swallowed |
| empty bearer token → 401 | `Authorization: Bearer ` with nothing after it is not treated as valid | Same as above |

A check the script could not reach the network for reports **SKIP**, not PASS. An
unreachable database says nothing about what it would have answered, and counting that as a
pass is how a security check quietly rots.

---

# Step 3 — Confirm the grants (SQL editor)

The script cannot run SQL, and this is a genuinely separate question from Step 2:
`service_role` bypasses RLS but **not** table grants. This is the check that decides
whether the app works at all.

```sql
select
  has_table_privilege('service_role',  'public.profiles', 'select')   as sr_select,
  has_table_privilege('service_role',  'public.profiles', 'insert')   as sr_insert,
  has_table_privilege('service_role',  'public.profiles', 'update')   as sr_update,
  has_table_privilege('authenticated', 'public.profiles', 'select')   as auth_select,
  has_table_privilege('anon',          'public.profiles', 'select')   as anon_select,
  has_table_privilege('anon',          'public.profiles', 'truncate') as anon_truncate;
```

**Pass:**

| column | expected |
|---|---|
| `sr_select`, `sr_insert`, `sr_update` | `true` |
| `auth_select`, `anon_select`, `anon_truncate` | `false` |

`sr_*` being `false` means `20260904140000_profiles_grants.sql` was not pushed. Every
`/profile` request will fail with 42501, which reads like an auth bug and is not one.

`auth_select` and `anon_select` staying `false` is intended, not an oversight — the browser
reaches Postgres only through `/api`. See the header comment in
`supabase/migrations/20260904140000_profiles_grants.sql`.

While you are here, confirm RLS is on:

```sql
select relrowsecurity from pg_class where relname = 'profiles';   -- expect: true
select policyname, cmd from pg_policies where tablename = 'profiles';
-- expect: profiles_select_own / profiles_insert_own / profiles_update_own
```

---

# Step 4 — Sign in with a magic link

```bash
cd api && uv run python -m uvicorn app.main:app --reload   # terminal 1
cd web && pnpm install && pnpm dev                          # terminal 2
```

1. Open `http://localhost:3000/onboarding`.
   **Pass:** redirected to `/login`. (Before this change you got straight in.)
2. Enter your own email, click **Email me a sign-in link**.
   **Pass:** "Check &lt;your email&gt; for a sign-in link", and **Resend** disabled with a
   countdown.
3. Open the email and click the link **in the same browser**.
   **Pass:** brief "Signing you in…", then `/onboarding` showing "Signed in as
   &lt;email&gt;" with a **Sign out** button.
4. Still signed in, open `http://localhost:3000/ai`, pick a category, ask anything.
   **Pass:** the page loads and the answer streams. `/ai/answer` calls `_get_user_id()`
   and 401s without a user, so this is confirming the token reaches a second endpoint,
   not just `/profile`.

> **Email rate limits.** Supabase's built-in sender is throttled hard on the free tier — a
> handful per hour across the whole project, shared by the team. If nothing arrives, check
> spam, then **Authentication → Logs** in the dashboard, before assuming the code is
> broken. Testing several addresses in one sitting will hit this. A custom SMTP provider is
> the fix and is out of scope for this change.

---

# Step 5 — Confirm the token reaches the backend

DevTools → **Network**, reload `/onboarding`, click the `profile` request:

- **Request headers** contain `Authorization: Bearer eyJ…`
- **Response** is `200`, not `401`

Then confirm the backend agrees about *who* you are. DevTools → Console:

```js
const t = JSON.parse(localStorage.getItem(
  Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'))
)).access_token;
await (await fetch('http://localhost:8000/auth/me', {
  headers: { Authorization: `Bearer ${t}` }
})).json();
```

**Pass:**

```json
{ "user_id": "<uuid>", "email": "<your email>", "auth_source": "supabase" }
```

`auth_source` is the entire point of that endpoint — it separates three failures that all
look identical from a 401:

| value | meaning |
|---|---|
| `supabase` | Real token, verified. What you want |
| `local-dev-fallback` | No token was sent at all. The browser is not signed in |
| `test-header` | You left `NEXT_PUBLIC_TEST_USER_ID` set. Clear it and restart `pnpm dev` |

---

# Step 6 — Confirm the row belongs to the real user

Complete one onboarding step (pick a move date), then in the SQL editor:

```sql
select p.user_id, u.email, p.move_date, p.updated_at
from profiles p join auth.users u on u.id = p.user_id
order by p.updated_at desc limit 5;
```

**Pass:** one row, `user_id` matches the uuid from Step 5, `email` is yours, `move_date` is
what you picked.

**Fail:** `user_id` is the literal string `local-dev-user`, or there is no row — the
backend took its in-memory dev path instead of writing to Supabase. Re-check Step 5.

**Fail, differently:** the API returns 500 and the logs show `permission denied for table
profiles` (42501). That is the grants migration missing, not an auth problem. Go back to
Step 3.

---

# Step 7 — Confirm the failure paths behave

| Do this | Expect |
|---|---|
| Click the same magic link a second time | `/auth/callback` shows "invalid or has expired" with a **Back to sign in** button — not a blank page |
| Request a link in Chrome, open it in Safari | "This link was opened in a different browser…" — PKCE working as designed, see ADR 0008 |
| Open `/auth/callback` with no query string | "This link is missing its sign-in code." |
| Click **Sign out**, then visit `/onboarding` | Redirected to `/login` |
| Signed out, visit `/ai` | Redirected to `/login`. Before this branch `/ai` was ungated, so a signed-out visitor could type a question and watch the stream fail with nothing explaining why |
| Sign out, then replay the Step 5 `fetch` with the old token | Still `200` until the token expires (~1 hour). Expected: sign-out clears the browser's copy, it does not revoke the token server-side. Worth knowing before someone files it as a bug |

---

# Step 8 — Run the CI gates

```bash
cd api && uv sync --extra dev                         # ruff and pytest are dev extras
uv run ruff check . && uv run pytest -q               # 22 passed

cd ../web && pnpm install
pnpm lint && pnpm typecheck && pnpm test              # 11 passed
```

> `uv sync` on its own installs only the runtime dependencies. `ruff` and `pytest`
> live under `[project.optional-dependencies] dev`, so without `--extra dev` you get
> `Failed to spawn: ruff -- No such file or directory`. CI runs `uv sync --extra dev`;
> the README's setup step does not, which is why a fresh clone cannot run the gates
> CI enforces until you do this once.

---

# Appendix A — Debugging a failed check in Step 2

`verify-auth.sh` sends the server's output to `/dev/null`, so a failure shows you the
status code but not the reason. To see the logs, run the server yourself with the hatches
off and repeat just the check that failed:

```bash
cd api
ENVIRONMENT=staging uv run python -m uvicorn app.main:app --reload
```

`ENVIRONMENT=staging` in front of the command applies to that process only — it does not
edit `.env` and is gone when you Ctrl-C. The value is not special: `AuthMiddleware` checks
for the exact string `development`, so anything else disables the escape hatches. That is
deliberate, so a misspelled `ENVIRONMENT` fails closed.

Then, in another terminal, the single failing request, e.g.:

```bash
curl -si localhost:8000/auth/me -H "x-test-user-id: 11111111-1111-1111-1111-111111111111"
```

---

# Appendix B — Rolling back

This branch's only migration is `20260904140000_profiles_grants.sql`. The RLS policies
on `profiles` come from `20260831120000_profiles_rls.sql`, which is **already merged to
main** — they are not this branch's to roll back, and dropping them would revert someone
else's shipped work.

Migrations are reversed with a *new* migration, never by editing a merged one (ADR 0002).
Emergency dashboard rollback of this branch, dev only:

```sql
revoke select, insert, update on public.profiles from service_role;
```

Be clear about what that does: it does not loosen anything, it **breaks the API**. Every
`/profile` call goes back to 42501, which is the state `main` is in today. The only reason
to run it is to reproduce that failure deliberately.

There is no rollback needed for the frontend — sign-in is additive, and reverting the
branch removes `/login`, `/auth/callback`, and the `RequireSession` gates together.

