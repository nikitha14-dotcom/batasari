"use client";

import { MinusIcon, PlusIcon } from "./icons";
import styles from "./onboarding.module.css";

const MAX_CHILDREN = 10;
const MAX_AGE = 25;

/**
 * ONB-07A -> 07C: a numeric stepper for the child count, then one small age
 * box per child. The count drives how many boxes render, so 07A (count 0,
 * no boxes), 07B (one empty box) and 07C (two filled boxes) are the same
 * component at three values rather than three screens.
 */
export function ChildAgeFields({
  count,
  ages,
  onCountChange,
  onAgeChange,
  disabled,
}: {
  count: number;
  ages: string[];
  onCountChange: (count: number) => void;
  onAgeChange: (index: number, value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className={styles.subPanel}>
      <p className={styles.subPrompt}>How many children are moving with you?</p>

      <div className={styles.stepper}>
        <button
          type="button"
          className={styles.stepperButton}
          onClick={() => onCountChange(Math.max(0, count - 1))}
          disabled={disabled || count <= 0}
          aria-label="One fewer child"
        >
          <MinusIcon />
        </button>
        <span className={styles.stepperValue} aria-live="polite">
          {count}
        </span>
        <button
          type="button"
          className={styles.stepperButton}
          onClick={() => onCountChange(Math.min(MAX_CHILDREN, count + 1))}
          disabled={disabled || count >= MAX_CHILDREN}
          aria-label="One more child"
        >
          <PlusIcon />
        </button>
      </div>

      {count > 0 && (
        <div className={styles.ageRows}>
          {Array.from({ length: count }, (_, index) => (
            <div className={styles.ageRow} key={index}>
              <label className={styles.ageLabel} htmlFor={`child-age-${index}`}>
                Child {index + 1}
              </label>
              <input
                id={`child-age-${index}`}
                className={styles.ageInput}
                value={ages[index] ?? ""}
                onChange={(event) => {
                  // Digits only; the backend stores these as integers.
                  const next = event.target.value.replace(/[^0-9]/g, "").slice(0, 2);
                  if (next === "" || Number(next) <= MAX_AGE) {
                    onAgeChange(index, next);
                  }
                }}
                placeholder="Enter age"
                inputMode="numeric"
                disabled={disabled}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

