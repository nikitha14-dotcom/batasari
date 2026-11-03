import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import ChatMessage from "../ChatMessage";

describe("ChatMessage answer feedback", () => {
  it("restores a saved rating and removes it when the selected thumb is clicked", () => {
    const onRatingChange = vi.fn();
    const message = {
      id: "answer-1",
      role: "assistant" as const,
      content: "An answer",
      answerRunId: "11111111-1111-1111-1111-111111111111",
      rating: 1 as const,
    };
    render(<ChatMessage message={message} onRatingChange={onRatingChange} />);

    const thumbsUp = screen.getByRole("button", { name: "Thumbs up" });
    expect(thumbsUp.className).toMatch(/feedbackActive/);
    fireEvent.click(thumbsUp);

    expect(onRatingChange).toHaveBeenCalledWith(message, null);
  });

  it("does not persist feedback for history that has no stable answer ID", () => {
    const onRatingChange = vi.fn();
    render(
      <ChatMessage
        message={{ id: "old-answer", role: "assistant", content: "Older answer" }}
        onRatingChange={onRatingChange}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Thumbs down" }));
    expect(onRatingChange).not.toHaveBeenCalled();
  });
});

