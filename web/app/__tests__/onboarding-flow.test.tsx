import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
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

vi.mock("../../lib/supabase/RequireSession", () => ({
  RequireSession: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

// The top bar shows Log out, which reads the session. Signed-out here, so it
// renders nothing and these tests stay about the onboarding steps.
vi.mock("../../lib/supabase/useSession", () => ({
  useSession: () => ({ session: null, loading: false, configured: true }),
}));

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

/**
 * Stands in for the profile endpoint. GET returns `stored`; PATCH records the
 * body and merges it, so a test can assert what each step actually sent.
 */
function mockProfileApi(stored: Record<string, unknown> = EMPTY_PROFILE) {
  const patches: Record<string, unknown>[] = [];
  let state = { ...stored };

  const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
    if (init?.method === "PATCH") {
      const body = JSON.parse(String(init.body));
      patches.push(body);
      state = { ...state, ...body };
    }
    return { ok: true, json: async () => state };
  });

  vi.stubGlobal("fetch", fetchMock);
  return { patches, fetchMock };
}

async function renderFlow() {
  render(<OnboardingPage />);
  await waitFor(() =>
    expect(screen.getByRole("progressbar")).toBeInTheDocument(),
  );
}

const cont = () => screen.getByRole("button", { name: "Continue" });
const heading = (pattern: RegExp) => screen.findByRole("heading", { name: pattern });

/** Answers the current step and clicks Continue. */
async function answerStep(step: number) {
  switch (step) {
    case 1:
      fireEvent.change(screen.getByLabelText("Move date"), { target: { value: "2026-10-22" } });
      break;
    case 2:
      fireEvent.click(screen.getByRole("radio", { name: "Study Permit" }));
      break;
    case 3:
      fireEvent.click(screen.getByRole("radio", { name: "Just me" }));
      break;
    case 4:
      fireEvent.click(screen.getByRole("button", { name: "No pets" }));
      break;
    case 5:
      fireEvent.change(screen.getByLabelText(/city and country/i), { target: { value: "Indo" } });
      fireEvent.click(await screen.findByRole("button", { name: "Indonesia" }));
      break;
    case 6:
      fireEvent.click(screen.getByRole("radio", { name: "No" }));
      break;
  }

  fireEvent.click(cont());
}

describe("onboarding journey ONB-05 -> ONB-10", () => {
  beforeEach(() => {
    routerPush.mockReset();
    updateUser.mockReset().mockResolvedValue({ error: null });
    vi.unstubAllGlobals();
  });

  it("walks all six steps and sends the right patch for each", async () => {
    const { patches } = mockProfileApi();
    await renderFlow();

    await heading(/when are you planning to move/i);
    await answerStep(1);

    await heading(/what type of visa/i);
    await answerStep(2);

    await heading(/who is moving with you/i);
    await answerStep(3);

    await heading(/will you bring any pets/i);
    await answerStep(4);

    await heading(/which city and country/i);
    await answerStep(5);

    await heading(/long-term accommodation/i);
    await answerStep(6);

    await waitFor(() => expect(routerPush).toHaveBeenCalledWith("/housing"));

    expect(patches).toEqual([
      { move_date: "2026-10-22" },
      { visa_type: "study_permit", visa_other: null },
      { household_type: "solo", children_ages: null, household_other: null },
      { pets: [], pets_other: null },
      { city_country: "Indonesia" },
      { has_accommodation: false, accommodation_zip: null },
    ]);
  });

  it("advances the progress bar one segment per step", async () => {
    mockProfileApi();
    await renderFlow();

    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "1");
    await answerStep(1);

    await heading(/what type of visa/i);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "2");
  });

  it("keeps an answer when the user goes back to it", async () => {
    mockProfileApi();
    await renderFlow();

    await answerStep(1);
    await heading(/what type of visa/i);

    fireEvent.click(screen.getByRole("button", { name: "Back" }));

    await heading(/when are you planning to move/i);
    expect(screen.getByText("22 Oct 2026")).toBeInTheDocument();
    expect(cont()).toBeEnabled();
  });

  it("disables Back on the first step", async () => {
    mockProfileApi();
    await renderFlow();
    expect(screen.getByRole("button", { name: "Back" })).toBeDisabled();
  });

  /*
   * Resuming is the path least exercised by hand: the flow holds answers
   * locally, so a saved profile has to be mapped back onto that state or the
   * user sees their answers vanish.
   */
  it("restores a saved profile into the right controls", async () => {
    mockProfileApi({
      ...EMPTY_PROFILE,
      move_date: "2026-10-22",
      visa_type: "other",
      visa_other: "Provincial Nominee",
      household_type: "family",
      children_ages: [10, 18],
    });

    await renderFlow();

    await heading(/when are you planning to move/i);
    expect(screen.getByText("22 Oct 2026")).toBeInTheDocument();

    fireEvent.click(cont());
    await heading(/what type of visa/i);
    expect(screen.getByLabelText(/please specify your visa type/i)).toHaveValue(
      "Provincial Nominee",
    );

    fireEvent.click(cont());
    await heading(/who is moving with you/i);
    expect(screen.getByLabelText("Child 1")).toHaveValue("10");
    expect(screen.getByLabelText("Child 2")).toHaveValue("18");
  });

  // pets: [] means "no pets"; pets: null means the step was skipped.
  it("restores an empty pets array as No pets rather than as unanswered", async () => {
    mockProfileApi({ ...EMPTY_PROFILE, move_date: "2026-10-22", pets: [] });
    await renderFlow();

    fireEvent.click(cont());
    await heading(/what type of visa/i);
    fireEvent.click(screen.getByRole("radio", { name: "Visitor" }));
    fireEvent.click(cont());

    await heading(/who is moving with you/i);
    fireEvent.click(screen.getByRole("radio", { name: "Just me" }));
    fireEvent.click(cont());

    await heading(/will you bring any pets/i);
    expect(screen.getByRole("button", { name: "No pets" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});

describe("step-level rules", () => {
  beforeEach(() => {
    routerPush.mockReset();
    vi.unstubAllGlobals();
    mockProfileApi();
  });

  async function goToPets() {
    await renderFlow();
    await answerStep(1);
    await heading(/what type of visa/i);
    await answerStep(2);
    await heading(/who is moving with you/i);
    await answerStep(3);
    await heading(/will you bring any pets/i);
  }

  it("treats No pets as exclusive in both directions", async () => {
    await goToPets();

    fireEvent.click(screen.getByRole("button", { name: "Dog" }));
    fireEvent.click(screen.getByRole("button", { name: "Cat" }));
    expect(screen.getByRole("button", { name: "Dog" })).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(screen.getByRole("button", { name: "No pets" }));
    expect(screen.getByRole("button", { name: "Dog" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "Cat" })).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(screen.getByRole("button", { name: "Dog" }));
    expect(screen.getByRole("button", { name: "No pets" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("requires the pets Other text before continuing", async () => {
    await goToPets();

    fireEvent.click(screen.getByRole("button", { name: "Other" }));
    expect(cont()).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/please specify your pet type/i), {
      target: { value: "Rabbit" },
    });
    expect(cont()).toBeEnabled();
  });

  it("blocks Continue again if the answer is taken back", async () => {
    await goToPets();

    fireEvent.click(screen.getByRole("button", { name: "Dog" }));
    expect(cont()).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: "Dog" }));
    expect(cont()).toBeDisabled();
  });

  it("requires the household child ages before continuing", async () => {
    await renderFlow();
    await answerStep(1);
    await heading(/what type of visa/i);
    await answerStep(2);
    await heading(/who is moving with you/i);

    fireEvent.click(screen.getByRole("radio", { name: "Family with kids" }));
    expect(cont()).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: /one more child/i }));
    expect(cont()).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Child 1"), { target: { value: "7" } });
    expect(cont()).toBeEnabled();
  });

  it("does not ask for a postal code when there is no accommodation", async () => {
    await goToPets();
    await answerStep(4);
    await heading(/which city and country/i);
    await answerStep(5);
    await heading(/long-term accommodation/i);

    fireEvent.click(screen.getByRole("radio", { name: "No" }));
    expect(screen.queryByLabelText("Postal code")).not.toBeInTheDocument();
    expect(cont()).toBeEnabled();
  });

  it("asks for a postal code when there is accommodation", async () => {
    await goToPets();
    await answerStep(4);
    await heading(/which city and country/i);
    await answerStep(5);
    await heading(/long-term accommodation/i);

    fireEvent.click(screen.getByRole("radio", { name: "Yes" }));
    expect(cont()).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Postal code"), { target: { value: "M5V 3L9" } });
    expect(cont()).toBeEnabled();
  });

  // Figma puts "Start from scratch" on ONB-09 and ONB-10 only.
  it("offers Start from scratch from the fifth step and resets the answers", async () => {
    await goToPets();
    expect(screen.queryByRole("button", { name: /start from scratch/i })).not.toBeInTheDocument();

    await answerStep(4);
    await heading(/which city and country/i);

    fireEvent.change(screen.getByLabelText(/city and country/i), { target: { value: "Indo" } });
    fireEvent.click(screen.getByRole("button", { name: /start from scratch/i }));

    await heading(/when are you planning to move/i);
    expect(screen.getByText("Choose date")).toBeInTheDocument();
    expect(cont()).toBeDisabled();
  });
});

describe("failure handling", () => {
  beforeEach(() => {
    routerPush.mockReset();
    vi.unstubAllGlobals();
  });

  it("reports a failed profile load without rendering a broken step", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, json: async () => ({ detail: "Not authenticated" }) }),
    );

    render(<OnboardingPage />);
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Not authenticated"));
  });

  it("stays on the step when the save fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, init?: RequestInit) => {
        if (init?.method === "PATCH") {
          return { ok: false, json: async () => ({ detail: "Profile is locked." }) };
        }
        return { ok: true, json: async () => EMPTY_PROFILE };
      }),
    );

    await renderFlow();
    await answerStep(1);

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Profile is locked."));
    expect(
      screen.getByRole("heading", { name: /when are you planning to move/i }),
    ).toBeInTheDocument();
    expect(routerPush).not.toHaveBeenCalled();
  });

  it("skips a step without an answer and records the clearing patch", async () => {
    const { patches } = mockProfileApi();
    await renderFlow();

    fireEvent.click(screen.getByRole("button", { name: "Skip" }));
    await heading(/what type of visa/i);

    expect(patches).toEqual([{ move_date: null }]);
  });
});

describe("fixes for reported defects", () => {
  beforeEach(() => {
    routerPush.mockReset();
    vi.unstubAllGlobals();
  });

  /*
   * "Start from scratch" used to reset local state only. By the time the
   * button renders, the first four steps have each already been PATCHed, so
   * the discarded answers returned on the next load — and went on feeding the
   * assistant's system prompt in the meantime.
   */
  it("clears the answers on the server, not just on screen", async () => {
    const { patches } = mockProfileApi();
    await renderFlow();

    await answerStep(1);
    await heading(/what type of visa/i);
    await answerStep(2);
    await heading(/who is moving with you/i);
    await answerStep(3);
    await heading(/will you bring any pets/i);
    await answerStep(4);
    await heading(/which city and country/i);

    patches.length = 0;
    fireEvent.click(screen.getByRole("button", { name: /start from scratch/i }));

    await heading(/when are you planning to move/i);

    expect(patches).toHaveLength(1);
    expect(patches[0]).toEqual({
      move_date: null,
      visa_type: null,
      visa_other: null,
      household_type: null,
      children_ages: null,
      household_other: null,
      pets: null,
      pets_other: null,
      city_country: null,
      has_accommodation: null,
      accommodation_zip: null,
    });
  });

  /*
   * The banner belongs to the step that failed. Carrying it backwards left an
   * alert claiming a save failed on a question that had saved fine.
   */
  it("drops the error banner when the user goes back", async () => {
    let failNext = false;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, init?: RequestInit) => {
        if (init?.method === "PATCH" && failNext) {
          return { ok: false, json: async () => ({ detail: "Could not save your answer." }) };
        }
        return { ok: true, json: async () => EMPTY_PROFILE };
      }),
    );

    await renderFlow();
    await answerStep(1);
    await heading(/what type of visa/i);

    failNext = true;
    fireEvent.click(screen.getByRole("radio", { name: "Visitor" }));
    fireEvent.click(cont());
    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "Back" }));

    await heading(/when are you planning to move/i);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  /*
   * Every other control is gated on `saving`. While the free-text field was
   * not, text typed during an in-flight PATCH was silently dropped.
   */
  it("locks the free-text field while a save is in flight", async () => {
    // The first PATCH must complete so the flow can reach the visa step; the
    // second one hangs until the test releases it, which is the window where
    // typing used to be accepted and then thrown away.
    let release = () => {};
    const heldOpen = new Promise<void>((resolve) => {
      release = resolve;
    });
    let patchCount = 0;

    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, init?: RequestInit) => {
        if (init?.method === "PATCH") {
          patchCount += 1;
          if (patchCount > 1) await heldOpen;
        }
        return { ok: true, json: async () => EMPTY_PROFILE };
      }),
    );

    await renderFlow();
    await answerStep(1);
    await heading(/what type of visa/i);

    fireEvent.click(screen.getByRole("radio", { name: "Other" }));
    const specify = screen.getByLabelText(/please specify your visa type/i);
    fireEvent.change(specify, { target: { value: "PGWP" } });

    fireEvent.click(cont());
    await waitFor(() => expect(specify).toBeDisabled());

    // Let the request finish and wait for the re-render it causes. Without
    // this the state update lands after the test body returns, which React
    // reports as an un-acted update -- a warning in the CI log that looks
    // like a product bug and is not one.
    release();
    await waitFor(() => expect(specify).toBeEnabled());
  });

  // The 422 body is a list of field errors, not a string.
  it("names the offending field instead of saying 'Request failed.'", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, init?: RequestInit) => {
        if (init?.method === "PATCH") {
          return {
            ok: false,
            json: async () => ({
              detail: [{ loc: ["body", "move_date"], msg: "invalid date format" }],
            }),
          };
        }
        return { ok: true, json: async () => EMPTY_PROFILE };
      }),
    );

    await renderFlow();
    await answerStep(1);

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("move_date: invalid date format"),
    );
  });
});

describe("ONB-07 Other", () => {
  beforeEach(() => {
    routerPush.mockReset();
    vi.unstubAllGlobals();
  });

  async function goToHousehold() {
    await renderFlow();
    await answerStep(1);
    await heading(/what type of visa/i);
    await answerStep(2);
    await heading(/who is moving with you/i);
  }

  it("asks who else is moving and will not continue until told", async () => {
    mockProfileApi();
    await goToHousehold();

    fireEvent.click(screen.getByRole("radio", { name: "Other" }));
    expect(cont()).toBeDisabled();

    const field = screen.getByLabelText(/who else is moving with you/i);
    fireEvent.change(field, { target: { value: "brother, sister, father, mother" } });
    expect(cont()).toBeEnabled();
  });

  it("gives the household list 200 characters, not the 50 a label gets", async () => {
    mockProfileApi();
    await goToHousehold();

    fireEvent.click(screen.getByRole("radio", { name: "Other" }));
    expect(screen.getByLabelText(/who else is moving with you/i)).toHaveAttribute(
      "maxLength",
      "200",
    );
  });

  it("sends the free text and clears the child ages", async () => {
    const { patches } = mockProfileApi();
    await goToHousehold();

    fireEvent.click(screen.getByRole("radio", { name: "Other" }));
    fireEvent.change(screen.getByLabelText(/who else is moving with you/i), {
      target: { value: "brother, sister" },
    });
    fireEvent.click(cont());

    await heading(/will you bring any pets/i);
    expect(patches.at(-1)).toEqual({
      household_type: "other",
      children_ages: null,
      household_other: "brother, sister",
    });
  });
});

