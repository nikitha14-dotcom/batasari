import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

vi.mock("@/lib/supabase/client", () => ({
  isSupabaseConfigured: () => true,
  getSupabaseClient: () => ({ auth: { signOut: vi.fn() } }),
  getAccessToken: vi.fn().mockResolvedValue("token"),
}));

vi.mock("@/lib/supabase/useSession", () => ({
  useSession: () => ({
    session: { user: { id: "u1", email: "someone@example.com" } },
    loading: false,
    configured: true,
  }),
}));

const visa = vi.hoisted(() => ({ value: null as string | null }));

vi.mock("@/lib/profile/useVisaType", () => ({
  useVisaType: () => ({ visaType: visa.value, loading: false }),
}));

import HousingPage from "../housing/page";

/**
 * The "Learn more" popups, against the Figma structure (FH-02 … FH-08).
 *
 * This replaces the dialog half of housing-gate.test.tsx, which encoded the
 * pre-Figma design (a resource table with a "Website →" button per row). The
 * assertions that matter did not change: a popup must show what the database
 * holds, arranged the way the frame arranges it, and must show nothing at
 * all rather than an empty shell when the rows are absent.
 */
function row(
  section_key: string,
  title: string,
  body_markdown = "",
  source: { name: string; url: string } | null = null,
) {
  return { section_key, title, body_markdown, source };
}

const FIND_HOUSING = [
  row(
    "temporary-emergency-accommodation",
    "Toronto Shelter System",
    "Emergency accommodation and support for people experiencing homelessness.",
    { name: "Toronto Shelter System", url: "https://www.toronto.ca/shelter/" },
  ),
  row("temporary-hotel-hostelworld", "Hostelworld", "Booking website.", {
    name: "Hostelworld",
    url: "https://www.hostelworld.com/",
  }),
  row("temporary-hotel-expedia", "Expedia", "Booking website.", {
    name: "Expedia",
    url: "https://www.expedia.ca/",
  }),
  row("temporary-hotel-trivago", "Trivago", "Hotel price comparison website.", {
    name: "Trivago",
    url: "https://www.trivago.ca/",
  }),
  row("temporary-airbnb", "Airbnb", "Short-term residential rentals.", {
    name: "Airbnb",
    url: "https://www.airbnb.ca/",
  }),
  row(
    "managed-buildings-intro",
    "Managed Buildings",
    "Rental buildings operated by a company rather than individual owners.",
  ),
  row("managed-rentcafe", "RentCafe", "Listings come directly from property managers.", {
    name: "RentCafe",
    url: "https://www.rentcafe.com/",
  }),
  row("managed-capreit", "Capreit", "", {
    name: "Capreit",
    url: "https://www.capreit.ca/",
  }),
  row("university-boards", "University housing boards", "Off-campus boards run by universities."),
  row("university-board-utoronto", "University of Toronto", "", {
    name: "U of T Off-Campus Housing Finder",
    url: "https://housing.utoronto.ca/",
  }),
  row("university-board-york", "York University", "", {
    name: "York Off-Campus Housing",
    url: "https://york.ca/housing",
  }),
  row(
    "long-term-marketplaces-intro",
    "Long-term rentals",
    "Marketplaces and directories carry most long-term listings.",
  ),
  row(
    "agent-listed-intro",
    "Agent-Listed Rentals (MLS)",
    "Rentals here are listed on MLS by brokerages.\n\n**Before signing:** ask if the representation agreement is exclusive, how long it runs, and whether you could owe a fee.",
  ),
  row("agent-listed-realtor-ca", "Realtor.ca", "The national MLS portal.", {
    name: "Realtor.ca",
    url: "https://www.realtor.ca/",
  }),
  row("avoiding-rental-scams", "Avoiding rental scams", "Rental scams can appear anywhere."),
  row("scams-cafc", "Canadian Anti-Fraud Centre", "Official examples of rental-scam patterns.", {
    name: "Canadian Anti-Fraud Centre",
    url: "https://antifraudcentre.ca/",
  }),
];

function mockContent(sections: unknown[]) {
  return vi.fn(async (url: string) =>
    String(url).includes("/content")
      ? new Response(JSON.stringify({ sections }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      : new Response(JSON.stringify({}), { status: 200 }),
  );
}

async function openCard(name: RegExp) {
  const button = await screen.findByRole("button", { name });
  await waitFor(() => expect(button).not.toBeDisabled());
  fireEvent.click(button);
  return screen.findByRole("dialog");
}

describe("Housing 'Learn more' popups", () => {
  afterEach(() => {
    visa.value = null;
    vi.unstubAllGlobals();
  });

  it("opens nothing until a card is chosen", async () => {
    vi.stubGlobal("fetch", mockContent(FIND_HOUSING));
    render(<HousingPage />);

    await screen.findByText("Choose the right type of housing");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("names each opener for its own card, not just 'Learn more'", async () => {
    vi.stubGlobal("fetch", mockContent(FIND_HOUSING));
    render(<HousingPage />);

    // Six identical "Learn more" labels would be unusable with a screen
    // reader; the accessible name has to say which type it opens.
    expect(
      await screen.findByRole("button", { name: /Learn more about Temporary/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Learn more about Managed buildings/ }),
    ).toBeInTheDocument();
  });

  it("arranges FH-02 as prose plus labelled chip groups", async () => {
    vi.stubGlobal("fetch", mockContent(FIND_HOUSING));
    render(<HousingPage />);

    const dialog = await openCard(/Learn more about Temporary/);

    // Prose container: the row's own title, body and Website action.
    expect(within(dialog).getByText("Toronto Shelter System")).toBeInTheDocument();
    expect(
      within(dialog).getByText(/Emergency accommodation and support/),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole("link", { name: /Toronto Shelter System/ }),
    ).toHaveAttribute("href", "https://www.toronto.ca/shelter/");

    // Heading with no row behind it -- design copy from the frame.
    expect(within(dialog).getByText("Hotels and Hostels")).toBeInTheDocument();
    expect(within(dialog).getByText("Booking Sites")).toBeInTheDocument();

    // The booking sites are chips, not table rows.
    for (const name of ["Hostelworld", "Expedia", "Trivago", "Airbnb"]) {
      expect(within(dialog).getByRole("link", { name: new RegExp(name) })).toBeInTheDocument();
    }
  });

  it("gives every popup link a safe external target", async () => {
    vi.stubGlobal("fetch", mockContent(FIND_HOUSING));
    render(<HousingPage />);

    const dialog = await openCard(/Learn more about Temporary/);

    for (const link of within(dialog).getAllByRole("link")) {
      expect(link).toHaveAttribute("target", "_blank");
      expect(link.getAttribute("rel")).toContain("noopener");
    }
  });

  it("puts FH-05's operator chips in the same box as its rows", async () => {
    vi.stubGlobal("fetch", mockContent(FIND_HOUSING));
    render(<HousingPage />);

    const dialog = await openCard(/Learn more about Managed buildings/);

    expect(within(dialog).getByText("Operator-run & managed portals")).toBeInTheDocument();
    expect(within(dialog).getByText("Operator sites")).toBeInTheDocument();
    expect(within(dialog).getByRole("link", { name: /RentCafe/ })).toBeInTheDocument();
    expect(within(dialog).getByRole("link", { name: /Capreit/ })).toBeInTheDocument();
    // The frame shows one white box, not a section per group.
    expect(
      within(dialog).getByText(/operated by a company rather than individual owners/),
    ).toBeInTheDocument();
  });

  it("closes on the named control and on Escape", async () => {
    vi.stubGlobal("fetch", mockContent(FIND_HOUSING));
    render(<HousingPage />);

    await openCard(/Learn more about Temporary/);
    fireEvent.click(screen.getByRole("button", { name: "Close housing details" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

    await openCard(/Learn more about Temporary/);
    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("shows FH-08 only for a study permit, with the link on the right", async () => {
    visa.value = "study_permit";
    vi.stubGlobal("fetch", mockContent(FIND_HOUSING));
    render(<HousingPage />);

    const dialog = await openCard(/Learn more about University housing boards/);

    // Institution on the left, its own board link on the right.
    expect(within(dialog).getByText("University of Toronto")).toBeInTheDocument();
    expect(
      within(dialog).getByRole("link", { name: /U of T Off-Campus Housing Finder/ }),
    ).toHaveAttribute("href", "https://housing.utoronto.ca/");
    expect(within(dialog).getByText("York University")).toBeInTheDocument();
  });

  it("hides FH-08 entirely when the profile is not a study permit", async () => {
    visa.value = "open_work_permit";
    vi.stubGlobal("fetch", mockContent(FIND_HOUSING));
    render(<HousingPage />);

    await screen.findByText("Choose the right type of housing");
    expect(
      screen.queryByRole("button", { name: /Learn more about University housing boards/ }),
    ).not.toBeInTheDocument();
  });

  it("drops a group whose rows are absent instead of showing an empty box", async () => {
    // Only the emergency row survives: the hotel and Airbnb groups must go.
    vi.stubGlobal("fetch", mockContent([FIND_HOUSING[0]]));
    render(<HousingPage />);

    const dialog = await openCard(/Learn more about Temporary/);

    expect(within(dialog).getByText("Toronto Shelter System")).toBeInTheDocument();
    expect(within(dialog).queryByText("Hotels and Hostels")).not.toBeInTheDocument();
    expect(within(dialog).queryByText("Booking Sites")).not.toBeInTheDocument();
  });

  it("says so plainly when the subcategory has no rows at all", async () => {
    vi.stubGlobal("fetch", mockContent([]));
    render(<HousingPage />);

    const dialog = await openCard(/Learn more about Temporary/);

    expect(within(dialog).getByText(/don't have listings for this option yet/)).toBeInTheDocument();
  });

  it("says 'Before signing' once, not once as a heading and again in the body", async () => {
    vi.stubGlobal("fetch", mockContent(FIND_HOUSING));
    render(<HousingPage />);

    const dialog = await openCard(/Learn more about Long-term/);
    fireEvent.click(within(dialog).getByRole("tab", { name: /Agent-Listed/ }));

    // The seeded paragraph opens with the same phrase the frame promotes to a
    // heading, so rendering it verbatim printed the heading twice.
    expect(within(dialog).getAllByText(/Before signing/)).toHaveLength(1);
    expect(
      within(dialog).getByText(/^Ask if the representation agreement is exclusive/),
    ).toBeInTheDocument();
  });

  it("renders the scams resources from the database, not a local copy", async () => {
    vi.stubGlobal("fetch", mockContent(FIND_HOUSING));
    render(<HousingPage />);

    expect(await screen.findByText("Avoiding rental scams")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Canadian Anti-Fraud Centre/ }),
    ).toHaveAttribute("href", "https://antifraudcentre.ca/");
    expect(
      screen.getByText("Official examples of rental-scam patterns."),
    ).toBeInTheDocument();
  });
});

