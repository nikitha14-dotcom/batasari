# 0006 — Data retention: resumes only; no raw conversation history

**Date:** 2026-08-30 · **Who:** Jia Gu (product), documented by Rahul Vaidhya (TL Full-stack) · **Status:** Superseded in part — see Updates (2026-09-19, 2026-09-28, 2026-09-29, 2026-10-01) below

## Update — 2026-10-01: full-profile Beta retention

**Who:** Jia Gu (product), implementation refinement documented by Vu Chau

- The seven-day automatic retention scope covers the user's Auth account and
  all user-owned rows: `profiles`, `feedback`, `contact_messages`,
  `product_update_subscriptions`, `conversation_history`, `user_insights`,
  `beta_access_events`, and `ai_answer_log`. This deletes the login email,
  authentication metadata, product-update email, and typed Beta feedback.
- Users in `beta_waitlist` are excluded from automatic deletion because joining
  the waitlist records their explicit interest in continuing. Team members in
  the shared exemption list are also retained. Everyone else is treated as a
  dropped-off user once their retention deadline passes.
- If product discontinues the entire Beta, the global stop starts the retention
  clock for everyone and overrides both waitlist and team exemptions.
- `20260930120000_beta_ai_data_retention.sql` introduced the durable insight
  store and opt-in cleanup function. Because it was already applied to staging,
  `20261001120000_extend_beta_profile_retention.sql` extends that function
  without rewriting migration history.
- The scheduled retention check runs hourly, but destructive deletion remains
  disabled while `BETA_RETENTION_DELETE_ENABLED=false`. Dry-run counts must be
  reviewed before deletion is enabled.
- End-of-Beta screen is the single access screen and exposes both
  user-initiated actions: **Delete conversations** and **Delete AI insights**.

## Update — 2026-09-29: Beta access clock and deletion access

**Who:** Jia Gu (product), implementation refinement documented by Vu Chau

The three-day duration remains unchanged. Its start is now defined precisely:

- Access lasts exactly **72 hours**, not through the third calendar day.
- The normal start is the user's Supabase `email_confirmed_at` timestamp.
- At rollout, `BETA_ACCESS_EPOCH` is a floor: the effective start is
  `max(email_confirmed_at, BETA_ACCESS_EPOCH)`. This prevents users who
  verified before enforcement shipped from being locked out immediately.
- Team exemptions use the same Supabase user-ID list for the 72-hour window and
  the $1 AI-credit cap.
- Expired users retain access to Contact Support, sign-out, and the endpoints
  that delete conversation history and derived insights. Expiration must not
  remove the user-initiated deletion guarantee documented below.
- If the access-policy lookup fails, time access fails open. An outage must not
  falsely tell every signed-in user that their Beta has ended.

Implementation and rollout details are recorded in ADR 0015.

## Update — 2026-09-28: 7-day retention for the Beta

**Who:** Jia Gu (product), documented by Rahul Vaidhya (Tech Lead / Platform)

The retention duration left TBD on 2026-09-19 is now decided. The 12 months
below no longer applies.

**Decision:**
- A user's stored profile data is deleted
  **within 7 days** after either their Beta access ends or we stop the Beta.
  This matches the Beta Privacy Statement: "If you stop using our app or we
  discontinue our Beta, we will delete your data from our systems within seven
  days and, where practical, notify registered users."
- Beta access lasts **3 days**. The exact start was refined on 2026-09-29 to
  use email verification with a rollout epoch floor. So
  for a single user, deletion is due within 7 days after their 3-day access
  ends.

**Implementation status (updated 2026-09-29):**
- User-initiated deletion is **implemented**: "Clear conversation" deletes the
  user's `conversation_history` rows for that category (#92), and "Clear AI
  memory" deletes their derived insights (#86).
- Automatic deletion is implemented by
  `20260930120000_beta_ai_data_retention.sql` and
  `20261001120000_extend_beta_profile_retention.sql`. The scheduled check
  previews or removes every user-owned table and the Auth account; users in
  `beta_waitlist` and the shared exemption list are excluded during normal
  operation. A global Beta stop includes everyone. Deletion is off by default
  until the staging counts are reviewed.
- Ending access after exactly 72 hours is implemented by the Beta access policy
  described in ADR 0015.
- Derived insights now use the service-role-only `user_insights` table when
  Supabase is configured. The JSON store remains a local-development fallback
  only and is not used as a production retention surface.
- The database cleanup boundary and exemption behavior are verified during
  rollout with the [Beta retention staging smoke test](../testing/beta-retention-smoke-test.md).

## Update — 2026-09-19

**Who:** Jia Gu (product), documented by Wissem (TL Backend/DS)

The "no raw conversation transcripts" decision below is **reversed**. Following
a team call on conversation history UX, the product decision changed: raw
question/answer pairs are now persisted, per category, so a user returning to
a category page can see their own past conversation there. This was decided
live by Jia, then formally reconciled against this ADR before the schema was
applied (raised by Vu Chau during schema review).

**New decision:**
- Raw conversation turns (question + answer) **are** stored, tagged by
  category, per user. Table: `conversation_history` (schema owned by Vu
  Chau; write/read path owned by Wissem, matching the original proposed
  split below).
- Retention is **not indefinite**. Per Jia: raw history and derived insights
  are retained while the user is active, and deleted after 12 months of
  inactivity or on account deletion. **Exact duration is still TBD**,
  pending alignment with PMs. *(Decided 2026-09-28: 7 days, see the update
  above.)*
- Users must be able to delete their own raw history and derived insights
  from the UI. **Not yet implemented** — tracked as follow-up work, blocked
  on the retention-duration decision above. *(Implemented since, in #86 and
  #92.)*
- The derived-summary work described in the original decision below is
  **still happening in parallel**, not replaced. Raw history and derived
  summaries are two separate, complementary things now: raw history for
  what the user sees on return to a page; derived summaries for what gets
  fed back into future prompts.

**What's still true from the original decision, unchanged:**
- Resumes: stored, Supabase Storage only, as below.
- No other uploaded content is persisted.
- The open capture-mechanism questions below (structured vs. free-text
  summary, pgvector or not, who writes it) remain open and unrelated to
  this update.

## Original Context (2026-08-30)
PRD §8.4 (Privacy and PII) shipped as a single placeholder line: *"security and
privacy review (e.g. resume, etc)."* Meanwhile §5 contradicted itself — promising
uploads aren't stored, while also shipping a resume upload feature with storage, and
the Tech Stacks doc assigned resumes to Supabase Storage. This was raised as
[unresolved question 11](../engineering-foundations.md).

Separately, the PRD lists "conversation memory (pgvector)" as an in-scope platform
feature (§5) with no schema owner (unresolved question 8).

Jia resolved the first ambiguity directly, in Discord (2026-08-30):

> privacy and security are important for us - we want to save as little data as we
> can - we save resume, but not other stuff they upload, and our UI will need to
> [be] clear on that. Also we prob don't want to save their conversation history,
> but more about the summary of our understanding of their preferences, etc

## Original Decision (2026-08-30) — see Update above for what changed
- **Resumes are stored.** Supabase Storage, as already listed in the Tech Stacks
  table. This is the one exception to "we don't store uploads."
- **No other uploaded content is persisted.** Anything else a user uploads to a
  chatbot (per PRD §5, the "if users upload content... we don't store them" line)
  is processed and discarded — never written to Storage, never logged. The UI must
  say this plainly, per Jia's note.
- ~~**Raw conversation transcripts are not stored.**~~ **Superseded — see Update
  above.** Originally: the system would persist only a *derived summary* of what
  has been learned about the user's preferences and context, not the
  message-by-message history.

## Open (not yet decided)
How the summary is captured, updated, and shaped is explicitly still under
discussion between Jia and Wissem (Backend/DS lead) — this ADR documents the
retention *policy*, not the *mechanism*. The open sub-questions:
- Is the summary a structured row (fields we define) or a free-text/embedded blob?
- Does it live in Postgres proper, or as a pgvector embedding, or both?
- Who updates it — a step in the AI service pipeline, or a separate summarisation job?
- Does "conversation memory (pgvector)" in the PRD mean this summary, embedded for
  retrieval, or something broader?

This sits across two ownership lines: Storage/DB schema is TL Full-stack (mine);
the AI service interface and what it produces is TL Backend/DS (Wissem's). Proposed
starting split, for discussion rather than decided: I own the table that holds the
summary once its shape is agreed; Wissem owns what writes to it and when.

## Consequences (original, partially superseded)
- Object storage scope is now unambiguous: resumes only. Simplifies the storage
  bucket/policy design — no general-purpose upload bucket needed.
- The privacy review PRD §8.4 owes the team is no longer entirely unwritten — this
  is its first real content.
- Logging conventions (Engineering Foundations §8) already forbid logging resume
  content or user free text; **this now applies to the error/debug log only, not
  to the `conversation_history` table**, which is a deliberate, separate,
  documented exception per the Update above.
- ~~Until the capture mechanism is settled, no one should start building a
  conversation-history table modeled on raw messages — it would be thrown
  away.~~ **Superseded.** The table now exists, live on dev and staging.

