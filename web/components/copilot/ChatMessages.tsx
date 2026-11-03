"use client";

import { useEffect, useRef, memo } from "react";
import ChatMessage, { type Message } from "./ChatMessage";
import LoadingIndicator from "./LoadingIndicator";
import ErrorMessage from "./ErrorMessage";
import type { AnswerRating } from "@/lib/copilot/answerFeedbackApi";
import styles from "./copilot.module.css";

export interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
  currentStage?: string | null;
  hasError: boolean;
  errorMessage?: string | null;
  onRetry: () => void;
  onRatingChange?: (message: Message, rating: AnswerRating | null) => void;
}

function ChatMessages({
  messages,
  isLoading,
  currentStage,
  hasError,
  errorMessage,
  onRetry,
  onRatingChange,
}: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Nothing to follow yet. Scrolling on the first, empty render dragged the
    // whole page down to the chat box on load, hiding the page heading.
    if (messages.length === 0 && !isLoading && !hasError) return;
    if (typeof bottomRef.current?.scrollIntoView === "function") {
      // "nearest" moves the page only as far as needed to show the latest line.
      bottomRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [messages, isLoading, currentStage, hasError]);

  return (
    <div className={styles.messagesContainer} role="log" aria-live="polite">
      {messages.map((msg) => (
        <ChatMessage key={msg.id} message={msg} onRatingChange={onRatingChange} />
      ))}

      {isLoading && <LoadingIndicator currentStage={currentStage} />}

      {hasError && <ErrorMessage error={errorMessage} onRetry={onRetry} />}

      {messages.length > 0 && (
        <p className={styles.disclaimer}>
          AI may make mistakes. Verify important information.
        </p>
      )}

      <div ref={bottomRef} aria-hidden="true" />
    </div>
  );
}

export default memo(ChatMessages);

