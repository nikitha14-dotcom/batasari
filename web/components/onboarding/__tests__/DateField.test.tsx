import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DateField, formatMoveDate } from "../DateField";

describe("formatMoveDate", () => {
  // ONB-05B renders "22 Oct 2026" — day, short month, year, no comma.
  it("matches the Figma date format", () => {
    expect(formatMoveDate("2026-10-22")).toBe("22 Oct 2026");
    expect(formatMoveDate("2026-01-05")).toBe("05 Jan 2026");
  });

  it("returns the raw value rather than 'Invalid Date' when it cannot parse", () => {
    expect(formatMoveDate("not-a-date")).toBe("not-a-date");
  });

  /*
   * Parsing is pinned to midnight local time. Without the explicit T00:00:00,
   * "2026-10-22" parses as UTC and renders as the 21st anywhere west of
   * Greenwich — including Toronto, the app's whole audience.
   */
  it("does not shift the day backwards in a western timezone", () => {
    expect(formatMoveDate("2026-10-22")).toContain("22");
  });
});

describe("DateField (ONB-05 / 05A / 05B)", () => {
  it("shows the placeholder until a date is chosen", () => {
    render(<DateField value="" onChange={vi.fn()} />);
    expect(screen.getByText("Choose date")).toBeInTheDocument();
  });

  it("shows the formatted date once chosen", () => {
    render(<DateField value="2026-10-22" onChange={vi.fn()} />);

    expect(screen.getByText("22 Oct 2026")).toBeInTheDocument();
    expect(screen.queryByText("Choose date")).not.toBeInTheDocument();
  });

  it("reports the chosen date", () => {
    const onChange = vi.fn();
    render(<DateField value="" onChange={onChange} />);

    fireEvent.change(screen.getByLabelText("Move date"), { target: { value: "2026-10-22" } });
    expect(onChange).toHaveBeenCalledWith("2026-10-22");
  });

  it("opens the native picker when the pill is clicked", () => {
    const showPicker = vi.fn();
    render(<DateField value="" onChange={vi.fn()} />);

    const input = screen.getByLabelText("Move date") as HTMLInputElement;
    input.showPicker = showPicker;

    fireEvent.click(input);
    expect(showPicker).toHaveBeenCalled();
  });

  /*
   * Safari throws from showPicker() when it does not recognise the gesture.
   * Focusing the input is the fallback; an uncaught throw would break the step.
   */
  it("falls back to focus when showPicker throws", () => {
    render(<DateField value="" onChange={vi.fn()} />);

    const input = screen.getByLabelText("Move date") as HTMLInputElement;
    input.showPicker = () => {
      throw new Error("NotAllowedError");
    };

    expect(() => fireEvent.click(input)).not.toThrow();
    expect(input).toHaveFocus();
  });

  it("does not open the picker while saving", () => {
    const showPicker = vi.fn();
    render(<DateField value="" onChange={vi.fn()} disabled />);

    const input = screen.getByLabelText("Move date") as HTMLInputElement;
    input.showPicker = showPicker;

    fireEvent.click(input);
    expect(showPicker).not.toHaveBeenCalled();
    expect(input).toBeDisabled();
  });
});

