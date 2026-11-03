"use client";

import { useEffect, useId, useState } from "react";

import { AppShell } from "@/components/navigation";
import { Icon, type IconName } from "@/components/navigation/icons";
import {
  ContentRequestError,
  fetchSubcategoryContent,
  type ContentSection,
  type SubcategoryContent,
} from "@/lib/content/contentApi";
import styles from "./immigration.module.css";

const SECTIONS = [
  {
    key: "sin",
    title: "1. Social Insurance Number (SIN)",
    icon: "id-card" as IconName,
    subcategory: "Social Insurance Number (SIN)",
  },
  {
    key: "ircc",
    title: "2. Immigration, Refugees and Citizenship Canada (IRCC)",
    icon: "landmark" as IconName,
    subcategory: "Immigration, Refugees and Citizenship Canada (IRCC)",
  },
  {
    key: "programs",
    title: "3. Government programs serving immigrants",
    icon: "building-2" as IconName,
    subcategory: "Government Programs Serving Immigrants",
  },
] as const;

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; content: SubcategoryContent };

function sourceLabel(section: ContentSection): string {
  return section.source?.name ?? section.title;
}

function ResourceRow({ section, showLabel }: { section: ContentSection; showLabel: boolean }) {
  const href = section.source?.url;
  if (!href) {
    return <p className={styles.resourceMissing}>{section.title}</p>;
  }

  return (
    <a className={styles.resource} href={href} target="_blank" rel="noopener noreferrer">
      <span className={styles.resourceText}>
        {showLabel && <span className={styles.resourceLabel}>{section.title}</span>}
        <span className={styles.resourceLink}>{sourceLabel(section)}</span>
      </span>
      <Icon name="arrow-right" size={16} />
    </a>
  );
}

function ImmigrationAccordion({
  title,
  icon,
  subcategory,
  open,
  onToggle,
}: Omit<(typeof SECTIONS)[number], "key"> & {
  open: boolean;
  onToggle: () => void;
}) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    setState({ status: "loading" });
    fetchSubcategoryContent("Immigration", subcategory, { signal: controller.signal })
      .then((content) => setState({ status: "ready", content }))
      .catch((error: unknown) => {
        if ((error as Error)?.name === "AbortError") return;
        const message =
          error instanceof ContentRequestError ? error.message : "Something went wrong.";
        setState({ status: "error", message });
      });
    return () => controller.abort();
  }, [attempt, open, subcategory]);

  return (
    <section className={styles.accordion}>
      <button
        type="button"
        className={styles.header}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
      >
        <span className={styles.iconBackground}>
          <Icon name={icon} size={25} />
        </span>
        <span className={styles.title}>{title}</span>
        <span className={`${styles.chevron} ${open ? styles.chevronOpen : ""}`}>
          <Icon name="chevron-down" size={16} />
        </span>
      </button>

      {open && (
        <div id={panelId} className={styles.panel}>
          {state.status === "loading" && <p className={styles.status}>Loading resources…</p>}
          {state.status === "error" && (
            <div className={styles.error} role="alert">
              <span>Couldn’t load this section. {state.message}</span>
              <button type="button" onClick={() => setAttempt((value) => value + 1)}>
                Try again
              </button>
            </div>
          )}
          {state.status === "ready" && (
            <div className={styles.resources}>
              {state.content.items.length === 0 ? (
                <p className={styles.status}>Content for this section is coming soon.</p>
              ) : (
                state.content.items.map((item, index) => (
                  <ResourceRow
                    key={`${item.key}-${index}`}
                    section={item}
                    showLabel={subcategory !== "Immigration, Refugees and Citizenship Canada (IRCC)"}
                  />
                ))
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export function ImmigrationPage() {
  const [openSection, setOpenSection] = useState<string | null>(null);

  return (
    <AppShell activeHref="/immigration">
      <main className={styles.page}>
        <h1 className={styles.heading}>Immigration</h1>
        <p className={styles.notice}>
          For immigration and government requirements, we connect you directly to official sources
          so you always have the most current information.
        </p>
        <div className={styles.sections}>
          {SECTIONS.map(({ key, ...section }) => (
            <ImmigrationAccordion
              key={key}
              {...section}
              open={openSection === key}
              onToggle={() => setOpenSection((current) => (current === key ? null : key))}
            />
          ))}
        </div>
      </main>
    </AppShell>
  );
}

