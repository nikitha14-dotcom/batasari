import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.ComponentProps<"a">) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

import MovePlanner from "../MovePlanner";

describe("Batasari move planner", () => {
  beforeEach(() => localStorage.clear());

  it("renders move details, budget and checklist", () => {
    render(<MovePlanner />);
    expect(screen.getByRole("heading", { name: /a calmer move/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/moving to/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /build your moving budget/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /your moving checklist/i })).toBeInTheDocument();
  });

  it("updates checklist progress and saves the plan locally", async () => {
    render(<MovePlanner />);
    fireEvent.click(screen.getByLabelText(/confirm your moving date/i));
    expect(screen.getByText("8%")).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: /save my plan/i })[0]);
    expect(await screen.findByRole("status")).toHaveTextContent(/saved on this device/i);
    expect(localStorage.getItem("batasari-planner-v1")).toContain("date");
  });
});
