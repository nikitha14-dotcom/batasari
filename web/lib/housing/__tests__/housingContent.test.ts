import { describe, expect, it } from "vitest";

import type { ContentSection } from "@/lib/content/contentApi";
import {
  CHOOSE_HOUSING_CARDS,
  resolveModalGroups,
  sectionByKey,
  sectionsWithPrefix,
  visibleHousingCards,
} from "../housingContent";

/**
 * The rules that decide what a Housing page shows.
 *
 * These are pure functions on purpose: the arrangement of a popup and the
 * visibility of a gated card are exactly the decisions that should be
 * checkable without a browser.
 */
function section(key: string, extra: Partial<ContentSection> = {}): ContentSection {
  return {
    key,
    title: extra.title ?? key,
    bodyMarkdown: extra.bodyMarkdown ?? "",
    source: extra.source ?? null,
  };
}

function withUrl(key: string, name: string, url: string): ContentSection {
  return section(key, {
    title: name,
    source: { name, url, authorityTier: null, jurisdiction: null },
  });
}

describe("sectionsWithPrefix", () => {
  const sections = [
    section("managed-buildings-intro"),
    section("managed-rentcafe"),
    section("managed-4rent"),
    section("private-kijiji"),
  ];

  it("takes a group's rows and leaves its intro out", () => {
    expect(sectionsWithPrefix(sections, "managed-").map((s) => s.key)).toEqual([
      "managed-rentcafe",
      "managed-4rent",
    ]);
  });

  it("does not leak rows from a neighbouring prefix", () => {
    expect(sectionsWithPrefix(sections, "private-").map((s) => s.key)).toEqual([
      "private-kijiji",
    ]);
  });

  it("returns nothing when the seed has no rows for that group", () => {
    expect(sectionsWithPrefix(sections, "rooms-shared-")).toEqual([]);
  });
});

describe("sectionByKey", () => {
  it("returns null rather than undefined for a missing row", () => {
    expect(sectionByKey([section("a")], "b")).toBeNull();
  });
});

describe("visibleHousingCards", () => {
  it("hides a visa-gated card when the profile is unknown", () => {
    const ids = visibleHousingCards(null).map((c) => c.id);

    // Showing a study-permit resource to someone who is not a student is a
    // worse error than briefly withholding it while /profile loads.
    expect(ids).not.toContain("university-boards");
  });

  it("hides it for a visa type that does not qualify", () => {
    const ids = visibleHousingCards("open_work_permit").map((c) => c.id);
    expect(ids).not.toContain("university-boards");
  });

  it("shows it for a study permit", () => {
    const ids = visibleHousingCards("study_permit").map((c) => c.id);
    expect(ids).toContain("university-boards");
  });

  it("never hides an ungated card", () => {
    const ungated = CHOOSE_HOUSING_CARDS.filter((c) => !c.visaTypes).map((c) => c.id);
    const shown = visibleHousingCards(null).map((c) => c.id);

    expect(shown).toEqual(ungated);
  });

  it("gates by explicit list, so a new card is visible unless it opts in", () => {
    for (const card of CHOOSE_HOUSING_CARDS) {
      if (card.visaTypes) expect(card.visaTypes.length).toBeGreaterThan(0);
    }
  });
});

describe("resolveModalGroups", () => {
  const temporary = CHOOSE_HOUSING_CARDS.find((c) => c.id === "temporary")!;

  it("builds FH-02's groups from the seeded rows", () => {
    const sections = [
      section("temporary-emergency-accommodation", {
        title: "Toronto Shelter System",
        bodyMarkdown: "Emergency accommodation.",
        source: {
          name: "Toronto Shelter System",
          url: "https://toronto.ca/",
          authorityTier: "A",
          jurisdiction: "Toronto",
        },
      }),
      withUrl("temporary-hotel-hostelworld", "Hostelworld", "https://hostelworld.com/"),
      withUrl("temporary-hotel-trivago", "Trivago", "https://trivago.ca/"),
      withUrl("temporary-airbnb", "Airbnb", "https://airbnb.ca/"),
    ];

    const groups = resolveModalGroups(temporary, sections);

    expect(groups.map((g) => g.id)).toEqual(["emergency", "hotels", "airbnb"]);
    expect(groups[0].title).toBe("Toronto Shelter System");
    expect(groups[0].action?.url).toBe("https://toronto.ca/");
    // "Hotels and Hostels" has no row behind it; it is design copy.
    expect(groups[1].title).toBe("Hotels and Hostels");
    expect(groups[1].chipSets[0].links.map((l) => l.name)).toEqual(["Hostelworld"]);
  });

  it("drops a group whose rows are all missing instead of rendering it empty", () => {
    const groups = resolveModalGroups(temporary, [
      withUrl("temporary-airbnb", "Airbnb", "https://airbnb.ca/"),
    ]);

    expect(groups.map((g) => g.id)).toEqual(["airbnb"]);
  });

  it("returns nothing at all when the subcategory has no rows", () => {
    expect(resolveModalGroups(temporary, [])).toEqual([]);
  });

  it("skips a chip whose row has no safe URL", () => {
    const groups = resolveModalGroups(temporary, [
      section("temporary-hotel-hostelworld", { title: "Hostelworld" }),
      withUrl("temporary-hotel-expedia", "Expedia", "https://expedia.ca/"),
    ]);

    const links = groups[0].chipSets.flatMap((s) => s.links).map((l) => l.name);
    expect(links).toEqual(["Expedia"]);
  });

  it("falls back to one group per row for a card with no explicit layout", () => {
    const midTerm = CHOOSE_HOUSING_CARDS.find((c) => c.id === "mid-term")!;
    const groups = resolveModalGroups(midTerm, [
      withUrl("short-term-zumper", "Zumper", "https://zumper.com/"),
      withUrl("short-term-roomies", "Roomies", "https://roomies.ca/"),
    ]);

    expect(groups.map((g) => g.id)).toEqual(["short-term-zumper", "short-term-roomies"]);
  });

  it("does not list a row twice when a card carries two prefixes", () => {
    const longTerm = CHOOSE_HOUSING_CARDS.find((c) => c.id === "long-term")!;
    const groups = resolveModalGroups(longTerm, [
      withUrl("long-term-livrent", "liv.rent", "https://liv.rent/"),
      withUrl("agent-listed-realtor-ca", "Realtor.ca", "https://realtor.ca/"),
    ]);

    const ids = groups.map((g) => g.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

