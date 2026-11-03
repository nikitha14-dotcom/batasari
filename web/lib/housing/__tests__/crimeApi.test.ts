import { afterEach, describe, expect, it, vi } from "vitest";

const { getAccessToken } = vi.hoisted(() => ({
  getAccessToken: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({ getAccessToken }));

import {
  CrimeRequestError,
  fetchCrimeStats,
  formatDifference,
  formatRate,
} from "../crimeApi";

/**
 * The crime client's parsing and failure modes.
 *
 * Every number on Check the Place comes through here, and the page's whole
 * point is that a wrong or missing number must never look like a right one.
 */
function ok(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function fail(status: number) {
  return new Response(JSON.stringify({ detail: "x" }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const payload = {
  neighbourhood: {
    name: "Annex",
    rate_year: 2025,
    estimated_population: 30000,
    crime_rates_per_100k: {
      assault: {
        neighbourhood_rate: 1080.9,
        city_average: 767.9,
        difference_percentage: 40.76,
        incident_count: 300,
      },
      autotheft: {
        neighbourhood_rate: 116.9,
        city_average: 225.2,
        difference_percentage: -48.09,
        incident_count: 30,
      },
    },
  },
  crime_markers: [],
  total_incidents_found: 855,
};

describe("formatRate / formatDifference", () => {
  it("prints the API's own precision, not a fixed decimal count", () => {
    // CP-02 shows 883.33, 225.21, 189.5 and 1.4 side by side: the frame
    // prints what the API returns rather than padding or truncating.
    expect(formatRate(883.33)).toBe("883.33 / 100k");
    expect(formatRate(189.5)).toBe("189.5 / 100k");
    expect(formatRate(1.4)).toBe("1.4 / 100k");
  });

  it("keeps two decimals and signs an increase", () => {
    expect(formatDifference(15.03)).toBe("+15.03%");
    expect(formatDifference(-6.7)).toBe("-6.7%");
  });

  it("does not round a small difference away", () => {
    // Rounding to whole percent turned -6.7% into -7%, overstating how far a
    // near-average neighbourhood sits from the city.
    expect(formatDifference(0.4)).toBe("+0.4%");
    expect(formatDifference(-0.4)).toBe("-0.4%");
  });

  it("leaves an exact zero unsigned", () => {
    expect(formatDifference(0)).toBe("0%");
  });
});

describe("fetchCrimeStats", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    getAccessToken.mockReset();
  });

  it("sends the Supabase access token to the authenticated crime API", async () => {
    getAccessToken.mockResolvedValue("crime-token");
    const fetchMock = vi.fn().mockResolvedValue(ok(payload));
    vi.stubGlobal("fetch", fetchMock);

    await fetchCrimeStats("100 Queen St W, Toronto, ON");

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/crime/stats/by-address"),
      expect.objectContaining({
        headers: {
          Accept: "application/json",
          Authorization: "Bearer crime-token",
        },
      }),
    );
  });

  it("maps the API shape onto rows in the frame's order", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(ok(payload)));

    const stats = await fetchCrimeStats("100 Queen St W, Toronto, ON");

    expect(stats.neighbourhoodName).toBe("Annex");
    expect(stats.rateYear).toBe(2025);
    expect(stats.totalIncidents).toBe(855);
    expect(stats.rows.map((r) => r.offence)).toEqual(["Assault", "Auto theft"]);
    expect(stats.rows[0].isHigher).toBe(true);
    expect(stats.rows[1].isHigher).toBe(false);
  });

  it("skips an offence whose rates are missing rather than printing NaN", async () => {
    const broken = {
      ...payload,
      neighbourhood: {
        ...payload.neighbourhood,
        crime_rates_per_100k: {
          assault: { neighbourhood_rate: null, city_average: 767.9 },
          robbery: { neighbourhood_rate: 10, city_average: 20, difference_percentage: -50 },
        },
      },
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(ok(broken)));

    const stats = await fetchCrimeStats("x");

    expect(stats.rows.map((r) => r.offence)).toEqual(["Robbery"]);
  });

  it("falls back to a neutral name rather than rendering 'undefined'", async () => {
    const nameless = {
      ...payload,
      neighbourhood: { ...payload.neighbourhood, name: "  " },
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(ok(nameless)));

    const stats = await fetchCrimeStats("x");

    expect(stats.neighbourhoodName).toBe("This neighbourhood");
  });

  it.each([
    [404, "not_found"],
    [400, "bad_request"],
    [401, "unauthenticated"],
    [429, "rate_limited"],
    [503, "unavailable"],
    [500, "unavailable"],
  ])("turns %i into a %s error the page can explain", async (status, kind) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(fail(status)));

    await expect(fetchCrimeStats("x")).rejects.toMatchObject({ kind });
  });

  it("reports a network failure as network, not as a bad address", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));

    await expect(fetchCrimeStats("x")).rejects.toMatchObject({ kind: "network" });
  });

  it("re-throws the caller's abort so a superseded lookup stays cancelled", async () => {
    const controller = new AbortController();
    const abortError = Object.assign(new Error("aborted"), { name: "AbortError" });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(abortError));
    controller.abort();

    await expect(
      fetchCrimeStats("x", { signal: controller.signal }),
    ).rejects.not.toBeInstanceOf(CrimeRequestError);
  });

  it("encodes the address instead of splicing it into the URL", async () => {
    const fetchMock = vi.fn().mockResolvedValue(ok(payload));
    vi.stubGlobal("fetch", fetchMock);

    await fetchCrimeStats("1 King & Bay St, Toronto, ON");

    const url = String(fetchMock.mock.calls[0][0]);
    expect(url).toContain("address=1+King+%26+Bay+St");
    expect(url).not.toContain("& Bay");
  });
});

