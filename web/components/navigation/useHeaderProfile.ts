"use client";

import { useEffect, useState } from "react";

import { displayName, relocationLabel } from "@/lib/profile/relocationLabel";
import { getAccessToken } from "@/lib/supabase/client";
import { useSession } from "@/lib/supabase/useSession";
import { apiUrl } from "@/lib/api/apiBase";

/**
 * Name and move-date line for the header profile card.
 *
 * The name comes from the Supabase session; the move date from GET /profile.
 * Either can be missing, and a failed /profile call only hides the subtitle:
 * the header must never break a page.
 */
export function useHeaderProfile(): { name: string | null; subtitle: string | null } {
  const { session } = useSession();
  const [subtitle, setSubtitle] = useState<string | null>(null);
  const userId = session?.user?.id ?? null;

  useEffect(() => {
    if (!userId) return;
    let active = true;
    (async () => {
      try {
        const token = await getAccessToken();
        if (!token) return;
        const res = await fetch(apiUrl(`/profile`), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const body = (await res.json()) as { move_date?: string | null };
        if (active) setSubtitle(relocationLabel(body.move_date));
      } catch {
        // Leave the subtitle empty.
      }
    })();
    return () => {
      active = false;
    };
  }, [userId]);

  return { name: displayName(session?.user), subtitle };
}

