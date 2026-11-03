import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../useHeaderProfile", () => ({
  useHeaderProfile: () => ({ name: "Jia", subtitle: "Settling in" }),
}));

import { AppHeader } from "../AppHeader";

describe("AppHeader", () => {
  it("uses KnewSooner as the signed-in home wordmark", () => {
    render(<AppHeader />);

    const wordmark = screen.getByRole("link", { name: "KnewSooner home" });
    expect(wordmark).toHaveAttribute("href", "/housing");
    expect(wordmark).toHaveTextContent("KnewSooner");
  });
});

