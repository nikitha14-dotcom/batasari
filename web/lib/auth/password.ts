/**
 * Password rules for CREATING a password (ONB-03).
 *
 * Not applied at Login: an existing password that predates these rules must
 * still work, and Login only needs to know the field isn't empty.
 *
 * These checks are guidance in the browser. The server-side copy lives in
 * Supabase (Authentication -> Providers -> Email -> password requirements) and
 * must be set to match, since anyone can call Supabase directly.
 */

export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 72; // bcrypt ignores bytes past 72

export type PasswordRule = { id: string; label: string; test: (pw: string) => boolean };

export const PASSWORD_RULES: readonly PasswordRule[] = [
  { id: "length", label: `At least ${MIN_PASSWORD_LENGTH} characters`, test: (pw) => pw.length >= MIN_PASSWORD_LENGTH },
  { id: "lower", label: "A lowercase letter", test: (pw) => /[a-z]/.test(pw) },
  { id: "upper", label: "An uppercase letter", test: (pw) => /[A-Z]/.test(pw) },
  { id: "number", label: "A number", test: (pw) => /[0-9]/.test(pw) },
  { id: "symbol", label: "A symbol (e.g. ! @ # $)", test: (pw) => /[^A-Za-z0-9\s]/.test(pw) },
];

export function failedRules(pw: string): PasswordRule[] {
  return PASSWORD_RULES.filter((r) => !r.test(pw));
}

export function isStrongPassword(pw: string): boolean {
  return pw.length <= MAX_PASSWORD_LENGTH && failedRules(pw).length === 0;
}

