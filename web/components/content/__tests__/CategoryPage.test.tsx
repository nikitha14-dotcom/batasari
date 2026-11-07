import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  notFound: vi.fn(),
}));

import { CategoryPageView } from "../CategoryPage";
import { getCategoryBySlug } from "@/lib/content/categories";

type Section = Record<string, unknown>;

/** Fake GET /content: a map of subcategory -> rows; anything else is empty. */
function stubContent(bySub: Record<string, Section[] | "fail">) {
  const fn = vi.fn(async (input: string) => {
    const sub = new URL(input).searchParams.get("subcategory") ?? "";
    const rows = bySub[sub];
    if (rows === "fail") return { ok: false, status: 500, json: async () => ({}) };
    return { ok: true, json: async () => ({ sections: rows ?? [] }) };
  });
  vi.stubGlobal("fetch", fn);
  return fn;
}

afterEach(() => vi.unstubAllGlobals());

const health = getCategoryBySlug("health")!;
const [first, second] = health.subcategories;

describe("CategoryPageView", () => {
  it("requests every subcategory of the category from GET /content", async () => {
    const fetchMock = stubContent({});
    render(<CategoryPageView config={health} />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(health.subcategories.length));
    const requested = fetchMock.mock.calls.map((c) => new URL(c[0] as string).searchParams);
    expect(requested.every((p) => p.get("category") === "Health")).toBe(true);
    expect(requested.map((p) => p.get("subcategory"))).toEqual([...health.subcategories]);
  });

  it("renders description, tip, cards, markdown and source from the API", async () => {
    stubContent({
      [first]: [
        { section_key: "description", title: first, body_markdown: "Seeded intro text." },
        { section_key: "tip", title: "Tip", body_markdown: "Seeded tip text." },
        {
          section_key: "ohip",
          title: "Apply for OHIP",
          body_markdown: "Bring **proof of address**.\n\n- Passport\n- Lease",
          source: {
            name: "ServiceOntario",
            url: "https://www.ontario.ca/page/apply-ohip-and-get-health-card",
            authority_tier: "A",
            jurisdiction: "Ontario",
          },
        },
      ],
    });
    render(<CategoryPageView config={health} />);

    expect(await screen.findByText("Seeded intro text.")).toBeInTheDocument();
    expect(screen.getByText("Seeded tip text.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Apply for OHIP" })).toBeInTheDocument();
    expect(screen.getByText("proof of address").tagName).toBe("STRONG");
    expect(screen.getByText("Passport").tagName).toBe("LI");
    expect(screen.getByText("Visit Website")).toBeInTheDocument();

    const link = screen.getByRole("link", { name: /visit serviceontario/i });
    expect(link).toHaveAttribute("href", "https://www.ontario.ca/page/apply-ohip-and-get-health-card");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("does not repeat the subcategory title inside a document-copy row", async () => {
    stubContent({
      [first]: [
        {
          section_key: "document-copy",
          title: first,
          body_markdown: "Exact document content.",
        },
      ],
    });

    render(<CategoryPageView config={health} />);

    expect(await screen.findByText("Exact document content.")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: first })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: new RegExp(escape(first)) })).toBeInTheDocument();
  });

  it("shows 'coming soon' for a subcategory with no rows yet", async () => {
    stubContent({});
    render(<CategoryPageView config={health} />);
    expect(await screen.findByText(/coming soon/i)).toBeInTheDocument();
  });

  it("shows an error with a retry that re-requests only that subcategory", async () => {
    let fail = true;
    const fetchMock = vi.fn(async (input: string) => {
      const sub = new URL(input).searchParams.get("subcategory");
      if (sub === first && fail) return { ok: false, status: 500, json: async () => ({}) };
      return {
        ok: true,
        json: async () => ({
          sections: sub === first ? [{ section_key: "x", title: "Recovered card", body_markdown: "" }] : [],
        }),
      };
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<CategoryPageView config={health} />);
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/500/);

    fail = false;
    fireEvent.click(within(alert).getByRole("button", { name: /try again/i }));
    expect(await screen.findByRole("heading", { name: "Recovered card" })).toBeInTheDocument();
  });

  it("opens only the first subcategory by default and toggles others", async () => {
    stubContent({ [second]: [{ section_key: "y", title: "Second card", body_markdown: "" }] });
    render(<CategoryPageView config={health} />);

    const secondHeader = screen.getByRole("button", { name: new RegExp(escape(second)) });
    expect(secondHeader).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("heading", { name: "Second card" })).not.toBeInTheDocument();

    fireEvent.click(secondHeader);
    expect(secondHeader).toHaveAttribute("aria-expanded", "true");
    expect(await screen.findByRole("heading", { name: "Second card" })).toBeInTheDocument();
  });

  it("does not render a javascript: link from seeded markdown", async () => {
    stubContent({
      [first]: [{ section_key: "x", title: "Card", body_markdown: "[click](javascript:alert(1))" }],
    });
    render(<CategoryPageView config={health} />);
    const text = await screen.findByText("click");
    expect(text.closest("a")?.getAttribute("href") ?? "").not.toMatch(/javascript:/i);
  });

  it("shows the official-sources notice on Immigration only", async () => {
    stubContent({});
    const { unmount } = render(<CategoryPageView config={getCategoryBySlug("immigration")!} />);
    expect(screen.getByRole("note")).toHaveTextContent(/official source/i);
    unmount();

    render(<CategoryPageView config={health} />);
    expect(screen.queryByRole("note")).not.toBeInTheDocument();
  });

  it("has no AI copilot on these pages", () => {
    stubContent({});
    render(<CategoryPageView config={health} />);
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByText(/copilot/i)).not.toBeInTheDocument();
  });

  it("hides the Visit button when the source has no safe URL", async () => {
    stubContent({
      [first]: [
        { section_key: "x", title: "No link", body_markdown: "", source: { name: "S", url: "javascript:alert(1)" } },
      ],
    });
    render(<CategoryPageView config={health} />);
    expect(await screen.findByRole("heading", { name: "No link" })).toBeInTheDocument();
    expect(screen.queryByText("Visit Website")).not.toBeInTheDocument();
  });

  it("marks the current category in the sidebar", () => {
    stubContent({});
    render(<CategoryPageView config={health} />);
    const nav = screen.getByRole("navigation", { name: "Categories" });
    expect(within(nav).getByRole("link", { name: "Stay & documents" })).toHaveAttribute("href", "/immigration");
  });
});

function escape(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

