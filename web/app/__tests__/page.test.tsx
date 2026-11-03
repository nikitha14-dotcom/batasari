import { render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: ComponentProps<"a">) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

import Home from "../page";

describe("Batasari home page", () => {
  it("introduces the India move planner and links to public planning pages", () => {
    render(<Home />);

    expect(screen.getByRole("heading", { name: /your move to india, made clearer/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /start your move plan/i })).toHaveAttribute("href", "/categories");
    expect(screen.getByRole("link", { name: /explore indian cities/i })).toHaveAttribute("href", "/india-guide");
  });
});
