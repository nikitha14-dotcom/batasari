"use client";

import { useId } from "react";

import { Icon } from "@/components/navigation/icons";
import styles from "./ui.module.css";

/**
 * The 933 x 127 "Tell us More" box, with the pencil affordance from the
 * design and a character counter the design does not have.
 *
 * The counter is here because the column is capped at 2000 characters in the
 * database; without it a long answer is silently rejected on submit, after
 * the person has done all the typing.
 */
export function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  maxLength: number;
}) {
  const id = useId();
  const used = value.length;
  const nearLimit = used > maxLength * 0.9;

  return (
    <div className={styles.field}>
      <label className={styles.fieldLabel} htmlFor={id}>
        {label}
      </label>

      <div className={styles.textareaWrap}>
        <textarea
          id={id}
          className={styles.textarea}
          value={value}
          placeholder={placeholder}
          maxLength={maxLength}
          onChange={(event) => onChange(event.target.value)}
        />
        <span className={styles.textareaIcon}>
          <Icon name="pencil" size={20} />
        </span>
      </div>

      <span className={`${styles.counter} ${nearLimit ? styles.counterNearLimit : ""}`}>
        {used} / {maxLength}
      </span>
    </div>
  );
}

