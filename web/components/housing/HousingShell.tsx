"use client";

import type { ReactNode } from "react";

import AICopilot from "@/components/copilot/AICopilot";
import { AppShell } from "@/components/navigation";

import { HousingSequenceBar, type HousingStep } from "./HousingSequenceBar";
import styles from "./housing.module.css";

/**
 * Page frame shared by the three Housing screens.
 *
 * Matches the frames' "center header": the page title on the left and the
 * stepper on the right of one row, then the scrolling middle column with the
 * AI Co-Pilot rail beside it. No numbered badge and no "Sequence" label --
 * neither exists in the design.
 */
export function HousingShell({
  step,
  title,
  subtitle,
  subcategory,
  children,
}: {
  step: HousingStep;
  title: string;
  subtitle?: string;
  /** Scopes the Co-Pilot's answers to this screen. */
  subcategory: string;
  children: ReactNode;
}) {
  return (
    <AppShell activeHref="/housing">
      <div className="housing-content">
        {/* The frames run the title row across the whole main column, so the
            stepper sits above the Co-Pilot rather than beside it. */}
        <div className={styles.headerBand}>
          <div className={styles.pageHeader}>
            <h1 className={styles.pageTitle}>{title}</h1>
            <HousingSequenceBar active={step} />
          </div>
          {subtitle && <p className={styles.pageSubtitle}>{subtitle}</p>}
        </div>

        <div className="housing-grid-layout">
          <div className="page-container">
            <div className={styles.stack}>{children}</div>
          </div>

          <aside className="housing-copilot-container">
            <AICopilot category="Housing" subcategory={subcategory} />
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

