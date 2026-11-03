import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const signInWithOtp = vi.fn();
const routerReplace = vi.fn();
const routerPush = vi.fn();
const fetchMock = vi.fn();
const sessionState = { session: null as unknown, loading: false, configured: true };

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: routerReplace, push: routerPush }),
}));
vi.mock("../../lib/supabase/client", () => ({
  isSupabaseConfigured: () => true,
  getSupabaseClient: () => ({ auth: { signInWithOtp } }),
  getAccessToken: vi.fn(),
}));
vi.mock("../../lib/supabase/useSession", () => ({ useSession: () => sessionState }));

import SignUpPage from "../signup/page";

const emailField = () => screen.getByLabelText("Email");
const continueButton = () => screen.getByRole("button", { name: "Continue" });

describe("ONB-01 sign up / ONB-02 verify email", () => {
  beforeEach(() => {
    signInWithOtp.mockReset();
    routerReplace.mockReset();
    sessionState.session = null;
    signInWithOtp.mockResolvedValue({ error: null });
    routerPush.mockReset();
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ registered: false }) });
    vi.stubGlobal("fetch", fetchMock);
    sessionStorage.clear();
  });

  it("shows the sign-up card, welcome panel, legal links and Login", () => {
    render(<SignUpPage />);

    expect(screen.getByRole("banner")).toHaveTextContent("KnewSooner");
    expect(screen.getByRole("heading", { name: "Sign Up" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Welcome to KnewSooner!" })).toBeInTheDocument();
    expect(
      screen.getByText("What you’ll wish you knew. Sooner."),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Considering a move to Toronto, preparing to arrive, or settling in? Get practical local knowledge, useful resources, and AI-assisted guidance tailored to your situation.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Save time, reduce stress, and avoid preventable mistakes."),
    ).toBeInTheDocument();
    expect(screen.getByText('Create your account to get started.')).toBeInTheDocument();
    expect(screen.queryByText(/A new city brings exciting possibilities/)).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter your email address")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "terms of service" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "privacy policy" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Login" })).toHaveAttribute("href", "/login");
  });

  it("opens the privacy statement without requiring a session", async () => {
    render(<SignUpPage />);
    fireEvent.click(screen.getByRole("button", { name: "privacy policy" }));

    expect(await screen.findByRole("dialog", { name: "Privacy Statement" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close privacy statement" })).toBeInTheDocument();
  });

  it("opens and closes the Terms of Service modal", async () => {
    render(<SignUpPage />);
    fireEvent.click(screen.getByRole("button", { name: "terms of service" }));

    expect(await screen.findByRole("dialog", { name: "Terms of Service" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close terms of service" })).toHaveFocus();

    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: "Terms of Service" })).not.toBeInTheDocument(),
    );
  });

  it("keeps Continue disabled until the email looks valid", () => {
    render(<SignUpPage />);
    expect(continueButton()).toBeDisabled();
    fireEvent.change(emailField(), { target: { value: "amy@" } });
    expect(continueButton()).toBeDisabled();
    fireEvent.change(emailField(), { target: { value: "amy@example.com" } });
    expect(continueButton()).toBeEnabled();
  });

  it("sends an open sign-up email and shows Verify Your Email", async () => {
    render(<SignUpPage />);
    fireEvent.change(emailField(), { target: { value: "  amy@example.com " } });
    fireEvent.click(continueButton());

    await waitFor(() => expect(signInWithOtp).toHaveBeenCalledTimes(1));
    const arg = signInWithOtp.mock.calls[0][0];
    expect(arg.email).toBe("amy@example.com");
    expect(arg.options.shouldCreateUser).toBe(true);
    expect(arg.options.emailRedirectTo).toMatch(/\/auth\/callback$/);

    expect(await screen.findByRole("heading", { name: "Verify Your Email" })).toBeInTheDocument();
    expect(screen.getByText("amy@example.com")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /resend in \d+s/i })).toBeDisabled();
  });

  it("Change email address returns to the form with the address filled in", async () => {
    render(<SignUpPage />);
    fireEvent.change(emailField(), { target: { value: "amy@example.com" } });
    fireEvent.click(continueButton());
    fireEvent.click(await screen.findByRole("button", { name: "Change email address" }));

    expect(screen.getByRole("heading", { name: "Sign Up" })).toBeInTheDocument();
    expect(emailField()).toHaveValue("amy@example.com");
  });

  it("shows a friendly message when the pilot is full", async () => {
    signInWithOtp.mockResolvedValue({
      error: new Error("The pilot is full. We are not accepting new sign-ups right now."),
    });
    render(<SignUpPage />);
    fireEvent.change(emailField(), { target: { value: "amy@example.com" } });
    fireEvent.click(continueButton());

    expect(await screen.findByRole("alert")).toHaveTextContent(/pilot is full right now/i);
    expect(screen.queryByRole("heading", { name: "Verify Your Email" })).not.toBeInTheDocument();
  });

  it("explains an email rate limit instead of showing the raw error", async () => {
    signInWithOtp.mockResolvedValue({ error: new Error("email rate limit exceeded") });
    render(<SignUpPage />);
    fireEvent.change(emailField(), { target: { value: "amy@example.com" } });
    fireEvent.click(continueButton());
    expect(await screen.findByRole("alert")).toHaveTextContent(/wait a few minutes/i);
  });

  it("forwards an already signed-in user to their next step without flashing the form", () => {
    sessionState.session = { user: { user_metadata: { has_password: true } } };
    render(<SignUpPage />);
    expect(routerReplace).toHaveBeenCalledWith("/create-account");
    expect(screen.queryByRole("heading", { name: "Sign Up" })).not.toBeInTheDocument();
  });

  it("shows nothing but the background while the session is still loading", () => {
    sessionState.loading = true;
    render(<SignUpPage />);
    expect(screen.queryByRole("heading", { name: "Sign Up" })).not.toBeInTheDocument();
    expect(routerReplace).not.toHaveBeenCalled();
    sessionState.loading = false;
  });

  it("checks the address with the API before sending anything", async () => {
    render(<SignUpPage />);
    fireEvent.change(emailField(), { target: { value: "amy@example.com" } });
    fireEvent.click(continueButton());
    await waitFor(() => expect(signInWithOtp).toHaveBeenCalled());
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/auth\/email-status$/);
    expect(JSON.parse(init.body)).toEqual({ email: "amy@example.com" });
  });

  it("sends an existing user to Login instead of emailing a sign-up link", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ registered: true }) });
    render(<SignUpPage />);
    fireEvent.change(emailField(), { target: { value: "amy@example.com" } });
    fireEvent.click(continueButton());

    expect(await screen.findByText(/an account already exists for/i)).toBeInTheDocument();
    expect(signInWithOtp).not.toHaveBeenCalled();
    expect(continueButton()).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Go to Login" }));
    expect(routerPush).toHaveBeenCalledWith("/login");
    expect(sessionStorage.getItem("ma_login_email")).toBe("amy@example.com");
  });

  it("clears the notice when the email is edited", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ registered: true }) });
    render(<SignUpPage />);
    fireEvent.change(emailField(), { target: { value: "amy@example.com" } });
    fireEvent.click(continueButton());
    await screen.findByText(/an account already exists for/i);
    fireEvent.change(emailField(), { target: { value: "other@example.com" } });
    expect(screen.queryByText(/an account already exists for/i)).not.toBeInTheDocument();
    expect(continueButton()).toBeEnabled();
  });

  it.each([
    ["the API is unreachable", () => fetchMock.mockRejectedValue(new TypeError("Failed to fetch"))],
    ["the endpoint is missing (old API)", () =>
      fetchMock.mockResolvedValue({ ok: false, status: 404, json: async () => ({}) })],
    ["the database check fails (migration not applied)", () =>
      fetchMock.mockResolvedValue({ ok: false, status: 503, json: async () => ({}) })],
    ["the response is malformed", () =>
      fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) })],
  ])("does NOT email anyone when %s", async (_label, arrange) => {
    arrange();
    render(<SignUpPage />);
    fireEvent.change(emailField(), { target: { value: "amy@example.com" } });
    fireEvent.click(continueButton());
    expect(await screen.findByRole("alert")).toHaveTextContent(/couldn't check your email/i);
    expect(signInWithOtp).not.toHaveBeenCalled();
    expect(screen.queryByRole("heading", { name: "Verify Your Email" })).not.toBeInTheDocument();
  });

  it("does NOT email anyone when rate-limited, and says why", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 429, json: async () => ({}) });
    render(<SignUpPage />);
    fireEvent.change(emailField(), { target: { value: "amy@example.com" } });
    fireEvent.click(continueButton());
    expect(await screen.findByRole("alert")).toHaveTextContent(/too many attempts/i);
    expect(signInWithOtp).not.toHaveBeenCalled();
  });
});

