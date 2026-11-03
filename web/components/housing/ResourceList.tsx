"use client";

import { Markdown } from "@/components/content/ContentCard";
import type { ContentSection } from "@/lib/content/contentApi";

import styles from "./housing.module.css";

/**
 * The recommended-resources list inside the scams card and on Check the
 * Place (Figma "RecommendedResourcesList"): a fixed-width underlined link on
 * the left, its description on the right, hairline between rows.
 *
 * The first version rendered this as a two-column table with a header row
 * and authority-tier badges, neither of which is in the frames.
 */
export function ResourceList({ sections }: { sections: ContentSection[] }) {
  return (
    <div className={styles.resourceBox}>
      {sections.map((section) => {
        const url = section.source?.url ?? null;

        return (
          <div className={styles.resourceRow} key={section.key}>
            <div className={styles.resourceName}>
              {url ? (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${section.title} (opens in a new tab)`}
                  style={{ color: "inherit", textDecoration: "inherit" }}
                >
                  {section.title} ↗
                </a>
              ) : (
                <span>{section.title}</span>
              )}
            </div>

            <div className={styles.resourceDesc}>
              {section.bodyMarkdown && (
                <Markdown>{section.bodyMarkdown}</Markdown>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

