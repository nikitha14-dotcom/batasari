"use client";

import styles from "./onboarding.module.css";

/**
 * Skip / Continue pair, with the optional "Start from scratch" link that
 * Figma shows on ONB-09 and ONB-10.
 *
 * `canContinue` drives the enabled styling AND the disabled attribute, so the
 * grey state in the frames is never merely cosmetic.
 */
export function StepFooter({
  canContinue,
  busy,
  onContinue,
  onSkip,
  onRestart,
  continueLabel = "Continue",
}: {
  canContinue: boolean;
  busy?: boolean;
  onContinue: () => void;
  onSkip?: () => void;
  onRestart?: () => void;
  continueLabel?: string;
}) {
  const disabled = !canContinue || busy;

  return (
    <div className={styles.footer}>
      <div className={styles.footerRow}>
        {onSkip ? (
          <button type="button" className={styles.skipButton} onClick={onSkip} disabled={busy}>
            Skip
          </button>
        ) : (
          <span />
        )}

        <button
          type="button"
          className={`${styles.continueButton} ${disabled ? styles.continueButtonDisabled : ""}`}
          onClick={onContinue}
          disabled={disabled}
        >
          {continueLabel}
        </button>
      </div>

      {onRestart && (
        <button type="button" className={styles.restartButton} onClick={onRestart} disabled={busy}>
          Start from scratch
        </button>
      )}
    </div>
  );
}

