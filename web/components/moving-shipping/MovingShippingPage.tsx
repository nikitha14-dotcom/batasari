'use client';

import { useEffect, useId, useState } from 'react';

import { Markdown } from '@/components/content/ContentCard';
import { AppShell } from '@/components/navigation';
import { Icon, type IconName } from '@/components/navigation/icons';
import {
  ContentRequestError,
  fetchSubcategoryContent,
  isEmpty,
  type ContentSection,
  type SubcategoryContent,
} from '@/lib/content/contentApi';

import styles from './moving-shipping.module.css';

const MOVING_SECTIONS = [
  {
    key: 'official',
    title: 'Official guidance',
    subcategory: 'Official guidance',
    icon: 'book-open-check' as IconName,
    summary: 'Government guidance for bringing belongings into Canada and hiring a mover.',
  },
  {
    key: 'options',
    title: 'Moving and shipping options',
    subcategory: 'Moving and shipping options',
    icon: 'truck' as IconName,
    summary: 'Compare ways to move belongings, ship packages, and store items in Toronto.',
  },
] as const;

const OPTION_GROUPS = [
  {
    key: 'airline',
    title: 'Airline checked or excess baggage',
    description: 'Check the baggage page of your airline.',
    icon: 'briefcase-business' as IconName,
    sourceKeys: [],
    resourceVariant: 'list' as const,
  },
  {
    key: 'parcel',
    title: 'Parcel or courier shipping',
    description: 'Send boxes and smaller items through a parcel or courier service.',
    icon: 'mail' as IconName,
    sourceKeys: ['canada-post', 'fedex', 'ups', 'chit-chats'],
    resourceVariant: 'grid' as const,
  },
  {
    key: 'diy',
    title: 'DIY truck or cargo-van rental',
    description:
      "Truck sizes from 9' cargo vans to 26' box trucks with ramps and furniture dollies.",
    icon: 'truck' as IconName,
    sourceKeys: ['uhaul-rental'],
    resourceVariant: 'list' as const,
  },
  {
    key: 'containers',
    title: 'Containers',
    description:
      'Have a container delivered, load it at your own pace, and arrange transport to its destination.',
    icon: 'file-text' as IconName,
    sourceKeys: ['pods'],
    resourceVariant: 'list' as const,
  },
  {
    key: 'movers',
    title: 'Professional household movers',
    description: 'Compare movers through established moving directories and industry associations.',
    icon: 'users' as IconName,
    sourceKeys: ['moving-com', 'canadian-movers', 'fidi'],
    resourceVariant: 'list' as const,
  },
  {
    key: 'storage',
    title: 'Storage lockers in Toronto',
    description: 'Rent a storage unit while you settle in or coordinate your move.',
    icon: 'building-2' as IconName,
    sourceKeys: ['uhaul-storage', 'public-storage', 'storage-mart'],
    resourceVariant: 'list' as const,
  },
] as const;

type LoadState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; content: SubcategoryContent };

function sourceItems(content: SubcategoryContent): ContentSection[] {
  return content.items.filter((item) => item.key !== 'document-copy');
}

function documentCopy(content: SubcategoryContent): ContentSection | null {
  return content.items.find((item) => item.key === 'document-copy') ?? content.description;
}

type ResourceVariant = 'list' | 'grid';

function ResourceRow({ section }: { section: ContentSection }) {
  const href = section.source?.url;
  if (!href) {
    return (
      <div className={styles.resourceRow}>
        <span>{section.title}</span>
        {section.bodyMarkdown && <Markdown>{section.bodyMarkdown}</Markdown>}
      </div>
    );
  }

  return (
    <a className={styles.resourceRow} href={href} target="_blank" rel="noopener noreferrer">
      <span>{section.title}</span>
      <Icon name="arrow-right" size={16} />
    </a>
  );
}

function ResourceList({
  items,
  variant = 'list',
}: {
  items: ContentSection[];
  variant?: ResourceVariant;
}) {
  if (items.length === 0) return null;
  return (
    <div className={`${styles.resourceList} ${variant === 'grid' ? styles.resourceGrid : ''}`}>
      {items.map((item) => (
        <ResourceRow key={item.key} section={item} />
      ))}
    </div>
  );
}

function OfficialGuidance({ content }: { content: SubcategoryContent }) {
  if (isEmpty(content))
    return <p className={styles.status}>Guidance for this section is coming soon.</p>;

  const resources = sourceItems(content);
  if (resources.length > 0) {
    return (
      <div className={styles.contentStack}>
        <h3 className={styles.groupTitle}>Useful resources</h3>
        <ResourceList items={resources} />
      </div>
    );
  }

  const copy = documentCopy(content);
  return copy?.bodyMarkdown ? (
    <div className={styles.narrative}>
      <Markdown>{copy.bodyMarkdown}</Markdown>
    </div>
  ) : (
    <p className={styles.status}>Guidance for this section is coming soon.</p>
  );
}

function MovingOptionCard({
  group,
  items,
}: {
  group: (typeof OPTION_GROUPS)[number];
  items: ContentSection[];
}) {
  return (
    <article className={styles.optionCard}>
      <div className={styles.optionHeading}>
        <span className={styles.optionIcon}>
          <Icon name={group.icon} size={18} />
        </span>
        <div>
          <h3>{group.title}</h3>
          <p>{group.description}</p>
        </div>
      </div>
      {items.length > 0 && <ResourceList items={items} variant={group.resourceVariant} />}
    </article>
  );
}

function MovingOptions({ content }: { content: SubcategoryContent }) {
  if (isEmpty(content))
    return <p className={styles.status}>Moving and shipping resources are coming soon.</p>;

  const items = sourceItems(content);
  const knownKeys = new Set<string>(OPTION_GROUPS.flatMap((group) => [...group.sourceKeys]));
  const unknownItems = items.filter((item) => !knownKeys.has(item.key));
  const copy = documentCopy(content);

  if (items.length === 0) {
    return copy?.bodyMarkdown ? (
      <div className={styles.narrative}>
        <Markdown>{copy.bodyMarkdown}</Markdown>
      </div>
    ) : (
      <p className={styles.status}>Moving and shipping resources are coming soon.</p>
    );
  }

  return (
    <div className={styles.optionsContent}>
      {OPTION_GROUPS.map((group) => (
        <MovingOptionCard
          key={group.key}
          group={group}
          items={items.filter((item) => (group.sourceKeys as readonly string[]).includes(item.key))}
        />
      ))}
      {unknownItems.length > 0 && (
        <section className={styles.extraResources}>
          <h3 className={styles.groupTitle}>More resources</h3>
          <ResourceList items={unknownItems} />
        </section>
      )}
    </div>
  );
}

function Accordion({
  section,
  open,
  onToggle,
}: {
  section: (typeof MOVING_SECTIONS)[number];
  open: boolean;
  onToggle: () => void;
}) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<LoadState>({ status: 'idle' });
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    setState({ status: 'loading' });
    fetchSubcategoryContent('Moving & Shipping', section.subcategory, { signal: controller.signal })
      .then((content) => setState({ status: 'ready', content }))
      .catch((error: unknown) => {
        if ((error as Error)?.name === 'AbortError') return;
        const message =
          error instanceof ContentRequestError ? error.message : 'Something went wrong.';
        setState({ status: 'error', message });
      });
    return () => controller.abort();
  }, [attempt, open, section.subcategory]);

  return (
    <section className={`${styles.accordion} ${open ? styles.accordionOpen : ''}`}>
      <button
        type="button"
        className={styles.header}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
      >
        <span className={styles.iconBackground}>
          <Icon name={section.icon} size={24} />
        </span>
        <span className={styles.headerText}>
          <strong>{section.title}</strong>
          <span>{section.summary}</span>
        </span>
        <span className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`}>
          <Icon name="chevron-down" size={16} />
        </span>
      </button>
      {open && (
        <div id={panelId} className={styles.panel}>
          {state.status === 'loading' && (
            <p className={styles.status} role="status">
              Loading moving and shipping resources…
            </p>
          )}
          {state.status === 'error' && (
            <div className={styles.error} role="alert">
              <span>Couldn’t load this section. {state.message}</span>
              <button type="button" onClick={() => setAttempt((value) => value + 1)}>
                Try again
              </button>
            </div>
          )}
          {state.status === 'ready' &&
            (section.key === 'official' ? (
              <OfficialGuidance content={state.content} />
            ) : (
              <MovingOptions content={state.content} />
            ))}
        </div>
      )}
    </section>
  );
}

export function MovingShippingPage() {
  const [openSection, setOpenSection] = useState<string | null>(null);

  return (
    <AppShell activeHref="/moving-shipping">
      <main className={styles.page}>
        <h1 className={styles.heading}>Moving &amp; Shipping</h1>
        <p className={styles.heroDescription}>
          Plan your move, compare shipping options, and find helpful resources for moving to
          Toronto.
        </p>
        <div className={styles.sections}>
          {MOVING_SECTIONS.map((section) => (
            <Accordion
              key={section.key}
              section={section}
              open={openSection === section.key}
              onToggle={() =>
                setOpenSection((current) => (current === section.key ? null : section.key))
              }
            />
          ))}
        </div>
      </main>
    </AppShell>
  );
}

