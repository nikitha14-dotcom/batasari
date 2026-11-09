"use client";

import type { ReactNode } from "react";

import styles from "./onboarding.module.css";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";

/**
 * Page chrome shared by every ONB screen: tinted background, the two
 * decorative gradient ellipses, the top bar, and the centred white card.
 *
 * Figma centres the card on the full 1440x1024 frame rather than inside the
 * area below the top bar, so `.stage` subtracts the bar's 87px height to land
 * in the same place at that viewport while staying scrollable when shorter.
 */
export function OnboardingShell({
  children,
  topBarAction,
  aside,
  cardClassName,
}: {
  children: ReactNode;
  topBarAction?: ReactNode;
  /** Left-hand panel beside the card (ONB-01's welcome text). */
  aside?: ReactNode;
  /** Extra class on the card, e.g. the 480px auth card for ONB-01..04. */
  cardClassName?: string;
}) {
  return (
    <div className={styles.root}>
      <div className={`${styles.blob} ${styles.blobGreen}`} aria-hidden />
      <div className={`${styles.blob} ${styles.blobWarm}`} aria-hidden />

      <header className={styles.topBar}>
        <div className={styles.brand}>
          <span className={styles.brandStrong}>Batasari</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}><LanguageSwitcher compact />{topBarAction}</div>
      </header>

      <main className={`${styles.stage} ${aside ? styles.stageSplit : ""}`}>
        {aside && <div className={styles.aside}>{aside}</div>}
        <div className={`${styles.card} ${cardClassName ?? ""}`}>{children}</div>
      </main>
    </div>
  );
}

