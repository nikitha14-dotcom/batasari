# Batasari

Relocation planning for people moving between Indian cities and people moving to India from abroad.

This application is a new Batasari project based on a copy of the Moving Assistant codebase. Its main experience includes an India move planner, Indian city guide, household moving preparation, interactive checklists, official links for India stay and customs research, and India-specific API routes for city data and saved move plans. Legacy Canada screens, datasets, content, and migration history remain in the copied source; see [Batasari product and architecture](docs/batasari-product-and-architecture.md) before exposing legacy routes or deploying.

The public planning pages can be browsed without signing in. Account creation, onboarding profile storage, and production hosting require a separately configured Batasari backend.

## Repo structure

```
/web    — Next.js + TypeScript frontend
/api    — FastAPI backend (Python)
/eval   — DS evaluation notebooks, prompt files, gold datasets
```

## Prerequisites

**Node.js** (LTS) — check with `node --version`. If missing, install from nodejs.org.

**uv** (Python package/dependency manager) — check with `uv --version`. If not found:

- **Windows (PowerShell):**
  ```powershell
  powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
  ```
  Close and reopen your terminal. If still not found, add it to PATH manually:
  ```powershell
  [Environment]::SetEnvironmentVariable("Path", $env:Path + ";$env:USERPROFILE\.local\bin", "User")
  ```
  Then close and reopen your terminal again.

- **Mac/Linux:**
  ```bash
  curl -LsSf https://astral.sh/uv/install.sh | sh
  ```
  Then restart your terminal.

**pnpm** — check with `pnpm --version`. If not found:
```bash
npm install -g pnpm
```

**Supabase CLI** — check with `supabase --version`. If not found:

- **Windows (via Scoop):**
  ```powershell
  scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
  scoop install supabase
  ```
  (If you don't have Scoop: `irm get.scoop.sh | iex` first, then the two lines above.)

- **Mac:**
  ```bash
  brew install supabase/tap/supabase
  ```

- **Linux / no package manager:** download the binary directly from
  https://github.com/supabase/cli/releases and add it to your PATH.

> **Windows note — PowerShell blocking npm/pnpm:** if you get an error like
> *"npm.ps1 cannot be loaded because running scripts is disabled on this system"*,
> PowerShell's execution policy is blocking it. Fix permanently (no admin needed):
> ```powershell
> Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
> ```
> Then close and reopen PowerShell. If you'd rather not change the policy, use
> `npm.cmd` / `pnpm.cmd` instead of `npm` / `pnpm` as a workaround.

> **Windows note — VS Code terminal not finding node/npm/uv:** if commands work in
> a regular terminal but not inside VS Code, fully close and reopen VS Code (not just
> the terminal panel) so it picks up the updated PATH.

## Setup (first time)

### 1. Clone and enter the repo
```bash
git clone https://github.com/<your-github-username>/batasari.git
cd batasari
```

### 2. Environment variables
```bash
cp .env.example .env
```
Then configure a **separate Batasari Supabase project and API credentials**. Do not point this
copy at the source app's database or reuse its production secrets. Review the inherited
migration history and seed data before applying it to a new project; legacy Canada content is
not suitable for a public Batasari launch.

### 3. Frontend (`/web`)
```bash
cd web
pnpm install
pnpm dev
```
Visit http://localhost:3000 — you should see the Batasari landing page.

> If `pnpm install` prompts about approving build scripts (e.g. for `unrs-resolver`),
> run `pnpm approve-builds`, select the listed package, and confirm.

### 4. Backend (`/api`)
> **Navigation note:** if you just finished the frontend step, you are currently inside the `/web` folder. Run `cd ../api` to get into the right place before running the commands below.
```bash
cd api
uv sync
uv run python -m uvicorn app.main:app --reload
```

To run the linter and tests locally — the same checks CI gates on — install the dev
extras once. `uv sync` alone installs runtime dependencies only, so `ruff` and
`pytest` will not be on the path:

```bash
uv sync --extra dev
uv run ruff check .
uv run pytest -q
```
Visit http://localhost:8000/health — you should see `{"status": "ok"}`.

> **Windows note:** if `uv run uvicorn app.main:app --reload` fails with a "spawn
> blocked" or application-control error, use the `python -m uvicorn` form above —
> it routes through `python.exe`, which avoids Windows blocking the standalone
> `uvicorn.exe` as an unrecognized executable.

### 5. Database

Most of the team: your `.env` already has a working Supabase URL and keys from the
shared secrets note — you don't need to run anything below unless you're specifically
working on schema/migrations.

If you're working on schema/migrations, you'll need Supabase project access first
(ask Wissem or Rahul), then:
```bash
supabase login
supabase link --project-ref <project-ref>
supabase db reset          # rebuild your local DB from migrations, from scratch
```

Migrations in `supabase/migrations/` are the only source of schema truth — **never**
change schema in the Supabase dashboard. Full process and rationale:
[`docs/decisions/0002-migrations-and-schema-source-of-truth.md`](docs/decisions/0002-migrations-and-schema-source-of-truth.md).

### 6. Authentication (Supabase Auth — email magic link)

Sign-in is passwordless: you enter an email, Supabase sends a link, clicking it signs you
in. The browser holds the session; every request to `/api` carries the token; the backend
asks Supabase to verify it. Full rationale in
[`docs/decisions/0008-authentication-supabase-magic-link.md`](docs/decisions/0008-authentication-supabase-magic-link.md).

**One-time dashboard setup** (dev project, Authentication section):

- **URL Configuration** → Site URL `http://localhost:3000`, and add
  `http://localhost:3000/auth/callback` to Redirect URLs.
- **Sign In / Providers → Email** → enabled.

A redirect URL that is not on that list fails *when the link is clicked*, not when it is
sent — the email arrives fine and then the callback shows an error. Check the list first.

**Env vars** — all in the repo-root `.env`, names in `.env.example`:
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
`NEXT_PUBLIC_API_URL`, `CORS_ALLOW_ORIGINS`, and `NEXT_PUBLIC_SITE_URL` (deployed only).

> `web/next.config.js` loads the **repo-root** `.env`. Next.js normally only reads `.env`
> from `/web`, so without that line the anon key never reaches the browser and every auth
> call silently does nothing. Restart `pnpm dev` after editing `.env` — `NEXT_PUBLIC_*`
> values are baked in at build time, not read at runtime.

**Running without Supabase credentials.** If the three Supabase values are blank, both
halves fall back to a single local user (`ENVIRONMENT=development` only) so onboarding still
works. Convenient, and also the reason a broken key looks like a working app — if you are
testing auth, confirm `GET /auth/me` returns `"auth_source": "supabase"`.

**Local sign-in bypass.** Setting `NEXT_PUBLIC_TEST_USER_ID` makes the browser send
`x-test-user-id` and skips sign-in. The API honours that header **only** when
`ENVIRONMENT=development`. Leave it blank unless you mean it.

**Testing it end to end:**
[`docs/testing/auth-manual-test-plan.md`](docs/testing/auth-manual-test-plan.md).

## Tech stack

Summary of chosen stack (full decision log coming to `/docs/decisions/` as we build):
- Frontend: Next.js + TypeScript, pnpm
- Backend: FastAPI (Python), uv
- Database: Supabase Postgres + pgvector + PostGIS
- Auth: Supabase Auth (email magic link, PKCE; token verified server-side)
- Storage: Supabase Storage
- Hosting: Vercel (web) + Google Cloud Run (api)
- Lint/format: ESLint + Prettier (web), Ruff (api)
- Testing: pytest (api), Vitest (web)

## Conventions

- Every PR needs one reviewer, within 24h.
- Nothing sensitive committed — env vars only, `.env` is gitignored.
- A task is "done" when: merged to main, runs in dev, noted in weekly update, doesn't break CI.

## Known setup gotchas (found during initial testing)

If you hit something not covered above, check here before asking — these were all
hit and fixed during first setup:
- `uv` not found after install → PATH issue, see Prerequisites above
- `uvicorn` "spawn blocked" on Windows → use `python -m uvicorn`, see step 4 above
- `npm`/`pnpm` blocked by PowerShell → execution policy, see Prerequisites above
- VS Code terminal not seeing newly installed tools → fully restart VS Code
- Magic link says "opened in a different browser" → PKCE keeps the redeeming secret in the
  browser that requested the link. Open it where you asked for it.
- No sign-in email arrives → Supabase's built-in sender is rate-limited to a handful per
  hour for the whole project. Check Authentication → Logs in the dashboard before
  suspecting the code.
- Signed in but the API still returns 401 → you almost certainly edited `.env` without
  restarting `pnpm dev`. `NEXT_PUBLIC_*` values are compiled in, not read at runtime.

