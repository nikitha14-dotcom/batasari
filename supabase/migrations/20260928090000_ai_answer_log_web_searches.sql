-- Number of web searches each answer used. Each search is billed on top of
-- tokens ($10 per 1,000 on Anthropic's web search tool), and that cost is
-- already in estimated_cost_usd; this is the count itself, for the
-- observability doc's "number of web searches" per user and per day.
--
-- Existing rows are answers from before search, so 0 is correct for them.
alter table public.ai_answer_log
  add column if not exists web_search_requests integer not null default 0
    check (web_search_requests >= 0);

