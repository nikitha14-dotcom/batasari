"use client";

import type { ChangeEvent } from "react";

import styles from "./profile-edit.module.css";

type ProfileFieldProps = {
  label: string;
  note?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: "text" | "email";
  autoComplete?: string;
};

/** A labeled profile input with the same validation and accessible error wiring everywhere. */
export function ProfileField({
  label,
  note,
  value,
  onChange,
  error,
  type = "text",
  autoComplete,
}: ProfileFieldProps) {
  const id = `profile-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  const errorId = `${id}-error`;

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onChange(event.target.value);
  }

  return (
    <div className={styles.field}>
      <label className={styles.inputLabel} htmlFor={id}>
        {label} {note && <span>{note}</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        autoComplete={autoComplete}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        onChange={handleChange}
      />
      {error && <small className={styles.error} id={errorId} role="alert">{error}</small>}
    </div>
  );
}

