import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../../lib/supabase/client", () => ({
  isSupabaseConfigured: () => true,
  getSupabaseClient: () => ({ auth: { signOut: vi.fn() } }),
  getAccessToken: vi.fn().mockResolvedValue("token"),
}));

vi.mock("../../lib/supabase/useSession", () => ({
  useSession: () => ({
    session: { user: { id: "u1", email: "someone@example.com" } },
    loading: false,
    configured: true,
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

import CheckPlacePage from "../housing/check/page";

/**
 * Check the Place, end to end through the page.
 *
 * Rewritten for CP-01/CP-02: the address field, the "Check Address" button
 * and the four-column table replaced the older "Analyze" form, and the page
 * no longer pre-fills an address. The previous version of this file asserted
 * the old labels and a `rate_year` query param the client stopped sending,
 * so it had been failing silently on a branch nobody could run vitest on.
 */
const crimeResponse = {
  neighbourhood: {
    id: 165,
    name: "Harbourfront-CityPlace",
    rate_year: 2025,
    estimated_population: 35321,
    crime_rates_per_100k: {
      assault: {
        neighbourhood_rate: 883.33,
        city_average: 767.9,
        difference_percentage: 15.03,
        incident_count: 312,
      },
      autotheft: {
        neighbourhood_rate: 56.62,
        city_average: 225.21,
        difference_percentage: -74.86,
        incident_count: 20,
      },
    },
  },
  crime_markers: [],
  total_incidents_found: 4126,
};

const emptyContent = { category: "Housing", subcategory: "Check the Place", sections: [] };

/** Routes by URL: the page loads static content as well as crime stats. */
function mockApi(crime: { status: number; body: unknown }) {
  return vi.fn((url: string) => {
    if (String(url).includes("/crime/")) {
      return Promise.resolve(
        new Response(JSON.stringify(crime.body), {
          status: crime.status,
          headers: { "Content-Type": "application/json" },
        }),
      );
    }
    return Promise.resolve(
      new Response(JSON.stringify(emptyContent), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
  });
}

async function search(address: string) {
  fireEvent.change(screen.getByPlaceholderText("Search a Toronto address..."), {
    target: { value: address },
  });
  fireEvent.click(screen.getByRole("button", { name: /check address/i }));
}

describe("Check the Place", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows nothing but the address card until a lookup runs", () => {
    vi.stubGlobal("fetch", mockApi({ status: 200, body: crimeResponse }));
    render(<CheckPlacePage />);

    expect(screen.getByText("Enter an address")).toBeInTheDocument();
    // No pre-filled address, and so no result: a number on screen always
    // corresponds to something the person actually asked for.
    expect(screen.queryByText("Harbourfront-CityPlace")).not.toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("renders the neighbourhood and its rates from the address endpoint", async () => {
    const fetchMock = mockApi({ status: 200, body: crimeResponse });
    vi.stubGlobal("fetch", fetchMock);
    render(<CheckPlacePage />);

    await search("150 Dan Leckie Way, Toronto, ON");

    expect(await screen.findByText("Harbourfront-CityPlace")).toBeInTheDocument();
    expect(screen.getByText("Assault")).toBeInTheDocument();
    expect(screen.getByText("883.33 / 100k")).toBeInTheDocument();
    // Two decimals, not rounded to +15%: near-average offences must not be
    // made to look further from the city average than they are.
    expect(screen.getByText("+15.03%")).toBeInTheDocument();
    expect(screen.getByText("-74.86%")).toBeInTheDocument();

    const called = fetchMock.mock.calls.map((c) => String(c[0]));
    expect(
      called.some((u) =>
        u.startsWith(
          "http://localhost:8000/crime/stats/by-address?address=150+Dan+Leckie+Way",
        ),
      ),
    ).toBe(true);
  });

  it("colours an increase and a decrease differently", async () => {
    vi.stubGlobal("fetch", mockApi({ status: 200, body: crimeResponse }));
    render(<CheckPlacePage />);

    await search("150 Dan Leckie Way, Toronto, ON");

    const up = await screen.findByText("+15.03%");
    const down = screen.getByText("-74.86%");
    expect(up.className).not.toEqual(down.className);
  });

  it("explains a 404 as an address we could not place, not a broken page", async () => {
    vi.stubGlobal(
      "fetch",
      mockApi({ status: 404, body: { detail: "Could not resolve that address." } }),
    );
    render(<CheckPlacePage />);

    await search("10 Downing St, London");

    expect(await screen.findByText(/couldn't match that to a Toronto/i)).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("tells the person the limit is theirs, not a fault, on 429", async () => {
    vi.stubGlobal("fetch", mockApi({ status: 429, body: { detail: "limit" } }));
    render(<CheckPlacePage />);

    await search("100 Queen St W, Toronto, ON");

    expect(await screen.findByText(/today's address lookup limit/i)).toBeInTheDocument();
  });

  it("asks the person to sign in again on 401 rather than showing nothing", async () => {
    vi.stubGlobal("fetch", mockApi({ status: 401, body: { detail: "unauthenticated" } }));
    render(<CheckPlacePage />);

    await search("100 Queen St W, Toronto, ON");

    expect(await screen.findByText(/session has expired/i)).toBeInTheDocument();
  });

  it("separates a 503 from a bad address", async () => {
    vi.stubGlobal("fetch", mockApi({ status: 503, body: { detail: "no dataset" } }));
    render(<CheckPlacePage />);

    await search("100 Queen St W, Toronto, ON");

    // #63: a missing dataset used to look identical to an address outside
    // Toronto, which is how it survived in staging unnoticed.
    expect(await screen.findByText(/on our side, not your address/i)).toBeInTheDocument();
  });

  it("keeps the button disabled until something is typed", () => {
    vi.stubGlobal("fetch", mockApi({ status: 200, body: crimeResponse }));
    render(<CheckPlacePage />);

    expect(screen.getByRole("button", { name: /check address/i })).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText("Search a Toronto address..."), {
      target: { value: "   " },
    });
    expect(screen.getByRole("button", { name: /check address/i })).toBeDisabled();
  });

  it("does not show Before signing: CP-01 is the address card alone", async () => {
    vi.stubGlobal("fetch", mockApi({ status: 200, body: crimeResponse }));
    render(<CheckPlacePage />);

    await waitFor(() => {
      expect(screen.queryByText("Before signing")).not.toBeInTheDocument();
    });
  });
});

