/**
 * Scheme allow-list for citation links.
 *
 * Source URLs are model output. React escapes text content but does NOT
 * sanitise `href`, so `<a href={source.url}>` with `javascript:alert(1)`
 * executes on click — a one-click XSS driven by whatever the model emits or
 * by whatever a retrieved page persuaded it to emit.
 *
 * It is dormant today only because runner.py hardcodes `sources: []`. The
 * retrieval work that fills that array is the moment it stops being dormant,
 * which is the wrong moment to discover this.
 */

const SAFE_SCHEMES = new Set(["http:", "https:", "mailto:"]);

/**
 * Returns the URL if it is safe to put in an href, or null if it is not.
 *
 * Relative URLs are rejected along with everything else: a citation names an
 * external authority, so anything that is not absolute is not a citation.
 */
export function safeExternalUrl(raw: unknown): string | null {
  if (typeof raw !== "string" || !raw.trim()) return null;

  let parsed: URL;
  try {
    parsed = new URL(raw.trim());
  } catch {
    return null;
  }

  return SAFE_SCHEMES.has(parsed.protocol) ? parsed.toString() : null;
}

