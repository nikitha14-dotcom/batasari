"use client";

import { useSignOut } from "@/lib/supabase/useSignOut";

import { Icon } from "./icons";
import styles from "./navigation.module.css";

/** "Log out" under the divider in the sidebar, styled like the tabs above it. */
export function SignOutButton() {
  const { signedIn, signingOut, signOut } = useSignOut();

  if (!signedIn) return null;

  return (
    <button
      type="button"
      className={`${styles.navItem} ${styles.navButton}`}
      onClick={() => void signOut()}
      disabled={signingOut}
    >
      <span className={styles.navIcon}>
        <Icon name="log-out" />
      </span>
      <span className={styles.navLabel}>{signingOut ? "Logging out…" : "Log out"}</span>
    </button>
  );
}

