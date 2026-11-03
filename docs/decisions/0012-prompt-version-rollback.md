# 0012 — Prompt-version rollback: a Cloud Run env var, validated at startup

**Date:** 2026-09-10 · **Who:** Rahul Vaidhya (Platform lead) · **Status:** Accepted

## Context
From the Eng/DS backlog: *"if we detect bad user prompts after launch, what's our
roll back plan and how quickly we can do it? We should have a easy/quick
configuration to roll back to previous version."* Week 3 turns that into a task:
switch `/ai/answer` back to a previous prompt version without a redeploy.

Before this, the prompt was a constant in `runner.py`. Changing it meant a PR, a
review, a merge and a Cloud Build — the slowest path available, at exactly the
moment speed matters.

## Decision
- Prompts live in `api/app/gateway/prompts.py` as a registry keyed by version.
  **Registered versions are append-only**: to change a prompt, add a new key. If
  `v1`'s text could be edited, "roll back to v1" would not mean the prompt that
  actually ran as v1.
- `PROMPT_VERSION` picks the active one. Blank or unset means
  `DEFAULT_PROMPT_VERSION`.
- The API resolves it **at startup** and refuses to start on an unknown version.
- Every `/ai/answer` response carries `metadata.prompt_version`. Prompt version is
  one of the Tier 1 fields that engineering-foundations §8 says every model call
  must log. It is returned to the client here, but not yet logged server-side.

**Rollback** — no code change, no build:

```bash
gcloud run services update moving-assistant-api-staging \
  --project moving-assistant-507202 --region northamerica-northeast2 \
  --update-env-vars PROMPT_VERSION=v1
```

Cloud Run starts a new revision from the image that is already built. A typo such
as `PROMPT_VERSION=v11` makes that revision fail to start, and traffic stays on
the previous revision. A bad rollback command therefore cannot take the service
down. Confirm the rollback worked from `metadata.prompt_version` on any answer.

To go back to the code default: `--remove-env-vars PROMPT_VERSION`.

`deploy-api.yml` uses `--update-env-vars`, not `--set-env-vars`. The latter
deletes every variable it does not list, so the next merge to `main` would
silently undo a rollback.

## Alternatives considered
- **Active version stored in a database row.** Truly no new revision. But it puts
  a database read on every `/ai/answer`, adds a failure mode to the hot path, and
  turns a typo into a per-request error instead of a failed startup. That is not
  worth it at pilot scale.
- **Cloud Run traffic rollback to an older revision.** This is already available
  and is the right tool for a *code* regression. But it rolls back everything in
  that revision, not just the prompt.

## Consequences
- A rollback is one command, run by anyone with deploy rights on the service.
- Only versions that have been merged can be rolled back to. That is intended:
  every prompt that reaches users has been reviewed.
- The active version lives in Cloud Run config, not the repo.
  `gcloud run services describe` is the source of truth for what is live.
- Before switching to a new version, it should be run through the eval harness
  (ADR 0013).

