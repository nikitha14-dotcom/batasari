import { describe, expect, it } from "vitest";

import { MAX_CHILDREN, MAX_HOUSEHOLD_OTHER, MAX_OTHER_TEXT } from "../limits";
import { EMPTY_DRAFT, EMPTY_PROFILE, toDraft, type Draft } from "../profile";
import { CLEAR_ALL_PATCH, STEPS, togglePet } from "../steps";

function draft(overrides: Partial<Draft> = {}): Draft {
  return { ...EMPTY_DRAFT, ...overrides };
}

const byId = Object.fromEntries(STEPS.map((step) => [step.id, step]));

describe("the step strategies", () => {
  it("covers ONB-05 through ONB-10 in order", () => {
    expect(STEPS.map((step) => step.id)).toEqual([
      "move_date",
      "visa",
      "household",
      "pets",
      "city_country",
      "accommodation",
    ]);
  });

  /*
   * The page renders whichever strategy the index selects and knows nothing
   * else about a step. A step missing any of these is a step the page cannot
   * drive — this is the contract that replaced three parallel switches.
   */
  it("gives every step a question, a completion rule, a patch and a skip", () => {
    for (const step of STEPS) {
      expect(step.question.length).toBeGreaterThan(0);
      expect(typeof step.isComplete).toBe("function");
      expect(typeof step.toPatch).toBe("function");
      expect(Object.keys(step.skipPatch).length).toBeGreaterThan(0);
    }
  });

  it("starts with nothing complete", () => {
    for (const step of STEPS) {
      expect(step.isComplete(EMPTY_DRAFT)).toBe(false);
    }
  });

  // Figma shows "Start from scratch" on ONB-09 and ONB-10 only.
  it("offers a restart only on the last two steps", () => {
    expect(STEPS.filter((step) => step.offersRestart).map((step) => step.id)).toEqual([
      "city_country",
      "accommodation",
    ]);
  });

  /*
   * "Start from scratch" resets the server too. Anything missing from this
   * body is an answer that survives the reset and comes back on reload — and
   * keeps feeding the assistant's prompt in the meantime.
   */
  it("clears every field any step can write", () => {
    const written = new Set<string>();
    for (const step of STEPS) {
      Object.keys(step.toPatch(draft())).forEach((field) => written.add(field));
    }

    for (const field of written) {
      expect(CLEAR_ALL_PATCH).toHaveProperty(field, null);
    }
  });

  it("clears only fields the profile actually has", () => {
    for (const field of Object.keys(CLEAR_ALL_PATCH)) {
      expect(EMPTY_PROFILE).toHaveProperty(field);
    }
  });
});

describe("household (ONB-07)", () => {
  const household = byId.household;

  it("accepts a plain answer with nothing else needed", () => {
    expect(household.isComplete(draft({ household: "solo" }))).toBe(true);
  });

  it("needs an age for every child before it is complete", () => {
    expect(household.isComplete(draft({ household: "family", childCount: 0 }))).toBe(false);
    expect(
      household.isComplete(draft({ household: "family", childCount: 2, childAges: ["10", ""] })),
    ).toBe(false);
    expect(
      household.isComplete(draft({ household: "family", childCount: 2, childAges: ["10", "18"] })),
    ).toBe(true);
  });

  // The new "Other": name who else is moving — brother, sister, father...
  it("needs the free text before Other is complete", () => {
    expect(household.isComplete(draft({ household: "other" }))).toBe(false);
    expect(household.isComplete(draft({ household: "other", householdOther: "   " }))).toBe(false);
    expect(
      household.isComplete(draft({ household: "other", householdOther: "brother, sister" })),
    ).toBe(true);
  });

  it("sends the free text only for Other", () => {
    const withText = draft({ household: "solo", householdOther: "brother" });
    expect(household.toPatch(withText).household_other).toBeNull();

    const asOther = draft({ household: "other", householdOther: " brother, sister " });
    expect(household.toPatch(asOther).household_other).toBe("brother, sister");
  });

  it("sends child ages only for Family with kids", () => {
    const asOther = draft({ household: "other", householdOther: "x", childCount: 2, childAges: ["1", "2"] });
    expect(household.toPatch(asOther).children_ages).toBeNull();

    const asFamily = draft({ household: "family", childCount: 2, childAges: ["10", "18"] });
    expect(household.toPatch(asFamily).children_ages).toEqual([10, 18]);
  });

  it("ignores ages typed beyond the current child count", () => {
    const shrunk = draft({ household: "family", childCount: 1, childAges: ["10", "18", "3"] });
    expect(household.toPatch(shrunk).children_ages).toEqual([10]);
  });
});

describe("free-text caps", () => {
  it("gives the household list more room than a one-word label", () => {
    expect(MAX_HOUSEHOLD_OTHER).toBeGreaterThan(MAX_OTHER_TEXT);
  });

  it("keeps the child cap in step with the stepper", () => {
    expect(MAX_CHILDREN).toBe(10);
  });
});

describe("togglePet", () => {
  it("treats No pets as exclusive in both directions", () => {
    expect(togglePet(["dog", "cat"], "no_pets")).toEqual(["no_pets"]);
    expect(togglePet(["no_pets"], "dog")).toEqual(["dog"]);
  });

  it("deselects a repeated choice", () => {
    expect(togglePet(["dog"], "dog")).toEqual([]);
    expect(togglePet(["no_pets"], "no_pets")).toEqual([]);
  });

  it("accumulates ordinary choices", () => {
    expect(togglePet(null, "dog")).toEqual(["dog"]);
    expect(togglePet(["dog"], "cat")).toEqual(["dog", "cat"]);
  });
});

describe("toDraft", () => {
  it("distinguishes a skipped pets question from No pets", () => {
    expect(toDraft({ ...EMPTY_PROFILE, pets: null }).pets).toBeNull();
    expect(toDraft({ ...EMPTY_PROFILE, pets: [] }).pets).toEqual(["no_pets"]);
    expect(toDraft({ ...EMPTY_PROFILE, pets: ["dog"] }).pets).toEqual(["dog"]);
  });

  it("restores the child count from the saved ages", () => {
    const restored = toDraft({ ...EMPTY_PROFILE, children_ages: [10, 18] });
    expect(restored.childCount).toBe(2);
    expect(restored.childAges).toEqual(["10", "18"]);
  });

  it("restores the household free text", () => {
    const restored = toDraft({
      ...EMPTY_PROFILE,
      household_type: "other",
      household_other: "brother, sister",
    });
    expect(restored.household).toBe("other");
    expect(restored.householdOther).toBe("brother, sister");
  });
});

