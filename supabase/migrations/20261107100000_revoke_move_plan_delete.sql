-- Keep browser roles from receiving destructive privileges on move plans.
-- RLS delete policies are not a substitute for withholding DELETE grants.
revoke delete on public.move_plans from authenticated;
