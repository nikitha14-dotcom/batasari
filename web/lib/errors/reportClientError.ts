import { getAccessToken } from "@/lib/supabase/client";

/**
 * Send a browser-side error to the API's /client-errors log, so a crash in
 * someone's browser is not only in their console.
 *
 * Fire and forget: this never throws and never awaits in the caller, because
 * a reporting failure must not become a second error. The API redacts emails,
 * tokens and long numbers and keeps only the page path, not its query string.
 */

export type ClientErrorKind = "render" | "error" | "unhandledrejection";

// One broken page can throw on every render or every tick. A few reports are
// enough to see it; the API also limits reports per person per day.
const MAX_REPORTS_PER_PAGE_LOAD = 5;
let sent = 0;

function messageOf(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "";
}

export function reportClientError(kind: ClientErrorKind, error: unknown, digest?: string): void {
  if (typeof window === "undefined" || sent >= MAX_REPORTS_PER_PAGE_LOAD) return;
  sent += 1;

  const body = JSON.stringify({
    kind,
    message: messageOf(error).slice(0, 500),
    page: window.location.pathname.slice(0, 200),
    digest: (digest ?? "").slice(0, 100),
  });
  const base = (process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:8000").replace(
    /\/+$/,
    "",
  );

  void (async () => {
    try {
      const token = await getAccessToken().catch(() => null);
      await fetch(`${base}/client-errors`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body,
        // Lets the report finish if the page is closing.
        keepalive: true,
      });
    } catch {
      // Nowhere left to report to.
    }
  })();
}

/** Test-only: reset the per-page-load cap. */
export function resetClientErrorReportsForTests(): void {
  sent = 0;
}

