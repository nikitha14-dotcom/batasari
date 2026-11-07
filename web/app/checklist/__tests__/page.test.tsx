import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import ChecklistPage from "../page";

describe("Batasari moving checklist", () => {
  it("renders practical moving tasks grouped by stage", () => {
    render(<ChecklistPage />);
    expect(screen.getByRole("heading", { level: 1, name: "One step at a time." })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Before the move" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Packing and logistics" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Moving day" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "After arrival" })).toBeInTheDocument();
    expect(screen.getByLabelText("Create a moving budget in ₹ INR")).toBeInTheDocument();
    expect(screen.getByText(/tasks complete/)).toBeInTheDocument();
  });
});
