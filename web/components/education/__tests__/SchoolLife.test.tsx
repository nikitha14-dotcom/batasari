import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("group=schools"),
}));

import { EducationFamilyPageView } from "../EducationFamilyPage";

afterEach(() => vi.unstubAllGlobals());

describe("School Life & Family Decisions", () => {
  it("renders the document topics and unassigned resources from the content API", async () => {
    const topics = Array.from(
      { length: 5 },
      (_, index) =>
        `#### API Topic ${index + 1}\n\nAPI topic ${index + 1} description.`,
    ).join("\n\n");
    const resources = Array.from({ length: 8 }, (_, index) => ({
      section_key: `api-resource-${index + 1}`,
      title: `API Resource ${index + 1}`,
      body_markdown: "",
      source: {
        name: `API Resource ${index + 1}`,
        url: `https://example.test/resource-${index + 1}`,
        authority_tier: "A",
        jurisdiction: "Canada",
      },
    }));

    const fetchMock = vi.fn(async (input: string) => {
      const subcategory = new URL(input).searchParams.get("subcategory");

      if (subcategory === "School Life & Family Decisions") {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            sections: [
              {
                section_key: "document-copy",
                title: "API supplied page title",
                body_markdown: `API supplied introduction.\n\n${topics}`,
                source: null,
              },
              ...resources,
            ],
          }),
        };
      }

      return {
        ok: true,
        status: 200,
        json: async () => ({
          sections: [
            {
              section_key: "document-copy",
              title: subcategory,
              body_markdown: "",
              source: null,
            },
          ],
        }),
      };
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<EducationFamilyPageView />);

    fireEvent.click(
      await screen.findByRole("button", {
        name: "Open API supplied page title",
      }),
    );

    expect(
      await screen.findByRole("heading", {
        name: "API supplied page title",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("API supplied introduction.")).toBeInTheDocument();

    for (let index = 1; index <= 5; index += 1) {
      expect(
        screen.getByRole("button", {
          name: new RegExp(`^API Topic ${index}`),
        }),
      ).toHaveAttribute("aria-expanded", "false");
    }

    fireEvent.click(
      screen.getByRole("button", { name: /^API Topic 2/ }),
    );
    expect(await screen.findByText("API topic 2 description.")).toBeInTheDocument();

    for (let index = 1; index <= 8; index += 1) {
      expect(screen.getByText(`API Resource ${index}`)).toBeInTheDocument();
    }

    expect(
      screen.getByRole("link", {
        name: "Visit API Resource 1 (opens in a new tab)",
      }),
    ).toHaveAttribute("href", "https://example.test/resource-1");

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining(
          "subcategory=School+Life+%26+Family+Decisions",
        ),
        expect.any(Object),
      ),
    );
  });
});

