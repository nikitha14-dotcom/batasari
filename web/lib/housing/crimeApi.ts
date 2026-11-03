"use client";

/**
 * Client for GET /crime/stats/by-address.
 *
 * The page used to show a literal table of five offences for a made-up
 * address, which looked identical whether the pipeline was working or not --
 * that is how the missing crime dataset survived in staging (#63). Every
 * number here now comes from the API, and each failure mode gets its own
 * message so "that address isn't in Toronto" never again reads the same as
 * "the crime data didn't ship".
 */

import { apiUrl } from "@/lib/api/apiBase";
import { getAccessToken } from "@/lib/supabase/client";

/**
 * How long we wait before giving up.
 *
 * Geocoding plus a neighbourhood lookup is normally well under a second, but
 * the first version had no timeout at all: a hung connection left the button
 * reading "Checking…" forever with no way back except a reload. The email
 * check next door already uses this pattern (emailStatus.ts).
 */
const TIMEOUT_MS = 10_000;

/** Offence keys the API returns, in CP-02's row order with its labels. */
const OFFENCE_LABELS: Array<{ key: string; label: string }> = [
  { key: "assault", label: "Assault" },
  { key: "autotheft", label: "Auto theft" },
  { key: "biketheft", label: "Bike theft" },
  { key: "breakenter", label: "Break & Enter" },
  { key: "robbery", label: "Robbery" },
  { key: "theftover", label: "Theft Over" },
  { key: "homicide", label: "Homicide" },
  { key: "shooting", label: "Shooting" },
  { key: "theftfrommv", label: "Theft from MV" },
];

export interface CrimeRateRow {
  key: string;
  offence: string;
  neighbourhoodRate: number;
  cityAverage: number;
  differencePercentage: number;
  incidentCount: number;
  /** Above the city average. Drives the up/down treatment in the table. */
  isHigher: boolean;
}

export interface CrimeStats {
  neighbourhoodName: string;
  estimatedPopulation: number | null;
  rateYear: number | null;
  totalIncidents: number;
  rows: CrimeRateRow[];
}

export type CrimeErrorKind =
  | "not_found"
  | "unavailable"
  | "bad_request"
  | "unauthenticated"
  | "rate_limited"
  | "timeout"
  | "network";

export class CrimeRequestError extends Error {
  constructor(
    message: string,
    readonly kind: CrimeErrorKind,
  ) {
    super(message);
    this.name = "CrimeRequestError";
  }
}

function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function parseRows(rates: unknown): CrimeRateRow[] {
  if (!rates || typeof rates !== "object") return [];
  const table = rates as Record<string, unknown>;
  const rows: CrimeRateRow[] = [];

  for (const { key, label } of OFFENCE_LABELS) {
    const raw = table[key];
    if (!raw || typeof raw !== "object") continue;
    const r = raw as Record<string, unknown>;

    const neighbourhoodRate = num(r.neighbourhood_rate);
    const cityAverage = num(r.city_average);
    if (neighbourhoodRate === null || cityAverage === null) continue;

    rows.push({
      key,
      offence: label,
      neighbourhoodRate,
      cityAverage,
      differencePercentage: num(r.difference_percentage) ?? 0,
      incidentCount: num(r.incident_count) ?? 0,
      isHigher: neighbourhoodRate > cityAverage,
    });
  }

  return rows;
}

export async function fetchCrimeStats(
  address: string,
  init?: { signal?: AbortSignal },
): Promise<CrimeStats> {
  const params = new URLSearchParams({ address });
  const token = await getAccessToken();

  // The caller's signal cancels a superseded lookup; ours caps how long any
  // single lookup may hang. Either one aborts the request.
  const timeout = AbortSignal.timeout(TIMEOUT_MS);
  const signal = init?.signal
    ? anySignal([init.signal, timeout])
    : timeout;

  let response: Response;
  try {
    response = await fetch(apiUrl(`/crime/stats/by-address?${params}`), {
      headers: {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: "same-origin",
      signal,
    });
  } catch (err) {
    // A caller-triggered abort is a cancelled lookup and must stay an abort.
    // Our own timeout is a failure the person needs to see.
    if (init?.signal?.aborted) throw err;
    if (timeout.aborted) {
      throw new CrimeRequestError(
        "That lookup took too long. Check your connection and try again.",
        "timeout",
      );
    }
    throw new CrimeRequestError("Could not reach the server.", "network");
  }

  if (!response.ok) {
    // The API separates these deliberately: 404 is a real miss, 503 means the
    // dataset or the geocoder is not available to the service.
    if (response.status === 404) {
      throw new CrimeRequestError(
        "We couldn't match that to a Toronto neighbourhood. Try a street address with the city, for example \"100 Queen St W, Toronto, ON\".",
        "not_found",
      );
    }
    if (response.status === 400) {
      throw new CrimeRequestError(
        "We don't have crime data for that year.",
        "bad_request",
      );
    }
    if (response.status === 401) {
      throw new CrimeRequestError(
        "Your session has expired. Sign in again to look up an address.",
        "unauthenticated",
      );
    }
    if (response.status === 429) {
      throw new CrimeRequestError(
        "You have reached today's address lookup limit. Try again tomorrow.",
        "rate_limited",
      );
    }
    throw new CrimeRequestError(
      "Crime data is unavailable right now. This is on our side, not your address.",
      "unavailable",
    );
  }

  const body = (await response.json()) as Record<string, unknown>;
  const hood = (body.neighbourhood ?? {}) as Record<string, unknown>;

  return {
    neighbourhoodName:
      typeof hood.name === "string" && hood.name.trim()
        ? hood.name
        : "This neighbourhood",
    estimatedPopulation: num(hood.estimated_population),
    rateYear: num(hood.rate_year),
    totalIncidents: num(body.total_incidents_found) ?? 0,
    rows: parseRows(hood.crime_rates_per_100k),
  };
}

/**
 * "883.33 / 100k" -- the API's own precision, trimmed, as CP-02 prints it.
 *
 * toFixed(1) was wrong in both directions: it padded 1.4 to "1.4" correctly
 * but flattened 883.33 to "883.3" and 225.21 to "225.2", so the table showed
 * numbers that do not appear in the source data.
 */
export function formatRate(rate: number): string {
  return `${Math.round(rate * 100) / 100} / 100k`;
}

/** "+27%" / "-13%", rounded the way the design shows it. */
export function formatDifference(percentage: number): string {
  const rounded = Math.round(percentage * 100) / 100;
  return `${rounded > 0 ? "+" : ""}${rounded}%`;
}

/** First of several signals to abort wins. AbortSignal.any is too new here. */
function anySignal(signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController();
  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort(signal.reason);
      break;
    }
    signal.addEventListener("abort", () => controller.abort(signal.reason), {
      once: true,
    });
  }
  return controller.signal;
}

