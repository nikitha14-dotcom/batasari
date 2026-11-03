import type { ReactNode } from "react";

import { AppHeader } from "./AppHeader";
import { SidebarNav, type EducationGroup } from "./SidebarNav";
import { BetaAccessGate } from "@/components/beta/BetaAccessGate";
import styles from "./navigation.module.css";

/**
 * Frame for every signed-in page: header across the top, category
 * navigation on the left, the page in the remaining space.
 *
 * `activeHref` highlights a sidebar tab; sub-pages pass their parent's
 * (e.g. /housing/compare passes "/housing"), pages outside the nav omit it.
 *
 * `activeEducationGroup` highlights a sub-item inside the Education & Family
 * dropdown (only relevant when activeHref === "/education-family").
 */
export function AppShell({
  activeHref,
  activeEducationGroup,
  children,
}: {
  activeHref?: string;
  activeEducationGroup?: EducationGroup | null;
  children: ReactNode;
}) {
  return (
    <div className={styles.shell}>
      <AppHeader />
      <BetaAccessGate allowExpired={activeHref === "/feedback"}>
        <div className={styles.body}>
          <SidebarNav
            activeHref={activeHref}
            activeEducationGroup={activeEducationGroup}
          />
          <main className={styles.main}>{children}</main>
        </div>
      </BetaAccessGate>
    </div>
  );
}

