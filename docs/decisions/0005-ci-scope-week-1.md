# 0005 — CI gates lint and typecheck only in week 1

**Date:** 2026-08-30 · **Who:** Rahul Vaidhya (TL Full-stack) · **Status:** Superseded by [ADR 0007](0007-ci-scope-week-2.md)

## Context
"Does not break CI" is part of the team's definition of done, so CI has to exist before
feature work merges. But there is almost no code yet, no agreed Front End Testing Plan,
and no evaluation gold set. A strict test gate this week would fail on absence rather
than on defects, and the fastest way to make a team ignore CI is to have it go red for
reasons nobody can act on.

## Decision
GitHub Actions runs on every pull request to `main` and on push to `main`, as two
independent jobs:

- **web** — `pnpm lint`, `pnpm typecheck`
- **api** — `uv run ruff check .`, `uv run pytest -q`

`pytest` is included on the API side because `api/tests/test_health.py` already exists
and takes seconds; it is not a new gate.

Vitest is installed and configured in `/web` with one smoke test, but is **deliberately
not gated in CI this week**. It joins the workflow once the Front End Testing Plan is
agreed.

`pnpm build` is not in CI this week either. It belongs with deployment.

## Consequences
- CI is fast and its failures are always actionable: a lint error or a type error.
- Type errors are caught before review, which matters most at the frontend/backend
  boundary where contracts are still moving.
- A change that typechecks but breaks the Next.js production build will not be caught
  until deploy. Accepted for one week; `pnpm build` joins CI with the staging deploy.
- Frontend test coverage is not enforced. This is a known, time-boxed gap.

