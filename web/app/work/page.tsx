'use client';

import AICopilot from '@/components/copilot/AICopilot';
import { WorkDirectory } from '@/components/work';
import styles from '@/components/work/work.module.css';
import { AppShell } from '@/components/navigation';
import { workStarterQuestions } from '@/lib/copilot/starterQuestions';
import { RequireSession } from '@/lib/supabase/RequireSession';

/**
 * Work: the shared shell (header + sidebar, from components/navigation)
 * around the seven-section directory, with the co-pilot beside it
 * (Work spec section 1: centre pane directory, right pane co-pilot).
 *
 * The co-pilot sends category "Work" and a fixed subcategory: which
 * subcategory a question belongs to is the router's job (FR-2.20), not the
 * page's.
 */
export default function Page() {
  return (
    <RequireSession>
      <AppShell activeHref="/work">
        <div className={styles.layout}>
          <div role="region" aria-label="Work directory" className={styles.directoryPane}>
            <WorkDirectory />
          </div>
          <div className={styles.copilotPane}>
            <AICopilot
              category="Work"
              subcategory="General"
              starterQuestions={workStarterQuestions}
              emptyStateDescription="Ask about finding work, your rights at work, getting your credentials recognised and job searching in Toronto."
            />
          </div>
        </div>
      </AppShell>
    </RequireSession>
  );
}

