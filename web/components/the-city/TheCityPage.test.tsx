import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/navigation", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { TheCityPage } from "./TheCityPage";

const source = (name: string, url: string) => ({ name, url });

function responseFor(input: RequestInfo | URL) {
  const request = decodeURIComponent(String(input)).replace(/\+/g, " ");
  if (request.includes("The City: Toronto at a Glance")) {
    return { sections: [{ section_key: "document-copy", title: "The City: Toronto at a Glance", body_markdown: "Toronto is Canada’s largest, most culturally diverse economic hub.", source: null }] };
  }
  if (request.includes("Cost & Lifestyle Comparison for Different Cities")) {
    return {
      sections: [
        { section_key: "cmhc-rental-reports", title: "Rental Market Reports", body_markdown: "", source: source("CMHC Rental Market Reports", "https://www.cmhc-schl.gc.ca/reports") },
        { section_key: "statistics-canada-cpi", title: "Consumer Price Index", body_markdown: "", source: source("Statistics Canada CPI", "https://www150.statcan.gc.ca/cpi") },
        { section_key: "bestplaces", title: "BestPlaces", body_markdown: "", source: source("BestPlaces", "https://www.bestplaces.net/") },
        { section_key: "numbeo", title: "Numbeo", body_markdown: "", source: source("Numbeo", "https://www.numbeo.com/cost-of-living/") },
        { section_key: "expatistan", title: "Expatistan", body_markdown: "", source: source("Expatistan", "https://www.expatistan.com/") },
      ],
    };
  }
  return { sections: [] };
}

describe("TheCityPage", () => {
  it("starts collapsed and toggles the Toronto overview open and closed", async () => {
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => ({ ok: true, json: async () => responseFor(input) })));

    render(<TheCityPage />);
    const first = screen.getByRole("button", { name: /Toronto at a Glance/ });
    expect(first).toHaveAttribute("aria-expanded", "false");
    expect(screen.getAllByRole("button")).toHaveLength(6);

    fireEvent.click(first);
    await waitFor(() => expect(screen.getByText(/Canada’s largest/)).toBeInTheDocument());
    expect(first).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(first);
    expect(first).toHaveAttribute("aria-expanded", "false");
  });

  it("keeps only one topic open and groups cost resources", async () => {
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => ({ ok: true, json: async () => responseFor(input) })));

    render(<TheCityPage />);
    const cost = screen.getByRole("button", { name: /Cost & Lifestyle Comparison/ });
    const people = screen.getByRole("button", { name: /People and Communities/ });
    fireEvent.click(cost);
    await waitFor(() => expect(screen.getByRole("heading", { name: "Useful Resources" })).toBeInTheDocument());
    expect(screen.getByRole("heading", { name: "Direct cost-of-living comparisons for different cities" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "CMHC rental market report" })).toHaveAttribute("target", "_blank");
    fireEvent.click(people);
    expect(cost).toHaveAttribute("aria-expanded", "false");
    expect(people).toHaveAttribute("aria-expanded", "true");
  });

  it("shows API failures and retries into the empty state", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 503 })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ sections: [] }) });
    vi.stubGlobal("fetch", fetchMock);

    render(<TheCityPage />);
    fireEvent.click(screen.getByRole("button", { name: /Toronto at a Glance/ }));
    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(screen.getByText(/coming soon/i)).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

