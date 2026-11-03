import { HealthPage } from "@/components/health/HealthPage";
import { RequireSession } from "@/lib/supabase/RequireSession";

export default function Page() {
  return (
    <RequireSession>
      <HealthPage />
    </RequireSession>
  );
}

