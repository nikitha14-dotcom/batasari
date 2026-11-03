import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/navigation", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Icon: ({ name }: { name: string }) => <span aria-hidden="true">{name}</span>,
}));

import { ImmigrationPage } from "./ImmigrationPage";

describe("ImmigrationPage", () => {
  it("loads all three sections from the content API and renders official links", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        const section = url.includes("Social+Insurance")
          ? {
              section_key: "required-documents",
              title: "Documents Required",
              body_markdown: "Documents Required",
              source: {
                name: "Required documents - Canada.ca",
                url: "https://www.canada.ca/required-documents",
              },
            }
          : {
              section_key: "resource",
              title: "Ontario newcomer services",
              body_markdown: "Ontario newcomer services",
              source: {
                name: "Get settled in Ontario",
                url: "https://www.ontario.ca/getting-settled",
              },
            };
        return { ok: true, json: async () => ({ sections: [section] }) };
      }),
    );

    render(<ImmigrationPage />);

    expect(screen.getByRole("heading", { name: "Immigration" })).toBeInTheDocument();
    expect(screen.getByText("1. Social Insurance Number (SIN)")).toBeInTheDocument();
    expect(
      screen.getByText("2. Immigration, Refugees and Citizenship Canada (IRCC)"),
    ).toBeInTheDocument();
    expect(screen.getByText("3. Government programs serving immigrants")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Social Insurance Number/ }));
    await waitFor(() =>
      expect(screen.getByRole("link", { name: /Required documents - Canada.ca/i })).toBeInTheDocument(),
    );
    expect(screen.getByRole("link", { name: /Required documents - Canada.ca/i })).toHaveAttribute(
      "target",
      "_blank",
    );
  });

  it("allows a section to collapse without affecting the others", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ sections: [] }) })));
    render(<ImmigrationPage />);

    expect(screen.getAllByRole("button")).toHaveLength(3);
    const button = screen.getByRole("button", { name: /Social Insurance Number/ });
    expect(button).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
    await waitFor(() => expect(screen.getByText(/coming soon/i)).toBeInTheDocument());
    expect(
      screen.getByRole("button", { name: /Immigration, Refugees/ }),
    ).toHaveAttribute("aria-expanded", "false");
  });
});

