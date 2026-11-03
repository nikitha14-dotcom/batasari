"use client";

import { memo, useEffect, useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Source } from "@/lib/copilot/copilotService";
import { safeExternalUrl } from "@/lib/copilot/safeUrl";
import type { AnswerRating } from "@/lib/copilot/answerFeedbackApi";
import styles from "./copilot.module.css";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  answerRunId?: string | null;
  rating?: AnswerRating | null;
  ratingVersion?: number;
}

export interface ChatMessageProps {
  message: Message;
  onRatingChange?: (message: Message, rating: AnswerRating | null) => void;
}

// Wide tables scroll inside the answer bubble instead of breaking the panel.
function MarkdownTable({ children }: { children?: ReactNode }) {
  return (
    <div className={styles.tableScroll}>
      <table>{children}</table>
    </div>
  );
}
function ChatMessage({ message, onRatingChange }: ChatMessageProps) {
  const isUser = message.role === "user";
  const hasSources = !isUser && message.sources && message.sources.length > 0;

  const [feedback, setFeedback] = useState<AnswerRating | null>(message.rating ?? null);

  useEffect(() => {
    setFeedback(message.rating ?? null);
  }, [message.rating]);

  const handleFeedback = (rating: AnswerRating) => {
    const next = feedback === rating ? null : rating;
    setFeedback(next);
    // Older history rows do not have a stable server answer ID. Preserve the
    // existing local toggle, but never guess an ID and attach feedback wrongly.
    if (message.answerRunId) onRatingChange?.(message, next);
  };

  if (isUser) {
    return (
      <div className={styles.messageRowUser}>
        <div className={styles.userBubble}>{message.content}</div>
      </div>
    );
  }

  return (
    <div className={styles.messageRowAssistant}>
      <div className={styles.assistantHeader}>
        <div className={styles.assistantAvatar} aria-hidden="true">
          AI
        </div>
        <span className={styles.assistantLabel}>AI Co-Pilot</span>
      </div>

      <div className={styles.assistantBubble}>
        <div className={styles.markdownContent}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{ table: MarkdownTable }}
          >
            {message.content}
          </ReactMarkdown>
        </div>

        {hasSources && (
          <div className={styles.sourcesWrapper}>
            <div className={styles.sourcesTitle}>Sources</div>
            <ul className={styles.sourcesList}>
              {message.sources!.map((source, idx) => {
                // Model-supplied. React escapes text but not href, so an
                // unchecked "javascript:" URL here would run on click.
                const href = safeExternalUrl(source.url);

                return (
                  <li key={idx} className={styles.sourcesItem}>
                    {href ? (
                      <a href={href} target="_blank" rel="noopener noreferrer">
                        [{idx + 1}] {source.title || href}
                      </a>
                    ) : (
                      // Still show the citation, just not as something
                      // clickable. Dropping it silently would hide that the
                      // assistant cited something.
                      <span>
                        [{idx + 1}] {source.title || source.url}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <div className={styles.feedbackWrapper}>
          <span className={styles.feedbackLabel}>Helpful?</span>
          <button
            type="button"
            className={`${styles.feedbackBtn} ${feedback === 1 ? styles.feedbackActive : ""}`}
            onClick={() => handleFeedback(1)}
            aria-label="Thumbs up"
            title="Helpful"
          >
            👍
          </button>
          <button
            type="button"
            className={`${styles.feedbackBtn} ${feedback === -1 ? styles.feedbackActive : ""}`}
            onClick={() => handleFeedback(-1)}
            aria-label="Thumbs down"
            title="Not helpful"
          >
            👎
          </button>
        </div>
      </div>
    </div>
  );
}

export default memo(ChatMessage);

