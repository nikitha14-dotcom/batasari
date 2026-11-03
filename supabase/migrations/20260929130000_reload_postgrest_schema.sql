-- Supabase's PostgREST API can keep a stale schema cache briefly after a
-- table is created. Refresh it so the beta waitlist endpoint can see the
-- table immediately after this migration is applied.
notify pgrst, 'reload schema';

