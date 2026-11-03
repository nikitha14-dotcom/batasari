import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/components/copilot/AICopilot", () => ({
  default: ({ category, subcategory }: { category: string; subcategory: string }) => (
    <aside aria-label="AI Co-Pilot">{category} / {subcategory}</aside>
  ),
}));

vi.mock("@/lib/supabase/RequireSession", () => ({
  RequireSession: ({ children }: { children: ReactNode }) => children,
}));

import CollegesUniversitiesPage from "./page";

afterEach(() => vi.unstubAllGlobals());

describe("CollegesUniversitiesPageContent", () => {
  it("loads Colleges & Universities content and renders API-provided resource URLs", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          sections: [
            {
              section_key: "document-copy",
              title: "Colleges & Universities",
              body_markdown: [
                "#### Understand Your Post-Secondary Options\n\nCollege and university pathways.",
                "#### Find & Compare Colleges, Universities and Programs\n\nCompare programs.",
                "#### Admissions, Eligibility & Cost Planning\n\nPlan for costs.",
                "#### Student Experience, Career & Future Pathways\n\nExplore career outcomes.",
              ].join("\n\n"),
              source: null,
            },
            {
              section_key: "college-university-pathways",
              title: "EduCanada pathways",
              body_markdown: "",
              source: {
                name: "EduCanada pathways",
                url: "https://example.test/pathways",
                authority_tier: "A",
                jurisdiction: "Canada",
              },
            },
            {
              section_key: "osap",
              title: "Ontario student aid",
              body_markdown: "",
              source: {
                name: "Ontario student aid",
                url: "https://example.test/student-aid",
                authority_tier: "A",
                jurisdiction: "Ontario",
              },
            },
          ],
        }),
      })),
    );

    render(<CollegesUniversitiesPage />);

    expect(screen.getByRole("link", { name: "← Back" })).toHaveAttribute("href", "/education-family");
    expect(screen.getByRole("heading", { name: "Colleges & Universities" })).toBeInTheDocument();
    expect(
      await screen.findByRole("button", { name: /Understand Your Post-Secondary Options/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Find & Compare Colleges, Universities and Programs/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Admissions, Eligibility & Cost Planning/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Student Experience, Career & Future Pathways/i })).toBeInTheDocument();

    const pathways = screen.getByRole("link", { name: /Visit EduCanada pathways/i });
    expect(pathways).toHaveAttribute("href", "https://example.test/pathways");
    const studentAid = screen.getByRole("link", { name: /Visit Ontario student aid/i });
    expect(studentAid).toHaveAttribute("href", "https://example.test/student-aid");
    expect(screen.getByRole("complementary", { name: "AI Co-Pilot" })).toHaveTextContent(
      "Education & Family / Colleges & Universities",
    );

    await waitFor(() => {
      const request = new URL((fetch as ReturnType<typeof vi.fn>).mock.calls[0][0]);
      expect(request.searchParams.get("category")).toBe("Education & Family");
      expect(request.searchParams.get("subcategory")).toBe("Colleges & Universities");
    });
  });
});

