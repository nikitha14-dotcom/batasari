-- The completion marker is written after the server has advanced past its
-- SSE complete event. Keep this capability narrower than a table-wide update:
-- service_role may update only the completion timestamp on answer logs.
-- RLS remains enabled; service_role is the API's trusted server connection.

grant update (completed_at) on public.ai_answer_log to service_role;

