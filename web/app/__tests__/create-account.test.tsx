import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const updateUser = vi.fn();
const routerReplace = vi.fn();
const sessionState = { session: null as unknown, loading: false, configured: true };

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: routerReplace, push: vi.fn() }),
}));
vi.mock("../../lib/supabase/client", () => ({
  isSupabaseConfigured: () => true,
  getSupabaseClient: () => ({ auth: { updateUser } }),
  getAccessToken: vi.fn(),
}));
vi.mock("../../lib/supabase/useSession", () => ({ useSession: () => sessionState }));
vi.mock("../../lib/supabase/RequireSession", () => ({
  RequireSession: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import CreateAccountPage from "../create-account/page";

const first = () => screen.getByLabelText(/First Name/);
const last = () => screen.getByLabelText(/Last Name/);
const display = () => screen.getByLabelText(/Choose a display name/);
const continueButton = () => screen.getByRole("button", { name: "Continue" });

describe("ONB-04 create account", () => {
  beforeEach(() => {
    updateUser.mockReset();
    routerReplace.mockReset();
    sessionState.session = { user: { user_metadata: { has_password: true } } };
    updateUser.mockResolvedValue({ data: {}, error: null });
  });

  it("shows the Figma fields with required/optional notes", () => {
    render(<CreateAccountPage />);
    expect(screen.getByRole("heading", { name: "Let’s get to know you!" })).toBeInTheDocument();
    expect(screen.getByText("(required)")).toBeInTheDocument();
    expect(screen.getAllByText("(optional)")).toHaveLength(2);
    expect(screen.getByText("This can be your name or a pseudonym.")).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: /product update emails/i })).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });

  it("needs a first name before Continue is enabled", () => {
    render(<CreateAccountPage />);
    expect(continueButton()).toBeDisabled();
    fireEvent.change(first(), { target: { value: "   " } });
    expect(continueButton()).toBeDisabled();
    fireEvent.change(first(), { target: { value: "Amy" } });
    expect(continueButton()).toBeEnabled();
  });

  it("saves cleaned names and the opt-in to account metadata, then goes to ONB-05", async () => {
    render(<CreateAccountPage />);
    fireEvent.change(first(), { target: { value: "  Amy  " } });
    fireEvent.change(last(), { target: { value: "Bennet" } });
    fireEvent.change(display(), { target: { value: "Maple\n" } });
    fireEvent.click(screen.getByRole("switch"));
    fireEvent.click(continueButton());

    await waitFor(() =>
      expect(updateUser).toHaveBeenCalledWith({
        data: {
          first_name: "Amy",
          last_name: "Bennet",
          display_name: "Maple",
          product_updates_opt_in: true,
        },
      }),
    );
    await waitFor(() => expect(routerReplace).toHaveBeenCalledWith("/onboarding"));
  });

  it("stores blank optional fields as null", async () => {
    render(<CreateAccountPage />);
    fireEvent.change(first(), { target: { value: "Amy" } });
    fireEvent.click(continueButton());
    await waitFor(() =>
      expect(updateUser).toHaveBeenCalledWith({
        data: { first_name: "Amy", last_name: null, display_name: null, product_updates_opt_in: false },
      }),
    );
  });

  it("pre-fills answers saved on an earlier visit", () => {
    sessionState.session = {
      user: { user_metadata: { first_name: "Amy", display_name: "Maple", product_updates_opt_in: true } },
    };
    render(<CreateAccountPage />);
    expect(first()).toHaveValue("Amy");
    expect(display()).toHaveValue("Maple");
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
  });

  it("shows a save failure and stays on the page", async () => {
    updateUser.mockResolvedValue({ data: {}, error: new Error("network down") });
    render(<CreateAccountPage />);
    fireEvent.change(first(), { target: { value: "Amy" } });
    fireEvent.click(continueButton());
    expect(await screen.findByRole("alert")).toHaveTextContent("network down");
    expect(routerReplace).not.toHaveBeenCalled();
  });

  it("caps each name field at 50 characters in the input", () => {
    render(<CreateAccountPage />);
    for (const field of [first(), last(), display()]) expect(field).toHaveAttribute("maxLength", "50");
  });
});

