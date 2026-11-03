import { render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams("group=childcare"),
}));

import { EducationFamilyPageView } from "../EducationFamilyPage";

afterEach(() => vi.unstubAllGlobals());

describe("EducationFamilyPageView", () => {
  it("renders all Education & Family content with the shared accordion UI", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string) => {
        const subcategory = new URL(input).searchParams.get("subcategory");
        const sections =
          subcategory === "Understand Childcare in Canada"
            ? [
                {
                  section_key: "document-copy",
                  title: "Understand Childcare in Canada",
                  body_markdown:
                    "### Childcare Centres\n\n[Ontario childcare rules](https://www.ontario.ca/page/child-care-rules-ontario)",
                  source: null,
                },
                {
                  section_key: "ontario-childcare-rules",
                  title: "Ontario — Childcare Rules",
                  body_markdown: "",
                  source: {
                    name: "Ontario — Childcare Rules",
                    url: "https://www.ontario.ca/page/child-care-rules-ontario",
                    authority_tier: "A",
                    jurisdiction: "Ontario",
                  },
                },
              ]
            : subcategory === "Understand Schools in Canada"
            ? [
                {
                  section_key: "document-copy",
                  title: "Understand Schools in Canada",
                  body_markdown:
                    "#### How Canadian System Works\n\n##### Province / Territory\n\nExact database detail.\n\n##### School Board / District\n\nLocal school-board detail.\n\n#### School Levels & Grades\n\n**Kindergarten**\n\nKindergarten detail.\n\n**Elementary / Primary School**\n\nElementary detail.",
                  source: null,
                },
              ]
            : [];
        return { ok: true, status: 200, json: async () => ({ sections }) };
      }),
    );

    render(<EducationFamilyPageView />);

    // With group=childcare (from the useSearchParams mock), only the Child Care group renders
    expect(screen.getByRole("heading", { name: "Child Care" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Schools in Canada" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "Colleges & Universities" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "ESL Classes" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "Trade Schools & Certifications" })).toBeNull();

    // The 4 Child Care subcategory accordions are present and collapsed by default
    // except the first which auto-opens (defaultOpen behaviour)
    const firstSection = screen.getByRole("button", { name: /Understand Childcare in Canada/i });
    expect(firstSection).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: /Find and Compare Childcare/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Costs and Financial Support/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Apply and Prepare/i })).toBeInTheDocument();

    // All 4 accordion buttons carry aria-expanded
    expect(screen.getAllByRole("button").filter((button) => button.hasAttribute("aria-expanded"))).toHaveLength(4);

    const childcareLink = await screen.findByRole("link", { name: "Ontario childcare rules" });
    expect(childcareLink).toHaveAttribute("href", "https://www.ontario.ca/page/child-care-rules-ontario");
    const childcareButton = screen.getByRole("link", {
      name: /Visit Ontario — Childcare Rules \(opens in a new tab\)/,
    });
    expect(childcareButton).toHaveAttribute("href", "https://www.ontario.ca/page/child-care-rules-ontario");
    expect(within(childcareButton).getByText("Visit Website")).toBeInTheDocument();

    // 4 content requests (one per childcare subcategory), plus the copilot's saved-history load.
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(5));
  });
});

