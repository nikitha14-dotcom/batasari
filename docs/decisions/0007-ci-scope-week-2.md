# 0007 — CI week 2: tests, build, and security scanning

**Date:** 2026-08-31 · **Who:** Rahul Vaidhya (Platform lead) · **Status:** Accepted
**Supersedes:** [ADR 0005](0005-ci-scope-week-1.md)

## Context
ADR 0005 deliberately scoped CI to lint and typecheck for week 1, on the grounds
that a stricter gate would fail on absence rather than on defects. The week 2 task
sheet lifts that:

> "CI: checkout → dependencies installation → code quality → tests (unit,
> integration, end-to-end tests) → build → security scanning"

Two things also happened that bear on this. A frontend test sat broken in `main`
for a day without anyone noticing, because Vitest was configured but not gated —
`web/app/page.tsx` became a redirect and the smoke test asserting a heading kept
failing silently. And a dependency audit surfaced 31 advisories, one of them
critical, in dependencies this repo had already merged.

## Decision

**Gated — a failure blocks the merge:**

| Stage | Web | API |
|---|---|---|
| Dependencies | `pnpm install --frozen-lockfile` | `uv sync --extra dev` |
| Code quality | `pnpm lint` | `uv run ruff check .` |
| Unit tests | `pnpm test` (Vitest) | `uv run pytest -q` |
| Build | `pnpm build` | — |
| Dependency audit | `pnpm audit --audit-level critical` | — |

**Reported but not gated:**

- `pnpm audit --audit-level high` — output visible, exit code ignored
- `pip-audit` on exported API requirements
- Secret scanning (TruffleHog, `--only-verified`)

**Deliberately absent:** integration and end-to-end tests. The task sheet names
them, but no such tests exist in the repo. A stage that runs nothing and reports
success is worse than no stage, because it looks like coverage.

## Why the audit is gated at critical, not high

There are 12 high-severity advisories, and essentially all of them are Next.js
14.x, fixed only in 15.5.x. That is a major-version upgrade affecting the whole
frontend — a team decision, not something to force through a CI gate.

Gating on `high` today would leave CI permanently red. A permanently red pipeline
is one everyone learns to ignore, which costs more than the advisories do. So the
gate sits at `critical` (currently zero, and enforced), with `high` reported on
every run so the backlog stays visible.

The one critical advisory — Vitest below 3.2.6 — was introduced by ADR 0005's own
work and is fixed in this change by upgrading to 3.2.7.

## Exception: two Next.js criticals with no 14.x fix (added 2026-09-10)

Two critical advisories were published on 2026-09-08. Both affect every Next.js 14
release, and both are fixed only in 15.5.24+:

- **GHSA-p293-qw3h-jr36** (CVE-2026-75604): unauthenticated remote code execution
  when the Next.js server runs on Windows. There is no workaround.
- **GHSA-2xp9-vwfh-vxw4**: remote code execution in the image optimization API
  when it processes AVIF files.

14.2.35 is the final 14.x release, so there is no patch to move to. The gate above
started failing every PR, whether or not it touched `/web` (see the next section).

Both advisories are ignored **by ID** in `web/package.json`
(`pnpm.auditConfig.ignoreGhsas`). Nothing else is ignored: any other critical
still fails the build, and the audit output lists these two as "(2 ignored)", so
they stay visible.

**Why this is acceptable until the upgrade:**
- **Windows.** The frontend is not hosted anywhere yet, and it will be hosted on
  Vercel, which runs Linux. The real exposure is `next dev` on the team's Windows
  laptops. The dev script now binds to `127.0.0.1`, so the dev server can only be
  reached from the laptop it runs on, not from a shared network.
- **AVIF.** The app does not use `next/image`. `images.unoptimized` is now set in
  `next.config.js`, and with it set, Next's server answers the image optimizer
  route with a 404. Nothing renders differently today.

**Expiry.** The exception ends with the Next.js 15.5.24+ upgrade, and launch does
not ship with it. The upgrade PR removes the `ignoreGhsas` entry,
`images.unoptimized` and the `-H 127.0.0.1` flag, and tightens this gate to
`high`, as the consequences below already call for.

## A change is blocked only by dependencies it changes (added 2026-09-10)

The audit ran against the whole dependency tree on every PR. So when the two
advisories above were published, API-only, migration-only and docs-only PRs went
red too, for something none of them changed. Any future advisory would do the
same: freeze the whole team until someone ships a fix.

**The rule now:**
- **On a PR or a push to main**, the critical audit blocks only if the change
  touches `web/package.json` or `web/pnpm-lock.yaml`. Those are the only ways a
  change can bring in a vulnerable dependency. Otherwise the audit still runs, and
  a failure shows as a warning on the check instead of failing it.
- **Every day**, `dependency-audit.yml` audits main's web dependencies and fails if
  any critical is present. That is where newly published advisories show up.
  GitHub emails the person who last edited that workflow's schedule when a
  scheduled run fails.
- **When the daily audit goes red**, the fix is a PR that upgrades the
  dependency. If no fix exists yet, it records a dated exception like the one
  above. Either way the PR touches the dependency files, so it gets the strict
  gate.

## Third-party actions are pinned to commit SHAs

`trufflesecurity/trufflehog` is pinned to the SHA of release v3.97.1, not to
`@main`. A moving reference means a third party can change what executes inside
our pipeline — with access to the repository and any secrets the job can see —
without any change on our side. First-party `actions/*` and `astral-sh/setup-uv`
are left on major-version tags, which is the common trade-off; the scanner is
pinned harder because it runs over the whole working tree.

## Why secret scanning is not blocking yet

It has never run on the GitHub runner. A false positive on its first outing would
block every merge for the whole team. It runs with `continue-on-error` until it
has passed cleanly a few times, then it gets promoted.

## Consequences
- A broken frontend test now blocks a merge, which is what would have caught the
  redirect regression the day it landed.
- `pnpm build` catches Next.js build failures that `tsc --noEmit` does not — server
  component errors, bad imports, failed static generation.
- CI is slower. The build and audit steps add roughly a minute.
- The Next.js 14 → 15 upgrade is now a tracked, visible piece of work rather than
  an invisible one. Whoever picks it up should tighten this gate to `high` after.
- Integration and e2e stages remain owed. They need tests written first, and an
  owner — currently nobody's.

