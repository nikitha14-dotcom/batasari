import type { Profile } from "@/lib/onboarding/profile";

export type IdentityDraft = {
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
};

export type IdentityErrors = Partial<Record<keyof IdentityDraft, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NAME = 80;

export function identityFromUser(user: {
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
} | null): IdentityDraft {
  const metadata = user?.user_metadata ?? {};
  const value = (key: string) => (typeof metadata[key] === "string" ? String(metadata[key]) : "");
  return {
    firstName: value("first_name"),
    lastName: value("last_name"),
    displayName: value("display_name"),
    email: user?.email ?? "",
  };
}

export function normalizeEmail(email: string | null | undefined): string {
  return (email ?? "").trim().toLowerCase();
}

export function validateIdentity(draft: IdentityDraft): IdentityErrors {
  const errors: IdentityErrors = {};
  if (!draft.firstName.trim()) errors.firstName = "First name is required.";
  else if (draft.firstName.trim().length > MAX_NAME) errors.firstName = `Use ${MAX_NAME} characters or fewer.`;
  if (draft.lastName.trim().length > MAX_NAME) errors.lastName = `Use ${MAX_NAME} characters or fewer.`;
  if (draft.displayName.trim().length > MAX_NAME) errors.displayName = `Use ${MAX_NAME} characters or fewer.`;
  if (!draft.email.trim()) errors.email = "Email is required.";
  else if (draft.email.trim().length > 254 || !EMAIL_RE.test(draft.email.trim())) {
    errors.email = "Enter a valid email address.";
  }
  return errors;
}

export function dateError(value: string): string | null {
  if (!value.trim()) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "Enter a valid date (YYYY-MM-DD).";
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value
    ? "Enter a real calendar date."
    : null;
}

export type QuestionKey =
  | "move_type"
  | "destination_city"
  | "move_date"
  | "visa_type"
  | "household_type"
  | "city_country"
  | "pets"
  | "has_accommodation";

export type Question = { key: QuestionKey; label: string };

export const QUESTIONS: readonly Question[] = [
  { key: "move_type", label: "What kind of move are you planning?" },
  { key: "destination_city", label: "Which Indian city are you moving to?" },
  { key: "move_date", label: "When are you planning to move?" },
  { key: "visa_type", label: "What status best describes your planned stay in India?" },
  { key: "household_type", label: "Who is moving with you?" },
  { key: "city_country", label: "Which city and country are you moving from?" },
  { key: "pets", label: "Will you bring any pets?" },
  { key: "has_accommodation", label: "Have you arranged a place to stay at your destination?" },
];

export function questionValue(profile: Partial<Profile>, key: QuestionKey): string {
  if (key === "move_type") return profile.move_type ?? "";
  if (key === "destination_city") return profile.destination_city ?? "";
  if (key === "move_date") return profile.move_date ?? "";
  if (key === "visa_type") return profile.visa_type ?? "";
  if (key === "household_type") return profile.household_type ?? "";
  if (key === "city_country") return profile.city_country ?? "";
  if (key === "pets") {
    if (profile.pets === null || profile.pets === undefined) return "";
    return profile.pets.length === 0 ? "none" : profile.pets.join(",");
  }
  return profile.has_accommodation === null || profile.has_accommodation === undefined
    ? ""
    : profile.has_accommodation ? "yes" : "no";
}

export function questionOtherValue(profile: Partial<Profile>, key: QuestionKey): string {
  if (key === "household_type") return profile.household_other ?? "";
  if (key === "pets") return profile.pets_other ?? "";
  return "";
}

