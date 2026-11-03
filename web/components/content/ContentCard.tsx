import ReactMarkdown from "react-markdown";

import type { ContentSection } from "@/lib/content/contentApi";
import { Icon } from "@/components/navigation/icons";
import styles from "./content.module.css";

/** Links inside seeded markdown open in a new tab, like the Visit button. */
const markdownComponents = {
  a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),
};

export function Markdown({ children }: { children: string }) {
  // react-markdown skips raw HTML and strips javascript: URLs by default.
  return <ReactMarkdown components={markdownComponents}>{children}</ReactMarkdown>;
}

/** One resource row inside an open accordion (Figma: Agency-*). */
export function ContentCard({ section }: { section: ContentSection }) {
  const url = section.source?.url ?? null;

  return (
    <article className={styles.row}>
      <div className={styles.rowText}>
        {section.key !== "document-copy" && (
          <h3 className={styles.rowTitle}>{section.title}</h3>
        )}
        {section.bodyMarkdown && (
          <div className={styles.rowBody}>
            <Markdown>{section.bodyMarkdown}</Markdown>
          </div>
        )}
      </div>
      {url && (
        <a
          className={styles.visit}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Visit ${section.source?.name ?? section.title} (opens in a new tab)`}
        >
          <span className={styles.visitText}>Visit Website</span>
          <Icon name="arrow-right" size={14} />
        </a>
      )}
    </article>
  );
}

