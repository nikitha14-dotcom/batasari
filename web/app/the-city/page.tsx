import { TheCityPage } from "@/components/the-city/TheCityPage";
import { RequireSession } from "@/lib/supabase/RequireSession";

export default function Page() {
  return (
    <RequireSession>
      <TheCityPage />
    </RequireSession>
  );
}

