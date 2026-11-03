import { describe, expect, it } from "vitest";

import starterQuestions, {
  defaultStarterQuestions,
  educationFamilyStarterQuestions,
  financeStarterQuestions,
  workStarterQuestions,
} from "../starterQuestions";

describe("defaultStarterQuestions", () => {
  it("returns each category's own questions", () => {
    expect(defaultStarterQuestions("Finance")).toBe(financeStarterQuestions);
    expect(defaultStarterQuestions("Education & Family")).toBe(educationFamilyStarterQuestions);
    expect(defaultStarterQuestions("Work")).toBe(workStarterQuestions);
  });

  it("falls back to the Housing set for any other category", () => {
    expect(defaultStarterQuestions("Housing")).toBe(starterQuestions);
    expect(defaultStarterQuestions("Health")).toBe(starterQuestions);
    expect(defaultStarterQuestions(undefined)).toBe(starterQuestions);
  });

  it("uses the wording the team asked for", () => {
    expect(financeStarterQuestions[0].title).toBe(
      "What documentation is required to open a bank account in Toronto?",
    );
    expect(financeStarterQuestions[1].title).toBe(
      "What steps can I take to build a Canadian credit history from scratch?",
    );
    expect(educationFamilyStarterQuestions[0].title).toBe(
      "How do I enroll my child in a public school in Ontario after moving from another country?",
    );
    expect(educationFamilyStarterQuestions[1].title).toBe(
      "How can I find licensed childcare and learn about childcare subsidies in Toronto?",
    );
  });
});
