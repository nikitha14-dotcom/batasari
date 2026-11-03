import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const session = {
  user: {
    id: "user-1",
    email: "olivia.sterling@example.com",
    user_metadata: {
      first_name: "Olivia",
      last_name: "Sterling",
      display_name: "Maple",
    },
  },
};

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

vi.mock("../../lib/supabase/client", () => ({
  isSupabaseConfigured: () => false,
  getSupabaseClient: () => ({ auth: { signOut: vi.fn() } }),
  getAccessToken: vi.fn(async () => "token"),
}));

vi.mock("../../lib/supabase/useSession", () => ({
  useSession: () => ({ session, loading: false, configured: false }),
}));

import ProfilePage from "../profile/page";

describe("profile overview", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string) => {
        if (input.endsWith("/beta/status")) {
          return {
            ok: true,
            json: async () => ({
              trial_ends_at: "2026-10-03T14:30:00Z",
              remaining_credit_usd: 0.75,
            }),
          };
        }
        return { ok: true, json: async () => ({ move_date: "2026-10-20" }) };
      }),
    );
  });

  it("shows the account's name, handle and email", async () => {
    render(<ProfilePage />);

    expect(screen.getByRole("heading", { name: "Profile Overview" })).toBeInTheDocument();
    expect(screen.getByText("Olivia Sterling")).toBeInTheDocument();
    expect(screen.getByText("@Maple")).toBeInTheDocument();
    expect(screen.getByText("olivia.sterling@example.com")).toBeInTheDocument();
    expect(screen.getByText("OS")).toBeInTheDocument();
  });

  it("shows the relocation timeline once the profile call returns", async () => {
    render(<ProfilePage />);

    await waitFor(() => expect(screen.getByText(/Oct 2026/)).toBeInTheDocument());
  });

  it("still renders the account details when the profile call fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("Failed to fetch");
      }),
    );

    render(<ProfilePage />);

    expect(screen.getByText("olivia.sterling@example.com")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Not set yet")).toBeInTheDocument());
  });

  it("links Share Your Feedback to the feedback page", () => {
    render(<ProfilePage />);

    expect(screen.getByRole("link", { name: "Share Your Feedback" })).toHaveAttribute(
      "href",
      "/feedback",
    );
  });

  it("shows trial data from the Beta status API without a plans button", async () => {
    render(<ProfilePage />);

    await waitFor(() =>
      expect(screen.getByText(/It'll expire on October 3, 2026.*\$0\.75 of AI credit remaining/)).toBeInTheDocument(),
    );
    expect(screen.queryByRole("button", { name: "View plans" })).not.toBeInTheDocument();
  });

  it("links to profile editing", () => {
    render(<ProfilePage />);

    expect(screen.getByRole("link", { name: /edit profile/i })).toHaveAttribute("href", "/profile/edit");

  });
});

