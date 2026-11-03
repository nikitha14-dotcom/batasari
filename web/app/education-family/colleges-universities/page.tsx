"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import AICopilot from "@/components/copilot/AICopilot";
import { ContentCard, Markdown } from "@/components/content/ContentCard";
import contentStyles from "@/components/content/content.module.css";
import { AppShell } from "@/components/navigation";
import { Icon } from "@/components/navigation/icons";
import { RequireSession } from "@/lib/supabase/RequireSession";
import {
  ContentRequestError,
  fetchSubcategoryContent,
  type ContentSection,
  type SubcategoryContent,
} from "@/lib/content/contentApi";

import styles from "./page.module.css";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; content: SubcategoryContent };

type DocumentSection = {
  title: string;
  bodyMarkdown: string;
};

const CATEGORY = "Education & Family";
const SUBCATEGORY = "Colleges & Universities";

/** Resource keys establish placement only; each displayed title and URL comes from the API. */
const RESOURCE_KEYS_BY_SECTION: Record<string, readonly string[]> = {
  "Understand Your Post-Secondary Options": [
    "college-university-pathways",
    "ontario-college-program-types",
  ],
  "Find & Compare Colleges, Universities and Programs": [
    "educanada-program-search",
    "ouac",
    "ouinfo",
    "ontario-college-program-search",
    "centennial-college",
    "times-higher-education",
    "qs-rankings",
  ],
  "Admissions, Eligibility & Cost Planning": [
    "educanada-apply",
    "educanada-universities",
    "ontario-colleges-apply",
    "osap",
    "dli-list",
  ],
  "Student Experience, Career & Future Pathways": [
    "cooperative-education",
    "study-programs",
    "during-your-studies",
    "community-connections",
    "get-ready",
    "study-in-canada",
    "labour-market-information",
    "school-work-transition",
  ],
};

/** Split the database document into the section headings authored in its Markdown. */
function documentSections(section: ContentSection | undefined): DocumentSection[] {
  if (!section?.bodyMarkdown) return [];

  return section.bodyMarkdown
    .split(/^####\s+/m)
    .slice(1)
    .map((part) => {
      const [title = "", ...body] = part.split("\n");
      return { title: title.trim(), bodyMarkdown: body.join("\n").trim() };
    })
    .filter((entry) => entry.title && entry.bodyMarkdown && entry.title !== "Useful links");
}

function useCollegesUniversitiesContent() {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    fetchSubcategoryContent(CATEGORY, SUBCATEGORY, { signal: controller.signal })
      .then((content) => {
        if (!controller.signal.aborted) setState({ status: "ready", content });
      })
      .catch((error: unknown) => {
        if ((error as Error)?.name === "AbortError") return;
        setState({
          status: "error",
          message: error instanceof ContentRequestError ? error.message : "Something went wrong.",
        });
      });

    return () => controller.abort();
  }, []);

  return state;
}

function CollegeSection({
  section,
  resources,
}: {
  section: DocumentSection;
  resources: ContentSection[];
}) {
  const [open, setOpen] = useState(true);

  return (
    <section className={`${contentStyles.accordion} ${open ? contentStyles.accordionOpen : ""}`}>
      <button
        type="button"
        className={contentStyles.accordionHeader}
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
      >
        <span className={contentStyles.accordionIcon} aria-hidden="true">
          <Icon name="building-2" size={24} />
        </span>
        <span className={contentStyles.accordionText}>
          <span className={contentStyles.accordionTitle}>{section.title}</span>
        </span>
        <span
          className={`${contentStyles.chevron} ${open ? contentStyles.chevronOpen : ""}`}
          aria-hidden="true"
        >
          <Icon name="chevron-down" size={20} />
        </span>
      </button>
      {open && (
        <div className={contentStyles.panel}>
          <div className={styles.documentBody}>
            <Markdown>{section.bodyMarkdown}</Markdown>
          </div>
          {resources.length > 0 && (
            <div className={`${contentStyles.rows} ${styles.sectionResources}`}>
              {resources.map((resource) => (
                <ContentCard key={resource.key} section={resource} />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function CollegesUniversitiesPageContent() {
  const state = useCollegesUniversitiesContent();
  const content = state.status === "ready" ? state.content : null;
  const document = content?.items.find((item) => item.key === "document-copy");
  const sections = documentSections(document);
  const resourcesByKey = new Map(
    (content?.items ?? [])
      .filter((item) => item.key !== "document-copy")
      .map((item) => [item.key, item]),
  );

  return (
    <AppShell activeHref="/education-family">
      <div className={styles.layout}>
        <div className={styles.main}>
          <Link href="/education-family" className="back-link">
            ← Back
          </Link>
          <h1 className={contentStyles.heading}>{document?.title ?? SUBCATEGORY}</h1>

          {state.status === "loading" && <p className={contentStyles.status}>Loading content…</p>}
          {state.status === "error" && (
            <p className={contentStyles.status}>Couldn&apos;t load this section. {state.message}</p>
          )}
          {state.status === "ready" && sections.length === 0 && (
            <p className={contentStyles.status}>Content for this section is coming soon.</p>
          )}

          <div className={contentStyles.sections}>
            {sections.map((section) => (
              <CollegeSection
                key={section.title}
                section={section}
                resources={(RESOURCE_KEYS_BY_SECTION[section.title] ?? [])
                  .map((key) => resourcesByKey.get(key))
                  .filter((resource): resource is ContentSection => Boolean(resource))}
              />
            ))}
          </div>
        </div>
        <aside className={styles.copilot}>
          <AICopilot category={CATEGORY} subcategory={SUBCATEGORY} />
        </aside>
      </div>
    </AppShell>
  );
}

export default function CollegesUniversitiesPage() {
  return (
    <RequireSession>
      <CollegesUniversitiesPageContent />
    </RequireSession>
  );
}

