import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { FOOTER_ITEMS, NAV_ITEMS, SidebarNav } from "../SidebarNav";

afterEach(cleanup);

describe("Batasari SidebarNav", () => {
  it("renders the current primary navigation in order", () => {
    render(<SidebarNav activeHref="/city-compare" />);
    const nav = screen.getByRole("navigation", { name: "Categories" });
    expect(within(nav).getAllByRole("link").map((link) => [
      link.textContent?.trim(),
      link.getAttribute("href"),
    ])).toEqual(NAV_ITEMS.map((item) => [item.label, item.href]));
    expect(NAV_ITEMS).toHaveLength(6);
    expect(within(nav).getByRole("link", { name: "Compare cities" })).toHaveAttribute("aria-current", "page");
  });

  it("renders the support links below the divider", () => {
    render(<SidebarNav />);
    const support = screen.getByRole("navigation", { name: "Support" });
    expect(within(support).getAllByRole("link").map((link) => link.getAttribute("href")))
      .toEqual(FOOTER_ITEMS.map((item) => item.href));
    expect(within(support).getByRole("link", { name: "FAQ" })).toHaveAttribute("href", "/help");
    expect(within(support).getByRole("link", { name: "Privacy Statement" })).toHaveAttribute("href", "/privacy-statement");
    expect(within(support).getByRole("link", { name: "Contact Support" })).toHaveAttribute("href", "/contact-us");
    expect(within(support).getByRole("link", { name: "Feedback" })).toHaveAttribute("href", "/feedback");
  });

  it("marks only the requested primary route as current", () => {
    render(<SidebarNav activeHref="/checklist" />);
    const current = screen.getAllByRole("link").filter((link) => link.getAttribute("aria-current") === "page");
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveTextContent("Checklist");
  });

  it("does not mark a route active when no active href is supplied", () => {
    render(<SidebarNav />);
    expect(screen.getAllByRole("link").some((link) => link.hasAttribute("aria-current"))).toBe(false);
  });
});
