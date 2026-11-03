# Batasari product and architecture

## Product goal

Batasari helps people plan a move between Indian cities and people returning to or relocating to India from abroad. It is a planning product, not a mover marketplace, immigration adviser, price guarantee, or provider verification service.

## MVP journeys

1. **Move profile:** choose a move within India, a return to India, or relocation to India; capture destination, household, date, and relevant stay status.
2. **City research:** browse supported city/state, region, commonly used languages, and INR/time-zone context. Users verify neighborhood, transport, housing, school, and health details locally.
3. **Move preparation:** use route-specific checklists; compare written household mover quotes; plan local transport, packing, storage, and international shipment.
4. **Arrival research:** visit official Indian visa, OCI, and customs resources. Batasari does not decide eligibility or prescribe legal requirements.
5. **Saved move plan:** signed-in users save their route and service interests. The API scopes every read and update to the authenticated user; local development has a process-local store.

## Application structure

```text
web/                         Next.js App Router, React, TypeScript
  app/                       Public pages, authentication, profile, guide routes
  components/batasari/       India-focused landing, planner, guides, checklists
  lib/                       API, Supabase auth, profile and UI services
api/                         FastAPI application
  app/routers/india.py       City catalogue, checklists, and saved move plans
  app/services/india_catalog.py  Curated Indian cities and planning prompts
  app/routers/auth.py        Authentication verification
  app/routers/profile.py     User move profile
supabase/migrations/         Database schema history (apply to a new Batasari project)
docs/                        Product, architecture, and operational notes
```

## India API

The API is mounted under `/india`:

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/india/cities` | Public | List supported Indian cities; optional `region` and `q` filters |
| `GET` | `/india/checklists/{move_type}` | Public | Return planning prompts for one of the three move types |
| `GET` | `/india/move-plans` | Authenticated | List the caller's saved plans |
| `POST` | `/india/move-plans` | Authenticated | Create a plan with route, destination, household size, and services |
| `PATCH` | `/india/move-plans/{plan_id}` | Authenticated | Update selected fields on the caller's plan |

Move types are `within_india`, `returning_to_india`, and `relocating_to_india`. Service categories are `packers_movers`, `local_transport`, `storage`, and `international_shipping`. Currency metadata is INR; the product deliberately does not invent provider prices.

### Data and safety boundaries

- `move_plans` stores only user-submitted planning details. RLS is enabled and policies scope access to `auth.uid()`; API queries also filter by the verified caller's user ID.
- Configure a separate Batasari Supabase project and secrets before using persistent accounts. Do not reuse the source app's database or service-role key.
- Apply the Batasari migrations to a clean project only after reviewing inherited migration history and seed data. Legacy Toronto/Canada routes, content, neighborhood safety datasets, and migration seeds are still present in this source copy and must not be treated as India information.
- City languages are broad context, not a promise about an individual neighborhood or service. Safety, crime, rent, mover availability, and prices need current, city-specific authoritative or provider data before production claims are made.
- Visa, OCI, baggage, and customs requirements change and depend on individual circumstances. The UI links to official portals and labels its checklist as a planning aid.
- Real provider listings, background verification, live INR quotes, payments, customer support operations, multilingual translation, and production privacy/security review are future work.

## Local checks

From `web/`: `pnpm test`, `pnpm typecheck`, and `pnpm build`.

From `api/`: `uv sync --extra dev`, `uv run ruff check .`, and `uv run pytest -q`.

The development fallback uses a process-local move-plan store and clears when the API process restarts. Supabase persistence requires applying migrations and configuring the Batasari environment.

