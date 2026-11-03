import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const updateUser = vi.fn();
const routerReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: routerReplace, push: vi.fn() }),
}));

vi.mock("../../lib/supabase/client", () => ({
  isSupabaseConfigured: () => true,
  getSupabaseClient: () => ({ auth: { updateUser } }),
  getAccessToken: vi.fn(),
}));

// The gate is covered by require-session.test.tsx.
vi.mock("../../lib/supabase/RequireSession", () => ({
  RequireSession: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import SetPasswordPage from "../set-password/page";

function fill(password: string, confirmation: string) {
  fireEvent.change(screen.getByLabelText("Enter Password"), { target: { value: password } });
  fireEvent.change(screen.getByLabelText("Re-enter Password"), { target: { value: confirmation } });
}

const continueButton = () => screen.getByRole("button", { name: "Continue" });

describe("ONB-03 create password", () => {
  beforeEach(() => {
    updateUser.mockReset();
    routerReplace.mockReset();
    updateUser.mockResolvedValue({
      data: { user: { user_metadata: { has_password: true } } },
      error: null,
    });
  });

  it("shows the Figma heading and both fields", () => {
    render(<SetPasswordPage />);
    expect(screen.getByRole("heading", { name: "Create Password" })).toBeInTheDocument();
    expect(screen.getByText("Choose a password for your account")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter your password")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Confirm your password")).toBeInTheDocument();
  });

  it("keeps Continue disabled until the password is strong and re-entered", () => {
    render(<SetPasswordPage />);
    expect(continueButton()).toBeDisabled();
    fill("password", "password");
    expect(continueButton()).toBeDisabled();
    fill("Correct-horse1!", "");
    expect(continueButton()).toBeDisabled();
    fill("Correct-horse1!", "Correct-horse1!");
    expect(continueButton()).toBeEnabled();
  });

  it("ticks off each requirement as the password meets it", () => {
    render(<SetPasswordPage />);
    const list = screen.getByRole("list", { name: "Password requirements" });
    fireEvent.change(screen.getByLabelText("Enter Password"), { target: { value: "abc" } });
    expect(list).toHaveTextContent("A lowercase letter (met)");
    expect(list).toHaveTextContent("An uppercase letter (not yet)");
    fireEvent.change(screen.getByLabelText("Enter Password"), { target: { value: "Abcdefg1!" } });
    expect(list).not.toHaveTextContent("(not yet)");
  });

  it("saves the password, marks the account, and goes on to Create Account", async () => {
    render(<SetPasswordPage />);
    fill("Correct-horse1!", "Correct-horse1!");
    fireEvent.click(continueButton());

    await waitFor(() =>
      expect(updateUser).toHaveBeenCalledWith({
        password: "Correct-horse1!",
        data: { has_password: true },
      }),
    );
    await waitFor(() => expect(routerReplace).toHaveBeenCalledWith("/create-account"));
  });

  it("skips Create Account for a user who already gave their name", async () => {
    updateUser.mockResolvedValue({
      data: { user: { user_metadata: { has_password: true, first_name: "Amy" } } },
      error: null,
    });
    render(<SetPasswordPage />);
    fill("Correct-horse1!", "Correct-horse1!");
    fireEvent.click(continueButton());
    await waitFor(() => expect(routerReplace).toHaveBeenCalledWith("/onboarding"));
  });

  it("cannot submit a weak password", () => {
    render(<SetPasswordPage />);
    fill("Short1!", "Short1!");
    expect(continueButton()).toBeDisabled();
    fireEvent.click(continueButton());
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("rejects a mismatched confirmation without calling Supabase", async () => {
    render(<SetPasswordPage />);
    fill("Correct-horse1!", "Correct-horse1?");
    fireEvent.click(continueButton());

    expect(screen.getByText("Passwords do not match yet.")).toBeInTheDocument();
    expect(await screen.findByText(/those two passwords do not match/i)).toBeInTheDocument();
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("surfaces a Supabase failure instead of moving on", async () => {
    updateUser.mockResolvedValue({ data: {}, error: new Error("Password is too weak") });
    render(<SetPasswordPage />);
    fill("Correct-horse1!", "Correct-horse1!");
    fireEvent.click(continueButton());

    expect(await screen.findByText(/too weak/i)).toBeInTheDocument();
    expect(routerReplace).not.toHaveBeenCalled();
  });

  it("reveals and hides each password with its eye button", () => {
    render(<SetPasswordPage />);
    const field = screen.getByLabelText("Enter Password");
    expect(field).toHaveAttribute("type", "password");
    fireEvent.click(screen.getByRole("button", { name: "Show enter password" }));
    expect(field).toHaveAttribute("type", "text");
    fireEvent.click(screen.getByRole("button", { name: "Hide enter password" }));
    expect(field).toHaveAttribute("type", "password");
  });

  it("has no skip link (the design has none)", () => {
    render(<SetPasswordPage />);
    expect(screen.queryByRole("button", { name: /skip/i })).not.toBeInTheDocument();
  });

  it("says Reset Password when opened from a reset email", () => {
    window.history.replaceState({}, "", "/set-password?reset=1");
    render(<SetPasswordPage />);
    expect(screen.getByRole("heading", { name: "Reset Password" })).toBeInTheDocument();
    expect(screen.getByText("Choose a new password for your account")).toBeInTheDocument();
    window.history.replaceState({}, "", "/");
  });
});

