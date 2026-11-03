import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { submitFeedback, routerPush } = vi.hoisted(() => ({
  submitFeedback: vi.fn(),
  routerPush: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: routerPush }),
}));

vi.mock("../../lib/supabase/client", () => ({
  isSupabaseConfigured: () => false,
  getSupabaseClient: () => ({ auth: { signOut: vi.fn() } }),
  getAccessToken: vi.fn(async () => "token"),
}));

vi.mock("../../lib/supabase/useSession", () => ({
  useSession: () => ({ session: null, loading: false, configured: false }),
}));

vi.mock("../../lib/feedback/feedbackApi", async () => {
  const actual = await vi.importActual<typeof import("../../lib/feedback/feedbackApi")>(
    "../../lib/feedback/feedbackApi",
  );
  return { ...actual, submitFeedback };
});

import { FeedbackError } from "../../lib/feedback/feedbackApi";
import FeedbackPage from "../feedback/page";

function chooseType(label: string) {
  fireEvent.click(screen.getByRole("button", { name: /select feedback type/i }));
  fireEvent.click(screen.getByRole("option", { name: label }));
}

function fillValidForm() {
  fireEvent.click(screen.getByRole("radio", { name: "4 stars" }));
  chooseType("Bug Report");
}

function typeMessage(text: string) {
  fireEvent.change(screen.getByLabelText("Tell us More:"), { target: { value: text } });
}

describe("feedback page", () => {
  beforeEach(() => {
    submitFeedback.mockReset();
    submitFeedback.mockResolvedValue(undefined);
    routerPush.mockReset();
  });

  // ---- Feedback_1 ----

  it("renders the form at rest", () => {
    render(<FeedbackPage />);

    expect(screen.getByRole("heading", { name: "Share your feedback" })).toBeInTheDocument();
    expect(screen.getByText("How was your experience?")).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(5);
    expect(screen.getByLabelText("Tell us More:")).toBeInTheDocument();
  });

  it("starts with no feedback type selected, so the field cannot be left on a default", () => {
    render(<FeedbackPage />);

    expect(screen.getByRole("button", { name: /select feedback type/i })).toBeInTheDocument();
    expect(screen.queryByText("Suggestion")).not.toBeInTheDocument();
  });

  it("disables Submit until a rating and a type are both chosen", async () => {
    render(<FeedbackPage />);

    const submit = screen.getByRole("button", { name: "Submit Feedback" });
    expect(submit).toBeDisabled();

    fireEvent.click(screen.getByRole("radio", { name: "4 stars" }));
    expect(submit).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: /select feedback type/i }));
    fireEvent.click(screen.getByRole("option", { name: "Bug Report" }));
    expect(submit).toBeEnabled();
  });

  it("does not require the free text", async () => {
    render(<FeedbackPage />);

    fillValidForm();

    expect(screen.getByRole("button", { name: "Submit Feedback" })).toBeEnabled();
  });

  it("marks stars up to the one clicked", async () => {
    render(<FeedbackPage />);

    fireEvent.click(screen.getByRole("radio", { name: "3 stars" }));

    expect(screen.getByRole("radio", { name: "3 stars" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "4 stars" })).not.toBeChecked();
  });

  // ---- Feedback_2 ----

  it("opens the type menu with all six options in the design's order", async () => {
    render(<FeedbackPage />);

    fireEvent.click(screen.getByRole("button", { name: /select feedback type/i }));

    expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual([
      "Suggestion",
      "Feature Request",
      "Bug Report",
      "Complaint",
      "General Feedback",
      "Other",
    ]);
  });

  it("closes the menu and shows the choice once a type is picked", async () => {
    render(<FeedbackPage />);

    fireEvent.click(screen.getByRole("button", { name: /select feedback type/i }));
    fireEvent.click(screen.getByRole("option", { name: "Complaint" }));

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /complaint/i })).toBeInTheDocument();
  });

  it("closes the menu on Escape", async () => {
    render(<FeedbackPage />);

    fireEvent.click(screen.getByRole("button", { name: /select feedback type/i }));
    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  // ---- submit ----

  it("sends the rating, type and message", async () => {
    render(<FeedbackPage />);

    fillValidForm();
    typeMessage("Search is broken");
    fireEvent.click(screen.getByRole("button", { name: "Submit Feedback" }));

    await waitFor(() =>
      expect(submitFeedback).toHaveBeenCalledWith({
        rating: 4,
        feedbackType: "bug_report",
        message: "Search is broken",
      }),
    );
  });

  // ---- Feedback_3 ----

  it("shows the thanks dialog after a successful submission", async () => {
    render(<FeedbackPage />);

    fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: "Submit Feedback" }));

    expect(await screen.findByRole("dialog")).toHaveTextContent("Thanks for Your Feedback");
  });

  // ---- Feedback_4 ----

  it("sends the user to Profile Overview when the dialog is closed", async () => {
    render(<FeedbackPage />);

    fillValidForm();
    typeMessage("Something");
    fireEvent.click(screen.getByRole("button", { name: "Submit Feedback" }));

    fireEvent.click(await screen.findByRole("button", { name: "Close" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(routerPush).toHaveBeenCalledWith("/profile");
  });

  it("clears the answers on the way out, so a back navigation cannot show them as unsent", async () => {
    render(<FeedbackPage />);

    fillValidForm();
    typeMessage("Something");
    fireEvent.click(screen.getByRole("button", { name: "Submit Feedback" }));
    fireEvent.click(await screen.findByRole("button", { name: "Close" }));

    expect(screen.getByLabelText("Tell us More:")).toHaveValue("");
    expect(screen.getByRole("radio", { name: "4 stars" })).not.toBeChecked();
    expect(screen.getByRole("button", { name: /select feedback type/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Submit Feedback" })).toBeDisabled();
  });

  it("does not leave a banner behind on the feedback page", async () => {
    render(<FeedbackPage />);

    fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: "Submit Feedback" }));
    fireEvent.click(await screen.findByRole("button", { name: "Close" }));

    expect(screen.queryByText("Feedback Received Successfully")).not.toBeInTheDocument();
  });

  it("closes the dialog and redirects on Escape too", async () => {
    render(<FeedbackPage />);

    fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: "Submit Feedback" }));
    await screen.findByRole("dialog");

    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(routerPush).toHaveBeenCalledWith("/profile");
  });

  it("does not navigate while the dialog is still open", async () => {
    render(<FeedbackPage />);

    fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: "Submit Feedback" }));
    await screen.findByRole("dialog");

    expect(routerPush).not.toHaveBeenCalled();
  });

  // ---- failure (not in the mock) ----

  it("shows the server's message and keeps what the user typed when the save fails", async () => {
    submitFeedback.mockRejectedValue(new FeedbackError("You have sent a lot of feedback today.", 429));
    render(<FeedbackPage />);

    fillValidForm();
    typeMessage("Keep this");
    fireEvent.click(screen.getByRole("button", { name: "Submit Feedback" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "You have sent a lot of feedback today.",
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Tell us More:")).toHaveValue("Keep this");
    expect(routerPush).not.toHaveBeenCalled();
  });

  it("does not leak a raw exception to the user", async () => {
    submitFeedback.mockRejectedValue(new TypeError("Failed to fetch"));
    render(<FeedbackPage />);

    fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: "Submit Feedback" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("We could not save your feedback. Please try again.");
    expect(alert).not.toHaveTextContent("Failed to fetch");
  });
});

