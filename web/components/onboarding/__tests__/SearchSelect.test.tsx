import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SearchSelect } from "../SearchSelect";

const INDONESIA = [
  "Indonesia",
  "Jakarta, Indonesia",
  "Bandung, Indonesia",
  "Surabaya, Indonesia",
  "Bali, Indonesia",
];

function renderSearch(props: Partial<Parameters<typeof SearchSelect>[0]> = {}) {
  const onChange = vi.fn();
  const onSelect = vi.fn();

  render(
    <SearchSelect
      value=""
      onChange={onChange}
      onSelect={onSelect}
      suggestions={[]}
      placeholder="Search for a city or country"
      label="City and country you are moving from"
      {...props}
    />,
  );

  return { onChange, onSelect };
}

describe("SearchSelect (ONB-09 .. ONB-09C)", () => {
  // ONB-09: empty search, no suggestion list, no clear button.
  it("shows nothing but the field when empty", () => {
    renderSearch();

    expect(screen.getByPlaceholderText("Search for a city or country")).toBeInTheDocument();
    expect(screen.queryByText("Suggestions")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Clear" })).not.toBeInTheDocument();
  });

  // ONB-09A: typed query reveals the list.
  it("lists suggestions once there is a query", () => {
    renderSearch({ value: "Indo", suggestions: INDONESIA });

    expect(screen.getByText("Suggestions")).toBeInTheDocument();
    expect(screen.getAllByRole("button").filter((b) => b.textContent?.includes("Indo"))).toHaveLength(
      INDONESIA.length,
    );
  });

  // ONB-09B: the matched run renders semibold, the rest regular.
  it("splits each suggestion around the matched text", () => {
    renderSearch({ value: "Indo", suggestions: ["Jakarta, Indonesia"] });

    const match = screen.getByText("Indo");
    expect(match.tagName).toBe("SPAN");
    expect(match.parentElement).toHaveTextContent("Jakarta, Indonesia");
  });

  it("matches case-insensitively", () => {
    renderSearch({ value: "indo", suggestions: ["Indonesia"] });
    expect(screen.getByText("Indo")).toBeInTheDocument();
  });

  it("reports the picked suggestion", () => {
    const { onSelect } = renderSearch({ value: "Indo", suggestions: INDONESIA });

    fireEvent.click(screen.getByRole("button", { name: "Jakarta, Indonesia" }));
    expect(onSelect).toHaveBeenCalledWith("Jakarta, Indonesia");
  });

  // ONB-09C: once the value equals a suggestion the list closes.
  it("hides the list when the value already is a suggestion", () => {
    renderSearch({ value: "Indonesia", suggestions: ["Indonesia"] });
    expect(screen.queryByText("Suggestions")).not.toBeInTheDocument();
  });

  it("hides the list for a query with no matches", () => {
    renderSearch({ value: "Zzzz", suggestions: [] });
    expect(screen.queryByText("Suggestions")).not.toBeInTheDocument();
  });

  it("clears the field from the clear button", () => {
    const { onChange } = renderSearch({ value: "Indo", suggestions: INDONESIA });

    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(onChange).toHaveBeenCalledWith("");
  });

  it("disables the field and its suggestions while saving", () => {
    renderSearch({ value: "Indo", suggestions: ["Indonesia"], disabled: true });

    expect(screen.getByLabelText("City and country you are moving from")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Indonesia" })).toBeDisabled();
  });
});

