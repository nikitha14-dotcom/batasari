# Batasari

Batasari helps people plan a move between Indian cities or a move to India from abroad. The starter website includes an India move planner, city guide with regional language context, household moving guidance, arrival resources, and an interactive checklist.

## Run the website on Windows

You need Node.js 20 or newer and pnpm. Install Node.js from [nodejs.org](https://nodejs.org/) if needed, then install pnpm once:

```powershell
npm.cmd install --global pnpm
```

Open PowerShell in the Batasari repository folder and run:

```powershell
cd web
pnpm.cmd install
pnpm.cmd dev
```

Open <http://localhost:3000>. The public planner, city guide, moving guidance, and checklist work without a Supabase account or a running backend. Guest move plans are saved in the current browser on the current device. When Supabase and the API are configured and a user is signed in, the move route and core move details can also sync to the account; the detailed budget and checklist remain browser-local.

Stop the website by pressing **Ctrl+C** in PowerShell.

## Run on macOS or Linux

Install Node.js 20 or newer and pnpm, then from the repository folder run:

```bash
cd web
pnpm install
pnpm dev
```

Open <http://localhost:3000>.

## Optional backend and accounts

The FastAPI backend and Supabase migration support account-backed move plans. They are not required to review the public website. The planner uses `GET /india/cities`, `POST /india/move-plans`, and `PATCH /india/move-plans/{plan_id}` for city options and authenticated plan syncing. To enable account sign-in or deploy the backend, create a separate Batasari Supabase project, configure the variables in `.env.example`, and review the migrations before applying them. Do not reuse credentials or a database from the source Moving Assistant project.

## Product scope

- India-city move planning and household relocation preparation.
- City starting points include regional context, common languages, INR, and India Standard Time.
- City comparison at `/city-compare` compares supported directory metadata side by side (state, region, languages, currency, and time zone). It explicitly marks cost, rent, jobs, climate, connectivity, and lifestyle metrics as unavailable until verified, dated source datasets are integrated. No composite scores or city rankings are generated.
- Practical quote and mover-safety questions for local transport, intercity moves, and packers.
- Arrival and document research links to official Government of India sources.
- No mover marketplace, price guarantee, or provider verification is represented as available.
- Immigration, customs, local service, and price requirements should be verified with the relevant official source or provider.

The original Moving Assistant repository is separate. This repository is Batasari's working copy.
