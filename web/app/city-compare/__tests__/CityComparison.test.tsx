import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { listIndiaCities } = vi.hoisted(() => ({ listIndiaCities: vi.fn() }));
vi.mock("@/lib/api/india", () => ({ listIndiaCities: () => listIndiaCities() }));

import CityComparison from "../CityComparison";

const CITY_DATA = [
  { name: "Surat", state: "Gujarat", region: "West", languages: ["Gujarati", "Hindi", "English"] },
  { name: "Hyderabad", state: "Telangana", region: "South", languages: ["Telugu", "Urdu", "English", "Hindi"] },
  { name: "Pune", state: "Maharashtra", region: "West", languages: ["Marathi", "Hindi", "English"] },
];

describe("CityComparison", () => {
  beforeEach(() => { listIndiaCities.mockReset(); listIndiaCities.mockResolvedValue(CITY_DATA); });

  it("loads the directory and lets users select up to four cities", async () => {
    render(<CityComparison />);
    const surat = await screen.findByLabelText(/Surat/);
    fireEvent.click(surat);
    fireEvent.click(screen.getByLabelText(/Hyderabad/));
    expect(screen.getByRole("region", { name: /selected city comparison/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /Surat/ })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /Hyderabad/ })).toBeInTheDocument();
  });

  it("shows supported metadata and explicitly marks unsupported metrics", async () => {
    render(<CityComparison />);
    fireEvent.click(await screen.findByLabelText(/Surat/));
    const table = within(screen.getByRole("region", { name: /selected city comparison/i })).getByRole("table");
    expect(within(table).getByText("Gujarat")).toBeInTheDocument();
    expect(within(table).getByText("Gujarati, Hindi, English")).toBeInTheDocument();
    expect(within(table).getAllByText("Not available in verified data").length).toBeGreaterThan(0);
    expect(screen.getByText(/do not estimate rent, living costs, salaries/i)).toBeInTheDocument();
  });

  it("filters cities and enforces the four-city selection limit", async () => {
    listIndiaCities.mockResolvedValue([...CITY_DATA, { name: "Delhi", state: "Delhi", region: "North", languages: ["Hindi"] }, { name: "Kochi", state: "Kerala", region: "South", languages: ["Malayalam"] }]);
    render(<CityComparison />);
    fireEvent.click(await screen.findByLabelText(/Surat/));
    fireEvent.click(screen.getByLabelText(/Hyderabad/));
    fireEvent.click(screen.getByLabelText(/Pune/));
    fireEvent.click(screen.getByLabelText(/Delhi/));
    expect(screen.getByLabelText(/Kochi/)).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/Search by city/i), { target: { value: "Gujarat" } });
    expect(screen.getByLabelText(/Surat/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Hyderabad/)).not.toBeInTheDocument();
  });

  it("shows a recoverable error if the directory request fails", async () => {
    listIndiaCities.mockRejectedValueOnce(new Error("City directory offline"));
    render(<CityComparison />);
    expect(await screen.findByRole("alert")).toHaveTextContent("City directory offline");
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(await screen.findByText(/Surat/)).toBeInTheDocument();
  });

  it("shows a helpful empty state before any city is selected", async () => {
    render(<CityComparison />);
    expect(await screen.findByText(/Your comparison starts here/i)).toBeInTheDocument();
  });
});
