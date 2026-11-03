"use client";

import { useMemo, useState } from "react";

import { Markdown } from "@/components/content/ContentCard";
import { ContentError, ContentLoading, HousingShell } from "@/components/housing";
import styles from "@/components/housing/housing.module.css";
import type { ContentSection } from "@/lib/content/contentApi";
import {
  COMPARE_GROUPS,
  COMPARE_INTRO_KEY,
  GROUPED_KEYS,
} from "@/lib/housing/compareThemes";
import {
  HOUSING_SUBCATEGORY,
  sectionByKey,
  useHousingContent,
} from "@/lib/housing/housingContent";
import { RequireSession } from "@/lib/supabase/RequireSession";

/**
 * Tips on evaluating housing options (Figma HO-01 condensed, HO-02 expanded).
 *
 * The two frames are one page in two states, so the rows expand in place
 * rather than living on separate screens. Groups of one row show their text
 * directly -- Condition & Building Quality and Required Documents are
 * paragraphs in the frame, not accordions -- while groups of several get a
 * row each with a chevron.
 */
function CompareOptionsContent() {
  const { sections, loading, error } = useHousingContent(
    HOUSING_SUBCATEGORY.compare,
  );
  const [openKeys, setOpenKeys] = useState<Set<string>>(new Set());

  const intro = sectionByKey(sections, COMPARE_INTRO_KEY);

  const groups = useMemo(() => {
    const byKey = new Map(sections.map((s) => [s.key, s]));

    const built = COMPARE_GROUPS.map(({ heading, keys }) => ({
      heading,
      rows: keys
        .map((key) => byKey.get(key))
        .filter((s): s is ContentSection => Boolean(s)),
    })).filter((group) => group.rows.length > 0);

    const leftovers = sections.filter(
      (s) => s.key !== COMPARE_INTRO_KEY && !GROUPED_KEYS.has(s.key),
    );
    if (leftovers.length > 0) {
      built.push({ heading: "Other considerations", rows: leftovers });
    }

    return built;
  }, [sections]);

  const expandable = groups.flatMap((g) => (g.rows.length > 1 ? g.rows : []));
  const allOpen = expandable.length > 0 && openKeys.size === expandable.length;

  return (
    <HousingShell
      step={2}
      title="Tips on evaluating housing options"
      subcategory={HOUSING_SUBCATEGORY.compare}
    >
      {error && <ContentError message={error} />}

      <div className={styles.compareTop}>
        <p className={styles.pageSubtitle} style={{ margin: 0 }}>
          {intro?.title ?? "What to weigh before you commit to a place."}
        </p>

        <button
          type="button"
          className={styles.expandAll}
          onClick={() =>
            setOpenKeys(
              allOpen ? new Set() : new Set(expandable.map((r) => r.key)),
            )
          }
          disabled={expandable.length === 0}
        >
          {allOpen ? "Collapse all" : "Expand all"}
        </button>
      </div>

      {loading ? (
        <ContentLoading label="Loading tips…" />
      ) : (
        groups.map(({ heading, rows }) => (
          <div className={styles.compareGroup} key={heading}>
            <p className={styles.compareGroupLabel}>{heading}</p>

            <div className={styles.compareBox}>
              {rows.length === 1 ? (
                <div className={styles.compareStatic}>
                  {rows[0].bodyMarkdown && (
                    <Markdown>{rows[0].bodyMarkdown}</Markdown>
                  )}
                  <SourceLink section={rows[0]} />
                </div>
              ) : (
                rows.map((row) => (
                  <Row
                    key={row.key}
                    section={row}
                    open={openKeys.has(row.key)}
                    onToggle={() =>
                      setOpenKeys((current) => {
                        const next = new Set(current);
                        if (next.has(row.key)) next.delete(row.key);
                        else next.add(row.key);
                        return next;
                      })
                    }
                  />
                ))
              )}
            </div>
          </div>
        ))
      )}
    </HousingShell>
  );
}

function Row({
  section,
  open,
  onToggle,
}: {
  section: ContentSection;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className={styles.compareRow}>
      <button
        type="button"
        className={styles.compareRowHeader}
        onClick={onToggle}
        aria-expanded={open}
      >
        <span className={styles.popupBullet} aria-hidden="true" />
        <span className={styles.compareRowTitle}>{section.title}</span>
        <span
          className={
            open
              ? `${styles.cardChevron} ${styles.cardChevronOpen}`
              : styles.cardChevron
          }
          aria-hidden="true"
        >
          ⌄
        </span>
      </button>

      {open && (
        <div className={styles.compareRowBody}>
          {section.bodyMarkdown && <Markdown>{section.bodyMarkdown}</Markdown>}
          <SourceLink section={section} />
        </div>
      )}
    </div>
  );
}

/**
 * True when the seeded body already links out on its own.
 *
 * Four of the topic rows (maintenance responsibilities, cycling, rent
 * control, credit/employment alternatives) carry the citation inline, as a
 * markdown link inside the sentence. Appending the trusted-source link
 * underneath then shows the same authority twice -- and the two hrefs are
 * not always identical, so the reader has no way to tell which to trust.
 * A row that cites inline keeps its own link; a row that does not still
 * gets the source footer.
 */
function bodyLinksOut(body: string | null | undefined): boolean {
  return /\]\(\s*https?:\/\//i.test(body ?? "");
}

function SourceLink({ section }: { section: ContentSection }) {
  const url = section.source?.url;
  if (!url || bodyLinksOut(section.bodyMarkdown)) return null;

  return (
    <a
      className={styles.compareSource}
      href={url}
      target="_blank"
      rel="noopener noreferrer"
    >
      {section.source?.name} ↗
    </a>
  );
}

export default function CompareOptionsPage() {
  return (
    <RequireSession>
      <CompareOptionsContent />
    </RequireSession>
  );
}

