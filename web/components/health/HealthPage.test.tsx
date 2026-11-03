import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/navigation", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { HealthPage } from "./HealthPage";

const responseFor = (section: string) => {
  if (section.includes("Healthcare+in+Ontario")) {
    return {
      sections: [
        {
          section_key: "ohip-coverage",
          title: "What OHIP Covers",
          body_markdown: "OHIP covers medically necessary physician and hospital services.",
          source: { name: "What OHIP covers", url: "https://www.ontario.ca/page/ohip" },
        },
      ],
    };
  }
  if (section.includes("Additional+healthcare+insurance")) {
    return {
      sections: [
        {
          section_key: "document-copy",
          title: "Additional healthcare insurance",
          body_markdown: "* Students: [uhip.ca](https://uhip.ca/get-started/)\n* Major private insurance companies: [Sun Life](https://www.sunlife.ca/en/)",
          source: null,
        },
        {
          section_key: "uhip",
          title: "Students",
          body_markdown: "",
          source: { name: "University Health Insurance Plan", url: "https://uhip.ca/get-started/" },
        },
        {
          section_key: "ifhp",
          title: "Refugees and Protected Persons",
          body_markdown: "",
          source: { name: "Interim Federal Health Program", url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/refugees/help-within-canada/health-care.html" },
        },
        {
          section_key: "sun-life",
          title: "Sun Life",
          body_markdown: "",
          source: { name: "Sun Life health insurance", url: "https://www.sunlife.ca/en/" },
        },
      ],
    };
  }
  if (section.includes("Medical+services+and+mental+health+support")) {
    const source = (name: string, url: string) => ({ name, url });
    return {
      sections: [
        { section_key: "uhn", title: "University Health Network", body_markdown: "", source: source("University Health Network", "https://www.uhn.ca/") },
        { section_key: "walk-in-clinics", title: "Walk-in Clinics", body_markdown: "", source: source("Toronto Central Healthline", "https://www.torontocentralhealthline.ca/listservices.aspx?id=10072") },
        { section_key: "health-811", title: "HealthLink", body_markdown: "HealthLink is a 24/7 medical hotline available at 811.", source: null },
        { section_key: "camh-crisis", title: "Mental Health Hotline", body_markdown: "", source: source("CAMH crisis resources", "https://www.camh.ca/en/health-info/crisis-resources") },
      ],
    };
  }
  return { sections: [] };
};

describe("HealthPage", () => {
  it("starts collapsed, opens one section, and renders API resources", async () => {
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => ({
      ok: true,
      json: async () => responseFor(String(input)),
    })));

    render(<HealthPage />);
    const headings = [
      "Healthcare in Ontario",
      "Additional healthcare insurance",
      "Finding a family doctor or nurse practitioner",
      "Medical services and mental health support",
    ];
    expect(headings).toHaveLength(4);
    const first = screen.getByRole("button", { name: /Healthcare in Ontario/ });
    expect(first).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(first);
    expect(first).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: /Additional healthcare insurance/ })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    await waitFor(() => expect(screen.getByRole("link", { name: /What OHIP covers/i })).toHaveAttribute("target", "_blank"));

    fireEvent.click(screen.getByRole("button", { name: /Additional healthcare insurance/ }));
    expect(first).toHaveAttribute("aria-expanded", "false");
    await waitFor(() => expect(screen.getByRole("heading", { name: "Students" })).toBeInTheDocument());
  });

  it("groups insurance resources without repeating the document-copy links", async () => {
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => ({
      ok: true,
      json: async () => responseFor(String(input)),
    })));

    render(<HealthPage />);
    fireEvent.click(screen.getByRole("button", { name: /Additional healthcare insurance/ }));

    await waitFor(() => expect(screen.getByRole("link", { name: /UHIP health insurance for students/i })).toBeInTheDocument());
    expect(screen.getAllByRole("link", { name: /UHIP health insurance for students/i })).toHaveLength(1);
    expect(screen.getByRole("heading", { name: "Major Private Insurance Companies" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /health insurance options from Sun Life/i })).toBeInTheDocument();
    expect(screen.queryByText("uhip.ca")).not.toBeInTheDocument();
  });

  it("shows an API error and supports retry", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 503 })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ sections: [] }) });
    vi.stubGlobal("fetch", fetchMock);

    render(<HealthPage />);
    fireEvent.click(screen.getByRole("button", { name: /Healthcare in Ontario/ }));
    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(screen.getByText(/coming soon/i)).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("groups medical services into hospitals, clinics, HealthLink, and mental health", async () => {
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => ({
      ok: true,
      json: async () => responseFor(String(input)),
    })));

    render(<HealthPage />);
    fireEvent.click(screen.getByRole("button", { name: /Medical services and mental health support/ }));

    await waitFor(() => expect(screen.getByRole("heading", { name: "Major Hospitals" })).toBeInTheDocument());
    expect(screen.getByRole("heading", { name: "Walk-in Clinics" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "HealthLink" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Mental Health Support" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Call 811 for 24\/7 health advice/i })).toHaveAttribute("href", "tel:811");
    expect(screen.getByRole("link", { name: /mental health crisis resources/i })).toHaveAttribute("target", "_blank");
  });
});

