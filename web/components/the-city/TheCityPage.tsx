"use client";

import { useEffect, useId, useState } from "react";

import { AppShell } from "@/components/navigation";
import { Icon, type IconName } from "@/components/navigation/icons";
import {
  ContentRequestError,
  fetchSubcategoryContent,
  isEmpty,
  type ContentSection,
  type SubcategoryContent,
} from "@/lib/content/contentApi";
import { Markdown } from "@/components/content/ContentCard";
import styles from "./the-city.module.css";

const CITY_SECTIONS = [
  {
    key: "toronto",
    title: "Toronto at a Glance",
    subcategory: "The City: Toronto at a Glance",
    icon: "map-pinned" as IconName,
    summary: "Toronto is Canada’s largest, most culturally diverse economic hub, featuring four distinct seasons and a growing population.",
  },
  {
    key: "people",
    title: "People and Communities",
    subcategory: "People and Communities",
    icon: "users" as IconName,
    summary: "Learn about Toronto’s demographics, economy, labour force, and major languages.",
  },
  {
    key: "neighbourhoods",
    title: "Understanding Toronto’s Neighbourhoods",
    subcategory: "Understanding Toronto’s Neighbourhoods",
    icon: "building" as IconName,
    summary: "Explore neighbourhoods by lifestyle fit, local amenities, and urban or suburban setting.",
  },
  {
    key: "climate",
    title: "Climate and Seasonal Planning",
    subcategory: "Climate and Seasonal Planning",
    icon: "thermometer-sun" as IconName,
    summary: "Understand Toronto’s seasons, typical temperatures, and changing weather conditions.",
  },
  {
    key: "attractions",
    title: "Attractions & Recreation",
    subcategory: "Attractions & Recreation",
    icon: "ferris-wheel" as IconName,
    summary: "Find major landmarks, cultural venues, city parks, and natural trail networks.",
  },
  {
    key: "cost",
    title: "Cost & Lifestyle Comparison",
    subcategory: "Cost & Lifestyle Comparison for Different Cities",
    icon: "scale" as IconName,
    summary: "Compare rental markets, inflation, and direct cost-of-living measures across cities.",
  },
] as const;

const RESOURCE_LABELS: Readonly<Record<string, string>> = {
  "toronto-demographics": "Toronto’s Demographics, Economy & Labour Force",
  "canada-census": "Statistics Canada Census",
  "neighbourhood-profiles": "Toronto Neighbourhood Profiles",
  weather: "Weather and Seasonal Planning",
  "destination-toronto": "Destination Toronto",
  "parks-recreation": "City Parks & Recreation",
  "cmhc-rental-reports": "CMHC rental market report",
  "statistics-canada-cpi": "Statistics Canada CPI",
  bestplaces: "Best Places",
  numbeo: "Numbeo",
  expatistan: "Expatistan",
};

const COST_CORE_KEYS = new Set(["cmhc-rental-reports", "statistics-canada-cpi"]);
const COST_COMPARISON_KEYS = new Set(["bestplaces", "numbeo", "expatistan"]);

type LoadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; content: SubcategoryContent };

function documentCopy(content: SubcategoryContent): ContentSection | null {
  return content.items.find((item) => item.key === "document-copy") ?? content.description;
}

function resourceItems(content: SubcategoryContent): ContentSection[] {
  return content.items.filter((item) => item.key !== "document-copy");
}

function ResourceRow({ section }: { section: ContentSection }) {
  const href = section.source?.url;
  if (!href) {
    return (
      <div className={styles.contentBlock}>
        <strong>{RESOURCE_LABELS[section.key] ?? section.title}</strong>
        {section.bodyMarkdown && <Markdown>{section.bodyMarkdown}</Markdown>}
      </div>
    );
  }

  return (
    <a className={styles.resourceRow} href={href} target="_blank" rel="noopener noreferrer">
      <span>{RESOURCE_LABELS[section.key] ?? section.title}</span>
      <Icon name="arrow-right" size={16} />
    </a>
  );
}

function ResourceList({ items }: { items: ContentSection[] }) {
  if (items.length === 0) return null;
  return <div className={styles.resourceList}>{items.map((item) => <ResourceRow key={item.key} section={item} />)}</div>;
}

function Narrative({ content }: { content: SubcategoryContent }) {
  const copy = documentCopy(content);
  if (!copy?.bodyMarkdown) return null;
  return <div className={styles.narrative}><Markdown>{copy.bodyMarkdown}</Markdown></div>;
}

function CityContent({ content, sectionKey }: { content: SubcategoryContent; sectionKey: string }) {
  if (isEmpty(content)) return <p className={styles.status}>Content for this section is coming soon.</p>;

  const items = resourceItems(content);
  if (sectionKey === "toronto" || items.length === 0) {
    return documentCopy(content)?.bodyMarkdown ? <Narrative content={content} /> : <p className={styles.status}>Content for this section is coming soon.</p>;
  }

  if (sectionKey === "cost") {
    const core = items.filter((item) => COST_CORE_KEYS.has(item.key));
    const comparison = items.filter((item) => COST_COMPARISON_KEYS.has(item.key));
    const known = new Set([...core, ...comparison]);
    const other = items.filter((item) => !known.has(item));
    return (
      <div className={styles.contentStack}>
        {core.length > 0 && <><h3 className={styles.groupTitle}>Useful Resources</h3><ResourceList items={core} /></>}
        {comparison.length > 0 && <><h3 className={styles.groupTitle}>Direct cost-of-living comparisons for different cities</h3><ResourceList items={comparison} /></>}
        {other.length > 0 && <ResourceList items={other} />}
      </div>
    );
  }

  return (
    <div className={styles.contentStack}>
      <h3 className={styles.groupTitle}>Useful Resources</h3>
      <ResourceList items={items} />
    </div>
  );
}

function CityAccordion({
  section,
  open,
  onToggle,
}: {
  section: (typeof CITY_SECTIONS)[number];
  open: boolean;
  onToggle: () => void;
}) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<LoadState>({ status: "idle" });
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    setState({ status: "loading" });
    fetchSubcategoryContent("The City", section.subcategory, { signal: controller.signal })
      .then((content) => setState({ status: "ready", content }))
      .catch((error: unknown) => {
        if ((error as Error)?.name === "AbortError") return;
        const message = error instanceof ContentRequestError ? error.message : "Something went wrong.";
        setState({ status: "error", message });
      });
    return () => controller.abort();
  }, [attempt, open, section.subcategory]);

  return (
    <section className={styles.accordion}>
      <button type="button" className={styles.header} aria-expanded={open} aria-controls={panelId} onClick={onToggle}>
        <span className={styles.iconBackground}><Icon name={section.icon} size={24} /></span>
        <span className={styles.headerText}>
          <strong>{section.title}</strong>
          <span>{section.summary}</span>
        </span>
        <span className={`${styles.chevron} ${open ? styles.chevronOpen : ""}`}><Icon name="chevron-down" size={16} /></span>
      </button>
      {open && (
        <div id={panelId} className={styles.panel}>
          {state.status === "loading" && <p className={styles.status} role="status">Loading City resources…</p>}
          {state.status === "error" && (
            <div className={styles.error} role="alert">
              <span>Couldn’t load this section. {state.message}</span>
              <button type="button" onClick={() => setAttempt((value) => value + 1)}>Try again</button>
            </div>
          )}
          {state.status === "ready" && <CityContent content={state.content} sectionKey={section.key} />}
        </div>
      )}
    </section>
  );
}

export function TheCityPage() {
  const [openSection, setOpenSection] = useState<string | null>(null);

  return (
    <AppShell activeHref="/the-city">
      <main className={styles.page}>
        <h1 className={styles.heading}>The City</h1>
        <p className={styles.heroDescription}>Explore Toronto’s communities, neighbourhoods, climate, recreation and cost of living.</p>
        <div className={styles.sections}>
          {CITY_SECTIONS.map((section) => (
            <CityAccordion
              key={section.key}
              section={section}
              open={openSection === section.key}
              onToggle={() => setOpenSection((current) => (current === section.key ? null : section.key))}
            />
          ))}
        </div>
      </main>
    </AppShell>
  );
}

