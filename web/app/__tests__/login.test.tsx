import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const resetPasswordForEmail = vi.fn();
const signInWithPassword = vi.fn();
const routerReplace = vi.fn();
const sessionState = { session: null as unknown, loading: false, configured: true };

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: routerReplace, push: vi.fn() }),
}));

vi.mock("../../lib/supabase/client", () => ({
  isSupabaseConfigured: () => true,
  getSupabaseClient: () => ({ auth: { resetPasswordForEmail, signInWithPassword } }),
  getAccessToken: vi.fn(),
}));

vi.mock("../../lib/supabase/useSession", () => ({ useSession: () => sessionState }));

import LoginPage from "../login/page";

const emailField = () => screen.getByLabelText("Email");

function useResetMode() {
  fireEvent.click(screen.getByRole("button", { name: "Forgot your password?" }));
}

describe("login page", () => {
  afterEach(() => vi.unstubAllGlobals());

  beforeEach(() => {
    resetPasswordForEmail.mockReset();
    signInWithPassword.mockReset();
    routerReplace.mockReset();
    vi.unstubAllEnvs();
    sessionState.session = null;
    sessionState.loading = false;
    resetPasswordForEmail.mockResolvedValue({ data: {}, error: null });
    sessionStorage.clear();
    signInWithPassword.mockResolvedValue({
      data: { user: { user_metadata: { has_password: true, first_name: "Amy" } } },
      error: null,
    });
  });

  it("uses the new design: Login heading, email + password, Sign up in the top bar", () => {
    render(<LoginPage />);

    expect(screen.getByRole("banner")).toHaveTextContent("KnewSooner");
    expect(screen.getByRole("heading", { name: "Login" })).toBeInTheDocument();
    expect(emailField()).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "password");
    expect(screen.getByRole("link", { name: "Sign up" })).toHaveAttribute("href", "/signup");
  });

  it("signs in with a password and goes to the user's next step", async () => {
    render(<LoginPage />);
    fireEvent.change(emailField(), { target: { value: " jia@example.com " } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "correct-horse" } });
    fireEvent.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() =>
      expect(signInWithPassword).toHaveBeenCalledWith({ email: "jia@example.com", password: "correct-horse" }),
    );
    await waitFor(() => expect(routerReplace).toHaveBeenCalledWith("/onboarding"));
  });

  it("explains wrong credentials in plain language", async () => {
    signInWithPassword.mockResolvedValue({ data: {}, error: new Error("Invalid login credentials") });
    render(<LoginPage />);
    fireEvent.change(emailField(), { target: { value: "jia@example.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "nope" } });
    fireEvent.click(screen.getByRole("button", { name: "Login" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/wrong email or password/i);
    expect(routerReplace).not.toHaveBeenCalled();
  });

  it("keeps Login disabled until there is a valid email and a password", () => {
    render(<LoginPage />);
    const login = screen.getByRole("button", { name: "Login" });
    expect(login).toBeDisabled();
    fireEvent.change(emailField(), { target: { value: "test.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "x" } });
    expect(login).toBeDisabled();
    fireEvent.change(emailField(), { target: { value: "test@example.com" } });
    expect(login).toBeEnabled();
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "" } });
    expect(login).toBeDisabled();
  });

  it("flags a malformed email once the field loses focus", () => {
    render(<LoginPage />);
    fireEvent.change(emailField(), { target: { value: "test.com" } });
    expect(screen.queryByText(/valid email/i)).not.toBeInTheDocument();
    fireEvent.blur(emailField());
    expect(screen.getByText("Enter a valid email, like name@example.com.")).toBeInTheDocument();
    expect(emailField()).toHaveAttribute("aria-invalid", "true");
  });

  it("does not send a reset link to a malformed address", () => {
    render(<LoginPage />);
    useResetMode();
    fireEvent.change(emailField(), { target: { value: "not-an-email" } });
    const send = screen.getByRole("button", { name: "Send reset link" });
    expect(send).toBeDisabled();
    fireEvent.click(send);
    expect(resetPasswordForEmail).not.toHaveBeenCalled();
  });

  it("has no 'New to KnewSooner' footer (Sign up is in the top bar)", () => {
    render(<LoginPage />);
    expect(screen.queryByText(/new to knewsooner/i)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign up" })).toHaveAttribute("href", "/signup");
  });

  it("opens the privacy statement without requiring a session", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ sections: [] }),
      }),
    );
    render(<LoginPage />);
    fireEvent.click(screen.getByRole("button", { name: "Privacy policy" }));

    expect(await screen.findByRole("dialog", { name: "Privacy Statement" })).toBeInTheDocument();
  });

  it("Forgot your password? switches to Reset Password with email only", () => {
    render(<LoginPage />);
    useResetMode();
    expect(screen.getByRole("heading", { name: "Reset Password" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Password")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Back to login" }));
    expect(screen.getByRole("heading", { name: "Login" })).toBeInTheDocument();
  });

  it("emails a recovery link that returns to /auth/callback", async () => {
    render(<LoginPage />);
    useResetMode();
    fireEvent.change(emailField(), { target: { value: " jia@example.com " } });
    fireEvent.click(screen.getByRole("button", { name: "Send reset link" }));

    await waitFor(() => expect(resetPasswordForEmail).toHaveBeenCalledTimes(1));
    const [address, options] = resetPasswordForEmail.mock.calls[0];
    expect(address).toBe("jia@example.com");
    expect(options.redirectTo).toMatch(/\/auth\/callback$/);
  });

  it("keeps the redirect absolute when NEXT_PUBLIC_SITE_URL is blank", async () => {
    // A blank env var is not nullish, so `??` kept it and produced the relative
    // "/auth/callback", which Supabase rejects.
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    render(<LoginPage />);
    useResetMode();
    fireEvent.change(emailField(), { target: { value: "jia@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Send reset link" }));

    await waitFor(() => expect(resetPasswordForEmail).toHaveBeenCalledTimes(1));
    expect(resetPasswordForEmail.mock.calls[0][1].redirectTo).toBe(`${window.location.origin}/auth/callback`);
  });

  it("confirms without revealing whether the account exists, and blocks an immediate resend", async () => {
    render(<LoginPage />);
    useResetMode();
    fireEvent.change(emailField(), { target: { value: "jia@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Send reset link" }));

    expect(await screen.findByRole("heading", { name: "Check Your Email" })).toBeInTheDocument();
    expect(screen.getByText(/if an account exists for/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /resend in \d+s/i })).toBeDisabled();
  });

  it("surfaces a Supabase failure instead of claiming the email was sent", async () => {
    resetPasswordForEmail.mockResolvedValue({ data: {}, error: new Error("email rate limit exceeded") });
    render(<LoginPage />);
    useResetMode();
    fireEvent.change(emailField(), { target: { value: "jia@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Send reset link" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/wait a few minutes/i);
    expect(screen.queryByRole("heading", { name: "Check Your Email" })).not.toBeInTheDocument();
  });

  it("forwards a signed-in user without flashing the form", () => {
    sessionState.session = { user: { user_metadata: { has_password: true } } };
    render(<LoginPage />);
    expect(routerReplace).toHaveBeenCalledWith("/create-account");
    expect(screen.queryByRole("heading", { name: "Login" })).not.toBeInTheDocument();
  });

  it("pre-fills the email handed over from Sign Up, once", () => {
    sessionStorage.setItem("ma_login_email", "amy@example.com");
    render(<LoginPage />);
    expect(emailField()).toHaveValue("amy@example.com");
    expect(sessionStorage.getItem("ma_login_email")).toBeNull();
  });
});

