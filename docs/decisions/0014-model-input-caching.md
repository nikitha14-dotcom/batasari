# 0014 - Cache non-personalized model inputs without user conversation data

**Date:** 2026-09-19 · **Status:** Proposed for review

## Context

Repeated public questions currently repeat source reads and model calls. ADR 0006
allows raw turns to be retained in the user-owned `conversation_history` table,
but that history is a separate product feature and must never enter a shared
cache. The gateway also runs on multiple Cloud Run instances, so an
in-memory-only answer cache cannot be shared or reliably invalidated.

## Decision

- Supabase stores shared cache entries for approved source excerpts, normalized
  public facts, and fully generic answers.
- Cache rows contain hashes, classification metadata, expiry, and a JSON payload.
  They never contain a user ID, profile context, preference summary, conversation
  ID, or raw question.
- Personalized answers are always generated live and are never persisted in
  `model_input_cache`. They may be retained in the separate, user-scoped
  `conversation_history` table under ADR 0006. A request containing conversation
  context or a derived preference summary is personalized and bypasses the
  shared generic-answer cache.
- A source's cache TTL defaults to 15 minutes and may be configured up to 24
  hours on `trusted_sources`. Frequently changing sources retain shorter TTLs.
- Generic answers remain capped at 30 minutes even when their source content has
  a longer TTL.
- Keys include the source snapshot. A reseed or source edit creates a new
  snapshot and therefore an immediate logical miss; expired and unreachable
  rows are removed separately.
- Generic-answer keys also include category, subcategory, normalized question
  hash, prompt version, and model. A prompt rollback or model change cannot serve
  output generated under another configuration.
- Each API instance keeps a bounded in-memory front layer. Supabase failures are
  fail-open: the request continues through live retrieval or generation.
- Generic-answer caching is disabled by default and requires
  `GENERIC_ANSWER_CACHE_ENABLED=true` after this ADR is approved.
- TTL is a safety-net expiry and is checked on every read. No database trigger
  or scheduled deletion job participates in correctness; unreachable expired
  rows may be removed by an explicit maintenance cleanup.

## Consequences

The shared lookup adds a database read to eligible generic `/ai/answer` calls,
but avoids model cost on a hit. Personalized requests skip the cache entirely.
Public-search and official-excerpt producers can use the cache contract when
their retrieval implementations land; this ADR does not invent those producers.

