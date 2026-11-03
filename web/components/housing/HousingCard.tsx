"use client";

import type { ReactNode } from "react";

import styles from "./housing.module.css";

/**
 * The white accordion card the Housing frames use for every top-level
 * section (Figma "Expanded-Accordion"): 52px tinted icon tile, bold 18px
 * title with an optional 11px subtitle, chevron on the right.
 *
 * `tone="warn"` is the Avoiding Rental Scams variant -- #fbeee9 with a
 * #d97757 border instead of the green tile.
 */
export function HousingCard({
  icon,
  title,
  subtitle,
  caption,
  open,
  onToggle,
  tone = "default",
  children,
}: {
  icon: string;
  title: string;
  subtitle?: string;
  /** Small line ABOVE the title. CP-02 puts the rate basis and year there. */
  caption?: string;
  open: boolean;
  onToggle: () => void;
  tone?: "default" | "warn";
  children: ReactNode;
}) {
  return (
    <section className={styles.card}>
      <button
        type="button"
        className={styles.cardHeader}
        onClick={onToggle}
        aria-expanded={open}
      >
        <span
          className={
            tone === "warn"
              ? `${styles.cardIcon} ${styles.cardIconWarn}`
              : styles.cardIcon
          }
          aria-hidden="true"
        >
          {icon}
        </span>

        <span className={styles.cardTitles}>
          {caption && <span className={styles.crimeCaption}>{caption}</span>}
          <span className={styles.cardTitle}>{title}</span>
          {subtitle && <span className={styles.cardSubtitle}>{subtitle}</span>}
        </span>

        <span
          className={
            open ? `${styles.cardChevron} ${styles.cardChevronOpen}` : styles.cardChevron
          }
          aria-hidden="true"
        >
          ⌃
        </span>
      </button>

      {open && <div className={styles.cardBody}>{children}</div>}
    </section>
  );
}

