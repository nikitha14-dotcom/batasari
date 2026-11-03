"use client";

import { useId, useState, type InputHTMLAttributes, type ReactNode } from "react";

import styles from "../auth.module.css";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "className" | "id"> & {
  label: string;
  /** "(required)" / "(optional)" shown in regular weight after the label. */
  note?: string;
  /** Small grey line under the label (ONB-04 display name). */
  hint?: string;
  icon?: ReactNode;
  error?: string | null;
  /** Adds the eye toggle and manages type="password" / "text". */
  revealable?: boolean;
};

/** Label + 45px rounded input used on ONB-01, ONB-03 and ONB-04. */
export function AuthField({ label, note, hint, icon, error, revealable, type, ...input }: Props) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const [revealed, setRevealed] = useState(false);
  const effectiveType = revealable ? (revealed ? "text" : "password") : type;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ") || undefined;

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {icon}
        <span>
          {label}
          {note && <span className={styles.labelNote}> {note}</span>}
        </span>
      </label>
      {hint && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}
      <div className={styles.inputWrap}>
        <input
          {...input}
          id={id}
          type={effectiveType}
          className={`${styles.input} ${revealable ? styles.inputWithToggle : ""}`}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
        />
        {revealable && (
          <button
            type="button"
            className={styles.toggle}
            onClick={() => setRevealed((r) => !r)}
            aria-label={revealed ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
            aria-pressed={revealed}
          >
            {revealed ? <EyeIcon /> : <EyeOffIcon />}
          </button>
        )}
      </div>
      {error && (
        <p id={errorId} className={styles.fieldError} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

const svg = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  focusable: false,
};

/* Lucide eye / eye-off / mail (ISC), matching the design's outline icons. */
function EyeIcon() {
  return (
    <svg {...svg}>
      <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg {...svg}>
      <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
      <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
      <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
      <path d="m2 2 20 20" />
    </svg>
  );
}

export function MailIcon() {
  return (
    <svg {...svg} width={22} height={22}>
      <path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7" />
      <rect x="2" y="4" width="20" height="16" rx="2" />
    </svg>
  );
}

