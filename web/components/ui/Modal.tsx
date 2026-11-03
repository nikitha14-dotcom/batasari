"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

import { Icon } from "@/components/navigation/icons";
import styles from "./ui.module.css";

/**
 * Scrim plus centred card ("thanks button", 771 x 509 over Rectangle 10).
 *
 * The design shows the scrim and the close control but says nothing about
 * keyboard behaviour. A dialog that cannot be dismissed with Escape and lets
 * Tab wander into the page behind it is a trap for keyboard users, so both
 * are handled here.
 *
 * `decoration` is painted behind the content for the confetti in Feedback_3;
 * `tone` switches the card to the design's green celebration skin.
 */
export function Modal({
  title,
  onClose,
  tone = "plain",
  decoration,
  children,
}: {
  title: string;
  onClose: () => void;
  tone?: "plain" | "celebration";
  decoration?: ReactNode;
  children: ReactNode;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    cardRef.current?.querySelector<HTMLElement>("button")?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = cardRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [onClose]);

  return (
    <div
      className={styles.scrim}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={cardRef}
        className={`${styles.modal} ${tone === "celebration" ? styles.modalCelebration : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <button
          type="button"
          className={styles.modalClose}
          onClick={onClose}
          aria-label="Close"
        >
          <Icon name="x" size={20} />
        </button>

        {decoration}

        <span className={styles.modalBadge} aria-hidden="true">
          <Icon name="check" size={56} />
        </span>

        <h2 className={styles.modalTitle} id={titleId}>
          {title}
        </h2>

        {children}
      </div>
    </div>
  );
}

