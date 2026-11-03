import { describe, expect, it } from "vitest";

import { cleanName, toAccountDetails, validateDraft, draftFromMetadata } from "../accountDetails";
import { friendlyAuthError, isValidEmail } from "../email";
import { nextStepFor } from "../nextStep";
import { failedRules, isStrongPassword } from "../password";

describe("nextStepFor", () => {
  it.each([
    [null, "/set-password"],
    [{ user_metadata: {} }, "/set-password"],
    [{ user_metadata: { has_password: "true" } }, "/set-password"],
    [{ user_metadata: { has_password: true } }, "/create-account"],
    [{ user_metadata: { has_password: true, first_name: "  " } }, "/create-account"],
    [{ user_metadata: { has_password: true, first_name: "Amy" } }, "/onboarding"],
    [{ user_metadata: { has_password: true, first_name: "Amy", onboarding_completed: true } }, "/housing"],
  ])("%j -> %s", (user, route) => {
    expect(nextStepFor(user)).toBe(route);
  });
});

describe("account details", () => {
  it("collapses whitespace and strips control characters", () => {
    expect(cleanName("  Amy \n\t Lee\u2028 ")).toBe("Amy Lee");
  });

  it("requires a first name and caps every field at 50", () => {
    const long = "x".repeat(51);
    expect(validateDraft({ firstName: " ", lastName: "", displayName: "", productUpdates: false })).toEqual({
      firstName: "Enter your first name.",
    });
    expect(
      Object.keys(validateDraft({ firstName: long, lastName: long, displayName: long, productUpdates: false })),
    ).toEqual(["firstName", "lastName", "displayName"]);
  });

  it("maps a draft to metadata with nulls for blanks", () => {
    expect(toAccountDetails({ firstName: "Amy", lastName: " ", displayName: "", productUpdates: false })).toEqual({
      first_name: "Amy",
      last_name: null,
      display_name: null,
      product_updates_opt_in: false,
    });
  });

  it("ignores non-string metadata when pre-filling", () => {
    expect(draftFromMetadata({ first_name: 5, product_updates_opt_in: "yes" })).toEqual({
      firstName: "",
      lastName: "",
      displayName: "",
      productUpdates: false,
    });
  });
});

describe("email helpers", () => {
  it("accepts ordinary addresses and rejects obvious non-addresses", () => {
    expect(isValidEmail(" a@b.co ")).toBe(true);
    expect(isValidEmail("a@b")).toBe(false);
    expect(isValidEmail("a b@c.co")).toBe(false);
  });

  it("maps known Supabase errors to plain language and passes others through", () => {
    expect(friendlyAuthError(new Error("The pilot is full. ..."), "x")).toMatch(/pilot is full right now/);
    expect(friendlyAuthError(new Error("Signups not allowed for otp"), "x")).toMatch(/closed/);
    expect(friendlyAuthError(new Error("email rate limit exceeded"), "x")).toMatch(/few minutes/);
    expect(friendlyAuthError(new Error("boom"), "x")).toBe("boom");
    expect(friendlyAuthError(null, "fallback")).toBe("fallback");
  });
});

describe("password strength", () => {
  it.each([
    ["Abcdef1!", true],
    ["abcdef1!", false],
    ["ABCDEF1!", false],
    ["Abcdefg!", false],
    ["Abcdefg1", false],
    ["Ab1!", false],
    ["Aa1!" + "x".repeat(70), false],
  ])("%s -> %s", (pw, ok) => {
    expect(isStrongPassword(pw)).toBe(ok);
  });

  it("names exactly the rules that fail", () => {
    expect(failedRules("abc").map((r) => r.id)).toEqual(["length", "upper", "number", "symbol"]);
  });
});

