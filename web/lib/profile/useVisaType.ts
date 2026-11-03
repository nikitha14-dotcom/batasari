"use client";

import { useEffect, useState } from "react";

import type { VisaType } from "@/lib/onboarding/profile";
import { getAccessToken } from "@/lib/supabase/client";
import { useSession } from "@/lib/supabase/useSession";
import { apiUrl } from "@/lib/api/apiBase";

/**
 * The visa type the person chose during onboarding, from GET /profile.
 *
 * Used to decide whether a card that only applies to one status is shown at
 * all -- University housing boards is for study permits. `visaType` stays
 * null while the request is in flight and if it fails, and callers treat
 * null as "do not show": offering a student-only resource to someone on a
 * work permit is worse than briefly withholding it from a student, and the
 * card reappears as soon as the profile loads.
 *
 * A failed /profile call is never surfaced. Housing must render regardless.
 */
export function useVisaType(): { visaType: VisaType | null; loading: boolean } {
  const { session } = useSession();
  const [visaType, setVisaType] = useState<VisaType | null>(null);
  const [loading, setLoading] = useState(true);
  const userId = session?.user?.id ?? null;

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    let active = true;

    (async () => {
      try {
        const token = await getAccessToken();
        if (!token) return;
        const res = await fetch(apiUrl(`/profile`), {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        if (!res.ok) return;
        const body = (await res.json()) as { visa_type?: VisaType | null };
        if (active) setVisaType(body.visa_type ?? null);
      } catch {
        // Leave it null; the caller hides the gated card.
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
      controller.abort();
    };
  }, [userId]);

  return { visaType, loading };
}

