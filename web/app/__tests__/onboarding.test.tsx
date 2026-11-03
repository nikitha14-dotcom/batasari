import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const routerPush = vi.fn();
const updateUser = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPush, replace: vi.fn() }),
}));

vi.mock("../../lib/supabase/client", () => ({
  isSupabaseConfigured: () => true,
  getSupabaseClient: () => ({ auth: { updateUser } }),
  getAccessToken: vi.fn().mockResolvedValue("test-token"),
}));

// RequireSession is exercised by its own suite; here it must not gate rendering.
vi.mock("../../lib/supabase/RequireSession", () => ({
  RequireSession: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// The top bar shows Log out, which reads the session. Signed-out here, so it
// renders nothing and these tests stay about the onboarding steps.
vi.mock("../../lib/supabase/useSession", () => ({
  useSession: () => ({ session: null, loading: false, configured: true }),
}));

import { MAX_OTHER_TEXT } from "../../lib/onboarding/limits";
import OnboardingPage from "../onboarding/page";

const EMPTY_PROFILE = {
  household_type: null,
  children_ages: null,
  pets: null,
  pets_other: null,
  visa_type: null,
  visa_other: null,
  city_country: null,
  has_accommodation: null,
  accommodation_zip: null,
  move_date: null,
};

function mockFetch() {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => EMPTY_PROFILE,
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

/** The flow loads the profile before rendering a question. */
async function renderFlow() {
  render(<OnboardingPage />);
  await waitFor(() =>
    expect(screen.getByRole("heading", { name: /when are you planning to move/i })).toBeInTheDocument(),
  );
}

function continueButton() {
  return screen.getByRole("button", { name: "Continue" });
}

describe("onboarding flow (ONB-05 .. ONB-10)", () => {
  beforeEach(() => {
    routerPush.mockReset();
    updateUser.mockReset().mockResolvedValue({ error: null });
    vi.unstubAllGlobals();
    mockFetch();
  });

  it("shows one progress segment per step", async () => {
    await renderFlow();

    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuemax", "6");
    expect(bar).toHaveAttribute("aria-valuenow", "1");
  });

  // ONB-05 -> ONB-05B: Continue is grey until a date exists.
  it("keeps Continue disabled until a move date is chosen", async () => {
    await renderFlow();
    expect(continueButton()).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/move date/i), { target: { value: "2026-10-22" } });
    expect(continueButton()).toBeEnabled();
  });

  it("renders a selected date in the Figma format", async () => {
    await renderFlow();
    fireEvent.change(screen.getByLabelText(/move date/i), { target: { value: "2026-10-22" } });

    expect(screen.getByText("22 Oct 2026")).toBeInTheDocument();
  });

  // ONB-06 -> ONB-06A: picking "Other" reveals the specify field, and Continue
  // stays disabled while that field is empty.
  it("requires the Other text before continuing past the visa question", async () => {
    const fetchMock = mockFetch();
    await renderFlow();

    fireEvent.change(screen.getByLabelText(/move date/i), { target: { value: "2026-10-22" } });
    fireEvent.click(continueButton());

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: /what type of visa/i })).toBeInTheDocument(),
    );

    expect(continueButton()).toBeDisabled();
    fireEvent.click(screen.getByRole("radio", { name: "Other" }));

    const specify = screen.getByLabelText(/please specify your visa type/i);
    expect(specify).toBeInTheDocument();
    expect(continueButton()).toBeDisabled();

    fireEvent.change(specify, { target: { value: "Provincial Nominee" } });
    expect(continueButton()).toBeEnabled();

    // The free-text value is capped, because it is concatenated into the
    // assistant's system prompt server-side.
    expect(specify).toHaveAttribute("maxLength", String(MAX_OTHER_TEXT));
    expect(fetchMock).toHaveBeenCalled();
  });

  // A non-"Other" option needs no sub-input, so Continue enables immediately.
  it("enables Continue as soon as a plain option is picked", async () => {
    await renderFlow();
    fireEvent.change(screen.getByLabelText(/move date/i), { target: { value: "2026-10-22" } });
    fireEvent.click(continueButton());

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: /what type of visa/i })).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByRole("radio", { name: "Study Permit" }));
    expect(continueButton()).toBeEnabled();
  });

  it("sends the skip patch for the current step without requiring an answer", async () => {
    const fetchMock = mockFetch();
    await renderFlow();

    fireEvent.click(screen.getByRole("button", { name: "Skip" }));

    await waitFor(() => {
      const patchCall = fetchMock.mock.calls.find(([, init]) => init?.method === "PATCH");
      expect(patchCall).toBeDefined();
      expect(JSON.parse(patchCall![1].body)).toEqual({ move_date: null });
    });
  });

  it("surfaces a save failure instead of advancing", async () => {
    const fetchMock = vi.fn().mockImplementation((_url: string, init?: RequestInit) => {
      if (init?.method === "PATCH") {
        return Promise.resolve({ ok: false, json: async () => ({ detail: "Profile is locked." }) });
      }
      return Promise.resolve({ ok: true, json: async () => EMPTY_PROFILE });
    });
    vi.stubGlobal("fetch", fetchMock);

    await renderFlow();
    fireEvent.change(screen.getByLabelText(/move date/i), { target: { value: "2026-10-22" } });
    fireEvent.click(continueButton());

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Profile is locked."));
    expect(screen.getByRole("heading", { name: /when are you planning to move/i })).toBeInTheDocument();
  });
});

