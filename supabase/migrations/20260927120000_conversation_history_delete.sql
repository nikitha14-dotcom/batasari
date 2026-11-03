-- Lets the API delete a user's saved conversation turns, for the copilot's
-- "Clear conversation" button (DELETE /ai/conversations).
--
-- Until now service_role had only select and insert here, so that button
-- cleared the insight store's copy and left every row in this table.
--
-- Browser roles still get nothing (ADR 0010): the delete goes through /api,
-- which filters by the signed-in user's id.
grant delete on public.conversation_history to service_role;

