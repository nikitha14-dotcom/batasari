# 0001 — Monorepo with /web, /api, /eval

**Date:** 2026-08-30 · **Who:** Rahul Vaidhya (TL Full-stack) · **Status:** Accepted

## Context
Three workstreams ship in parallel in an 8-week build: a Next.js frontend, a FastAPI
backend, and DS evaluation work. DS needs to call the same model interface the product
calls, and evaluate against the same input schema. Separate repos would mean the eval
harness drifts from the code it is meant to evaluate, and every cross-cutting change
becomes a two-repo PR dance with two reviewers and no atomic revert.

## Decision
One repository, three top-level directories:

- `/web` — Next.js + TypeScript frontend (pnpm)
- `/api` — FastAPI backend (uv)
- `/eval` — DS notebooks, prompt files, gold datasets

DS notebooks and prompt files live beside the code that consumes them, not in a
separate repo. `/web` and `/api` keep independent dependency manifests and lockfiles;
there is no shared JS/Python workspace tying them together.

## Consequences
- A change spanning frontend and backend is one PR, one review, one revert.
- CI runs two independent jobs; a Python change cannot break the web job and vice versa.
- Deployment targets differ per directory (Vercel for `/web`, Cloud Run for `/api`), so
  deploy configuration is per-directory rather than repo-wide.
- Repo-wide tooling (a single root lint or test command) is deliberately absent. Each
  directory is entered and run on its own terms.

