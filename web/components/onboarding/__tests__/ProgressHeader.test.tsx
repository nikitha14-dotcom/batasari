import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ProgressHeader } from "../ProgressHeader";

describe("ProgressHeader", () => {
  it("announces the position in the flow", () => {
    render(
      <ProgressHeader
        step={2}
        stepCount={6}
        question="Who is moving with you?"
        onBack={vi.fn()}
      />,
    );

    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "3");
    expect(bar).toHaveAttribute("aria-valuemax", "6");
    expect(bar).toHaveAttribute("aria-valuetext", "Step 3 of 6");
  });

  it("renders the question as the page heading", () => {
    render(
      <ProgressHeader step={0} stepCount={6} question="When are you planning to move?" onBack={vi.fn()} />,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "When are you planning to move?" }),
    ).toBeInTheDocument();
  });

  it("calls back when the arrow is used", () => {
    const onBack = vi.fn();
    render(<ProgressHeader step={1} stepCount={6} question="Q" onBack={onBack} />);

    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(onBack).toHaveBeenCalled();
  });

  it("disables the arrow on the first step", () => {
    render(<ProgressHeader step={0} stepCount={6} question="Q" onBack={vi.fn()} backDisabled />);
    expect(screen.getByRole("button", { name: "Back" })).toBeDisabled();
  });
});

