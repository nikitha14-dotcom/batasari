import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { StepFooter } from "../StepFooter";

describe("StepFooter", () => {
  /*
   * Every frame shows Continue grey until the step's answer is complete, so
   * grey has to mean genuinely unclickable rather than merely styled.
   */
  it("blocks Continue until the step is answered", () => {
    const onContinue = vi.fn();
    render(<StepFooter canContinue={false} onContinue={onContinue} />);

    const button = screen.getByRole("button", { name: "Continue" });
    expect(button).toBeDisabled();

    fireEvent.click(button);
    expect(onContinue).not.toHaveBeenCalled();
  });

  it("allows Continue once the step is answered", () => {
    const onContinue = vi.fn();
    render(<StepFooter canContinue onContinue={onContinue} />);

    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(onContinue).toHaveBeenCalled();
  });

  it("blocks Continue while a save is in flight even when the answer is valid", () => {
    render(<StepFooter canContinue busy onContinue={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
  });

  it("offers Skip only when the step can be skipped", () => {
    const { rerender } = render(<StepFooter canContinue={false} onContinue={vi.fn()} />);
    expect(screen.queryByRole("button", { name: "Skip" })).not.toBeInTheDocument();

    rerender(<StepFooter canContinue={false} onContinue={vi.fn()} onSkip={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Skip" })).toBeInTheDocument();
  });

  // Skip must stay available precisely when Continue is not.
  it("keeps Skip usable with no answer given", () => {
    const onSkip = vi.fn();
    render(<StepFooter canContinue={false} onContinue={vi.fn()} onSkip={onSkip} />);

    fireEvent.click(screen.getByRole("button", { name: "Skip" }));
    expect(onSkip).toHaveBeenCalled();
  });

  // Figma shows "Start from scratch" on ONB-09 and ONB-10 only.
  it("offers Start from scratch only when a reset handler is given", () => {
    const { rerender } = render(<StepFooter canContinue onContinue={vi.fn()} />);
    expect(screen.queryByRole("button", { name: /start from scratch/i })).not.toBeInTheDocument();

    const onRestart = vi.fn();
    rerender(<StepFooter canContinue onContinue={vi.fn()} onRestart={onRestart} />);
    fireEvent.click(screen.getByRole("button", { name: /start from scratch/i }));
    expect(onRestart).toHaveBeenCalled();
  });
});

