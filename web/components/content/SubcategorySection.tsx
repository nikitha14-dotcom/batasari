"use client";

import { useCallback, useEffect, useId, useState } from "react";

import {
  ContentRequestError,
  fetchSubcategoryContent,
  isEmpty,
  type SubcategoryContent,
} from "@/lib/content/contentApi";
import { subcategoryIcon } from "@/lib/content/categories";
import { Icon } from "@/components/navigation/icons";
import { ContentCard, Markdown } from "./ContentCard";
import styles from "./content.module.css";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; content: SubcategoryContent };

interface Props {
  category: string;
  subcategory: string;
  defaultOpen?: boolean;
  onOpenChange?: (subcategory: string, open: boolean) => void;
}

export function SubcategorySection({
  category,
  subcategory,
  defaultOpen = false,
  onOpenChange,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const [state, setState] = useState<LoadState>({
    status: "loading",
  });
  const [attempt, setAttempt] = useState(0);
  const panelId = useId();

  useEffect(() => {
    const controller = new AbortController();

    setState({ status: "loading" });

    fetchSubcategoryContent(category, subcategory, {
      signal: controller.signal,
    })
      .then((content) => {
        setState({
          status: "ready",
          content,
        });
      })
      .catch((err: unknown) => {
        if ((err as Error)?.name === "AbortError") {
          return;
        }

        const message =
          err instanceof ContentRequestError
            ? err.message
            : "Something went wrong.";

        setState({
          status: "error",
          message,
        });
      });

    return () => controller.abort();
  }, [category, subcategory, attempt]);

  const retry = useCallback(() => {
    setAttempt((value) => value + 1);
  }, []);

  const handleToggle = () => {
    const nextOpen = !open;

    setOpen(nextOpen);
    onOpenChange?.(subcategory, nextOpen);
  };

  const content = state.status === "ready" ? state.content : null;
  const summary = content?.description?.bodyMarkdown;

  return (
    <section
      className={`${styles.accordion} ${
        open ? styles.accordionOpen : ""
      }`}
    >
      <button
        type="button"
        className={styles.accordionHeader}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={handleToggle}
      >
        <span className={styles.accordionIcon}>
          <Icon name={subcategoryIcon(subcategory)} size={24} />
        </span>

        <span className={styles.accordionText}>
          <span className={styles.accordionTitle}>
            {subcategory}
          </span>

          {summary && (
            <span className={styles.accordionSummary}>
              {summary}
            </span>
          )}
        </span>

        <span
          className={`${styles.chevron} ${
            open ? styles.chevronOpen : ""
          }`}
          aria-hidden="true"
        >
          <Icon name="chevron-down" size={16} />
        </span>
      </button>

      {open && (
        <div id={panelId} className={styles.panel}>
          {state.status === "loading" && (
            <p className={styles.status} role="status">
              Loading…
            </p>
          )}

          {state.status === "error" && (
            <div className={styles.errorBox} role="alert">
              <p>
                Couldn’t load this section. {state.message}
              </p>

              <button
                type="button"
                className={styles.retry}
                onClick={retry}
              >
                Try again
              </button>
            </div>
          )}

          {content && isEmpty(content) && (
            <p className={styles.status}>
              Content for this section is coming soon.
            </p>
          )}

          {content?.tip && (
            <aside className={styles.tip}>
              <span className={styles.tipIcon}>
                <Icon name="lightbulb" size={14} />
              </span>

              <div className={styles.tipText}>
                <strong>TIP </strong>
                <Markdown>
                  {content.tip.bodyMarkdown}
                </Markdown>
              </div>
            </aside>
          )}

          {content && content.items.length > 0 && (
            <div className={styles.rows}>
              {content.items.map((item) => (
                <ContentCard
                  key={item.key}
                  section={item}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
