import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const routerReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: routerReplace, push: vi.fn() }),
}));

vi.mock("../../lib/supabase/client", () => ({
  isSupabaseConfigured: () => false,
  getSupabaseClient: () => ({ auth: { signOut: vi.fn() } }),
  getAccessToken: vi.fn(),
}));

vi.mock("../../lib/supabase/useSession", () => ({
  useSession: () => ({ session: null, loading: false, configured: false }),
}));

import { RequireSession } from "../../lib/supabase/RequireSession";

describe("RequireSession with no Supabase credentials", () => {
  beforeEach(() => {
    routerReplace.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("renders children in development, so a teammate without secrets is not blocked", () => {
    vi.stubEnv("NODE_ENV", "development");

    render(
      <RequireSession>
        <p>protected content</p>
      </RequireSession>
    );

    expect(screen.getByText("protected content")).toBeInTheDocument();
    expect(routerReplace).not.toHaveBeenCalled();
  });

  // A blank NEXT_PUBLIC_SUPABASE_URL on Vercel used to disable the gate rather
  // than close it, rendering /onboarding and /ai to any anonymous visitor.
  it("fails closed in a production build instead of serving the app unguarded", async () => {
    vi.stubEnv("NODE_ENV", "production");

    render(
      <RequireSession>
        <p>protected content</p>
      </RequireSession>
    );

    expect(screen.queryByText("protected content")).not.toBeInTheDocument();
    await waitFor(() => expect(routerReplace).toHaveBeenCalledWith("/login"));
  });
});

