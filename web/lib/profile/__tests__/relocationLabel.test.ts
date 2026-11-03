import { describe, expect, it } from "vitest";

import { displayName, relocationLabel } from "../relocationLabel";

const TODAY = new Date(2026, 8, 21); // 21 Sep 2026, local time

describe("relocationLabel", () => {
  it.each([
    [null, null],
    ["", null],
    ["not a date", null],
    ["2026-09-10", "Settling in"],
    ["2026-09-21", "Moving today"],
    ["2026-09-22", "Relocating tomorrow"],
    ["2026-09-26", "Relocating in 5 days"],
    ["2026-10-05", "Relocating in 2 weeks"],
    ["2026-10-21", "Relocating in 1 month"],
    ["2026-12-21", "Relocating in 3 months"],
  ])("%s -> %s", (input, expected) => {
    expect(relocationLabel(input, TODAY)).toBe(expected);
  });

  it("treats a bare date as a local calendar day, not UTC midnight", () => {
    expect(relocationLabel("2026-09-21", new Date(2026, 8, 21, 23, 30))).toBe("Moving today");
  });
});

describe("displayName", () => {
  it("prefers a name in user metadata", () => {
    expect(displayName({ email: "a@b.com", user_metadata: { full_name: "Maple Li" } })).toBe("Maple Li");
  });

  it("falls back to the email's local part", () => {
    expect(displayName({ email: "maple@example.com", user_metadata: {} })).toBe("maple");
  });

  it("returns null with no user", () => {
    expect(displayName(null)).toBeNull();
  });
});

