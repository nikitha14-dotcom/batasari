"use client";

import { useEffect, useState } from "react";

import { useSearchParams } from "next/navigation";

import AICopilot from "@/components/copilot/AICopilot";
import { ContentCard, Markdown } from "@/components/content/ContentCard";
import { SubcategorySection } from "@/components/content/SubcategorySection";
import { AppShell } from "@/components/navigation";
import { Icon, type IconName } from "@/components/navigation/icons";
import {
  fetchSubcategoryContent,
  isEmpty,
  type SubcategoryContent,
} from "@/lib/content/contentApi";
import { getCategoryBySlug, subcategoryIcon } from "@/lib/content/categories";
import type { EducationGroup } from "@/components/navigation/SidebarNav";
import styles from "./EducationFamilyPage.module.css";

const CATEGORY = "Education & Family";
const EDUCATION_CONFIG = getCategoryBySlug("education-family");

// ─────────────────────────────────────────────────────────────────────────────
// SCHOOLS IN CANADA — The 4 DB-backed subcategories that make up this group.
//
// These strings must match `static_content.subcategory` exactly in Postgres.
// ─────────────────────────────────────────────────────────────────────────────

const SCHOOLS_SUBCATEGORIES = [
  "Understand Schools in Canada",
  "Understand My School Choices",
  "Eligibility, Enrollment & Preparation",
  "School Life & Family Decisions",
] as const;

type SchoolsSubcategory = (typeof SCHOOLS_SUBCATEGORIES)[number];

// ─────────────────────────────────────────────────────────────────────────────
// Special full-card sections (ESL, Trade)
// ─────────────────────────────────────────────────────────────────────────────

type SectionConfig = {
  title: string;
  icon: IconName;
};

const SPECIAL_SECTIONS: Record<string, SectionConfig> = {
  "ESL Classes": {
    title: "ESL Classes",
    icon: "book-open-check",
  },
  "Trade Schools & Certifications": {
    title: "Trade Schools & Certifications",
    icon: "briefcase-business",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Generic data-fetch hook
// ─────────────────────────────────────────────────────────────────────────────

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; content: SubcategoryContent };

function useSubcategoryContent(subcategory: string) {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    setState({ status: "loading" });

    fetchSubcategoryContent(CATEGORY, subcategory, {
      signal: controller.signal,
    })
      .then((content) => setState({ status: "ready", content }))
      .catch((err: unknown) => {
        if ((err as Error)?.name === "AbortError") return;

        setState({
          status: "error",
          message:
            err instanceof Error
              ? err.message
              : "Could not load this section.",
        });
      });

    return () => controller.abort();
  }, [subcategory, attempt]);

  return {
    state,
    retry: () => setAttempt((v) => v + 1),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SCHOOLS IN CANADA — Hub page
// ─────────────────────────────────────────────────────────────────────────────

function SchoolsHubCard({
  subcategory,
  onClick,
}: {
  subcategory: SchoolsSubcategory;
  onClick: () => void;
}) {
  const { state } = useSubcategoryContent(subcategory);
  const content = state.status === "ready" ? state.content : null;
  const document =
    content?.items.find((item) => item.key === "document-copy") ?? null;
  const title = document?.title ?? "";
  const description = content?.description?.bodyMarkdown ?? "";
  const icon = subcategoryIcon(subcategory);

  return (
    <button
      type="button"
      className={styles.hubCard}
      onClick={onClick}
      aria-label={title ? `Open ${title}` : "Open section"}
    >
      <div className={styles.hubCardTop}>
        <span className={styles.hubCardIcon} aria-hidden="true">
          <Icon name={icon} size={28} />
        </span>

        {title && <span className={styles.hubCardTitle}>{title}</span>}

        <span className={styles.hubCardArrow} aria-hidden="true">
          <Icon name="chevron-right" size={18} />
        </span>
      </div>

      {state.status === "loading" && (
        <p className={styles.hubCardLoading}>Loading…</p>
      )}

      {description && (
        <p className={styles.hubCardDescription}>{description}</p>
      )}

      {state.status === "ready" && !description && !isEmpty(content!) && (
        <p className={styles.hubCardDescription}>
          {content!.items[0]?.title ?? ""}
        </p>
      )}
    </button>
  );
}

function SchoolsHubView({
  onSelectSubcategory,
}: {
  onSelectSubcategory: (sub: SchoolsSubcategory) => void;
}) {
  const { state: overviewState } = useSubcategoryContent(
    "Understand Schools in Canada",
  );

  const overview =
    overviewState.status === "ready" ? overviewState.content : null;

  const subtitle = overview?.description?.bodyMarkdown;

  return (
    <div className={styles.hubPage}>
      <header className={styles.hubHeader}>
        <h1 className={styles.hubTitle}>Schools in Canada</h1>

        {subtitle ? (
          <p className={styles.hubSubtitle}>{subtitle}</p>
        ) : overviewState.status === "ready" ? null : (
          <p className={styles.hubSubtitle} aria-hidden="true" />
        )}
      </header>

      <div className={styles.hubGrid}>
        {SCHOOLS_SUBCATEGORIES.map((sub) => (
          <SchoolsHubCard
            key={sub}
            subcategory={sub}
            onClick={() => onSelectSubcategory(sub)}
          />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MARKDOWN PARSER UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

interface ParsedSubItem {
  title: string;
  body: string;
  chips: string[];
  noteLines: string[];
  description: string;
}

interface ParsedSection {
  title: string;
  body: string;
  snippet: string;
  preamble: string;
  subItems: ParsedSubItem[];
  boldItems: ParsedSubItem[];
  sectionNotes: string[];
}

function extractBoldLabels(lines: string[]): string[] {
  return lines
    .map((l) => l.trim())
    .filter((l) => /^\*\*[^\*]+\*\*$/.test(l))
    .map((l) =>
      l.replace(/^\*\*/, "").replace(/\*\*$/, "").trim(),
    );
}

function extractNoteLines(lines: string[]): string[] {
  return lines
    .map((l) => l.trim())
    .filter(
      (l) =>
        /^\*[^\*].*[^\*]\*$/.test(l) ||
        /^\*[^\*]+\*$/.test(l),
    )
    .map((l) => l.replace(/^\*/, "").replace(/\*$/, "").trim());
}

function toPlainText(line: string): string {
  return line
    .replace(/^#+\s+/, "")
    .replace(/^\*\*(.+)\*\*$/, "$1")
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/^[-*+]\s+/, "")
    .replace(/^>\s*/, "")
    .trim();
}

function firstSnippet(rawBlock: string): string {
  for (const line of rawBlock.split("\n")) {
    if (/^#####\s/.test(line.trim())) continue;

    const plain = toPlainText(line);

    if (plain.length > 0) {
      return plain.slice(0, 160);
    }
  }

  return "";
}

function parseSubItem(
  title: string,
  rawBody: string,
): ParsedSubItem {
  const lines = rawBody.split("\n");
  const chips = extractBoldLabels(lines);
  const noteLines = extractNoteLines(lines);
  const description = firstSnippet(rawBody);

  return {
    title,
    body: rawBody.trim(),
    chips,
    noteLines,
    description,
  };
}

function parseSectionBody(rawBody: string): {
  subItems: ParsedSubItem[];
  boldItems: ParsedSubItem[];
  sectionNotes: string[];
  preamble: string;
} {
  const HAS_SUB = /^#####\s/m.test(rawBody);
  const allLines = rawBody.split("\n");
  const sectionNotes = extractNoteLines(allLines);

  if (HAS_SUB) {
    const preambleLines: string[] = [];

    for (const line of allLines) {
      if (/^#####\s/.test(line.trim())) break;

      const plain = toPlainText(line);

      if (
        plain.length > 0 &&
        !/^\*[^\*]/.test(line.trim())
      ) {
        preambleLines.push(plain);
      }
    }

    const preamble = preambleLines.join(" ").slice(0, 300);

    const parts = rawBody.split(/^(?=#####\s)/m);
    const subItems: ParsedSubItem[] = [];

    for (const part of parts) {
      const headingMatch = /^#####\s+(.+)$/m.exec(part);

      if (!headingMatch) continue;

      const title = headingMatch[1].trim();
      const headingEnd = part.indexOf(
        "\n",
        headingMatch.index,
      );

      const body =
        headingEnd === -1
          ? ""
          : part.slice(headingEnd + 1);

      subItems.push(parseSubItem(title, body));
    }

    return {
      subItems,
      boldItems: [],
      sectionNotes,
      preamble,
    };
  }

  const preambleLines: string[] = [];
  let firstBoldSeen = false;

  for (const line of allLines) {
    const trimmed = line.trim();

    if (/^\*\*[^\*]+\*\*$/.test(trimmed)) {
      firstBoldSeen = true;
      break;
    }

    const plain = toPlainText(line);

    if (
      plain.length > 0 &&
      !/^\*[^\*]/.test(trimmed)
    ) {
      preambleLines.push(plain);
    }
  }

  const preamble = firstBoldSeen
    ? preambleLines.join(" ").slice(0, 300)
    : "";

  const boldItems: ParsedSubItem[] = [];

  let currentTitle = "";
  let currentLines: string[] = [];

  const flush = () => {
    if (!currentTitle) return;

    boldItems.push(
      parseSubItem(
        currentTitle,
        currentLines.join("\n"),
      ),
    );

    currentLines = [];
    currentTitle = "";
  };

  for (const line of allLines) {
    const trimmed = line.trim();

    if (/^\*\*[^\*]+\*\*$/.test(trimmed)) {
      const innerText = trimmed
        .replace(/^\*\*/, "")
        .replace(/\*\*$/, "")
        .trim();

      const isSentenceNote =
        innerText.length > 40 ||
        innerText.includes(".") ||
        innerText.includes(",");

      if (isSentenceNote) {
        if (!sectionNotes.includes(innerText)) {
          sectionNotes.push(innerText);
        }

        flush();
      } else {
        flush();
        currentTitle = innerText;
      }
    } else if (currentTitle) {
      currentLines.push(line);
    }
  }

  flush();

  return {
    subItems: [],
    boldItems,
    sectionNotes,
    preamble,
  };
}

function parseMarkdownSections(
  bodyMarkdown: string,
): ParsedSection[] {
  const parts = bodyMarkdown.split(/^(?=####\s)/m);
  const sections: ParsedSection[] = [];

  for (const part of parts) {
    const headingMatch = /^####\s+(.+)$/m.exec(part);

    if (!headingMatch) continue;

    const title = headingMatch[1].trim();

    const headingEnd = part.indexOf(
      "\n",
      headingMatch.index,
    );

    const rawBody =
      headingEnd === -1
        ? ""
        : part.slice(headingEnd + 1).trim();

    const snippet = firstSnippet(rawBody);

    const {
      subItems,
      boldItems,
      sectionNotes,
      preamble,
    } = parseSectionBody(rawBody);

    sections.push({
      title,
      body: rawBody,
      snippet,
      preamble,
      subItems,
      boldItems,
      sectionNotes,
    });
  }

  return sections;
}

function markdownIntroduction(bodyMarkdown: string): string {
  return bodyMarkdown
    .split(/^(?=####\s)/m)[0]
    ?.trim() ?? "";
}

// ─────────────────────────────────────────────────────────────────────────────
// PRESENTATIONAL ICON MAPPINGS
// ─────────────────────────────────────────────────────────────────────────────

const LEVEL_CARD_ICONS: readonly IconName[] = [
  "shield",
  "building-2",
  "map-pin",
  "book-open-check",
];

const SECTION_ICONS: readonly IconName[] = [
  "building",
  "graduation-cap",
  "building-2",
  "file-text",
];

const SCHOOL_CHOICES_SECTION_ICONS: readonly IconName[] = [
  "building",
  "file-text",
  "book-open-check",
  "search",
  "shield",
];

const ELIGIBILITY_SECTION_ICONS: readonly IconName[] = [
  "file-text",
  "square-check",
  "file-text",
  "square-check",
  "users",
  "shopping-bag",
];

function getSectionIcons(
  subcategory: string,
): readonly IconName[] {
  if (
    subcategory ===
    "Understand My School Choices"
  ) {
    return SCHOOL_CHOICES_SECTION_ICONS;
  }

  if (
    subcategory ===
    "Eligibility, Enrollment & Preparation"
  ) {
    return ELIGIBILITY_SECTION_ICONS;
  }

  return SECTION_ICONS;
}

// ─────────────────────────────────────────────────────────────────────────────
// UI COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function ChipRow({
  chips,
}: {
  chips: string[];
}) {
  if (chips.length === 0) return null;

  return (
    <div className={styles.chipRow}>
      {chips.map((chip) => (
        <span
          key={chip}
          className={styles.chip}
        >
          <span
            className={styles.chipDot}
            aria-hidden="true"
          />
          {chip}
        </span>
      ))}
    </div>
  );
}

function SectionTip({
  lines,
}: {
  lines: string[];
}) {
  if (lines.length === 0) return null;

  return (
    <div className={styles.sectionTipBar}>
      <span
        className={styles.sectionTipIcon}
        aria-hidden="true"
      >
        <Icon name="info" size={15} />
      </span>

      <p className={styles.sectionTipText}>
        {lines.join(" ")}
      </p>
    </div>
  );
}

function LevelCard({
  item,
  index,
}: {
  item: ParsedSubItem;
  index: number;
}) {
  const cardIcon =
    LEVEL_CARD_ICONS[
      index % LEVEL_CARD_ICONS.length
    ];

  return (
    <div className={styles.levelCard}>
      <div className={styles.levelCardHeader}>
        <div className={styles.levelCardTopRow}>
          <span
            className={styles.levelCardIconBox}
            aria-hidden="true"
          >
            <Icon name={cardIcon} size={22} />
          </span>

          <div className={styles.levelCardMeta}>
            <span className={styles.levelBadge}>
              Level{" "}
              {String(index + 1).padStart(2, "0")}
            </span>

            {item.description && (
              <p
                className={
                  styles.levelCardDescription
                }
              >
                {item.description}
              </p>
            )}
          </div>
        </div>

        <h3 className={styles.levelCardTitle}>
          {item.title}
        </h3>

        <ChipRow chips={item.chips} />
      </div>

      {item.chips.length > 0 && (
        <div className={styles.subGrid}>
          {item.chips.map((chip, ci) => {
            const chipDesc = getChipDescription(
              item.body,
              chip,
            );

            return (
              <div
                key={ci}
                className={styles.subCard}
              >
                <span
                  className={styles.subCardArrow}
                  aria-hidden="true"
                >
                  <Icon
                    name="chevron-right"
                    size={14}
                  />
                </span>

                <div
                  className={
                    styles.subCardContent
                  }
                >
                  <strong
                    className={
                      styles.subCardTitle
                    }
                  >
                    {chip}
                  </strong>

                  {chipDesc && (
                    <p
                      className={
                        styles.subCardDesc
                      }
                    >
                      {chipDesc}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {item.noteLines.length > 0 && (
        <SectionTip lines={item.noteLines} />
      )}
    </div>
  );
}

function FlatCard({
  item,
  icon,
}: {
  item: ParsedSubItem;
  icon: IconName;
}) {
  return (
    <div className={styles.flatCard}>
      <div
        className={styles.flatCardIcon}
        aria-hidden="true"
      >
        <Icon name={icon} size={22} />
      </div>

      <div className={styles.flatCardContent}>
        <strong className={styles.flatCardTitle}>
          {item.title}
        </strong>

        {item.description && (
          <p className={styles.flatCardDesc}>
            {item.description}
          </p>
        )}

        {item.chips.length > 0 && (
          <ChipRow chips={item.chips} />
        )}
      </div>
    </div>
  );
}

function LearnMoreGrid({
  linkItems,
}: {
  linkItems: Array<{
    key: string;
    title: string;
    source: {
      name: string;
      url: string | null;
    } | null;
  }>;
}) {
  const validLinks = linkItems.filter(
    (i) => i.source?.url,
  );

  if (validLinks.length === 0) return null;

  return (
    <div className={styles.learnMoreSection}>
      <p className={styles.learnMoreLabel}>
        Learn More
      </p>

      <div className={styles.learnMoreGrid}>
        {validLinks.map((item) => (
          <a
            key={item.key}
            href={item.source!.url!}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.learnMoreTile}
          >
            <div
              className={
                styles.learnMoreTileInner
              }
            >
              <span
                className={
                  styles.learnMoreTileArrow
                }
                aria-hidden="true"
              >
                <Icon
                  name="chevron-right"
                  size={14}
                />
              </span>

              <div>
                <p
                  className={
                    styles.learnMoreTileName
                  }
                >
                  {item.source!.name}
                </p>

                {item.title !==
                  item.source!.name && (
                  <p
                    className={
                      styles.learnMoreTileTitle
                    }
                  >
                    {item.title}
                  </p>
                )}
              </div>
            </div>

            <span
              className={
                styles.learnMoreTileExternal
              }
              aria-hidden="true"
            >
              <Icon
                name="external-link"
                size={13}
              />
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}

function getChipDescription(
  body: string,
  chipLabel: string,
): string {
  const lines = body.split("\n");
  const boldLine = `**${chipLabel}**`;

  let found = false;

  for (const line of lines) {
    if (found) {
      const plain = toPlainText(line);

      if (plain.length > 0) {
        return plain.slice(0, 200);
      }
    }

    if (line.trim() === boldLine) {
      found = true;
    }
  }

  return "";
}

// ─────────────────────────────────────────────────────────────────────────────
// SCHOOLS DETAIL VIEW
// ─────────────────────────────────────────────────────────────────────────────

function SchoolLifeFamilyDecisionsView({
  subcategory,
  onBack,
}: {
  subcategory: SchoolsSubcategory;
  onBack: () => void;
}) {
  const { state, retry } = useSubcategoryContent(subcategory);
  const content = state.status === "ready" ? state.content : null;
  const [openTopic, setOpenTopic] = useState<string | null>(null);

  useEffect(() => {
    setOpenTopic(null);
  }, [subcategory]);

  const document =
    content?.items.find(
      (item) =>
        item.key === "document-copy" &&
        item.bodyMarkdown.trim() !== "",
    ) ?? null;
  const topics = document
    ? parseMarkdownSections(document.bodyMarkdown)
    : [];
  const resources =
    content?.items.filter(
      (item) => item.key !== "document-copy",
    ) ?? [];
  const introduction = document
    ? markdownIntroduction(document.bodyMarkdown)
    : "";

  return (
    <div className={styles.schoolLifePage}>
      <button
        type="button"
        className={styles.detailBackBtn}
        onClick={onBack}
      >
        <Icon name="chevron-left" size={16} />
        <span>Back</span>
      </button>

      {state.status === "loading" && (
        <p className={styles.status} role="status">
          Loading...
        </p>
      )}

      {state.status === "error" && (
        <div className={styles.error} role="alert">
          <span>{state.message}</span>
          <button type="button" onClick={retry}>
            Try again
          </button>
        </div>
      )}

      {content && isEmpty(content) && (
        <p className={styles.status}>
          Content for this section is coming soon.
        </p>
      )}

      {document && (
        <>
          <header className={styles.schoolLifeHeader}>
            <h1 className={styles.schoolLifeTitle}>{document.title}</h1>
            {introduction && (
              <div className={styles.schoolLifeIntroduction}>
                <Markdown>{introduction}</Markdown>
              </div>
            )}
          </header>

          {topics.length > 0 && (
            <div className={styles.schoolLifeTopics}>
              {topics.map((topic) => {
                const isOpen = openTopic === topic.title;

                return (
                  <section
                    key={topic.title}
                    className={`${styles.schoolLifeTopic} ${
                      isOpen ? styles.schoolLifeTopicOpen : ""
                    }`}
                  >
                    <button
                      type="button"
                      className={styles.schoolLifeTopicHeader}
                      aria-expanded={isOpen}
                      onClick={() =>
                        setOpenTopic(isOpen ? null : topic.title)
                      }
                    >
                      <span
                        className={styles.schoolLifeTopicIcon}
                        aria-hidden="true"
                      >
                        <Icon name="book-open-check" size={20} />
                      </span>
                      <span className={styles.schoolLifeTopicText}>
                        <span className={styles.schoolLifeTopicTitle}>
                          {topic.title}
                        </span>
                        {!isOpen && topic.snippet && (
                          <span className={styles.schoolLifeTopicSummary}>
                            {topic.snippet}
                          </span>
                        )}
                      </span>
                      <span
                        className={`${styles.schoolLifeTopicArrow} ${
                          isOpen ? styles.rotated : ""
                        }`}
                        aria-hidden="true"
                      >
                        <Icon name="chevron-down" size={16} />
                      </span>
                    </button>

                    {isOpen && topic.body && (
                      <div className={styles.schoolLifeTopicBody}>
                        <Markdown>{topic.body}</Markdown>
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          )}

          {resources.length > 0 && (
            <section className={styles.schoolLifeResources}>
              <div className={styles.schoolLifeResourceList}>
                {resources.map((resource) => (
                  <ContentCard key={resource.key} section={resource} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function SchoolsDetailView({
  subcategory,
  onBack,
}: {
  subcategory: SchoolsSubcategory;
  onBack: () => void;
}) {
  const { state, retry } =
    useSubcategoryContent(subcategory);

  const content =
    state.status === "ready"
      ? state.content
      : null;

  const [selectedSectionIdx, setSelectedSectionIdx] =
    useState<number | null>(null);

  useEffect(() => {
    setSelectedSectionIdx(null);
  }, [subcategory]);

  const docItem =
    content?.items.find(
      (i) =>
        i.key === "document-copy" &&
        i.bodyMarkdown.trim() !== "",
    ) ?? null;

  const linkItems =
    content?.items.filter(
      (i) =>
        i.bodyMarkdown.trim() === "" &&
        i.source?.url,
    ) ?? [];

  const parsedSections: ParsedSection[] =
    docItem
      ? parseMarkdownSections(
          docItem.bodyMarkdown,
        )
      : [];

  const primaryLink = linkItems[0] ?? null;

  const stateBlock = (
    <>
      {state.status === "loading" && (
        <p
          className={styles.status}
          role="status"
        >
          Loading...
        </p>
      )}

      {state.status === "error" && (
        <div
          className={styles.error}
          role="alert"
        >
          <span>{state.message}</span>

          <button
            type="button"
            onClick={retry}
          >
            Try again
          </button>
        </div>
      )}

      {content && isEmpty(content) && (
        <p className={styles.status}>
          Content for this section is coming soon.
        </p>
      )}
    </>
  );

  if (selectedSectionIdx !== null) {
    const section =
      parsedSections[selectedSectionIdx];

    if (!section) {
      setSelectedSectionIdx(null);
      return null;
    }

    const hasSubItems =
      section.subItems.length > 0;

    const hasBoldItems =
      section.boldItems.length > 0;

    const sectionIcons =
      getSectionIcons(subcategory);

    const sectionIcon =
      sectionIcons[
        selectedSectionIdx %
          sectionIcons.length
      ];

    const detailSubtitle =
      section.preamble || section.snippet;

    return (
      <div className={styles.detailPage}>
        <button
          type="button"
          className={styles.detailBackBtn}
          onClick={() =>
            setSelectedSectionIdx(null)
          }
        >
          <Icon
            name="chevron-left"
            size={16}
          />

          <span>{subcategory}</span>
        </button>

        <header
          className={
            styles.sectionDetailHeader
          }
        >
          <h1
            className={
              styles.sectionDetailTitle
            }
          >
            {section.title}
          </h1>

          {detailSubtitle && (
            <p
              className={
                styles.sectionDetailSubtitle
              }
            >
              {detailSubtitle}
            </p>
          )}
        </header>

        {stateBlock}

        {hasSubItems && (
          <div
            className={
              styles.levelCardList
            }
          >
            {section.subItems.map(
              (item, idx) => (
                <LevelCard
                  key={idx}
                  item={item}
                  index={idx}
                />
              ),
            )}
          </div>
        )}

        {hasBoldItems && (
          <div
            className={
              styles.flatCardList
            }
          >
            {section.boldItems.map(
              (item, idx) => (
                <FlatCard
                  key={idx}
                  item={item}
                  icon={sectionIcon}
                />
              ),
            )}
          </div>
        )}

        {!hasSubItems &&
          !hasBoldItems &&
          section.body && (
            <div
              className={
                styles.detailDocBody
              }
            >
              <Markdown>
                {section.body}
              </Markdown>
            </div>
          )}

        {section.sectionNotes.length >
          0 && (
          <SectionTip
            lines={
              section.sectionNotes
            }
          />
        )}

        {selectedSectionIdx ===
          parsedSections.length - 1 &&
          linkItems.length > 0 && (
            <LearnMoreGrid
              linkItems={linkItems}
            />
          )}
      </div>
    );
  }

  return (
    <div className={styles.detailPage}>
      <button
        type="button"
        className={styles.detailBackBtn}
        onClick={onBack}
      >
        <Icon
          name="chevron-left"
          size={16}
        />

        <span>
          Schools in Canada
        </span>
      </button>

      <header
        className={styles.detailHeader}
      >
        <div
          className={
            styles.detailHeaderIcon
          }
          aria-hidden="true"
        >
          <Icon
            name={subcategoryIcon(
              subcategory,
            )}
            size={36}
          />
        </div>

        <div
          className={
            styles.detailHeaderText
          }
        >
          <h1
            className={styles.detailTitle}
          >
            {subcategory}
          </h1>

          {content?.description
            ?.bodyMarkdown && (
            <p
              className={
                styles.detailSubtitle
              }
            >
              {
                content.description
                  .bodyMarkdown
              }
            </p>
          )}
        </div>
      </header>

      {stateBlock}

      {content?.tip && (
        <aside className={styles.tip}>
          <span
            className={styles.tipIcon}
          >
            <Icon
              name="lightbulb"
              size={14}
            />
          </span>

          <div
            className={styles.tipText}
          >
            <strong>TIP </strong>

            <Markdown>
              {content.tip.bodyMarkdown}
            </Markdown>
          </div>
        </aside>
      )}

      {parsedSections.length > 0 && (
        <div
          className={
            styles.detailRows
          }
        >
          {parsedSections.map(
            (section, idx) => {
              const rowIcons =
                getSectionIcons(
                  subcategory,
                );

              const rowIcon =
                rowIcons[
                  idx % rowIcons.length
                ];

              return (
                <button
                  key={idx}
                  type="button"
                  className={
                    styles.detailRow
                  }
                  onClick={() =>
                    setSelectedSectionIdx(
                      idx,
                    )
                  }
                >
                  <span
                    className={
                      styles.detailRowIcon
                    }
                    aria-hidden="true"
                  >
                    <Icon
                      name={rowIcon}
                      size={22}
                    />
                  </span>

                  <div
                    className={
                      styles.detailRowContent
                    }
                  >
                    <div
                      className={
                        styles.detailRowMain
                      }
                    >
                      <span
                        className={
                          styles.detailRowTitle
                        }
                      >
                        {section.title}
                      </span>

                      {section.snippet && (
                        <p
                          className={
                            styles.detailRowDescription
                          }
                        >
                          {section.snippet}
                        </p>
                      )}
                    </div>

                    <span
                      className={
                        styles.detailRowArrow
                      }
                      aria-hidden="true"
                    >
                      <Icon
                        name="chevron-right"
                        size={18}
                      />
                    </span>
                  </div>
                </button>
              );
            },
          )}
        </div>
      )}

      {parsedSections.length === 0 &&
        docItem && (
          <div
            className={
              styles.detailDocBody
            }
          >
            <Markdown>
              {docItem.bodyMarkdown}
            </Markdown>
          </div>
        )}

      {primaryLink?.source?.url && (
        <a
          href={
            primaryLink.source.url
          }
          target="_blank"
          rel="noopener noreferrer"
          className={
            styles.learnMoreBanner
          }
        >
          <span>
            {
              primaryLink.source.name
            }
          </span>

          <Icon
            name="external-link"
            size={18}
          />
        </a>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SPECIAL SECTIONS
// ─────────────────────────────────────────────────────────────────────────────

function SpecialSection({
  config,
  selected,
  onSelect,
}: {
  config: SectionConfig;
  selected: boolean;
  onSelect: () => void;
}) {
  const { state, retry } =
    useSubcategoryContent(
      config.title,
    );

  const content =
    state.status === "ready"
      ? state.content
      : null;

  const description =
    content?.description
      ?.bodyMarkdown;

  const cards =
    content?.items ?? [];

  return (
    <section
      className={`${styles.section} ${
        selected
          ? styles.sectionSelected
          : ""
      }`}
    >
      <button
        type="button"
        className={
          styles.sectionHeader
        }
        onClick={onSelect}
        aria-expanded={selected}
      >
        <span
          className={
            styles.sectionIcon
          }
          aria-hidden="true"
        >
          <Icon
            name={config.icon}
            size={24}
          />
        </span>

        <span
          className={
            styles.sectionHeaderText
          }
        >
          <span
            className={
              styles.sectionTitle
            }
          >
            {config.title}
          </span>

          {description && (
            <span
              className={
                styles.sectionDescription
              }
            >
              {description}
            </span>
          )}
        </span>

        <span
          className={`${styles.sectionArrow} ${
            selected
              ? styles.rotated
              : ""
          }`}
          aria-hidden="true"
        >
          <Icon
            name="chevron-down"
            size={18}
          />
        </span>
      </button>

      {selected && (
        <div
          className={
            styles.sectionBody
          }
        >
          {state.status === "loading" && (
            <p
              className={styles.status}
              role="status"
            >
              Loading…
            </p>
          )}

          {state.status === "error" && (
            <div
              className={styles.error}
              role="alert"
            >
              <span>
                {state.message}
              </span>

              <button
                type="button"
                onClick={retry}
              >
                Try again
              </button>
            </div>
          )}

          {content &&
            isEmpty(content) && (
              <p
                className={
                  styles.status
                }
              >
                Content for this section
                is coming soon.
              </p>
            )}

          {content?.tip && (
            <aside
              className={styles.tip}
            >
              <span
                className={
                  styles.tipIcon
                }
              >
                <Icon
                  name="lightbulb"
                  size={14}
                />
              </span>

              <div
                className={
                  styles.tipText
                }
              >
                <strong>
                  TIP{" "}
                </strong>

                <Markdown>
                  {
                    content.tip
                      .bodyMarkdown
                  }
                </Markdown>
              </div>
            </aside>
          )}

          {cards.length > 0 && (
            <div
              className={
                styles.cardGrid
              }
            >
              {cards.map(
                (section) => (
                  <article
                    key={
                      section.key
                    }
                    className={
                      styles.card
                    }
                  >
                    <div
                      className={
                        styles.cardIcon
                      }
                      aria-hidden="true"
                    >
                      <Icon
                        name={
                          config.icon
                        }
                        size={22}
                      />
                    </div>

                    <div
                      className={
                        styles.cardContent
                      }
                    >
                      <h3
                        className={
                          styles.cardTitle
                        }
                      >
                        {
                          section.title
                        }
                      </h3>

                      {section.bodyMarkdown && (
                        <div
                          className={
                            styles.cardDescription
                          }
                        >
                          <Markdown>
                            {
                              section.bodyMarkdown
                            }
                          </Markdown>
                        </div>
                      )}

                      {section.source
                        ?.url && (
                        <a
                          className={
                            styles.cardLink
                          }
                          href={
                            section
                              .source
                              .url
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Visit website for ${section.title}`}
                        >
                          Visit Website

                          <Icon
                            name="arrow-right"
                            size={14}
                          />
                        </a>
                      )}
                    </div>
                  </article>
                ),
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EDUCATION & FAMILY PAGE
// ─────────────────────────────────────────────────────────────────────────────

const GROUP_PARAM_TO_TITLE: Record<
  string,
  string
> = {
  childcare: "Child Care",
  schools: "Schools in Canada",
  colleges: "Colleges & Universities",
  esl: "ESL Classes",
  trade: "Trade Schools & Certifications",
};

export function EducationFamilyPageView() {
  const searchParams =
    useSearchParams();

  const groupParam =
    searchParams.get("group") ?? "";

  const activeEdGroup:
    | EducationGroup
    | null = groupParam
    ? (groupParam as EducationGroup)
    : null;

  const activeGroupTitle =
    GROUP_PARAM_TO_TITLE[
      groupParam
    ] ?? "";

  const groups =
    EDUCATION_CONFIG
      ?.subcategoryGroups ?? [];

  const allSubcategories =
    EDUCATION_CONFIG
      ?.subcategories ?? [];

  const firstSubcategory =
    allSubcategories[0] ??
    "Understand Childcare in Canada";

  const [
    schoolsDetailSub,
    setSchoolsDetailSub,
  ] =
    useState<SchoolsSubcategory | null>(
      null,
    );

  const [
    selectedSection,
    setSelectedSection,
  ] =
    useState<string>(
      firstSubcategory,
    );

  const [
    copilotSubcategory,
    setCopilotSubcategory,
  ] =
    useState<string>(
      firstSubcategory,
    );

  useEffect(() => {
    setSchoolsDetailSub(null);
  }, [groupParam]);

  const toggleSection = (
    subcategory: string,
  ) => {
    if (
      selectedSection ===
      subcategory
    ) {
      setSelectedSection("");
      return;
    }

    setSelectedSection(
      subcategory,
    );

    setCopilotSubcategory(
      subcategory,
    );
  };

  const handleStandardSectionChange =
    (
      subcategory: string,
      open: boolean,
    ) => {
      if (open) {
        setCopilotSubcategory(
          subcategory,
        );
      }
    };

  const isSchoolsGroup =
    activeGroupTitle ===
    "Schools in Canada";

  const effectiveCopilotSubcategory =
    isSchoolsGroup
      ? schoolsDetailSub ??
        "Understand Schools in Canada"
      : copilotSubcategory;

  const renderMainContent = () => {
    if (isSchoolsGroup) {
      if (schoolsDetailSub) {
        if (schoolsDetailSub === "School Life & Family Decisions") {
          return (
            <SchoolLifeFamilyDecisionsView
              subcategory={schoolsDetailSub}
              onBack={() => setSchoolsDetailSub(null)}
            />
          );
        }

        return (
          <SchoolsDetailView
            subcategory={
              schoolsDetailSub
            }
            onBack={() =>
              setSchoolsDetailSub(
                null,
              )
            }
          />
        );
      }

      return (
        <SchoolsHubView
          onSelectSubcategory={(
            sub,
          ) => {
            setSchoolsDetailSub(
              sub,
            );
            setCopilotSubcategory(
              sub,
            );
          }}
        />
      );
    }

    const hasGroups =
      groups.length > 0;

    const visibleGroups =
      activeGroupTitle
        ? groups.filter(
            (g) =>
              g.title ===
              activeGroupTitle,
          )
        : groups;

    if (
      hasGroups &&
      visibleGroups.length > 0
    ) {
      return (
        <>
          {visibleGroups.map(
            (group) => {
              const isSpecialGroup =
                group.subcategories
                  .length === 1 &&
                Boolean(
                  SPECIAL_SECTIONS[
                    group
                      .subcategories[0]
                  ],
                );

              if (
                isSpecialGroup
              ) {
                const subcategory =
                  group
                    .subcategories[0];

                const config =
                  SPECIAL_SECTIONS[
                    subcategory
                  ];

                return (
                  <div
                    key={
                      group.title
                    }
                    className={
                      styles.group
                    }
                  >
                    <h2
                      className={
                        styles.groupTitle
                      }
                    >
                      {
                        group.title
                      }
                    </h2>

                    <SpecialSection
                      config={
                        config
                      }
                      selected={
                        selectedSection ===
                        subcategory
                      }
                      onSelect={() =>
                        toggleSection(
                          subcategory,
                        )
                      }
                    />
                  </div>
                );
              }

              return (
                <section
                  key={
                    group.title
                  }
                  className={
                    styles.group
                  }
                >
                  <h2
                    className={
                      styles.groupTitle
                    }
                  >
                    {
                      group.title
                    }
                  </h2>

                  <div
                    className={
                      styles.standardGroup
                    }
                  >
                    {group.subcategories.map(
                      (
                        subcategory,
                      ) => {
                        const isSelected =
                          selectedSection ===
                          subcategory;

                        const isSpecial =
                          Boolean(
                            SPECIAL_SECTIONS[
                              subcategory
                            ],
                          );

                        if (
                          isSpecial
                        ) {
                          return (
                            <SpecialSection
                              key={
                                subcategory
                              }
                              config={
                                SPECIAL_SECTIONS[
                                  subcategory
                                ]
                              }
                              selected={
                                isSelected
                              }
                              onSelect={() =>
                                toggleSection(
                                  subcategory,
                                )
                              }
                            />
                          );
                        }

                        return (
                          <SubcategorySection
                            key={
                              subcategory
                            }
                            category={
                              CATEGORY
                            }
                            subcategory={
                              subcategory
                            }
                            defaultOpen={
                              isSelected
                            }
                            onOpenChange={
                              handleStandardSectionChange
                            }
                          />
                        );
                      },
                    )}
                  </div>
                </section>
              );
            },
          )}
        </>
      );
    }

    return (
      <>
        {allSubcategories.map(
          (subcategory) => {
            const config =
              SPECIAL_SECTIONS[
                subcategory
              ];

            if (config) {
              return (
                <SpecialSection
                  key={
                    subcategory
                  }
                  config={config}
                  selected={
                    selectedSection ===
                    subcategory
                  }
                  onSelect={() =>
                    toggleSection(
                      subcategory,
                    )
                  }
                />
              );
            }

            return (
              <SubcategorySection
                key={
                  subcategory
                }
                category={
                  CATEGORY
                }
                subcategory={
                  subcategory
                }
                defaultOpen={
                  selectedSection ===
                  subcategory
                }
                onOpenChange={
                  handleStandardSectionChange
                }
              />
            );
          },
        )}
      </>
    );
  };

  return (
    <AppShell
      activeHref="/education-family"
      activeEducationGroup={
        activeEdGroup
      }
    >
      <div className={styles.page}>
        <div
          className={
            styles.mainContent
          }
        >
          {groupParam && (
            <div
              className={
                styles.sections
              }
            >
              {renderMainContent()}
            </div>
          )}
        </div>

        <aside
          className={
            styles.copilot
          }
        >
          <AICopilot
            category={CATEGORY}
            subcategory={
              effectiveCopilotSubcategory
            }
            emptyStateDescription={`Ask anything about ${effectiveCopilotSubcategory.toLowerCase()} and get help finding relevant resources.`}
          />
        </aside>
      </div>
    </AppShell>
  );
}

