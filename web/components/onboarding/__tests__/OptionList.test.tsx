import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { InlineField, OptionList } from "../OptionList";

const OPTIONS = [
  { value: "solo", label: "Just me" },
  { value: "partner", label: "With my partner" },
  { value: "family", label: "Family with kids" },
];

describe("OptionList", () => {
  it("exposes a radiogroup for single choice and a group for multi choice", () => {
    const { rerender } = render(
      <OptionList name="Household" options={OPTIONS} selected={[]} onSelect={vi.fn()} />,
    );
    expect(screen.getByRole("radiogroup", { name: "Household" })).toBeInTheDocument();

    rerender(
      <OptionList multiple name="Pets" options={OPTIONS} selected={[]} onSelect={vi.fn()} />,
    );
    expect(screen.getByRole("group", { name: "Pets" })).toBeInTheDocument();
  });

  it("marks only the chosen option as checked", () => {
    render(
      <OptionList name="Household" options={OPTIONS} selected={["partner"]} onSelect={vi.fn()} />,
    );

    expect(screen.getByRole("radio", { name: "Just me" })).toHaveAttribute("aria-checked", "false");
    expect(screen.getByRole("radio", { name: "With my partner" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });

  it("reports the clicked value", () => {
    const onSelect = vi.fn();
    render(<OptionList name="Household" options={OPTIONS} selected={[]} onSelect={onSelect} />);

    fireEvent.click(screen.getByRole("radio", { name: "Family with kids" }));
    expect(onSelect).toHaveBeenCalledWith("family");
  });

  /*
   * ONB-06 -> ONB-06A. The expansion is the design's only selection signal for
   * options that have one, so it must appear on selection and not before.
   */
  it("renders an option's expansion only once that option is selected", () => {
    const withExpansion = [
      { value: "visitor", label: "Visitor" },
      { value: "other", label: "Other", expansion: <p>Please specify your visa type</p> },
    ];

    const { rerender } = render(
      <OptionList name="Visa" options={withExpansion} selected={[]} onSelect={vi.fn()} />,
    );
    expect(screen.queryByText("Please specify your visa type")).not.toBeInTheDocument();

    rerender(
      <OptionList name="Visa" options={withExpansion} selected={["other"]} onSelect={vi.fn()} />,
    );
    expect(screen.getByText("Please specify your visa type")).toBeInTheDocument();
  });

  it("keeps an expanded option clickable so it can be deselected", () => {
    const onSelect = vi.fn();
    render(
      <OptionList
        name="Visa"
        options={[{ value: "other", label: "Other", expansion: <input aria-label="Specify" /> }]}
        selected={["other"]}
        onSelect={onSelect}
      />,
    );

    fireEvent.click(screen.getByRole("radio", { name: "Other" }));
    expect(onSelect).toHaveBeenCalledWith("other");
  });

  it("disables every option while a save is in flight", () => {
    render(
      <OptionList name="Household" options={OPTIONS} selected={[]} onSelect={vi.fn()} disabled />,
    );

    for (const option of OPTIONS) {
      expect(screen.getByRole("radio", { name: option.label })).toBeDisabled();
    }
  });

  it("uses aria-pressed rather than aria-checked in multi-select mode", () => {
    render(
      <OptionList
        multiple
        name="Pets"
        options={[
          { value: "dog", label: "Dog" },
          { value: "cat", label: "Cat" },
        ]}
        selected={["dog"]}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Dog" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Cat" })).toHaveAttribute("aria-pressed", "false");
  });
});

describe("InlineField", () => {
  /*
   * The cap is not cosmetic: these strings are concatenated into the
   * assistant's system prompt server-side.
   */
  it("enforces the character cap it is given", () => {
    render(
      <InlineField
        value=""
        onChange={vi.fn()}
        placeholder="Please specify"
        maxLength={120}
        label="Please specify your visa type"
      />,
    );

    expect(screen.getByLabelText("Please specify your visa type")).toHaveAttribute(
      "maxLength",
      "120",
    );
  });

  it("reports what the user types", () => {
    const onChange = vi.fn();
    render(
      <InlineField
        value=""
        onChange={onChange}
        placeholder="Enter your postal code"
        maxLength={12}
        label="Postal code"
      />,
    );

    fireEvent.change(screen.getByLabelText("Postal code"), { target: { value: "M5V 3L9" } });
    expect(onChange).toHaveBeenCalledWith("M5V 3L9");
  });
});

