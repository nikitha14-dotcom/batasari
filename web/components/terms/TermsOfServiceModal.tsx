"use client";

import { useEffect, useRef } from "react";

import styles from "@/components/privacy/privacy-statement-modal.module.css";

export function TermsOfServiceModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const previousFocus = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previousFocus?.focus();
    };
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className={styles.backdrop} role="presentation" onMouseDown={onClose}>
      <section
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="terms-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className={styles.header}>
          <div>
            <h2 id="terms-modal-title">Terms of Service</h2>
            <p>These general terms describe how Batasari may be used.</p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className={styles.close}
            aria-label="Close terms of service"
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <div className={styles.content}>
          <h3>Using Batasari</h3>
          <p>
            Batasari provides planning information and practical resources to help you prepare for a move within India or a stay in India. It is not a substitute for professional, legal, immigration, or financial advice.
          </p>

          <h3>Information and sources</h3>
          <p>
            We aim to provide useful and current information, but details can change. Please check
            official sources before making important decisions.
          </p>

          <h3>Your responsibilities</h3>
          <p>
            You are responsible for reviewing information, protecting your account, and deciding
            whether a resource or recommendation is right for you.
          </p>

          <h3>Updates</h3>
          <p>
            These general terms may be updated as the service develops. We will provide the latest
            version here.
          </p>
        </div>
      </section>
    </div>
  );
}

