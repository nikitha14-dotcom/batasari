import { relocationLabel } from "./relocationLabel";

type MetadataUser = {
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
};

function meta(user: MetadataUser | null | undefined, key: string): string | null {
  const value = user?.user_metadata?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/**
 * The large name on the profile card ("Olivia Sterling").
 *
 * Reads the same metadata keys as displayName() in relocationLabel.ts, plus
 * first_name + last_name, which is how the onboarding screens write it.
 */
export function fullName(user: MetadataUser | null | undefined): string | null {
  const direct = meta(user, "full_name") ?? meta(user, "name");
  if (direct) return direct;

  const first = meta(user, "first_name");
  const last = meta(user, "last_name");
  if (first && last) return `${first} ${last}`;
  return first ?? last;
}

/** The "@Maple" line: the chosen display name, if there is one. */
export function handle(user: MetadataUser | null | undefined): string | null {
  const name = meta(user, "display_name") ?? meta(user, "preferred_name");
  return name ? `@${name}` : null;
}

/**
 * Two letters for the avatar circle.
 *
 * Falls back to the email's first letter, then to a dash -- an avatar that
 * renders "undefined" is worse than one that renders nothing.
 */
export function initials(user: MetadataUser | null | undefined): string {
  const name = fullName(user);
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  }

  const local = user?.email?.trim();
  return local ? local[0].toUpperCase() : "-";
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/**
 * "Relocating in 1 month (Oct 2026)".
 *
 * The month in brackets is computed from move_date rather than stored
 * separately: the mock shows "Relocating in 1 month (Nov 2026)" dated from a
 * September session, which is two different months for one date.
 */
export function timelineLabel(
  moveDate: string | null | undefined,
  today: Date = new Date(),
): string | null {
  const label = relocationLabel(moveDate, today);
  if (!label) return null;

  const parsed = /^(\d{4})-(\d{2})/.exec(moveDate ?? "");
  if (!parsed) return label;

  const month = MONTHS[Number(parsed[2]) - 1];
  return month ? `${label} (${month} ${parsed[1]})` : label;
}

