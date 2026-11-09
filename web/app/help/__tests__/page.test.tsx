import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Page from "../page";

describe("Public Batasari help page", () => {
  it("shows FAQ without requiring a session", () => {
    render(<Page />);
    expect(screen.getByRole("heading", { level: 1, name: "Help & frequently asked questions" })).toBeInTheDocument();
    expect(screen.getByText(/This page is public/)).toBeInTheDocument();
  });

  it("includes Batasari FAQ content and opens answers", () => {
    render(<Page />);
    const question = screen.getByRole("button", { name: "Can I read the FAQ or ask the AI assistant without signing in?" });
    fireEvent.click(question);
    expect(question).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(/public Batasari AI assistant are available without creating an account/)).toBeInTheDocument();
    expect(screen.queryByText(/KnewSooner|Moving Assistant/i)).toBeNull();
  });

  it("links to official Indian services and the public AI assistant", () => {
    render(<Page />);
    expect(screen.getByRole("link", { name: /UIDAI – Aadhaar services/ })).toHaveAttribute("href", "https://uidai.gov.in/");
    expect(screen.getByRole("link", { name: /Passport Seva/ })).toHaveAttribute("href", "https://www.passportindia.gov.in/");
    expect(screen.getByRole("link", { name: "Ask Batasari AI →" })).toHaveAttribute("href", "/ask");
  });
});
