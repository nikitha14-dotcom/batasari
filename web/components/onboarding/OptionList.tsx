"use client";

import type { ReactNode } from "react";

import styles from "./onboarding.module.css";

export type Option<T extends string> = {
  value: T;
  label: string;
  /**
   * Rendered inside the option once it is chosen (ONB-06A "Please specify",
   * ONB-07A..C child ages, ONB-10A postal code). Its presence is what turns
   * the row into the taller expanded card shown in those frames.
   */
  expansion?: ReactNode;
};

/**
 * The repeated option row from ONB-06 through ONB-10.
 *
 * Note on selected state: the Figma frames signal the current choice ONLY by
 * expanding the row that has a sub-input. Options without one (Just me, With
 * my partner, No) have no distinct appearance when chosen anywhere in the
 * file. A ring is added here for those, because otherwise a user who picks
 * "Just me" gets no confirmation that anything happened.
 */
export function OptionList<T extends string>({
  options,
  selected,
  onSelect,
  disabled,
  name,
  multiple,
}: {
  options: Option<T>[];
  selected: T[];
  onSelect: (value: T) => void;
  disabled?: boolean;
  name: string;
  multiple?: boolean;
}) {
  return (
    <div
      className={styles.options}
      role={multiple ? "group" : "radiogroup"}
      aria-label={name}
    >
      {options.map((option) => {
        const isSelected = selected.includes(option.value);
        const isExpanded = isSelected && Boolean(option.expansion);

        if (isExpanded) {
          return (
            <div key={option.value} className={`${styles.option} ${styles.optionExpanded}`}>
              <button
                type="button"
                className={styles.optionTrigger}
                onClick={() => onSelect(option.value)}
                disabled={disabled}
                aria-pressed={multiple ? true : undefined}
                aria-checked={multiple ? undefined : true}
                role={multiple ? undefined : "radio"}
              >
                {option.label}
              </button>
              {option.expansion}
            </div>
          );
        }

        return (
          <button
            key={option.value}
            type="button"
            className={`${styles.option} ${isSelected ? styles.optionSelected : ""}`}
            onClick={() => onSelect(option.value)}
            disabled={disabled}
            aria-pressed={multiple ? isSelected : undefined}
            aria-checked={multiple ? undefined : isSelected}
            role={multiple ? undefined : "radio"}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * The underlined free-text field that appears inside an expanded option.
 *
 * `maxLength` is required rather than optional: every one of these values is
 * concatenated into the assistant's system prompt server-side, so an uncapped
 * field here is an uncapped field there.
 */
export function InlineField({
  value,
  onChange,
  placeholder,
  maxLength,
  label,
  inputMode,
  autoFocus,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  maxLength: number;
  label: string;
  inputMode?: "text" | "numeric";
  autoFocus?: boolean;
  /**
   * Required in practice, not optional in spirit.
   *
   * Every other control in the flow is gated on `saving`. While this one was
   * not, text typed during an in-flight PATCH was silently dropped: pick Yes
   * on the accommodation step, type "M5V", press Continue, type " 2T6" — the
   * request carries "M5V", the step advances, and nothing tells the user the
   * rest of their postal code never left the browser.
   */
  disabled?: boolean;
}) {
  return (
    <input
      className={styles.inlineField}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      inputMode={inputMode}
      aria-label={label}
      autoFocus={autoFocus}
      disabled={disabled}
    />
  );
}

