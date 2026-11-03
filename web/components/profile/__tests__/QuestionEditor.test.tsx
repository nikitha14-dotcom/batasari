import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { QuestionEditor } from "../QuestionEditor";

describe("QuestionEditor", () => {
  it("shows the household free-text editor for Other", () => {
    render(
      <QuestionEditor
        question={{ key: "household_type", label: "Who is moving with you?" }}
        value="other"
        otherValue=""
        saving={false}
        onChange={vi.fn()}
        onOtherChange={vi.fn()}
        onSave={vi.fn()}
      />,
    );

    expect(screen.getByRole("textbox", { name: "Who else is moving with you" })).toBeInTheDocument();
  });

  it("shows the pets free-text editor and preserves its input", () => {
    const onOtherChange = vi.fn();
    render(
      <QuestionEditor
        question={{ key: "pets", label: "Will you bring any pets?" }}
        value="other"
        otherValue="parrot"
        saving={false}
        onChange={vi.fn()}
        onOtherChange={onOtherChange}
        onSave={vi.fn()}
      />,
    );

    const input = screen.getByRole("textbox", { name: "Please specify your pet type" });
    expect(input).toHaveValue("parrot");
    fireEvent.change(input, { target: { value: "parrot, turtle" } });
    expect(onOtherChange).toHaveBeenCalledWith("parrot, turtle");
  });

  it("uses the onboarding city suggestions", () => {
    const onChange = vi.fn();
    render(
      <QuestionEditor
        question={{ key: "city_country", label: "Which city and country are you moving from?" }}
        value="tor"
        saving={false}
        onChange={onChange}
        onSave={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Toronto, Canada" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Toronto, Canada" }));
    expect(onChange).toHaveBeenCalledWith("Toronto, Canada");
  });
});

