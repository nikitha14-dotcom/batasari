import { DailyNeedsPage } from '@/components/daily-needs/DailyNeedsPage';
import { RequireSession } from '@/lib/supabase/RequireSession';

export default function Page() {
  return (
    <RequireSession>
      <DailyNeedsPage />
    </RequireSession>
  );
}

