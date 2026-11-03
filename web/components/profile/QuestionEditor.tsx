"use client";

import type { ChangeEvent, ReactNode } from "react";

import { Button } from "@/components/ui";
import { SearchSelect } from "@/components/onboarding/SearchSelect";
import { MAX_CITY_COUNTRY, MAX_HOUSEHOLD_OTHER, MAX_OTHER_TEXT } from "@/lib/onboarding/limits";
import { suggestPlaces } from "@/lib/onboarding/places";
import type { Question, QuestionKey } from "@/lib/profile/profileEdit";
import styles from "./profile-edit.module.css";

type Option = { value: string; label: string };

const OPTIONS: Partial<Record<QuestionKey, readonly Option[]>> = {
  move_type: [
    { value: "within_india", label: "Moving between Indian cities" },
    { value: "returning_to_india", label: "Returning to India" },
    { value: "relocating_to_india", label: "Moving to India from abroad" },
  ],
  visa_type: [
    { value: "indian_citizen", label: "Indian citizen" },
    { value: "oci_card_holder", label: "OCI card holder" },
    { value: "employment_visa", label: "Employment visa" },
    { value: "student_visa", label: "Student visa" },
    { value: "business_visa", label: "Business visa" },
    { value: "visitor_visa", label: "Visitor visa / e-Visa" },
    { value: "other", label: "Other" },
  ],
  household_type: [
    { value: "solo", label: "Just me" },
    { value: "partner", label: "Partner" },
    { value: "family", label: "Family" },
    { value: "other", label: "Other" },
  ],
  pets: [
    { value: "dog", label: "Dog" },
    { value: "cat", label: "Cat" },
    { value: "dog,cat", label: "Dog and cat" },
    { value: "other", label: "Other" },
    { value: "none", label: "No pets" },
  ],
  has_accommodation: [
    { value: "yes", label: "Yes" },
    { value: "no", label: "No" },
  ],
};

type QuestionEditorProps = {
  question: Question;
  value: string;
  error?: string;
  message?: string;
  saving: boolean;
  onChange: (value: string) => void;
  otherValue?: string;
  onOtherChange?: (value: string) => void;
  onSave: () => void;
};

/** Owns one onboarding answer's control, feedback, and save action. */
export function QuestionEditor({
  question,
  value,
  error,
  message,
  saving,
  onChange,
  otherValue = "",
  onOtherChange,
  onSave,
}: QuestionEditorProps) {
  const id = `question-${question.key}`;
  const errorId = `${id}-error`;
  const common = {
    id,
    value,
    "aria-invalid": Boolean(error),
    "aria-describedby": error ? errorId : undefined,
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => onChange(event.target.value),
  };

  let control: ReactNode;
  if (question.key === "move_date") {
    control = <input type="date" {...common} />;
  } else if (question.key === "city_country" || question.key === "destination_city") {
    control = (
      <SearchSelect
        value={value}
        onChange={(next) => onChange(next.slice(0, MAX_CITY_COUNTRY))}
        onSelect={(next) => onChange(next.slice(0, MAX_CITY_COUNTRY))}
        suggestions={question.key === "destination_city"
          ? suggestPlaces(value).filter((place) => /, India$/i.test(place))
          : suggestPlaces(value)}
        placeholder={question.key === "city_country" ? "Search a city or country" : "Search an Indian city"}
        label={question.label}
        disabled={saving}
      />
    );
  } else {
    control = (
      <select {...common}>
        <option value="">Select an answer</option>
        {OPTIONS[question.key]?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    );
  }

  const otherInput = question.key === "household_type" && value === "other" ? (
    <input
      type="text"
      value={otherValue}
      maxLength={MAX_HOUSEHOLD_OTHER}
      placeholder="Sister, brother, friend…"
      aria-label="Who else is moving with you"
      onChange={(event) => onOtherChange?.(event.target.value)}
      disabled={saving}
    />
  ) : question.key === "pets" && value.includes("other") ? (
    <input
      type="text"
      value={otherValue}
      maxLength={MAX_OTHER_TEXT}
      placeholder="Please specify"
      aria-label="Please specify your pet type"
      onChange={(event) => onOtherChange?.(event.target.value)}
      disabled={saving}
    />
  ) : null;

  return (
    <div className={styles.questionEditor}>
      <div className={styles.field}>
        <label className={styles.inputLabel} htmlFor={id}>{question.label}</label>
        {control}
        {otherInput}
        {error && <small className={styles.error} id={errorId} role="alert">{error}</small>}
        {message && <small className={styles.success} role="status">{message}</small>}
      </div>
      <Button type="button" size="small" disabled={saving} onClick={onSave}>
        {saving ? "Saving…" : "Save Changes"}
      </Button>
    </div>
  );
}

