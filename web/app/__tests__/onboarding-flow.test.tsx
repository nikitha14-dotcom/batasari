import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const routerPush = vi.fn();
const updateUser = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: routerPush, replace: vi.fn() }) }));
vi.mock("../../lib/supabase/client", () => ({
  getSupabaseClient: () => ({ auth: { updateUser } }),
  getAccessToken: vi.fn().mockResolvedValue("test-token"),
}));
vi.mock("../../lib/supabase/RequireSession", () => ({
  RequireSession: ({ children }: { children: ReactNode }) => <>{children}</>,
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

describe("Batasari onboarding journey", () => {
  beforeEach(() => {
    routerPush.mockReset();
    updateUser.mockReset().mockResolvedValue({ error: null });
    vi.unstubAllGlobals();
  });

  it("walks through all eight steps when the user skips optional answers", async () => {
    const patches = setup();
    for (let step = 1; step <= 8; step += 1) {
      await waitFor(() => expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", String(step)));
      fireEvent.click(screen.getByRole("button", { name: "Skip" }));
    }
    await waitFor(() => expect(routerPush).toHaveBeenCalledWith("/categories"));
    expect(patches).toEqual([
      { move_type: null },
      { move_date: null },
      { visa_type: null, visa_other: null },
      { household_type: null, children_ages: null, household_other: null },
      { pets: null, pets_other: null },
      { city_country: null },
      { destination_city: null },
      { has_accommodation: null, accommodation_zip: null },
    ]);
    expect(updateUser).toHaveBeenCalledTimes(8);
  });

  it("keeps the first answer when navigating back from the move-date step", async () => {
    setup();
    fireEvent.click(await screen.findByRole("radio", { name: "Moving between Indian cities" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    await waitFor(() => expect(screen.getByLabelText("Move date")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(await screen.findByRole("radio", { name: "Moving between Indian cities" })).toHaveAttribute("aria-checked", "true");
  });
});
