"use client";

import { memo } from "react";
import styles from "./copilot.module.css";

export interface ErrorMessageProps {
  error?: string | null;
  onRetry: () => void;
}

function ErrorMessage({ error, onRetry }: ErrorMessageProps) {
  return (
    <div className={styles.errorBubble} role="alert">
      <p className={styles.errorText}>
        {error || "Something went wrong. Please try again."}
      </p>
      <button
        className={styles.retryBtn}
        onClick={onRetry}
        aria-label="Retry sending message"
      >
        Retry
      </button>
    </div>
  );
}

export default memo(ErrorMessage);

