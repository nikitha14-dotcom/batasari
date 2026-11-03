"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

import { Icon } from "@/components/navigation/icons";

import styles from "./housing.module.css";

/**
 * Plain dialog for the Housing "Learn more" popups.
 *
 * components/ui/Modal is the feedback "thanks" dialog: it always paints a
 * 56px check badge and repeats the title above the content, which is right
 * for a confirmation and wrong for these -- the frames show the green card
 * alone under a bare close button. This keeps Modal's keyboard behaviour
 * (Escape closes, Tab stays inside, focus returns on close) and drops the
 * chrome.
 *
 * The scrim is rgba(255,255,255,0.1), as in the frames: the page behind is
 * meant to stay visible rather than dim.
 */
export function HousingPopup({
  label,
  onClose,
  children,
}: {
  /** Names the dialog for screen readers; not painted, per the frames. */
  label: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const labelId = useId();

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    cardRef.current?.querySelector<HTMLElement>("button, [href]")?.focus();

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
        className={styles.scrimInner}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelId}
      >
        <span id={labelId} className={styles.srOnly}>
          {label}
        </span>

        <button
          type="button"
          className={styles.popupClose}
          onClick={onClose}
          aria-label="Close housing details"
        >
          <Icon name="x" size={22} />
        </button>

        {children}
      </div>
    </div>
  );
}

