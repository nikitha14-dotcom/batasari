"use client";

import { useState } from "react";

import { Markdown } from "@/components/content/ContentCard";
import type { ContentSection } from "@/lib/content/contentApi";
import {
  type HousingTypeCard,
  type PopupSection,
  resolveModalGroups,
  sectionByKey,
  sectionsWithPrefix,
} from "@/lib/housing/housingContent";

import { HousingPopup } from "./HousingPopup";
import styles from "./housing.module.css";

const ICON_GLYPH: Record<string, string> = {
  calendar: "📅",
  suitcase: "🧳",
  house: "🏠",
  "building-check": "🏢",
  key: "🔑",
  people: "👥",
  school: "🎓",
};

/**
 * The expanded "Learn more" popup (Figma FH-02 … FH-08).
 *
 * The seven frames share a shell -- a #dcf2e1 card with the card's icon,
 * title and its own subtitle -- and then differ:
 *
 * - FH-02 groups rows into white containers, with the booking sites as chips.
 * - FH-04 splits into two tabs, Marketplaces and Agent-Listed (MLS), each
 *   with headed sections and a caution line on the anonymous one.
 * - FH-05 and FH-06 have headed sections, FH-05 ending in a row of chips for
 *   the operator sites.
 * - FH-08 puts the institution on the left and its link on the right.
 * - FH-03 and FH-07 have no section config yet and fall back to a plain list.
 *
 * Headings like "Verified platform" are design copy with no row behind them,
 * so they live in the card's config. Every name, description and URL still
 * comes from static_content.
 */
export function HousingTypeModal({
  card,
  sections,
  onClose,
}: {
  card: HousingTypeCard;
  sections: ContentSection[];
  onClose: () => void;
}) {
  const tabs = card.popup?.tabs;
  const [activeTab, setActiveTab] = useState(tabs?.[0]?.id ?? "");

  const tab = tabs?.find((t) => t.id === activeTab) ?? tabs?.[0];
  const introKey = card.popup
    ? (tab?.introKey ?? card.popup.introKey)
    : card.introKey;
  const introLimit = tab?.introParagraphs ?? card.popup?.introParagraphs;
  const intro = introKey ? sectionByKey(sections, introKey) : null;
  const introBody = intro
    ? paragraphs(intro.bodyMarkdown, 0, introLimit)
    : "";
  const blocks = tab?.sections ?? card.popup?.sections;

  return (
    <HousingPopup label={card.title} onClose={onClose}>
      <div className={styles.popup}>
        <div className={styles.popupHeader}>
          <span className={styles.optionIcon} aria-hidden="true">
            {ICON_GLYPH[card.icon] ?? "🏠"}
          </span>
          <div>
            <p className={styles.popupTitle}>{card.title}</p>
            <p className={styles.popupBlurb}>
              {card.popup?.subtitle ?? card.blurb}
            </p>
          </div>
        </div>

        {tabs && tabs.length > 1 && (
          <div className={styles.popupTabs} role="tablist">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={t.id === tab?.id}
                className={
                  t.id === tab?.id
                    ? `${styles.popupTab} ${styles.popupTabActive}`
                    : styles.popupTab
                }
                onClick={() => setActiveTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        {introBody && (
          <div className={styles.popupIntroBar}>
            <Markdown>{introBody}</Markdown>
          </div>
        )}

        <div className={styles.popupGroups}>
          {card.groups?.length ? (
            <GroupedBody card={card} sections={sections} />
          ) : blocks?.length ? (
            blocks.map((block) => (
              <Section key={block.id} block={block} sections={sections} />
            ))
          ) : (
            <ListBody card={card} sections={sections} intro={intro} />
          )}
        </div>
      </div>
    </HousingPopup>
  );
}

/**
 * Drop a lead-in that repeats the block's own heading.
 *
 * The seeded copy reads as a standalone paragraph -- "**Before signing:** ask
 * if the representation agreement is exclusive..." -- because it has to make
 * sense wherever it is quoted. The frame promotes that phrase to a heading
 * above the paragraph, so printing the body verbatim underneath says it
 * twice. Stripping it here keeps the sentence correct in the database and
 * matches the frame on screen; a paragraph that does not open with the
 * heading is left exactly as written.
 */
function withoutLeadIn(para: string, title?: string): string {
  if (!title) return para;

  const sameAsTitle = (text: string) =>
    text.replace(/[\s:\u2014-]+$/, "").toLowerCase() === title.toLowerCase();

  // "**Before signing:** ask if..." -- the separator may sit inside the bold.
  const bold = /^\s*\*\*(.+?)\*\*\s*[:\u2014-]?\s*/.exec(para);
  if (bold && sameAsTitle(bold[1])) return capitalize(para.slice(bold[0].length));

  // "Before signing: ask if..." -- the same copy without the emphasis.
  const plain = new RegExp(
    `^\\s*${title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*[:\u2014-]\\s*`,
    "i",
  );
  if (plain.test(para)) return capitalize(para.replace(plain, ""));

  return para;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** A headed block: callout, cards, then one box holding rows, chips, note. */
function Section({
  block,
  sections,
}: {
  block: PopupSection;
  sections: ContentSection[];
}) {
  const byKey = new Map(sections.map((s) => [s.key, s]));
  const rows = (block.rows ?? [])
    .map((key) => byKey.get(key))
    .filter((s): s is ContentSection => Boolean(s));
  const chips = (block.chips ?? [])
    .map((key) => byKey.get(key))
    .filter((s): s is ContentSection => Boolean(s) && Boolean(s?.source?.url));

  const calloutRow = block.calloutKey ? byKey.get(block.calloutKey) : undefined;
  const calloutParas = (
    calloutRow ? paragraphList(calloutRow.bodyMarkdown, block.calloutFrom ?? 0) : []
  ).map((para, index) =>
    index === 0 ? withoutLeadIn(para, block.calloutTitle) : para,
  );

  const cards = (block.cards ?? [])
    .map((card) => ({ ...card, row: byKey.get(card.key) }))
    .filter((card): card is typeof card & { row: ContentSection } =>
      Boolean(card.row),
    );

  const hasBox = rows.length > 0 || chips.length > 0;
  if (!hasBox && cards.length === 0 && calloutParas.length === 0) return null;

  return (
    <div className={styles.popupSection}>
      {block.heading && (
        <p className={styles.popupSectionHeading}>{block.heading}</p>
      )}

      {calloutParas.length > 0 && (
        <div className={styles.callout}>
          <span aria-hidden="true">ⓘ</span>
          <div>
            {block.calloutTitle && (
              <p className={styles.calloutTitle}>{block.calloutTitle}</p>
            )}
            {calloutParas.map((para, index) => (
              <div className={styles.calloutPara} key={index}>
                <Markdown>{para}</Markdown>
              </div>
            ))}
          </div>
        </div>
      )}

      {cards.map((card) => {
        const chipRows = (card.chips ?? [])
          .map((key) => byKey.get(key))
          .filter((r): r is ContentSection => Boolean(r?.source?.url));
        const own = card.row.source?.url ? card.row.source : null;

        return (
          <div className={styles.arrangement} key={card.key}>
            <div className={styles.arrangementHead}>
              <div className={styles.arrangementTitleRow}>
                <p className={styles.arrangementTitle}>{card.row.title}</p>
                {own && (
                  <a
                    className={styles.chip}
                    href={own.url!}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {own.name} ↗
                  </a>
                )}
              </div>
              {card.badge && (
                <span
                  className={`${styles.rtaBadge} ${
                    card.badgeTone === "out" ? styles.rtaBadgeOut : styles.rtaBadgeIn
                  }`}
                >
                  {card.badge}
                </span>
              )}
            </div>

            {card.row.bodyMarkdown && (
              <div className={styles.popupItemDesc}>
                <Markdown>{card.row.bodyMarkdown}</Markdown>
              </div>
            )}

            {chipRows.length > 0 && (
              <div className={styles.popupChips}>
                {chipRows.map((r) => (
                  <a
                    className={styles.chip}
                    key={r.key}
                    href={r.source!.url!}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {r.title} ↗
                  </a>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {hasBox && (
        <div className={styles.popupList}>
          {block.layout === "linkRight"
            ? rows.map((row) => (
                <div className={styles.popupLinkRight} key={row.key}>
                  <span className={styles.popupInstitution}>{row.title}</span>
                  {row.source?.url && (
                    <a
                      className={styles.popupItemName}
                      href={row.source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${row.source.name} (opens in a new tab)`}
                    >
                      {row.source.name} ↗
                    </a>
                  )}
                </div>
              ))
            : rows.map((row) => <Row key={row.key} row={row} />)}

          {chips.length > 0 && (
            <div className={styles.popupChipRow}>
              {block.chipHeading && (
                <span className={styles.popupChipHeading}>
                  {block.chipHeading}
                </span>
              )}
              <div>
                {block.chipLabel && (
                  <p className={styles.popupChipLabel}>{block.chipLabel}</p>
                )}
                <div className={styles.popupChips}>
                  {chips.map((row) => (
                    <a
                      className={styles.chip}
                      key={row.key}
                      href={row.source!.url!}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${row.source!.name} (opens in a new tab)`}
                    >
                      {row.source!.name} ↗
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}

          {block.note && (
            <p className={styles.popupNote}>
              <span aria-hidden="true">🛡️</span>
              {block.note}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Slice a body by paragraph.
 *
 * The MLS intro is one seeded row holding three paragraphs, and the frame
 * splits it: the first sits above the tab content, the rest form the
 * "Before signing" box. Splitting here keeps the copy in the database.
 */
function paragraphs(body: string, from = 0, count?: number): string {
  return paragraphList(body, from, count).join("\n\n");
}

function paragraphList(body: string, from = 0, count?: number): string[] {
  const parts = body.split(/\n\s*\n/).filter((p) => p.trim());
  return count === undefined ? parts.slice(from) : parts.slice(from, from + count);
}

function Row({ row }: { row: ContentSection }) {
  const url = row.source?.url ?? null;

  return (
    <div className={styles.popupItem}>
      <div className={styles.popupItemLink}>
        {url ? (
          <a
            className={styles.popupItemName}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${row.title} (opens in a new tab)`}
          >
            {row.title} ↗
          </a>
        ) : (
          <span className={styles.popupItemName}>{row.title}</span>
        )}
      </div>

      <div className={styles.popupItemDesc}>
        {row.bodyMarkdown && <Markdown>{row.bodyMarkdown}</Markdown>}
      </div>
    </div>
  );
}

/** FH-02: white containers, some carrying rows of link chips. */
function GroupedBody({
  card,
  sections,
}: {
  card: HousingTypeCard;
  sections: ContentSection[];
}) {
  const groups = resolveModalGroups(card, sections);
  if (groups.length === 0) return <EmptyState />;

  return (
    <>
      {groups.map((group) => (
        <div className={styles.popupGroup} key={group.id}>
          <span className={styles.popupBullet} aria-hidden="true" />

          <div className={styles.popupGroupText}>
            <div className={styles.popupGroupHead}>
              <p className={styles.popupGroupTitle}>{group.title}</p>
              {group.action && (
                <a
                  className={styles.chip}
                  href={group.action.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${group.action.name} (opens in a new tab)`}
                >
                  Website →
                </a>
              )}
            </div>

            {group.body && (
              <div className={styles.popupBody}>
                <Markdown>{group.body}</Markdown>
              </div>
            )}

            {group.chipSets.map((set, index) => (
              <div key={set.label ?? index}>
                {set.label && <p className={styles.popupChipLabel}>{set.label}</p>}
                <div className={styles.popupChips}>
                  {set.links.map((link) => (
                    <a
                      className={styles.chip}
                      key={link.key}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${link.name} (opens in a new tab)`}
                    >
                      {link.name} →
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

/** FH-03 / FH-07: one container, a link and a description per row. */
function ListBody({
  card,
  sections,
  intro,
}: {
  card: HousingTypeCard;
  sections: ContentSection[];
  intro: ContentSection | null;
}) {
  const seen = new Set<string>();
  const rows: ContentSection[] = [];

  for (const prefix of card.prefixes) {
    for (const section of sectionsWithPrefix(sections, prefix)) {
      if (section.key === card.introKey || seen.has(section.key)) continue;
      seen.add(section.key);
      rows.push(section);
    }
  }

  if (rows.length === 0) return <EmptyState />;

  return (
    <div className={styles.popupList}>
      {intro?.title && <p className={styles.popupListHeading}>{intro.title}</p>}
      {rows.map((row) => (
        <Row key={row.key} row={row} />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <p className={styles.popupBody}>
      We don&apos;t have listings for this option yet.
    </p>
  );
}

