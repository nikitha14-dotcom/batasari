"use client";

import { useSignOut } from "../../../lib/supabase/useSignOut";

import styles from "../auth.module.css";

/**
 * Top-bar "Log out" on the onboarding screens -- the counterpart of LoginLink,
 * for someone who signed in with the wrong account before finishing setup.
 */
export function LogoutButton() {
  const { signedIn, signingOut, signOut } = useSignOut();

  if (!signedIn) return null;

  return (
    <button
      type="button"
      className={`${styles.loginButton} ${styles.logoutButton}`}
      onClick={() => void signOut()}
      disabled={signingOut}
    >
      {signingOut ? "Logging out…" : "Log out"}
    </button>
  );
}

