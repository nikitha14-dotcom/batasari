import { fireEvent, render, screen, within } from "@testing-library/react";
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

import ComparePage from "../housing/compare/page";

/**
 * "Tips on evaluating housing options": one citation per row.
 *
 * Four of the seeded rows carry their citation inline, as a markdown link
 * inside the sentence. The page also rendered the row's trusted-source link
 * underneath, so those rows showed the same authority twice -- and with
 * different hrefs, since the inline link points at the specific brochure
 * while trusted_sources holds the general guide. A reader had no way to tell
 * which of the two to follow.
 */
const LTB = "https://tribunalsontario.ca/documents/ltb/Brochures/Maintenance%20and%20Repairs.html";
const LTB_GUIDE = "https://tribunalsontario.ca/documents/ltb/Brochures/Guide%20to%20RTA.html";

function section(
  key: string,
  title: string,
  bodyMarkdown: string,
  source: { name: string; url: string } | null,
) {
  return { section_key: key, title, body_markdown: bodyMarkdown, source };
}

const SECTIONS = [
  section("evaluate-options", "What to weigh before you commit to a place.", "", null),
  // Cites inline: the source footer would be a second, different link.
  section(
    "maintenance-responsibilities",
    "Maintenance responsibilities",
    `Landlords are generally responsible for repairs. See details from the [Ontario Landlord and Tenant Board](${LTB}).`,
    { name: "Ontario Landlord and Tenant Board", url: LTB_GUIDE },
  ),
  // No inline link: the source footer is the only citation, so it stays.
  section(
    "living-alone-vs-sharing",
    "Living alone vs sharing",
    "Sharing lowers rent but removes control over who you live with.",
    { name: "Ontario Landlord and Tenant Board", url: LTB_GUIDE },
  ),
  section("total-housing-costs", "Total housing costs", "Budget for utilities and internet.", null),
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

async function openAll() {
  const button = await screen.findByRole("button", { name: /expand all/i });
  fireEvent.click(button);
}

describe("Compare options citations", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("keeps the inline citation and drops the duplicate source footer", async () => {
    vi.stubGlobal("fetch", mockContent(SECTIONS));
    render(<ComparePage />);

    await openAll();

    const header = await screen.findByRole("button", {
      name: /Maintenance responsibilities/,
    });
    const row = header.parentElement!;
    const links = within(row).getAllByRole("link", {
      name: /Ontario Landlord and Tenant Board/,
    });

    expect(links).toHaveLength(1);
    // The surviving link is the one the sentence points at, not the generic
    // guide from trusted_sources.
    expect(links[0]).toHaveAttribute("href", LTB);
  });

  it("still shows the source footer for a row that does not cite inline", async () => {
    vi.stubGlobal("fetch", mockContent(SECTIONS));
    render(<ComparePage />);

    await openAll();

    const links = screen.getAllByRole("link", { name: /Ontario Landlord and Tenant Board/ });
    // One inline (maintenance) plus one footer (living alone vs sharing):
    // suppression is per row, not a blanket removal of the footer.
    expect(links).toHaveLength(2);
    expect(links.some((l) => l.getAttribute("href") === LTB_GUIDE)).toBe(true);
  });
});

