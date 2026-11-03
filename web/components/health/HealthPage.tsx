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
import styles from "./health.module.css";

const HEALTH_SECTIONS = [
  {
    key: "ontario",
    title: "Healthcare in Ontario",
    icon: "heart-pulse" as IconName,
    subcategory: "Healthcare in Ontario",
    summary:
      "Ontario has a publicly funded healthcare system, but eligibility and coverage depend on your immigration status and Ontario residency.",
  },
  {
    key: "insurance",
    title: "Additional healthcare insurance",
    icon: "shield-plus" as IconName,
    subcategory: "Additional healthcare insurance",
    summary:
      "Explore additional healthcare insurance options for students, refugees, protected persons, and private coverage providers",
  },
  {
    key: "primary-care",
    title: "Finding a family doctor or nurse practitioner",
    icon: "stethoscope" as IconName,
    subcategory: "Finding a family doctor or nurse practitioner",
    summary:
      "Find a primary-care provider, check available options, and learn how to register with a family doctor or nurse practitioner.",
  },
  {
    key: "services",
    title: "Medical services and mental health support",
    icon: "brain" as IconName,
    subcategory: "Medical services and mental health support",
    summary: "Find hospitals, walk-in clinics, medical helplines, and mental health support services.",
  },
] as const;

const PRIVATE_INSURANCE_KEYS = new Set(["sun-life", "manulife", "canada-life", "greenshield", "blue-cross"]);
const HOSPITAL_KEYS = new Set([
  "uhn", "unity-health", "sinai-health", "sunnybrook", "scarborough-health",
  "north-york-general", "humber-river-health", "sickkids", "womens-college",
]);

const PRIVATE_INSURANCE_LINK_COPY: Record<string, string> = {
  "sun-life": "Learn more about health insurance options from Sun Life",
  manulife: "Learn more about health insurance options from Manulife",
  "canada-life": "Learn more about health and dental insurance from Canada Life",
  greenshield: "Learn more about health insurance from GreenShield",
  "blue-cross": "Learn more about health insurance from Blue Cross",
};

const HOSPITAL_LINK_COPY: Record<string, string> = {
  uhn: "Learn more about University Health Network",
  "unity-health": "Learn more about Unity Health",
  "sinai-health": "Learn more about Sinai Health",
  sunnybrook: "Learn more about Sunnybrook",
  "scarborough-health": "Learn more about Scarborough Health Network",
  "north-york-general": "Learn more about North York General",
  "humber-river-health": "Learn more about Humber River Health",
  sickkids: "Learn more about SickKids",
  "womens-college": "Learn more about Women's College Hospital",
};

type LoadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; content: SubcategoryContent };

function ExternalResource({ section, label }: { section: ContentSection; label?: string }) {
  const href = section.source?.url;
  if (!href) {
    return (
      <div className={styles.contentBlock}>
        <h3>{section.title}</h3>
        {section.bodyMarkdown && <Markdown>{section.bodyMarkdown}</Markdown>}
      </div>
    );
  }

  return (
    <a className={styles.resource} href={href} target="_blank" rel="noopener noreferrer">
      <span className={styles.resourceText}>
        <strong>{label ?? section.title}</strong>
        {section.bodyMarkdown && section.bodyMarkdown !== section.title && (
          <div className={styles.resourceDescription}><Markdown>{section.bodyMarkdown}</Markdown></div>
        )}
      </span>
      <Icon name="arrow-right" size={16} />
    </a>
  );
}

function ResourceGroup({ items }: { items: ContentSection[] }) {
  return <>{items.map((item) => <ExternalResource key={item.key} section={item} />)}</>;
}

function FeatureLink({ section, label, href }: { section?: ContentSection; label: string; href?: string }) {
  if (!section) return null;
  const destination = href ?? section.source?.url;
  if (!destination) return <div className={styles.featureLink}><span>{label}</span></div>;
  return (
    <a className={styles.featureLink} href={destination} target={destination.startsWith("tel:") ? undefined : "_blank"} rel={destination.startsWith("tel:") ? undefined : "noopener noreferrer"}>
      <span>{label}</span>
      <span className={styles.externalIcon} aria-hidden="true">↗</span>
    </a>
  );
}

function ResourceList({ items, labelForItem }: { items: ContentSection[]; labelForItem: (item: ContentSection) => string }) {
  if (items.length === 0) return null;
  return (
    <div className={styles.companyList}>
      {items.map((item) => {
        const label = labelForItem(item);
        if (!item.source?.url) return <ExternalResource key={item.key} section={item} label={label} />;
        return (
          <a key={item.key} className={styles.companyRow} href={item.source.url} target="_blank" rel="noopener noreferrer">
            <strong>{item.title}</strong>
            <span className={styles.companyLink}>
              {label}
              <span className={styles.externalIcon} aria-hidden="true">↗</span>
            </span>
          </a>
        );
      })}
    </div>
  );
}

function PrivateInsuranceList({ items }: { items: ContentSection[] }) {
  return <ResourceList items={items} labelForItem={(item) => PRIVATE_INSURANCE_LINK_COPY[item.key] ?? item.source?.name ?? item.title} />;
}

function HospitalList({ items }: { items: ContentSection[] }) {
  return <ResourceList items={items} labelForItem={(item) => HOSPITAL_LINK_COPY[item.key] ?? `Learn more about ${item.title}`} />;
}

function HealthContent({ content, sectionKey }: { content: SubcategoryContent; sectionKey: string }) {
  if (isEmpty(content)) return <p className={styles.status}>Content for this section is coming soon.</p>;

  if (sectionKey === "insurance") {
    const items = content.items.filter((item) => item.key !== "document-copy");
    const students = items.find((item) => item.key === "uhip");
    const refugees = items.find((item) => item.key === "ifhp");
    const companies = items.filter((item) => PRIVATE_INSURANCE_KEYS.has(item.key));
    const fallback = items.filter((item) => item !== students && item !== refugees && !PRIVATE_INSURANCE_KEYS.has(item.key));
    const documentCopy = content.items.find((item) => item.key === "document-copy");
    return (
      <div className={styles.insuranceContent}>
        {students && <><h3 className={styles.groupTitle}>Students</h3><FeatureLink section={students} label="Learn more about UHIP health insurance for students" /></>}
        {refugees && <><h3 className={styles.groupTitle}>Refugees &amp; Protected Persons</h3><FeatureLink section={refugees} label="Learn more about health care coverage for refugees and protected persons" /></>}
        {companies.length > 0 && <><h3 className={styles.groupTitle}>Major Private Insurance Companies</h3><PrivateInsuranceList items={companies} /></>}
        {fallback.length > 0 && <ResourceGroup items={fallback} />}
        {items.length === 0 && documentCopy && <div className={styles.description}><Markdown>{documentCopy.bodyMarkdown}</Markdown></div>}
      </div>
    );
  }

  if (sectionKey === "services") {
    const items = content.items.filter((item) => item.key !== "document-copy");
    const hospitals = items.filter((item) => HOSPITAL_KEYS.has(item.key));
    const walkInClinics = items.find((item) => item.key === "walk-in-clinics");
    const healthLink = items.find((item) => item.key === "health-811");
    const mentalHealth = items.find((item) => item.key === "camh-crisis");
    const knownItems = new Set([...hospitals, walkInClinics, healthLink, mentalHealth].filter(Boolean));
    const ungrouped = items.filter((item) => !knownItems.has(item));
    const documentCopy = content.items.find((item) => item.key === "document-copy");
    return (
      <div className={styles.servicesContent}>
        {hospitals.length > 0 && <><h3 className={styles.groupTitle}>Major Hospitals</h3><HospitalList items={hospitals} /></>}
        {walkInClinics && <><h3 className={styles.groupTitle}>Walk-in Clinics</h3><FeatureLink section={walkInClinics} label="Learn more about walk-in clinics" /></>}
        {healthLink && <><h3 className={styles.groupTitle}>HealthLink</h3><FeatureLink section={healthLink} href="tel:811" label="Call 811 for 24/7 health advice" /></>}
        {mentalHealth && <><h3 className={styles.groupTitle}>Mental Health Support</h3><FeatureLink section={mentalHealth} label="Learn more about mental health crisis resources and support" /></>}
        {ungrouped.length > 0 && <>{ungrouped.map((item) => <ExternalResource key={item.key} section={item} />)}</>}
        {items.length === 0 && documentCopy && <div className={styles.description}><Markdown>{documentCopy.bodyMarkdown}</Markdown></div>}
      </div>
    );
  }

  return (
    <div className={styles.contentStack}>
      {content.description && <div className={styles.description}><Markdown>{content.description.bodyMarkdown}</Markdown></div>}
      {content.items.filter((item) => item.key !== "document-copy").map((item) => <ExternalResource key={item.key} section={item} />)}
      {content.items.every((item) => item.key === "document-copy") && content.items[0] && (
        <div className={styles.description}><Markdown>{content.items[0].bodyMarkdown}</Markdown></div>
      )}
    </div>
  );
}

function HealthAccordion({
  section,
  open,
  onToggle,
}: {
  section: (typeof HEALTH_SECTIONS)[number];
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
    fetchSubcategoryContent("Health", section.subcategory, { signal: controller.signal })
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
        <span className={styles.iconBackground}><Icon name={section.icon} size={26} /></span>
        <span className={styles.headerText}>
          <strong>{section.title}</strong>
          <span>{section.summary}</span>
        </span>
        <span className={`${styles.chevron} ${open ? styles.chevronOpen : ""}`}><Icon name="chevron-down" size={16} /></span>
      </button>
      {open && (
        <div id={panelId} className={styles.panel}>
          {state.status === "loading" && <p className={styles.status} role="status">Loading health resources…</p>}
          {state.status === "error" && (
            <div className={styles.error} role="alert">
              <span>Couldn’t load this section. {state.message}</span>
              <button type="button" onClick={() => setAttempt((value) => value + 1)}>Try again</button>
            </div>
          )}
          {state.status === "ready" && <HealthContent content={state.content} sectionKey={section.key} />}
        </div>
      )}
    </section>
  );
}

export function HealthPage() {
  const [openSection, setOpenSection] = useState<string | null>(null);
  return (
    <AppShell activeHref="/health">
      <main className={styles.page}>
        <h1 className={styles.heading}>Health</h1>
        <p className={styles.heroDescription}>Understand healthcare in Ontario, explore OHIP and insurance options, and find medical services and support.</p>
        <div className={styles.sections}>
          {HEALTH_SECTIONS.map((section) => (
            <HealthAccordion
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

