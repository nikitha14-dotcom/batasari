"use client";

import { useEffect, useState } from "react";

import {
  ContentRequestError,
  fetchSubcategoryContent,
  isEmpty,
  type SubcategoryContent,
} from "@/lib/content/contentApi";

import { PrivacyStatementBody } from "./PrivacyStatementBody";
import styles from "./privacy-statement-modal.module.css";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; content: SubcategoryContent };

export function PrivacyStatementModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!open) return;

    const controller = new AbortController();
    setState({ status: "loading" });
    fetchSubcategoryContent("Privacy Statement", "Privacy Statement", {
      signal: controller.signal,
    })
      .then((content) => setState({ status: "ready", content }))
      .catch((cause: unknown) => {
        if ((cause as Error)?.name === "AbortError") return;
        setState({
          status: "error",
          message: cause instanceof ContentRequestError ? cause.message : "Something went wrong.",
        });
      });

    return () => controller.abort();
  }, [attempt, open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className={styles.backdrop} role="presentation" onMouseDown={onClose}>
      <section
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="privacy-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className={styles.header}>
          <div>
            <h2 id="privacy-modal-title">Privacy Statement</h2>
            <p>Learn how Batasari handles information when you use the service.</p>
          </div>
          <button type="button" className={styles.close} aria-label="Close privacy statement" onClick={onClose}>
            ×
          </button>
        </header>

        <div className={styles.content}>
          {state.status === "loading" && <p role="status">Loading privacy statement…</p>}
          {state.status === "error" && (
            <div className={styles.error} role="alert">
              <p>Couldn&apos;t load the privacy statement. {state.message}</p>
              <button type="button" onClick={() => setAttempt((count) => count + 1)}>
                Try again
              </button>
            </div>
          )}
          {state.status === "ready" && isEmpty(state.content) && (
            <p role="status">The privacy statement is unavailable right now.</p>
          )}
          {state.status === "ready" && !isEmpty(state.content) && (
            <PrivacyStatementBody content={state.content} />
          )}
        </div>
      </section>
    </div>
  );
}

