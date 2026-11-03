# 0009 — Keyless GitHub → GCP auth, and the Toronto region

**Date:** 2026-09-02 · **Who:** Rahul Vaidhya (Platform lead) · **Status:** Accepted

## Context
The week 2 task is "Cloud Run service setup — create the service, configure
environment, wire deployment pipeline from GitHub Actions to staging." Two choices
inside that are worth writing down, because both are hard to reverse later.

**How GitHub authenticates to GCP.** The common approach is to create a service
account, download a JSON key, and paste it into a repo secret. That key is a
permanent credential: it does not expire, it works from anywhere, and if it leaks
it stays valid until someone notices and revokes it.

**Which region the service runs in.** Cloud Run regions are fixed at creation.

## Decision

**Workload Identity Federation, not a service account key.** GitHub mints a
short-lived OIDC token, GCP is configured to trust it for this specific repository,
and no long-lived credential exists anywhere. The workflow needs
`permissions: id-token: write` for this to work.

**Region `northamerica-northeast2` (Toronto).** Lowest latency for a Toronto-pilot
product, and it keeps user data — visa type, household composition, children's ages,
postal codes — inside Canada.

**`ENVIRONMENT=staging` is set on the service.** Not cosmetic: the auth middleware
only honours the `x-test-user-id` impersonation header when `ENVIRONMENT` is
`development` (see ADR 0004 and the auth-gate fix). Deploying without setting this
would leave the dev bypass live in staging.

## Consequences
- No credential to leak, rotate, or forget about. A compromised repo cannot be used
  to reach GCP after the fact.
- Setup cost is higher: a workload identity pool and provider must be created, and
  the service account needs an IAM binding trusting this repo. That requires
  permission to grant IAM roles, which `roles/editor` does not include — this is the
  outstanding blocker.
- Region cannot be changed without recreating the service. Moving later means a new
  URL and re-pointing the frontend.
- Secrets are **not** wired into the deploy yet. Supabase and model-provider values
  still need creating in Secret Manager and attaching with `--set-secrets`; a deploy
  referencing a secret that does not exist fails outright, so that lands separately.

