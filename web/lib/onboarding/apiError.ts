/**
 * Turn a FastAPI error body into something a person can act on.
 *
 * FastAPI sends `detail` as a string for an HTTPException but as a list of
 * per-field objects for a Pydantic ValidationError. Handling only the string
 * case collapsed every 422 — wrong enum, over-length text, a year the server
 * cannot represent — into the same "Request failed.", which reads as a server
 * outage rather than as "the date you typed is out of range".
 */

type FieldError = {
  loc?: unknown[];
  msg?: unknown;
};

export const GENERIC_FAILURE = "Request failed.";

export function readErrorDetail(body: unknown): string {
  const detail = (body as { detail?: unknown } | null | undefined)?.detail;

  if (typeof detail === "string" && detail.trim()) return detail.trim();

  if (Array.isArray(detail)) {
    const messages = detail
      .map((item: FieldError) => {
        // "body" is always the first element and tells the user nothing.
        const path = Array.isArray(item?.loc)
          ? item.loc.filter((part) => part !== "body").join(".")
          : "";
        const message = typeof item?.msg === "string" ? item.msg : "is not valid";
        return path ? `${path}: ${message}` : message;
      })
      .filter(Boolean);

    if (messages.length) return messages.join("; ");
  }

  return GENERIC_FAILURE;
}

export const NETWORK_FAILURE =
  "We can't reach the Batasari service right now. Check your connection and try again.";

/**
 * Message for an error thrown by fetch() itself (not an HTTP error status).
 *
 * The browser reports every network-level failure the same way -- server down,
 * wrong API URL, a CORS rejection, or a 500 that came back without CORS
 * headers -- as a TypeError ("Failed to fetch" in Chrome, "Load failed" in
 * Safari). Showing that text verbatim tells a user nothing.
 */
export function requestErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof TypeError) return NETWORK_FAILURE;
  if (err instanceof DOMException && (err.name === "TimeoutError" || err.name === "AbortError")) {
    return "The server took too long to respond. Try again in a moment.";
  }
  return err instanceof Error && err.message ? err.message : fallback;
}

