/**
 * The header's "Relocating in 1 month" line, from the profile's move_date.
 *
 * Returns null when there is nothing honest to say (no date, unparseable
 * date), so the header can simply omit the line.
 */
export function relocationLabel(moveDate: string | null | undefined, today: Date = new Date()): string | null {
  if (!moveDate) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(moveDate);
  if (!m) return null;

  // Compare calendar dates in local time; a bare "YYYY-MM-DD" parsed with
  // new Date() is UTC midnight and would be "yesterday" west of Greenwich.
  const move = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (Number.isNaN(move.getTime())) return null;
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const days = Math.round((move.getTime() - start.getTime()) / 86_400_000);

  if (days < 0) return "Settling in";
  if (days === 0) return "Moving today";
  if (days === 1) return "Relocating tomorrow";
  if (days < 14) return `Relocating in ${days} days`;
  if (days < 45) {
    const weeks = Math.round(days / 7);
    return weeks >= 4 ? "Relocating in 1 month" : `Relocating in ${weeks} weeks`;
  }
  const months = Math.round(days / 30.44);
  return `Relocating in ${months} months`;
}

/** Display name: the account's name if it has one, else the email's local part. */
export function displayName(
  user: { email?: string | null; user_metadata?: Record<string, unknown> | null } | null | undefined,
): string | null {
  if (!user) return null;
  const meta = user.user_metadata ?? {};
  for (const key of ["full_name", "name", "first_name"]) {
    const v = meta[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  const local = user.email?.split("@")[0]?.trim();
  return local || null;
}

