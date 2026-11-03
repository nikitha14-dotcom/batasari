import { describe, expect, it } from "vitest";

import { suggestPlaces } from "../places";

describe("suggestPlaces (ONB-09)", () => {
  it("returns nothing for an empty or whitespace query", () => {
    expect(suggestPlaces("")).toEqual([]);
    expect(suggestPlaces("   ")).toEqual([]);
  });

  /*
   * ONB-09B shows Indonesia above the four Indonesian cities. Countries are
   * listed first and prefix matches outrank substring matches, which is what
   * produces that exact order.
   */
  it("reproduces the ordering in the Figma frame", () => {
    expect(suggestPlaces("Indo")).toEqual([
      "Indonesia",
      "Jakarta, Indonesia",
      "Bandung, Indonesia",
      "Surabaya, Indonesia",
      "Bali, Indonesia",
    ]);
  });

  it("ignores case", () => {
    expect(suggestPlaces("indo")).toEqual(suggestPlaces("INDO"));
  });

  it("caps the list so it cannot overflow the card", () => {
    expect(suggestPlaces("a").length).toBeLessThanOrEqual(5);
    expect(suggestPlaces("a", 3)).toHaveLength(3);
  });

  it("matches a city name on its own", () => {
    expect(suggestPlaces("Jakar")).toContain("Jakarta, Indonesia");
  });

  it("returns nothing for a query that matches no place", () => {
    expect(suggestPlaces("zzzzzz")).toEqual([]);
  });

  it("trims the query before matching", () => {
    expect(suggestPlaces("  Toronto ")).toContain("Toronto, Canada");
  });
});

