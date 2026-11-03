# 0015 - Separate Beta-time access from AI-credit enforcement

**Date:** 2026-09-29 · **Status:** Accepted

## Context

The Beta gives each user three days of product access and $1 of model usage.
The spend cap already exists, but time expiration did not. Existing users also
verified before enforcement was available, so applying `email_confirmed_at +
72 hours` directly would lock out the whole pilot at activation.

Team members need continued access for testing. The existing spend-cap
exemption list is also the approved Beta-time exemption list, so operators have
one user-ID setting to maintain. Expired users must also retain the deletion
controls required by ADR 0006.

## Decision

- The effective start is `max(email_confirmed_at, BETA_ACCESS_EPOCH)` and the
  window is exactly 72 hours by default.
- `BETA_ACCESS_ENABLED` is off by default. The epoch and flag are set together
  on Cloud Run when enforcement is activated.
- `AI_SPEND_CAP_EXEMPT_USER_IDS` is the single comma-separated list of Supabase
  user IDs that bypasses both the $1 spend cap and the 72-hour Beta expiry.
- API startup copies those IDs into `app_settings.beta_access_retention` so the
  database cleanup job uses the same exemption set. A global stop overrides
  the exemption for both access and retention.
- Membership in `beta_waitlist` separately excludes a user from automatic
  retention deletion during normal operation because it records an explicit
  request to continue. This does not exempt the user from access or spend
  limits. A global Beta stop overrides waitlist and team exemptions.
- Missing user timestamps fail open for time access.
- Enabling the policy with a missing or invalid epoch, or a non-positive access
  duration, fails at API startup with an explicit configuration error.
- Three-day expiration blocks authenticated product routes. It does not block
  Contact Support, sign-out, `DELETE /ai/conversations`, or
  `DELETE /ai/insights`.
- PR #119's end-of-Beta screen is the single frontend gate and keeps visible
  controls for deleting conversations and AI insights after expiry.
- When set, `BETA_STOPPED_AT` closes those product routes for every user at the
  configured instant, including users with unlimited time. The same timestamp
  starts their seven-day retention clock.
- The $1 cap blocks only `/ai/answer`; static guidance and other product areas
  remain available until the time window expires.
- Access denials are logged by user ID and reason code, never by email.

## Operations

- Keep `BETA_ACCESS_ENABLED=false` until the migration and team entries are
  verified in staging.
- Set `BETA_ACCESS_EPOCH` and `BETA_ACCESS_ENABLED=true` in the same Cloud Run
  configuration update. Deployment uses `--update-env-vars`, so direct service
  overrides survive later application deploys.
- API startup synchronizes the epoch and retention duration to
  `app_settings.beta_access_retention`, which is the pg_cron cleanup job's
  source of truth. Automatic deletion remains off while
  `BETA_RETENTION_DELETE_ENABLED=false`; preview the due counts in staging
  before enabling it. Set `BETA_STOPPED_AT` when the entire Beta ends so the same
  access stop and seven-day clock apply to time-exempt team members. Removing
  the environment value clears the synchronized stop timestamp at startup.
- Run the [Beta retention staging smoke test](../testing/beta-retention-smoke-test.md)
  before enabling the policy or changing its retention configuration.
- Review the preview counts for product-update subscriptions as well as the
  other user-owned tables and Auth accounts. Confirm waitlisted and team users
  are absent from normal-expiry due counts before enabling deletion. When a
  global stop is configured, confirm its preview includes every user because
  that mode intentionally overrides both exemptions.
- Record the activation epoch in the runbook. Moving it later intentionally
  grants the cohort another full window.
- `AI_SPEND_CAP_USD` remains the no-deploy control for the standard spend cap.

## Consequences

- Existing users receive a fair window when enforcement launches.
- Exemption management uses one Cloud Run setting and stable Supabase user IDs.
- Derived insights are durable in Supabase. The scheduled retention check is
  non-destructive while deletion is disabled. Once staging preview counts are
  approved and deletion is enabled, it removes the Auth account and all
  user-owned rows, including conversation history, derived insights, profiles,
  feedback, contact messages, product-update subscriptions, Beta access events,
  and AI answer logs within seven days after access ends. Waitlisted and team
  users are retained unless the entire Beta is stopped.

