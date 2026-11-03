"use client";

import { ArrowLeftIcon } from "./icons";
import styles from "./onboarding.module.css";

/**
 * Back arrow + segmented progress bar + question heading.
 *
 * The bar is one segment per step (six across ONB-05..ONB-10). Figma fixes
 * each segment at 74px; here they flex so the bar spans the card at any width
 * while keeping the 4px gap and 8px height.
 */
export function ProgressHeader({
  step,
  stepCount,
  question,
  onBack,
  backDisabled,
}: {
  step: number;
  stepCount: number;
  question: string;
  onBack: () => void;
  backDisabled?: boolean;
}) {
  return (
    <div className={styles.cardHead}>
      <button
        type="button"
        className={styles.backButton}
        onClick={onBack}
        disabled={backDisabled}
        aria-label="Back"
      >
        <ArrowLeftIcon />
      </button>

      <div
        className={styles.progress}
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={stepCount}
        aria-valuenow={step + 1}
        aria-valuetext={`Step ${step + 1} of ${stepCount}`}
      >
        {Array.from({ length: stepCount }, (_, i) => (
          <span
            key={i}
            className={`${styles.progressSegment} ${i <= step ? styles.progressSegmentOn : ""}`}
          />
        ))}
      </div>

      <h1 className={styles.question}>{question}</h1>
    </div>
  );
}

