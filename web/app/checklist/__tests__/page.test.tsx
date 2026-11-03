import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/navigation", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/lib/supabase/RequireSession", () => ({
  RequireSession: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import ChecklistPage from "../page";

describe("Checklist page", () => {
  it("uses the shared copilot with a checklist-specific starter question", () => {
    render(<ChecklistPage />);

    expect(screen.getByRole("heading", { level: 1, name: "Checklist" })).toBeInTheDocument();
    expect(screen.getByRole("complementary", { name: "AI Co-Pilot" })).toHaveClass("copilot");
    expect(screen.getByRole("button", { name: "Generate my checklist" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: "I don't have a Canadian job offer or credit history, how do I make my rental application competitive?",
      })
    ).not.toBeInTheDocument();
  });
});

