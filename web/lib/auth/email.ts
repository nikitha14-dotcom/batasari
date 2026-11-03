// Deliberately loose. Real validation is Supabase delivering the email; a
// stricter regex only rejects addresses that are in fact valid.
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Supabase rate-limits sign-in emails per address. Blocking the button locally
// gives a clear countdown instead of an opaque 429 from the server.
export const RESEND_COOLDOWN_SECONDS = 60;

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}

/**
 * Where the email link sends the user back to.
 *
 * Blank counts as unset. An env var defined as "" is not nullish, so `??`
 * would keep it and build the relative "/auth/callback". Supabase rejects a
 * relative redirect, falls back to the project's Site URL, and the sign-in
 * code never reaches this app.
 */
export function callbackUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const base =
    configured || (typeof window === "undefined" ? "http://localhost:3000" : window.location.origin);
  return `${base.replace(/\/+$/, "")}/auth/callback`;
}

/**
 * Turns a Supabase auth error into something a person can act on. Known
 * messages are matched loosely because Supabase does not version them.
 */
export function friendlyAuthError(err: unknown, fallback: string): string {
  const raw = err instanceof Error ? err.message : typeof err === "string" ? err : "";
  const lower = raw.toLowerCase();
  if (lower.includes("pilot is full")) {
    return "The pilot is full right now. We'll open more spots soon.";
  }
  if (lower.includes("signups not allowed")) {
    return "Sign-up is closed at the moment. If you already have an account, use Login.";
  }
  if (lower.includes("rate limit") || lower.includes("too many")) {
    return "Too many emails have been sent recently. Please wait a few minutes and try again.";
  }
  return raw || fallback;
}

