import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ChildAgeFields } from "../ChildAgeFields";

function setup(count: number, ages: string[] = []) {
  const onCountChange = vi.fn();
  const onAgeChange = vi.fn();

  render(
    <ChildAgeFields
      count={count}
      ages={ages}
      onCountChange={onCountChange}
      onAgeChange={onAgeChange}
    />,
  );

  return { onCountChange, onAgeChange };
}

describe("ChildAgeFields (ONB-07A .. ONB-07C)", () => {
  it("shows no age rows at zero children", () => {
    setup(0);

    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.queryByLabelText(/child 1/i)).not.toBeInTheDocument();
  });

  it("renders one age row per child", () => {
    setup(2, ["10", "18"]);

    expect(screen.getByLabelText("Child 1")).toHaveValue("10");
    expect(screen.getByLabelText("Child 2")).toHaveValue("18");
    expect(screen.queryByLabelText("Child 3")).not.toBeInTheDocument();
  });

  it("steps the count up and down", () => {
    const { onCountChange } = setup(2);

    fireEvent.click(screen.getByRole("button", { name: /one more child/i }));
    expect(onCountChange).toHaveBeenCalledWith(3);

    fireEvent.click(screen.getByRole("button", { name: /one fewer child/i }));
    expect(onCountChange).toHaveBeenCalledWith(1);
  });

  it("cannot go below zero", () => {
    setup(0);
    expect(screen.getByRole("button", { name: /one fewer child/i })).toBeDisabled();
  });

  it("stops at ten children", () => {
    setup(10);
    expect(screen.getByRole("button", { name: /one more child/i })).toBeDisabled();
  });

  /*
   * children_ages is list[int] on the API, so anything non-numeric reaching it
   * is a 422. The field filters rather than validates after the fact.
   */
  it("strips non-digits from an age", () => {
    const { onAgeChange } = setup(1, [""]);

    fireEvent.change(screen.getByLabelText("Child 1"), { target: { value: "1a2" } });
    expect(onAgeChange).toHaveBeenCalledWith(0, "12");
  });

  it("rejects an implausible age instead of storing it", () => {
    const { onAgeChange } = setup(1, [""]);

    fireEvent.change(screen.getByLabelText("Child 1"), { target: { value: "99" } });
    expect(onAgeChange).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText("Child 1"), { target: { value: "17" } });
    expect(onAgeChange).toHaveBeenCalledWith(0, "17");
  });

  it("allows clearing an age back to empty", () => {
    const { onAgeChange } = setup(1, ["10"]);

    fireEvent.change(screen.getByLabelText("Child 1"), { target: { value: "" } });
    expect(onAgeChange).toHaveBeenCalledWith(0, "");
  });

  it("disables the stepper and the age boxes while saving", () => {
    render(
      <ChildAgeFields
        count={1}
        ages={[""]}
        onCountChange={vi.fn()}
        onAgeChange={vi.fn()}
        disabled
      />,
    );

    expect(screen.getByRole("button", { name: /one more child/i })).toBeDisabled();
    expect(screen.getByLabelText("Child 1")).toBeDisabled();
  });
});

