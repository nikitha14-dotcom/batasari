import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import ChatMessage from "../ChatMessage";

const TABLE = [
  "| Neighbourhood | Why it works |",
  "|---|---|",
  "| The Annex | Closest to campus |",
].join("\n");

describe("ChatMessage tables", () => {
  it("renders a markdown table as a real table, not raw pipes", () => {
    render(<ChatMessage message={{ id: "1", role: "assistant", content: TABLE }} />);
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Neighbourhood" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "The Annex" })).toBeInTheDocument();
    expect(screen.queryByText(/\|---\|/)).not.toBeInTheDocument();
  });

  it("puts the table in a scrolling wrapper", () => {
    render(<ChatMessage message={{ id: "1", role: "assistant", content: TABLE }} />);
    expect(screen.getByRole("table").parentElement?.className).toMatch(/tableScroll/);
  });
});
