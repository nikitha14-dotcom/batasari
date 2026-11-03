import { describe, expect, it } from "vitest";

import { dateError, identityFromUser, normalizeEmail, questionOtherValue, questionValue, validateIdentity } from "../profileEdit";

describe("profile edit validation", () => {
  it("requires only first name and email", () => {
    expect(validateIdentity({ firstName: "", lastName: "", displayName: "", email: "" })).toEqual({
      firstName: "First name is required.",
      email: "Email is required.",
    });
  });

  it("rejects malformed email but allows optional names", () => {
    expect(validateIdentity({ firstName: "Olivia", lastName: "", displayName: "", email: "bad" }).email)
      .toBe("Enter a valid email address.");
  });

  it("rejects impossible dates", () => {
    expect(dateError("2026-02-31")).toBe("Enter a real calendar date.");
    expect(dateError("2026-02-20")).toBeNull();
  });

  it("maps API session metadata into the editable identity", () => {
    expect(identityFromUser({ email: "olivia@example.com", user_metadata: { first_name: "Olivia" } }))
      .toEqual({ firstName: "Olivia", lastName: "", displayName: "", email: "olivia@example.com" });
  });

  it("uses the Auth email instead of a stale metadata email", () => {
    expect(identityFromUser({
      email: "quietthinker@example.com",
      user_metadata: { email: "old@example.com" },
    }).email).toBe("quietthinker@example.com");
  });

  it("normalizes email comparisons", () => {
    expect(normalizeEmail("  New@Example.COM ")).toBe("new@example.com");
  });

  it("keeps an explicit no-pets answer selected", () => {
    expect(questionValue({ pets: [] }, "pets")).toBe("none");
    expect(questionValue({ pets: null }, "pets")).toBe("");
  });

  it("restores free-text values for Other answers", () => {
    expect(questionOtherValue({ household_other: "sister, brother" }, "household_type")).toBe("sister, brother");
    expect(questionOtherValue({ pets_other: "parrot" }, "pets")).toBe("parrot");
  });
});

