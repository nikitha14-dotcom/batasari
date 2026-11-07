import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const routerPush = vi.fn();
const updateUser = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: routerPush, replace: vi.fn() }) }));
vi.mock("../../lib/supabase/client", () => ({
  getSupabaseClient: () => ({ auth: { updateUser } }),
  getAccessToken: vi.fn().mockResolvedValue("test-token"),
}));
vi.mock("../../lib/supabase/RequireSession", () => ({
  RequireSession: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock("../../lib/supabase/useSession", () => ({
  useSession: () => ({ session: null, loading: false, configured: true }),
}));

import OnboardingPage from "../onboarding/page";

const EMPTY_PROFILE = {
  move_type: null,
  move_date: null,
  visa_type: null,
  visa_other: null,
  household_type: null,
  household_other: null,
  children_ages: null,
  pets: null,
  pets_other: null,
  city_country: null,
  destination_city: null,
  has_accommodation: null,
  accommodation_zip: null,
};

function setup() {
  const patches: Record<string, unknown>[] = [];
  vi.stubGlobal("fetch", vi.fn(async (_url: string, init?: RequestInit) => {
    if (init?.method === "PATCH") patches.push(JSON.parse(String(init.body)));
    return { ok: true, json: async () => EMPTY_PROFILE };
  }));
  render(<OnboardingPage />);
  return patches;
}

describe("Batasari onboarding", () => {
  beforeEach(() => {
    routerPush.mockReset();
    updateUser.mockReset().mockResolvedValue({ error: null });
    vi.unstubAllGlobals();
  });

  it("starts with the move type question and an eight-step progress indicator", async () => {
    setup();
    expect(await screen.findByText("Which kind of move are you planning?")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuemax", "8");
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
  });

  it("advances to the move date after selecting a move type", async () => {
    setup();
    fireEvent.click(await screen.findByRole("radio", { name: "Moving between Indian cities" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    await waitFor(() => expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "2"));
    expect(screen.getByLabelText("Move date")).toBeInTheDocument();
  });

  it("persists a skipped step as an explicit null patch", async () => {
    const patches = setup();
    fireEvent.click(await screen.findByRole("button", { name: "Skip" }));
    await waitFor(() => expect(patches).toEqual([{ move_type: null }]));
    expect(screen.getByLabelText("Move date")).toBeInTheDocument();
  });
});
