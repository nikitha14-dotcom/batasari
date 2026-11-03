"use client";

import Link from "next/link";

import styles from "./housing.module.css";

/**
 * The 1-2-3 stepper (Figma "sequence", top right of every Housing frame).
 *
 * The frames put it on the same row as the page title, with no "Sequence"
 * label and no separate numbered badge -- the number lives inside the pill.
 * The first implementation had all three, which is the most visible way the
 * built pages diverged from the design.
 */

export type HousingStep = 1 | 2 | 3;

const STEPS = [
  { step: 1 as const, href: "/housing", label: "Find Housing" },
  { step: 2 as const, href: "/housing/compare", label: "Compare Options" },
  { step: 3 as const, href: "/housing/check", label: "Check the place" },
];

export function HousingSequenceBar({ active }: { active: HousingStep }) {
  return (
    <nav className={styles.sequence} aria-label="Housing steps">
      {STEPS.map(({ step, href, label }, index) => (
        <span key={href} style={{ display: "contents" }}>
          {index > 0 && <span className={styles.stepLine} aria-hidden="true" />}
          <Link
            href={href}
            className={
              step === active ? `${styles.step} ${styles.stepActive}` : styles.step
            }
            aria-current={step === active ? "step" : undefined}
          >
            <span className={styles.stepNumber}>{step}</span>
            {label}
          </Link>
        </span>
      ))}
    </nav>
  );
}

