import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const exchangeCodeForSession = vi.fn();
const routerReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: routerReplace, push: vi.fn() }),
}));

vi.mock("../../lib/supabase/client", () => ({
  isSupabaseConfigured: () => true,
  getSupabaseClient: () => ({ auth: { exchangeCodeForSession } }),
  getAccessToken: vi.fn(),
}));

import AuthCallbackPage from "../auth/callback/page";

function visit(search: string) {
  window.history.replaceState({}, "", `/auth/callback${search}`);
}

describe("auth callback", () => {
  beforeEach(() => {
    exchangeCodeForSession.mockReset();
    routerReplace.mockReset();
    exchangeCodeForSession.mockResolvedValue({ data: {}, error: null });
  });

  it("exchanges the code and offers the password screen to a user without one", async () => {
    visit("?code=pkce-code-123");
    render(<AuthCallbackPage />);

    await waitFor(() => expect(exchangeCodeForSession).toHaveBeenCalledWith("pkce-code-123"));
    await waitFor(() => expect(routerReplace).toHaveBeenCalledWith("/set-password"));
  });

  it("sends a user with a password but no name to Create Account (ONB-04)", async () => {
    exchangeCodeForSession.mockResolvedValue({
      data: { session: { user: { user_metadata: { has_password: true } } } },
      error: null,
    });
    visit("?code=pkce-code-123");
    render(<AuthCallbackPage />);

    await waitFor(() => expect(routerReplace).toHaveBeenCalledWith("/create-account"));
  });

  it("sends a password-reset link to Reset Password even for a complete account", async () => {
    exchangeCodeForSession.mockResolvedValue({
      data: {
        session: { user: { user_metadata: { has_password: true, first_name: "Amy" } } },
        redirectType: "recovery",
      },
      error: null,
    });
    visit("?code=pkce-code-123");
    render(<AuthCallbackPage />);

    await waitFor(() => expect(routerReplace).toHaveBeenCalledWith("/set-password?reset=1"));
    expect(routerReplace).not.toHaveBeenCalledWith("/onboarding");
  });

  it("sends a returning user who finished both steps straight into onboarding", async () => {
    exchangeCodeForSession.mockResolvedValue({
      data: { session: { user: { user_metadata: { has_password: true, first_name: "Amy" } } } },
      error: null,
    });
    visit("?code=pkce-code-123");
    render(<AuthCallbackPage />);

    await waitFor(() => expect(routerReplace).toHaveBeenCalledWith("/onboarding"));
  });

  it("strips the used code from the URL so it cannot be replayed", async () => {
    visit("?code=pkce-code-123");
    render(<AuthCallbackPage />);

    await waitFor(() => expect(window.location.search).toBe(""));
  });

  it("explains a link opened in the wrong browser", async () => {
    visit("?code=pkce-code-123");
    exchangeCodeForSession.mockResolvedValue({
      data: {},
      error: { message: "both auth code and code verifier should be non-empty" },
    });

    render(<AuthCallbackPage />);

    expect(await screen.findByText(/different browser/i)).toBeInTheDocument();
    expect(routerReplace).not.toHaveBeenCalledWith("/onboarding");
  });

  it("surfaces an expired or already-used link", async () => {
    visit("?error=access_denied&error_description=Email+link+is+invalid+or+has+expired");
    render(<AuthCallbackPage />);

    expect(await screen.findByText(/invalid or has expired/i)).toBeInTheDocument();
    expect(exchangeCodeForSession).not.toHaveBeenCalled();
  });

  it("surfaces an expired link when Supabase reports it in the URL fragment", async () => {
    visit("#error=access_denied&error_description=Email+link+is+invalid+or+has+expired");
    render(<AuthCallbackPage />);

    expect(await screen.findByText(/invalid or has expired/i)).toBeInTheDocument();
    expect(exchangeCodeForSession).not.toHaveBeenCalled();
  });

  it("does not silently hang when the link carries no code", async () => {
    visit("");
    render(<AuthCallbackPage />);

    expect(await screen.findByText(/missing its sign-in code/i)).toBeInTheDocument();
  });
});

