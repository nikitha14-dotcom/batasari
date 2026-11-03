/**
 * ONB-04 fields, saved to the Supabase user's metadata
 * (auth.users.raw_user_meta_data). No table or API change.
 *
 * Caps are generous for names and small enough that metadata stays tiny; it is
 * copied into every access token.
 */

export const MAX_NAME = 50;

export type AccountDetails = {
  first_name: string;
  last_name: string | null;
  display_name: string | null;
  product_updates_opt_in: boolean;
};

export type AccountDraft = {
  firstName: string;
  lastName: string;
  displayName: string;
  productUpdates: boolean;
};

// Control characters and line/paragraph separators. A name is one line.
const CONTROL = /[\x00-\x1f\x7f-\x9f\u2028\u2029]/g;

/** Trim, collapse inner whitespace, strip control characters. */
export function cleanName(value: string): string {
  return value.replace(CONTROL, " ").replace(/\s+/g, " ").trim();
}

export type DraftErrors = Partial<Record<"firstName" | "lastName" | "displayName", string>>;

export function validateDraft(draft: AccountDraft): DraftErrors {
  const errors: DraftErrors = {};
  const first = cleanName(draft.firstName);
  if (!first) errors.firstName = "Enter your first name.";
  else if (first.length > MAX_NAME) errors.firstName = `Keep it under ${MAX_NAME} characters.`;
  if (cleanName(draft.lastName).length > MAX_NAME) errors.lastName = `Keep it under ${MAX_NAME} characters.`;
  if (cleanName(draft.displayName).length > MAX_NAME)
    errors.displayName = `Keep it under ${MAX_NAME} characters.`;
  return errors;
}

export function toAccountDetails(draft: AccountDraft): AccountDetails {
  const last = cleanName(draft.lastName);
  const display = cleanName(draft.displayName);
  return {
    first_name: cleanName(draft.firstName),
    last_name: last || null,
    display_name: display || null,
    product_updates_opt_in: draft.productUpdates,
  };
}

/** Pre-fill from metadata saved earlier, so revisiting ONB-04 keeps answers. */
export function draftFromMetadata(meta: Record<string, unknown> | null | undefined): AccountDraft {
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  return {
    firstName: str(meta?.first_name),
    lastName: str(meta?.last_name),
    displayName: str(meta?.display_name),
    productUpdates: meta?.product_updates_opt_in === true,
  };
}

