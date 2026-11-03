"use client";

import { memo } from "react";
import defaultStarterQuestions, { type StarterQuestion } from "@/lib/copilot/starterQuestions";
import styles from "./copilot.module.css";

export interface StarterQuestionsProps {
  onSelect: (questionText: string) => void;
  disabled?: boolean;
  /** Defaults to the Housing questions, so existing pages are unchanged. */
  questions?: StarterQuestion[];
}

function StarterQuestions({
  onSelect,
  disabled,
  questions = defaultStarterQuestions,
}: StarterQuestionsProps) {
  return (
    <div className={styles.startersList}>
      {questions.map((q: StarterQuestion) => (
        <button
          key={q.id}
          className={styles.starterCard}
          onClick={() => onSelect(q.question ?? q.title)}
          disabled={disabled}
          aria-label={q.title}
        >
          <span className={styles.starterIcon} aria-hidden="true">
            {q.icon}
          </span>
          <span className={styles.starterTitle}>{q.title}</span>
          <span className={styles.starterArrow} aria-hidden="true">
            ›
          </span>
        </button>
      ))}
    </div>
  );
}

export default memo(StarterQuestions);

