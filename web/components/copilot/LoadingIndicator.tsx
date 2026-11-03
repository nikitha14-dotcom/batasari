"use client";

import { memo } from "react";
import styles from "./copilot.module.css";

const STAGES = [
  { id: "routing", label: "Routing" },
  { id: "retrieving", label: "Retrieving" },
  { id: "generating", label: "Generating" },
  { id: "verifying", label: "Verifying" },
];

export interface LoadingIndicatorProps {
  currentStage?: string | null;
}

function LoadingIndicator({ currentStage }: LoadingIndicatorProps) {
  const currentIndex = STAGES.findIndex((stage) => stage.id === currentStage);

  return (
    <div
      className={styles.stagesWrapper}
      role="status"
      aria-live="polite"
      aria-label={
        currentStage
          ? `AI Copilot is ${currentStage}`
          : "AI Copilot is processing"
      }
    >
      {STAGES.map((stage, index) => {
        const isComplete = currentIndex !== -1 && index < currentIndex;
        const isCurrent = currentIndex !== -1 && index === currentIndex;

        return (
          <div
            key={stage.id}
            className={[
              styles.stageRow,
              isComplete ? styles.stageComplete : "",
              isCurrent ? styles.stageCurrent : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <span className={styles.stageIcon} aria-hidden="true">
              {isComplete ? "✓" : isCurrent ? "●" : "○"}
            </span>
            <span>{stage.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export default memo(LoadingIndicator);

