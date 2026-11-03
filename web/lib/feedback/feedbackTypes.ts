import type { SelectOption } from "@/components/ui";

/**
 * The six rows of the Feedback_2 dropdown, in the design's order.
 *
 * Keep the values in step with FEEDBACK_TYPES in api/app/routers/feedback.py
 * and with the feedback_type_check constraint in
 * supabase/migrations/20260923090000_feedback.sql.
 */
export const FEEDBACK_TYPES: readonly SelectOption[] = [
  { value: "suggestion", label: "Suggestion" },
  { value: "feature_request", label: "Feature Request" },
  { value: "bug_report", label: "Bug Report" },
  { value: "complaint", label: "Complaint" },
  { value: "general_feedback", label: "General Feedback" },
  { value: "other", label: "Other" },
];

/**
 * No default selection.
 *
 * The mock shows "Suggestion" already in the field before the menu has been
 * opened. That would make every untouched submission a "Suggestion" and the
 * type breakdown unreadable, so the field starts empty and Submit stays
 * disabled until a type is chosen.
 */
export const FEEDBACK_TYPE_PLACEHOLDER = "Select feedback type";

/** Matches the message length check on public.feedback. */
export const MAX_FEEDBACK_MESSAGE = 2000;

