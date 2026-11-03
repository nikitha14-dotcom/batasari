import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import AICopilot from "@/components/copilot/AICopilot";
import * as copilotService from "@/lib/copilot/copilotService";
import * as answerFeedbackApi from "@/lib/copilot/answerFeedbackApi";

vi.mock("@/lib/supabase/client", () => ({
  getAccessToken: vi.fn().mockResolvedValue("fake-token"),
  isSupabaseConfigured: () => true,
  getSupabaseClient: () => ({ auth: { signOut: vi.fn() } }),
}));

describe("AICopilot Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders copilot header and empty state by default", () => {
    render(<AICopilot />);

    expect(screen.getByText("AI Co-Pilot")).toBeInTheDocument();
    expect(screen.getByText("Ask your AI advisor")).toBeInTheDocument();
    expect(
      screen.getByText("I don't have a Canadian job offer or credit history, how do I make my rental application competitive?")
    ).toBeInTheDocument();
    expect(
      screen.getByText("How does winter affect my commute planning in Toronto?")
    ).toBeInTheDocument();
  });

  it("can send a message through input", async () => {
    const getCopilotResponseSpy = vi
      .spyOn(copilotService, "getCopilotResponse")
      .mockImplementation(async ({ onComplete }) => {
        onComplete?.({
          answer: "Here is advice on lease agreements.",
          sources: [{ title: "Ontario Tenant Rights", url: "https://example.com/tenant" }],
        });
      });

    render(<AICopilot />);

    const input = screen.getByPlaceholderText("Ask anything...");
    const sendBtn = screen.getByRole("button", { name: "Send message" });

    fireEvent.change(input, { target: { value: "Tell me about leases" } });
    fireEvent.click(sendBtn);

    expect(screen.getByText("Tell me about leases")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Here is advice on lease agreements.")).toBeInTheDocument();
      expect(screen.getByText(/Ontario Tenant Rights/)).toBeInTheDocument();
    });

    expect(getCopilotResponseSpy).toHaveBeenCalled();
  });

  it("renders assistant response formatted as Markdown", async () => {
    vi.spyOn(copilotService, "getCopilotResponse").mockImplementation(
      async ({ onComplete }) => {
        onComplete?.({
          answer: "# Heading 1\n\n- **Bold Item 1**\n- *Italic Item 2*",
          sources: [],
        });
      }
    );

    render(<AICopilot />);

    const input = screen.getByPlaceholderText("Ask anything...");
    const sendBtn = screen.getByRole("button", { name: "Send message" });

    fireEvent.change(input, { target: { value: "Give me markdown" } });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      // Heading 1 should be rendered as an h1 element
      const heading = screen.getByRole("heading", { level: 1, name: "Heading 1" });
      expect(heading).toBeInTheDocument();
      // Strong text should be rendered as a strong tag
      expect(screen.getByText("Bold Item 1").tagName.toLowerCase()).toBe("strong");
      // Italic text should be rendered as an em tag
      expect(screen.getByText("Italic Item 2").tagName.toLowerCase()).toBe("em");
    });
  });

  it("handles thumbs up and thumbs down feedback", async () => {
    const runId = "11111111-1111-1111-1111-111111111111";
    const save = vi.spyOn(answerFeedbackApi, "saveAnswerRating").mockResolvedValue({ rating: 1, version: 1 });
    const remove = vi.spyOn(answerFeedbackApi, "removeAnswerRating").mockResolvedValue({ rating: null, version: 2 });
    vi.spyOn(copilotService, "getCopilotResponse").mockImplementation(
      async ({ onComplete }) => {
        onComplete?.({
          answer: "Helpful answer here.",
          sources: [],
          metadata: { run_id: runId },
        });
      }
    );

    render(<AICopilot />);

    const input = screen.getByPlaceholderText("Ask anything...");
    const sendBtn = screen.getByRole("button", { name: "Send message" });

    fireEvent.change(input, { target: { value: "Test feedback" } });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(screen.getByText("Helpful answer here.")).toBeInTheDocument();
    });

    const thumbsUpBtn = screen.getByRole("button", { name: "Thumbs up" });
    const thumbsDownBtn = screen.getByRole("button", { name: "Thumbs down" });

    expect(thumbsUpBtn).toBeInTheDocument();
    expect(thumbsDownBtn).toBeInTheDocument();

    fireEvent.click(thumbsUpBtn);
    await waitFor(() => expect(save).toHaveBeenCalledWith(runId, 1, 0));
    fireEvent.click(thumbsUpBtn);
    await waitFor(() => expect(remove).toHaveBeenCalledWith(runId, 1));
  });

  it("restores saved answer ratings only for history with a stable run ID", async () => {
    const runId = "11111111-1111-1111-1111-111111111111";
    const history = vi
      .spyOn(copilotService, "getConversationHistory")
      .mockResolvedValue([
        { question: "Saved question", answer: "Saved answer", run_id: runId },
        { question: "Older question", answer: "Older answer" },
      ]);
    const ratings = vi.spyOn(answerFeedbackApi, "getAnswerRatings").mockResolvedValue({
      [runId]: { rating: 1, version: 4 },
    });

    render(<AICopilot />);

    await waitFor(() => {
      expect(screen.getByText("Saved answer")).toBeInTheDocument();
    });
    expect(ratings).toHaveBeenCalledWith([runId]);
    expect(screen.getAllByRole("button", { name: "Thumbs up" })[0].className).toMatch(
      /feedbackActive/
    );
    history.mockRestore();
    ratings.mockRestore();
  });

  it("restores the confirmed rating when feedback persistence fails", async () => {
    const runId = "22222222-2222-2222-2222-222222222222";
    vi.spyOn(answerFeedbackApi, "saveAnswerRating").mockRejectedValue(new Error("offline"));
    vi.spyOn(copilotService, "getCopilotResponse").mockImplementation(
      async ({ onComplete }) => {
        onComplete?.({ answer: "Answer whose rating cannot be saved.", sources: [], metadata: { run_id: runId } });
      }
    );

    render(<AICopilot />);
    fireEvent.change(screen.getByPlaceholderText("Ask anything..."), { target: { value: "Rate this" } });
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));

    await screen.findByText("Answer whose rating cannot be saved.");
    const thumbsUp = screen.getByRole("button", { name: "Thumbs up" });
    fireEvent.click(thumbsUp);

    await waitFor(() => expect(thumbsUp.className).not.toMatch(/feedbackActive/));
  });

  it("displays error message and retry button on failure", async () => {
    vi.spyOn(copilotService, "getCopilotResponse").mockImplementation(
      async ({ onError }) => {
        onError?.({ message: "Service is temporarily unavailable." });
      }
    );

    render(<AICopilot />);

    const starterBtn = screen.getByRole("button", {
      name: "I don't have a Canadian job offer or credit history, how do I make my rental application competitive?",
    });
    fireEvent.click(starterBtn);

    expect(
      await screen.findByText("Service is temporarily unavailable.")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Retry sending message" })
    ).toBeInTheDocument();
  });

  it("shows confirm dialog when 'Clear conversation' is clicked from the settings menu", async () => {
    render(<AICopilot />);

    // Open the settings menu
    const settingsBtn = screen.getByRole("button", { name: "Settings" });
    fireEvent.click(settingsBtn);

    // Click 'Clear conversation'
    const clearBtn = screen.getByText("🗑 Clear conversation");
    fireEvent.click(clearBtn);

    // Confirm dialog should appear
    await waitFor(() => {
      expect(screen.getByText("Clear conversation")).toBeInTheDocument();
      expect(
        screen.getByText(/delete your conversation history/)
      ).toBeInTheDocument();
    });

    // Cancel should dismiss
    const cancelBtn = screen.getByRole("button", { name: "Cancel" });
    fireEvent.click(cancelBtn);

    await waitFor(() => {
      expect(
        screen.queryByText(/delete your conversation history/)
      ).not.toBeInTheDocument();
    });
  });

  it("shows confirm dialog when 'Clear AI memory' is clicked from the settings menu", async () => {
    render(<AICopilot />);

    // Open the settings menu
    const settingsBtn = screen.getByRole("button", { name: "Settings" });
    fireEvent.click(settingsBtn);

    // Click 'Clear AI memory'
    const clearMemoryBtn = screen.getByText("🧹 Clear AI memory");
    fireEvent.click(clearMemoryBtn);

    // Confirm dialog should appear
    await waitFor(() => {
      expect(screen.getByText("Clear AI memory")).toBeInTheDocument();
      expect(
        screen.getByText(/delete all insights/)
      ).toBeInTheDocument();
    });
  });

  it("calls deleteConversationHistory and clears messages when confirmed", async () => {
    const deleteConvSpy = vi
      .spyOn(copilotService, "deleteConversationHistory")
      .mockResolvedValue(undefined);

    vi.spyOn(copilotService, "getCopilotResponse").mockImplementation(
      async ({ onComplete }) => {
        onComplete?.({
          answer: "Test response.",
          sources: [],
        });
      }
    );

    render(<AICopilot />);

    // Send a message first so there are messages to clear
    const input = screen.getByPlaceholderText("Ask anything...");
    const sendBtn = screen.getByRole("button", { name: "Send message" });
    fireEvent.change(input, { target: { value: "Hello" } });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(screen.getByText("Test response.")).toBeInTheDocument();
    });

    // Open settings menu and click Clear conversation
    const settingsBtn = screen.getByRole("button", { name: "Settings" });
    fireEvent.click(settingsBtn);
    const clearBtn = screen.getByText("🗑 Clear conversation");
    fireEvent.click(clearBtn);

    // Confirm the delete
    await waitFor(() => {
      expect(screen.getByText("Clear conversation")).toBeInTheDocument();
    });
    const confirmBtn = screen.getByRole("button", { name: "Clear" });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(deleteConvSpy).toHaveBeenCalledWith("Housing");
    });

    // Messages should be cleared, empty state should return
    await waitFor(() => {
      expect(screen.getByText("Ask your AI advisor")).toBeInTheDocument();
    });
  });
});

