"use client";

import { memo } from "react";
import styles from "./copilot.module.css";

export interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <div className={styles.confirmOverlay} onClick={onCancel}>
      <div
        className={styles.confirmDialog}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
      >
        <h3 id="confirm-title" className={styles.confirmTitle}>
          {title}
        </h3>
        <p id="confirm-message" className={styles.confirmMessage}>
          {message}
        </p>
        <div className={styles.confirmActions}>
          <button
            className={styles.confirmCancelBtn}
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            className={styles.confirmDeleteBtn}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default memo(ConfirmDialog);

