"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";

import { getSupabaseClient, isSupabaseConfigured } from "./client";

export type SessionState = {
  session: Session | null;
  /** True until the first getSession() resolves. Do not redirect while true. */
  loading: boolean;
  /** False when the build has no Supabase credentials -- local dev fallback. */
  configured: boolean;
  /** Force a token refresh and return the current authenticated session. */
  refreshSession: () => Promise<Session | null>;
};

/**
 * Deliberately quiet.
 *
 * This hook used to console.log on every mount and on every auth state
 * change, including `user: session.user.email`. That is a real user's email
 * address printed into the browser console of a production build -- visible
 * in any screen share, recorded demo, or support screenshot, and picked up by
 * anything that scrapes console output. It also fired constantly, which
 * buried the log lines that do matter.
 *
 * Failures are still surfaced, but only failures, and never with the address:
 * a getSession() error is the one event here worth a developer's attention,
 * and `error.message` from Supabase does not contain the user's identity.
 *
 * If you need per-session tracing again, add it behind an explicit debug flag
 * rather than unconditionally.
 */
export function useSession(): SessionState {
  const configured = isSupabaseConfigured();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(configured);
  const mountedRef = useRef(false);
  const refreshInFlightRef = useRef<Promise<Session | null> | null>(null);

  const refreshSession = useCallback(async (): Promise<Session | null> => {
    if (!configured) return null;

    if (refreshInFlightRef.current) return refreshInFlightRef.current;

    const refresh = (async () => {
      const { data, error } = await getSupabaseClient().auth.refreshSession();
      if (error) {
        console.warn("[useSession] refreshSession failed:", error.message);
        return null;
      }

      if (mountedRef.current) setSession(data.session);
      return data.session;
    })();

    refreshInFlightRef.current = refresh;
    try {
      return await refresh;
    } finally {
      if (refreshInFlightRef.current === refresh) refreshInFlightRef.current = null;
    }
  }, [configured]);

  useEffect(() => {
    if (!configured) return;

    const supabase = getSupabaseClient();
    let active = true;
    mountedRef.current = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        // No address, no token -- just that the read failed.
        console.warn("[useSession] getSession failed:", error.message);
      }

      if (!active) return;

      setSession(data.session);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, next) => {
      if (!active) return;

      setSession(next);
      setLoading(false);
    });

    return () => {
      active = false;
      mountedRef.current = false;
      subscription.subscription.unsubscribe();
    };
  }, [configured]);

  // Email confirmation links are often opened in another tab. Refresh when
  // this tab becomes active so the UI picks up the updated email without a
  // sign-out/sign-in cycle.
  useEffect(() => {
    if (!configured) return;

    const refreshWhenActive = () => {
      if (document.visibilityState === "visible") void refreshSession();
    };

    window.addEventListener("focus", refreshWhenActive);
    document.addEventListener("visibilitychange", refreshWhenActive);
    return () => {
      window.removeEventListener("focus", refreshWhenActive);
      document.removeEventListener("visibilitychange", refreshWhenActive);
    };
  }, [configured, refreshSession]);

  return { session, loading, configured, refreshSession };
}

