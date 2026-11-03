import { describe, expect, it } from "vitest";

import { fullName, handle, initials, timelineLabel } from "../accountSummary";

const TODAY = new Date(2026, 8, 23); // 23 Sep 2026

describe("fullName", () => {
  it("prefers full_name", () => {
    expect(fullName({ user_metadata: { full_name: "Olivia Sterling", first_name: "O" } })).toBe(
      "Olivia Sterling",
    );
  });

  it("joins first and last when there is no full name", () => {
    expect(fullName({ user_metadata: { first_name: "Olivia", last_name: "Sterling" } })).toBe(
      "Olivia Sterling",
    );
  });

  it("accepts a first name alone", () => {
    expect(fullName({ user_metadata: { first_name: "Olivia" } })).toBe("Olivia");
  });

  it("is null when there is no name at all", () => {
    expect(fullName({ email: "someone@example.com" })).toBeNull();
    expect(fullName(null)).toBeNull();
  });

  it("ignores blank metadata", () => {
    expect(fullName({ user_metadata: { full_name: "   " } })).toBeNull();
  });
});

describe("handle", () => {
  it("prefixes the display name with @", () => {
    expect(handle({ user_metadata: { display_name: "Maple" } })).toBe("@Maple");
  });

  it("is null without one", () => {
    expect(handle({ user_metadata: {} })).toBeNull();
  });
});

describe("initials", () => {
  it("uses first and last initial", () => {
    expect(initials({ user_metadata: { first_name: "Olivia", last_name: "Sterling" } })).toBe("OS");
  });

  it("uses the first two letters of a single name", () => {
    expect(initials({ user_metadata: { first_name: "Olivia" } })).toBe("OL");
  });

  it("falls back to the email", () => {
    expect(initials({ email: "someone@example.com" })).toBe("S");
  });

  it("never renders undefined", () => {
    expect(initials(null)).toBe("-");
    expect(initials({})).toBe("-");
  });
});

describe("timelineLabel", () => {
  it("appends the move month and year", () => {
    expect(timelineLabel("2026-10-20", TODAY)).toBe("Relocating in 1 month (Oct 2026)");
  });

  it("is null when there is no move date", () => {
    expect(timelineLabel(null, TODAY)).toBeNull();
    expect(timelineLabel(undefined, TODAY)).toBeNull();
  });

  it("is null for an unparseable date", () => {
    expect(timelineLabel("soon", TODAY)).toBeNull();
  });

  it("does not claim a future month for a past move", () => {
    expect(timelineLabel("2026-08-01", TODAY)).toBe("Settling in (Aug 2026)");
  });
});

