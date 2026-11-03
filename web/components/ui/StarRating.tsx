"use client";

import styles from "./ui.module.css";

const STARS = [1, 2, 3, 4, 5] as const;

/**
 * The five 40px stars above "Feedback Type".
 *
 * Radio semantics rather than five buttons: a rating is one choice out of
 * five, and role="radiogroup" is what makes arrow keys and screen readers
 * behave. The design shows no hover, focus or selected treatment, so those
 * are ours (see ui.module.css).
 */
export function StarRating({
  value,
  onChange,
  legend = "How was your experience?",
  name = "rating",
}: {
  value: number | null;
  onChange: (value: number) => void;
  legend?: string;
  name?: string;
}) {
  return (
    <div className={styles.rating} role="radiogroup" aria-label={legend}>
      {STARS.map((star) => {
        const on = value !== null && star <= value;
        return (
          <button
            key={star}
            type="button"
            role="radio"
            name={name}
            aria-checked={value === star}
            aria-label={`${star} ${star === 1 ? "star" : "stars"}`}
            className={`${styles.star} ${on ? styles.starOn : ""}`}
            onClick={() => onChange(star)}
          >
            <StarIcon filled={on} />
          </button>
        );
      })}
    </div>
  );
}

/**
 * Drawn here rather than imported from components/navigation/icons: that Icon
 * is stroke-only by design, and a rating star has to switch between outline
 * and filled.
 */
function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width={40}
      height={39}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.12 2.12 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.12 2.12 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.12 2.12 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.12 2.12 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.12 2.12 0 0 0 1.597-1.16z" />
    </svg>
  );
}

