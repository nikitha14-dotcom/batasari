
import { apiUrl } from "@/lib/api/apiBase";

/** sessionStorage key used to carry the address from Sign Up to Login. */
export const LOGIN_EMAIL_KEY = "ma_login_email";

export type EmailStatus = "registered" | "new" | "rate_limited" | "unavailable";

/**
 * Asks the API whether an account already uses this email (POST
 * /auth/email-status, rate-limited server-side).
 *
 * Sign Up must NOT continue on "rate_limited" or "unavailable". An earlier
 * version carried on when the check failed, which silently turned Sign Up back
 * into "email me a sign-in link" for existing users whenever the API was down,
 * outdated, or missing its migration -- and nothing showed that it had failed.
 */
export async function checkEmailStatus(email: string): Promise<EmailStatus> {
  try {
    const res = await fetch(apiUrl(`/auth/email-status`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
      signal: AbortSignal.timeout(8000),
    });
    if (res.status === 429) return "rate_limited";
    if (!res.ok) {
      console.warn(`[signup] /auth/email-status returned ${res.status}`);
      return "unavailable";
    }
    const body = (await res.json()) as { registered?: unknown };
    if (typeof body.registered !== "boolean") return "unavailable";
    return body.registered ? "registered" : "new";
  } catch (err) {
    console.warn("[signup] /auth/email-status unreachable", err);
    return "unavailable";
  }
}

/** Remember the address for Login without putting it in the URL. */
export function rememberLoginEmail(email: string): void {
  try {
    sessionStorage.setItem(LOGIN_EMAIL_KEY, email);
  } catch {
    // Private mode / storage disabled: Login just starts empty.
  }
}

/** Read (and clear) the address Sign Up handed over, if any. */
export function takeLoginEmail(): string | null {
  try {
    const value = sessionStorage.getItem(LOGIN_EMAIL_KEY);
    sessionStorage.removeItem(LOGIN_EMAIL_KEY);
    return value;
  } catch {
    return null;
  }
}

