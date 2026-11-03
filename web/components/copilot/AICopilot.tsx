"use client";

import { useState, useCallback, useEffect, useRef } from "react";

import CopilotHeader from "./CopilotHeader";
import ConfirmDialog from "./ConfirmDialog";
import EmptyState from "./EmptyState";
import StarterQuestions from "./StarterQuestions";
import ChatMessages from "./ChatMessages";
import MessageInput from "./MessageInput";
import type { Message } from "./ChatMessage";
import {
  getCopilotResponse,
  deleteConversationHistory,
  deleteInsights,
  getConversationHistory,
  type Source,
} from "@/lib/copilot/copilotService";
import { defaultStarterQuestions, type StarterQuestion } from "@/lib/copilot/starterQuestions";
import {
  getAnswerRatings,
  removeAnswerRating,
  saveAnswerRating,
  type AnswerRating,
  type AnswerRatingState,
  AnswerFeedbackConflictError,
} from "@/lib/copilot/answerFeedbackApi";
import styles from "./copilot.module.css";

export interface AICopilotProps {
  isOpen?: boolean;
  onClose?: () => void;
  onOpen?: () => void;
  category?: string;
  subcategory?: string;
  conversationId?: string | null;
  /** Opening questions for this page. Defaults to the Housing set. */
  starterQuestions?: StarterQuestion[];
    /** Hide the maximize button, for pages where the copilot already fills the screen. */
  disableExpand?: boolean;
  /** The line under "Ask your AI advisor". Defaults to the Housing copy. */
  emptyStateDescription?: string;
}

function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 11);
}

export default function AICopilot({
  isOpen,
  onClose,
  onOpen,
  category = "Housing",
  subcategory = "Find Housing",
  conversationId = null,
  starterQuestions,
  emptyStateDescription,
  disableExpand = false,
}: AICopilotProps) {
  const [aiRestricted, setAiRestricted] = useState(false);
  useEffect(() => {
    const onStatus = (event: Event) => {
      const state = (event as CustomEvent<{ state?: string }>).detail?.state;
      setAiRestricted(state === "credit_exhausted" || state === "expired");
    };
    window.addEventListener("beta-status", onStatus);
    return () => window.removeEventListener("beta-status", onStatus);
  }, []);

  // ---- Panel visibility ----
  const [internalOpen, setInternalOpen] = useState(true);
  const panelOpen = isOpen !== undefined ? isOpen : internalOpen;

  const handleClose = useCallback(() => {
    if (onClose) onClose();
    else setInternalOpen(false);
  }, [onClose]);

  const handleOpen = useCallback(() => {
    if (onOpen) onOpen();
    else setInternalOpen(true);
  }, [onOpen]);

  // ---- Panel layout states ----
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  // ---- Conversation state ----
  const [messages, setMessages] = useState<Message[]>([]);
  const ratingStates = useRef<Record<string, AnswerRatingState>>({});
  const ratingChains = useRef<Record<string, Promise<void>>>({});
  const latestRatingAction = useRef<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastFailedContent, setLastFailedContent] = useState<string | null>(
    null
  );

  // ---- Streaming stage ----
  const [currentStage, setCurrentStage] = useState<string | null>(null);

  // ---- Sources / citations ----
  const [, setSources] = useState<Source[]>([]);

  // ---- Confirm dialog state ----
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    onConfirm: () => void;
  } | null>(null);

  // ---- Info click ----
  const handleInfoClick = useCallback(() => {
    // Info tooltip or help modal placeholder
  }, []);

    // ---- Restore the saved conversation ----
  // The backend saves every turn, but the panel started empty after a reload or
  // a new sign-in (BUG-004). Load this category's saved turns once on open.
  useEffect(() => {
    let active = true;
    Promise.resolve()
      .then(() => getConversationHistory(category))
      .then(async (turns) => {
        if (!active || turns.length === 0) return;
        const restored = turns.flatMap<Message>((turn) => [
          { id: generateId(), role: "user", content: turn.question ?? "" },
          {
            id: generateId(),
            role: "assistant",
            content: turn.answer ?? "",
            answerRunId: turn.run_id ?? null,
          },
        ]);
        const answerRunIds = restored.flatMap((message) =>
          message.answerRunId ? [message.answerRunId] : []
        );
        let ratings: Record<string, AnswerRatingState> = {};
        try {
          ratings = await getAnswerRatings(answerRunIds);
        } catch (err) {
          // History remains usable if feedback is temporarily unavailable.
          console.warn("[AICopilot] Could not load saved answer ratings:", err);
        }
        const rated = restored.map((message) =>
          message.answerRunId
            ? {
                ...message,
                rating: ratings[message.answerRunId]?.rating ?? null,
                ratingVersion: ratings[message.answerRunId]?.version ?? 0,
              }
            : message
        );
        if (!active) return;
        ratingStates.current = { ...ratingStates.current, ...ratings };
        // Keep anything typed while the history was loading.
        setMessages((current) =>
          current.length > 0 ? [...rated, ...current] : rated
        );
      })
      .catch((err) => {
        console.warn("[AICopilot] Could not load saved history:", err);
      });
    return () => {
      active = false;
    };
  }, [category]);

  // ---- Core message flow ----
  const handleSendMessage = useCallback(
    async (text: string) => {
      if (isLoading) return;

      // 1. Append user message
      const userMsg: Message = {
        id: generateId(),
        role: "user",
        content: text,
      };

      setMessages((prev) => [...prev, userMsg]);

      // 2. Reset request state
      setIsLoading(true);
      setHasError(false);
      setErrorMessage(null);
      setLastFailedContent(null);
      setCurrentStage(null);
      setSources([]);

      try {
        const controller = new AbortController();
        // Matches the backend's budget for one answer (web search can take
        // a couple of minutes). Change both together.
        const timeoutId = setTimeout(() => controller.abort(), 180000);

        await getCopilotResponse({
          question: text,
          category,
          subcategory,
          conversationId,
          signal: controller.signal,

          onStage: (stage) => {
            setCurrentStage(stage);
          },

          onComplete: (data) => {
            const assistantMsg: Message = {
              id: generateId(),
              role: "assistant",
              content: data.answer || "",
              sources: data.sources || [],
              answerRunId: data.metadata?.run_id ?? null,
              ratingVersion: 0,
            };

            setSources(data.sources || []);
            setMessages((prev) => [...prev, assistantMsg]);
            setCurrentStage(null);
            setErrorMessage(null);
          },

          onError: (error) => {
            console.error("[AICopilot] Backend error:", error);
            setHasError(true);
            setErrorMessage(
              error?.message || "Backend service returned an error."
            );
            if (
              error?.code === "spend_cap_reached" ||
              error?.code === "credit_limit_reached" ||
              error?.code === "beta_expired"
            ) {
              setAiRestricted(true);
            }
            setLastFailedContent(text);
            setCurrentStage(null);
          },
        });

        clearTimeout(timeoutId);
      } catch (err: any) {
        console.error("[AICopilot] getCopilotResponse failed:", err);

        const msg =
          err.name === "AbortError"
            ? "Request timed out after 3 minutes."
            : err.message || "Failed to connect to AI backend.";

        setHasError(true);
        setErrorMessage(msg);
        setLastFailedContent(text);
        setCurrentStage(null);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, category, subcategory, conversationId]
  );

  const handleAnswerRating = useCallback(
    async (message: Message, rating: AnswerRating | null) => {
      if (!message.answerRunId) return;
      const runId = message.answerRunId;
      const action = (latestRatingAction.current[runId] ?? 0) + 1;
      latestRatingAction.current[runId] = action;
      setMessages((current) =>
        current.map((entry) =>
          entry.id === message.id ? { ...entry, rating } : entry
        )
      );
      const previous = ratingChains.current[runId] ?? Promise.resolve();
      const operation = previous.catch(() => undefined).then(async () => {
        let state = ratingStates.current[runId] ?? {
          rating: message.rating ?? null,
          version: message.ratingVersion ?? 0,
        };
        try {
          // Retry the user's desired state against an authoritative version if
          // another tab/device changed it while this action was queued.
          for (let attempts = 0; attempts < 3; attempts += 1) {
            try {
              state = rating === null
                ? await removeAnswerRating(runId, state.version)
                : await saveAnswerRating(runId, rating, state.version);
              ratingStates.current[runId] = state;
              break;
            } catch (err) {
              if (!(err instanceof AnswerFeedbackConflictError) || attempts === 2) throw err;
              state = err.state;
              ratingStates.current[runId] = state;
            }
          }
          if (latestRatingAction.current[runId] === action) {
            setMessages((current) => current.map((entry) =>
              entry.id === message.id ? { ...entry, rating: state.rating, ratingVersion: state.version } : entry
            ));
          }
        } catch (err) {
          console.warn("[AICopilot] Could not save answer rating:", err);
          if (latestRatingAction.current[runId] === action) {
            setMessages((current) => current.map((entry) =>
              entry.id === message.id
                ? { ...entry, rating: state.rating, ratingVersion: state.version }
                : entry
            ));
          }
        }
      });
      ratingChains.current[runId] = operation;
      await operation;
    },
    []
  );

  // ---- Retry after error ----
  const handleRetry = useCallback(() => {
    if (lastFailedContent) {
      setHasError(false);
      setErrorMessage(null);
      handleSendMessage(lastFailedContent);
    }
  }, [lastFailedContent, handleSendMessage]);

  // ---- Delete handlers ----
  const handleClearConversation = useCallback(() => {
    setConfirmDialog({
      title: "Clear conversation",
      message:
        "This will delete your conversation history for this category. This action cannot be undone.",
      confirmLabel: "Clear",
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          await deleteConversationHistory(category);
          setMessages([]);
          setHasError(false);
          setErrorMessage(null);
        } catch (err) {
          console.error("[AICopilot] Failed to clear conversation:", err);
        }
      },
    });
  }, [category]);

  const handleClearMemory = useCallback(() => {
    setConfirmDialog({
      title: "Clear AI memory",
      message:
        "This will delete all insights the AI has learned about your preferences across all categories. This action cannot be undone.",
      confirmLabel: "Clear memory",
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          await deleteInsights();
        } catch (err) {
          console.error("[AICopilot] Failed to clear memory:", err);
        }
      },
    });
  }, []);

  const hasMessages = messages.length > 0;

  // ---- Render: closed -> show floating toggle button ----
  if (!panelOpen) {
    return (
      <button
        className={styles.floatingToggle}
        onClick={handleOpen}
        aria-label="Open AI Copilot"
      >
        <span aria-hidden="true">✦</span>
        <span>AI Co-Pilot</span>
      </button>
    );
  }

  // Construct class list combining existing .copilot with scoped state classes
  const panelClasses = [
    "copilot",
    isExpanded ? styles.copilotExpanded : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <aside
      className={panelClasses}
      role="complementary"
      aria-label="AI Co-Pilot"
    >
      <CopilotHeader
        isExpanded={isExpanded}
        onToggleExpand={toggleExpand}
        disableExpand={disableExpand}
        onClose={handleClose}
        onInfoClick={handleInfoClick}
        onClearConversation={handleClearConversation}
        onClearMemory={handleClearMemory}
      />

      <div className="copilot-body">
        {!hasMessages && <EmptyState description={emptyStateDescription} />}

        <StarterQuestions
          onSelect={handleSendMessage}
          disabled={isLoading}
          questions={starterQuestions ?? defaultStarterQuestions(category)}
        />

        <ChatMessages
          messages={messages}
          isLoading={isLoading}
          currentStage={currentStage}
          hasError={hasError}
          errorMessage={errorMessage}
          onRetry={handleRetry}
          onRatingChange={handleAnswerRating}
        />
      </div>

      <MessageInput
        onSend={handleSendMessage}
        disabled={isLoading || aiRestricted}
      />

      {confirmDialog && (
        <ConfirmDialog
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmLabel={confirmDialog.confirmLabel}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
    </aside>
  );
}

