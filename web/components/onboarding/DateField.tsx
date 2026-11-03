"use client";

import { useRef } from "react";

import { MAX_MOVE_DATE, MIN_MOVE_DATE } from "../../lib/onboarding/limits";
import { CalendarIcon, ChevronIcon } from "./icons";
import styles from "./onboarding.module.css";

/**
 * ONB-05 / 05A / 05B. The rounded control is presentational; a transparent
 * native `<input type="date">` covers it so the browser supplies the calendar
 * (ONB-05A) and the keyboard/screen-reader behaviour.
 *
 * `showPicker()` is called on click where supported, which is what makes the
 * whole pill open the calendar rather than just the small native affordance.
 */
export function DateField({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className={styles.dateField}
      onClick={() => {
        const input = inputRef.current;
        if (!input || disabled) return;
        if (typeof input.showPicker === "function") {
          try {
            input.showPicker();
            return;
          } catch {
            // Safari throws when showPicker() is called without a user
            // gesture it recognises; focusing is the fallback.
          }
        }
        input.focus();
      }}
    >
      <span className={styles.dateIconBox}>
        <CalendarIcon />
      </span>

      <span className={styles.dateBody}>
        <span className={styles.dateLabelRow}>
          Date
          <ChevronIcon up={Boolean(value)} />
        </span>
        <span className={`${styles.dateValue} ${value ? "" : styles.dateValueEmpty}`}>
          {value ? formatMoveDate(value) : "Choose date"}
        </span>
      </span>

      <input
        ref={inputRef}
        type="date"
        className={styles.dateNativeInput}
        value={value}
        disabled={disabled}
        aria-label="Move date"
        /*
         * Chrome accepts years up to 275760 if you type into the year segment.
         * Python's `date` cannot represent those, so the PATCH came back 422
         * and the user saw a generic failure with no hint that the year was
         * the problem. Bounding the control is cheaper than explaining it.
         */
        min={MIN_MOVE_DATE}
        max={MAX_MOVE_DATE}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

/** Figma shows "22 Oct 2026" — day, short month, year, no comma. */
export function formatMoveDate(value: string): string {
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed
    .toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    .replace(/,/g, "");
}

