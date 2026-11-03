"use client";

import { useState } from "react";

import { getSupabaseClient } from "./client";
import { useSession } from "./useSession";

/**
 * Sign-out for any control that offers it (sidebar, onboarding top bar).
 *
 * `signedIn` is false with no session, which includes the local-dev fallback
 * where Supabase is not configured -- callers render nothing in that case.
 *
 * Navigation is a full page load rather than router.replace: it drops every
 * piece of in-memory state from the signed-out user (copilot history, cached
 * profile) before the next person sees the login screen.
 */
export type SignOutState = {
  signedIn: boolean;
  signingOut: boolean;
  signOut: () => Promise<void>;
};

export function useSignOut(): SignOutState {
  const { session } = useSession();
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await getSupabaseClient().auth.signOut();
    } finally {
      // Leave even if the call throws, so the button never hangs on
      // "Logging out…". /login shows the session state either way.
      window.location.assign("/login");
    }
  }

  return { signedIn: Boolean(session), signingOut, signOut };
}

