/**
 * Where the browser reaches the API.
 *
 * This literal was copy-pasted into five modules (contentApi, crimeApi,
 * emailStatus, useHeaderProfile, useVisaType). One of them is enough to get
 * wrong, and the fallback is the sharp edge: with NEXT_PUBLIC_API_URL unset,
 * every browser falls back to *its own* localhost:8000, which works on the
 * machine running the API and fails silently everywhere else.
 *
 * `apiUrl` also strips a trailing slash, because `${base}/content` with a
 * base of "http://localhost:8000/" produces "//content" -- a 404 that reads
 * like a missing endpoint.
 */

const FALLBACK = "http://localhost:8000";

/** Base URL with no trailing slash. */
export function apiBase(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim();
  return (configured || FALLBACK).replace(/\/+$/, "");
}

/** True when nothing was configured and we are guessing at localhost. */
export function usingFallbackApi(): boolean {
  return !process.env.NEXT_PUBLIC_API_URL?.trim();
}

/** Join a path onto the base, tolerating a leading slash or not. */
export function apiUrl(path: string): string {
  return `${apiBase()}/${path.replace(/^\/+/, "")}`;
}

