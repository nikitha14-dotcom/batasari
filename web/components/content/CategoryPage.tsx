"use client";

import type { CategoryConfig } from "@/lib/content/categories";
import { RequireSession } from "@/lib/supabase/RequireSession";
import { AppShell } from "@/components/navigation";
import { SubcategorySection } from "./SubcategorySection";
import styles from "./content.module.css";

export function CategoryPageView({ config }: { config: CategoryConfig }) {
  return (
    <AppShell activeHref={`/${config.slug}`}>
      <div className={styles.page}>
        <div className={styles.hero}>
          <h1 className={styles.heading}>{config.category}</h1>
        </div>

        {config.officialSourcesNotice && (
          <div className={styles.notice} role="note">
            For immigration and government requirements, we connect you directly to official sources so you always have the most current information. 
          </div>
        )}

        <div className={styles.sections}>
          {config.subcategories.map((sub, i) => (
            <SubcategorySection
              key={sub}
              category={config.category}
              subcategory={sub}
              defaultOpen={i === 0}
            />
          ))}
        </div>
      </div>
    </AppShell>
  );
}

export function CategoryPage({ config }: { config: CategoryConfig }) {
  return (
    <RequireSession>
      <CategoryPageView config={config} />
    </RequireSession>
  );
}

