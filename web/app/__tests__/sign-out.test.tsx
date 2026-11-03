import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The sign-out control used to be a fixed bar that RequireSession appended to
// every page. Once the shared header existed it sat on top of the header's
// location and profile card. These tests pin where sign-out lives now.

const auth = vi.hoisted(() => ({
  session: null as null | { user: { email: string } },
  signOut: vi.fn(async () => ({ error: null })),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

vi.mock("../../lib/supabase/client", () => ({
  isSupabaseConfigured: () => true,
  getSupabaseClient: () => ({ auth: { signOut: auth.signOut } }),
  getAccessToken: vi.fn(),
}));

vi.mock("../../lib/supabase/useSession", () => ({
  useSession: () => ({ session: auth.session, loading: false, configured: true }),
}));

import { SidebarNav } from "../../components/navigation";
import { LogoutButton } from "../../components/onboarding/auth";
import { RequireSession } from "../../lib/supabase/RequireSession";

const assign = vi.fn();

beforeEach(() => {
  auth.session = { user: { email: "someone@example.com" } };
  auth.signOut.mockClear();
  assign.mockReset();
  vi.stubGlobal("location", { ...window.location, assign });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("RequireSession", () => {
  it("renders only the page for a signed-in user, with no bar of its own", () => {
    render(
      <RequireSession>
        <p>protected content</p>
      </RequireSession>,
    );

    expect(screen.getByText("protected content")).toBeInTheDocument();
    expect(screen.queryByText(/Signed in as/)).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
  });
});

describe("sidebar Log out", () => {
  it("sits below the divider with FAQ and Privacy Statement", () => {
    render(<SidebarNav />);

    const support = screen.getByRole("navigation", { name: "Support" });
    expect(within(support).getByRole("button", { name: "Log out" })).toBeInTheDocument();
  });

  it("signs out, then loads the login page", async () => {
    render(<SidebarNav />);

    fireEvent.click(screen.getByRole("button", { name: "Log out" }));

    await waitFor(() => expect(assign).toHaveBeenCalledWith("/login"));
    expect(auth.signOut).toHaveBeenCalledTimes(1);
  });

  it("signs out once, however often it is clicked", async () => {
    render(<SidebarNav />);

    const button = screen.getByRole("button", { name: "Log out" });
    fireEvent.click(button);
    fireEvent.click(button);

    await waitFor(() => expect(assign).toHaveBeenCalled());
    expect(auth.signOut).toHaveBeenCalledTimes(1);
  });

  it("is not shown without a session (local dev without Supabase)", () => {
    auth.session = null;
    render(<SidebarNav />);

    expect(screen.queryByRole("button", { name: "Log out" })).toBeNull();
  });
});

describe("onboarding top-bar Log out", () => {
  it("signs out, then loads the login page", async () => {
    render(<LogoutButton />);

    fireEvent.click(screen.getByRole("button", { name: "Log out" }));

    await waitFor(() => expect(assign).toHaveBeenCalledWith("/login"));
    expect(auth.signOut).toHaveBeenCalledTimes(1);
  });

  it("is not shown without a session", () => {
    auth.session = null;
    render(<LogoutButton />);

    expect(screen.queryByRole("button", { name: "Log out" })).toBeNull();
  });
});

