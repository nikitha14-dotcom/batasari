"use client";

import { RequireSession } from "@/lib/supabase/RequireSession";
import { AppShell } from "@/components/navigation";
import styles from "./content.module.css";

/** A category that is in the navigation but has no content yet. */
export function PlaceholderPage({ title, href }: { title: string; href?: string }) {
  return (
    <RequireSession>
      <AppShell activeHref={href}>
        <div className={styles.page}>
          <div className={styles.hero}>
            <h1 className={styles.heading}>{title}</h1>
          </div>
          <p className={styles.placeholder}>Content to come.</p>
        </div>
      </AppShell>
    </RequireSession>
  );
}

