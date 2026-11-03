'use client';

import { Fragment, useEffect, useId, useState, type ReactNode } from 'react';

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
import styles from './daily-needs.module.css';

type DailyNeedsSection = {
  id: 'utilities' | 'groceries' | 'food-banks' | 'transportation' | 'mobile' | 'malls';
  title: string;
  summary: string;
  icon: IconName;
  /** Exact static_content lookup value. Content itself comes from GET /content. */
  subcategory: string;
};

const SECTIONS: readonly DailyNeedsSection[] = [
  {
    id: 'utilities',
    title: 'Home Utilities',
    summary:
      'Learn about electricity, water and wastewater, garbage and recycling, internet, and tenant or home insurance.',
    icon: 'house',
    subcategory: 'Home Utilities',
  },
  {
    id: 'groceries',
    title: 'Groceries',
    summary:
      'Find ways to save on groceries, affordable grocery stores, and tips for reducing grocery costs.',
    icon: 'shopping-cart',
    subcategory: 'Groceries',
  },
  {
    id: 'food-banks',
    title: 'Food Banks',
    summary: 'Learn how food banks work and find food bank resources in Toronto and the GTA.',
    icon: 'hand-heart',
    subcategory: 'Food banks',
  },
  {
    id: 'transportation',
    title: 'Transportation',
    summary:
      'Learn about public transit, driver’s licences, and buying or registering a car in Ontario.',
    icon: 'bus',
    subcategory: "Transportation — public transit, driver's licence, and car",
  },
  {
    id: 'mobile',
    title: 'Mobile Phone and Internet',
    summary:
      'Explore major mobile providers, prepaid and postpaid connections, and coverage considerations.',
    icon: 'smartphone',
    subcategory: 'Mobile phone and internet',
  },
  {
    id: 'malls',
    title: 'Major Malls',
    summary: 'Explore major malls and shopping options in Toronto.',
    icon: 'store',
    subcategory: 'Major malls',
  },
];

type LoadState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; content: SubcategoryContent };

/** Shared purple resource row used throughout the Daily Needs panels. */
function ExternalResourceLink({
  section,
  children,
}: {
  section: ContentSection;
  children?: ReactNode;
}) {
  const href = section.source?.url;

  if (!href) return null;

  return (
    <a className={styles.externalResource} href={href} target="_blank" rel="noopener noreferrer">
      <span>{children ?? section.source?.name ?? section.title}</span>
      <Icon name="external-link" size={16} />
    </a>
  );
}

function ResourceGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={styles.resourceGroup}>
      <h3>{title}</h3>
      <div className={styles.resourceGroupBody}>{children}</div>
    </section>
  );
}

function TagList({ items, breakBefore }: { items: readonly string[]; breakBefore?: string }) {
  return (
    <ul className={styles.tagList} aria-label="Informational providers">
      {items.map((item) => (
        <Fragment key={item}>
          {item === breakBefore && <li className={styles.tagBreak} aria-hidden="true" />}
          <li>{item}</li>
        </Fragment>
      ))}
    </ul>
  );
}

function TipsCallout({ title, children }: { title: string; children: ReactNode }) {
  const headingId = useId();

  return (
    <section className={styles.tips} aria-labelledby={headingId}>
      <h3 id={headingId}>
        <span className={styles.tipIcon} aria-hidden="true">
          <Icon name="lightbulb" size={16} />
        </span>
        {title}
      </h3>
      <div className={styles.tipBody}>{children}</div>
    </section>
  );
}

type GroceryBlock = {
  heading: string;
  lines: string[];
  bullets: string[];
};

/**
 * The content API stores a Groceries article as Markdown. This parser only
 * reads its headings and bullets so that editors keep control of every word
 * while the client applies the Figma layout to those API-provided values.
 */
function parseGroceryBlocks(markdown: string): GroceryBlock[] {
  const blocks: GroceryBlock[] = [];
  let current: GroceryBlock | null = null;

  for (const rawLine of markdown.split('\n')) {
    const heading = rawLine.match(/^#{1,6}\s+(.+?)\s*$/);
    if (heading) {
      current = { heading: heading[1].replace(/:$/, ''), lines: [], bullets: [] };
      blocks.push(current);
      continue;
    }

    const bullet = rawLine.match(/^\s*[-*]\s+(.+?)\s*$/);
    if (!current || !rawLine.trim()) continue;
    current.lines.push(rawLine.trim());
    if (bullet) current.bullets.push(bullet[1]);
  }

  return blocks;
}

function groceryBlock(blocks: readonly GroceryBlock[], word: string): GroceryBlock | undefined {
  return blocks.find((block) => block.heading.toLocaleLowerCase().includes(word));
}

function plainText(markdown: string): string {
  return markdown
    .replace(/\[([^\]]+)]\([^)]*\)/g, '$1')
    .replace(/[*_`]/g, '')
    .trim();
}

function capitalize(text: string): string {
  return text ? `${text[0].toLocaleUpperCase()}${text.slice(1)}` : text;
}

function resourceMentionedIn(resource: ContentSection, bullets: readonly string[]): boolean {
  const name = (resource.source?.name ?? resource.title).toLocaleLowerCase();
  return bullets.some((bullet) => plainText(bullet).toLocaleLowerCase().includes(name));
}

function resourceDescription(resource: ContentSection, bullets: readonly string[]): string {
  const name = resource.source?.name ?? resource.title;
  const matchingBullet = bullets.find((bullet) =>
    plainText(bullet).toLocaleLowerCase().includes(name.toLocaleLowerCase()),
  );
  if (!matchingBullet) return name;

  const text = plainText(matchingBullet);
  const index = text.toLocaleLowerCase().lastIndexOf(name.toLocaleLowerCase());
  const description = index >= 0 ? text.slice(0, index).replace(/[:\s-]+$/, '') : text;
  return capitalize(description || name);
}

function linkifiedText(text: string, resources: readonly ContentSection[]): ReactNode {
  const matches = resources
    .filter((resource) => resource.source?.url)
    .map((resource) => ({ resource, name: resource.source?.name ?? resource.title }))
    .sort((a, b) => b.name.length - a.name.length);

  const children: ReactNode[] = [];
  let remainder = plainText(text);
  let key = 0;

  while (remainder) {
    const candidate = matches
      .map((match) => ({
        match,
        index: remainder.toLocaleLowerCase().indexOf(match.name.toLocaleLowerCase()),
      }))
      .filter((value) => value.index >= 0)
      .sort((a, b) => a.index - b.index || b.match.name.length - a.match.name.length)[0];

    if (!candidate) {
      children.push(remainder);
      break;
    }

    if (candidate.index > 0) children.push(remainder.slice(0, candidate.index));
    children.push(
      <a
        key={`${candidate.match.resource.key}-${key}`}
        href={candidate.match.resource.source?.url ?? undefined}
        target="_blank"
        rel="noopener noreferrer"
      >
        {remainder.slice(candidate.index, candidate.index + candidate.match.name.length)}
      </a>,
    );
    remainder = remainder.slice(candidate.index + candidate.match.name.length);
    key += 1;
  }

  return children;
}

function titleCase(text: string): string {
  const minorWords = new Set(['and', 'in', 'of', 'the']);
  let wordIndex = 0;

  return text.replace(/\b[\p{L}][\p{L}'-]*/gu, (word) => {
    const lower = word.toLocaleLowerCase();
    const formatted = wordIndex > 0 && minorWords.has(lower) ? lower : capitalize(lower);
    wordIndex += 1;
    return formatted;
  });
}

function resourcesForText(resources: readonly ContentSection[], text: string): ContentSection[] {
  const lowerText = text.toLocaleLowerCase();
  const urls = [...text.matchAll(/\[[^\]]+]\(([^)]+)\)/g)].map((match) => match[1]);

  return resources.filter((resource) => {
    const name = (resource.source?.name ?? resource.title).toLocaleLowerCase();
    return (
      lowerText.includes(name) ||
      Boolean(resource.source?.url && urls.includes(resource.source.url))
    );
  });
}

function documentCopy(content: SubcategoryContent): ContentSection | undefined {
  // Environments that have not run the content-alignment migration still
  // return this article as the API's `description` section. Use the same
  // server-owned copy during that transition instead of dropping to a flat
  // Markdown layout.
  return (
    content.items.find((item) => item.key === 'document-copy') ?? content.description ?? undefined
  );
}

function FoodBanksContent({ content }: { content: SubcategoryContent }) {
  const document = documentCopy(content);
  const markdown = document?.bodyMarkdown ?? '';
  const intro = markdown.match(/^\*\*(.+?)\*\*(\??)\s*([^\n]+)(?:\n|$)/);
  const howItWorksLine = markdown.split('\n').find((line) => /how it works/i.test(line));
  const areaBullets = markdown
    .split('\n')
    .map((line) => line.match(/^\s*[-*]\s+(.+?)\s*$/)?.[1])
    .filter((line): line is string => Boolean(line));

  if (!document || !intro || !howItWorksLine || areaBullets.length === 0) {
    return <GenericDailyNeedsContent content={content} />;
  }

  const resources = content.items.filter((item) => item.key !== 'document-copy');
  const areas = areaBullets.map((bullet) => {
    const [rawArea, ...resourceCopy] = plainText(bullet).split(':');
    const area =
      rawArea.trim().toLocaleLowerCase() === 'gta' ? 'Greater Toronto Area.' : rawArea.trim();
    const related = resourcesForText(resources, resourceCopy.join(':'));
    return { area, related };
  });
  const displayedResources = new Set(areas.flatMap((area) => area.related));

  return (
    <div className={styles.panelContent}>
      <section className={styles.explainer}>
        <h3>{`${intro[1]}${intro[2]}`}</h3>
        <p>{intro[3]}</p>
      </section>
      <ResourceGroup title={howItWorksLine.replace(/\s+in:?\s*$/i, ':')}>
        <div className={styles.linkStack}>
          {areas.map(({ area, related }) => (
            <div key={area}>
              <strong>{area}</strong>
              {related.map((resource) => (
                <ExternalResourceLink key={resource.key} section={resource} />
              ))}
            </div>
          ))}
        </div>
      </ResourceGroup>
      {resources
        .filter((resource) => !displayedResources.has(resource))
        .map((resource) => (
          <ExternalResourceLink key={resource.key} section={resource} />
        ))}
    </div>
  );
}

function TransportationContent({ content }: { content: SubcategoryContent }) {
  const document = documentCopy(content);
  const blocks = parseGroceryBlocks(document?.bodyMarkdown ?? '');

  if (!document || blocks.length === 0) return <GenericDailyNeedsContent content={content} />;

  const resources = content.items.filter((item) => item.key !== 'document-copy');
  const grouped = blocks.map((block) => ({
    block,
    resources: resourcesForText(resources, [block.heading, ...block.lines].join('\n')),
  }));
  const displayedResources = new Set(grouped.flatMap((group) => group.resources));

  return (
    <div className={styles.transportContent}>
      {grouped.map(({ block, resources }) => {
        const heading = titleCase(plainText(block.heading).split(':')[0]);
        const description = block.bullets.map(plainText).filter(Boolean);

        return (
          <section className={styles.transportSection} key={block.heading}>
            <h3>{heading}</h3>
            {description.map((paragraph) => (
              <p key={paragraph}>{capitalize(paragraph)}</p>
            ))}
            <div className={styles.linkStack}>
              {resources.map((resource) => (
                <ExternalResourceLink key={resource.key} section={resource} />
              ))}
            </div>
          </section>
        );
      })}
      {resources
        .filter((resource) => !displayedResources.has(resource))
        .map((resource) => (
          <ExternalResourceLink key={resource.key} section={resource} />
        ))}
    </div>
  );
}

function apiStatement(markdown: string, label: string): { title: string; value: string } | null {
  const line = markdown
    .split('\n')
    .find((candidate) => candidate.toLocaleLowerCase().includes(label.toLocaleLowerCase()));
  if (!line) return null;

  const match = line.match(/^\s*(?:[-*]\s+)?\*\*(.+?)\*\*:\s*(.+?)\s*$/);
  return match ? { title: match[1], value: match[2] } : null;
}

function MobileContent({ content }: { content: SubcategoryContent }) {
  const document = documentCopy(content);
  const markdown = document?.bodyMarkdown ?? '';
  const providers = apiStatement(markdown, 'providers');
  const connections = apiStatement(markdown, 'connections');
  const tips = apiStatement(markdown, 'tips') ?? apiStatement(markdown, 'tip');

  if (!document || !providers || !connections || !tips) {
    return <GenericDailyNeedsContent content={content} />;
  }

  const providerNames = providers.value
    .split(',')
    .map((provider) => provider.trim())
    .filter(Boolean);

  return (
    <div className={`${styles.panelContent} ${styles.mobileContent}`}>
      <ResourceGroup title={titleCase(connections.title)}>
        <p>{connections.value}</p>
      </ResourceGroup>
      <ResourceGroup title={titleCase(providers.title)}>
        <TagList
          items={providerNames}
          breakBefore={providerNames.find((provider) => /^and their\b/i.test(provider))}
        />
      </ResourceGroup>
      <TipsCallout title="Tips and Recommendations">
        <p>{tips.value}</p>
      </TipsCallout>
    </div>
  );
}

function GroceryContent({ content }: { content: SubcategoryContent }) {
  const documentCopy = content.items.find((item) => item.key === 'document-copy');
  const blocks = parseGroceryBlocks(documentCopy?.bodyMarkdown ?? '');
  const apps = groceryBlock(blocks, 'app');
  const stores = groceryBlock(blocks, 'affordable');
  const tips = groceryBlock(blocks, 'tip');

  // Old data has a flat record shape. Keep it usable until it is migrated.
  if (!documentCopy || !apps || !stores || !tips)
    return <GenericDailyNeedsContent content={content} />;

  const resources = content.items.filter((item) => item.key !== 'document-copy');
  const appResources = resources.filter((resource) => resourceMentionedIn(resource, apps.bullets));
  const couponResources = resources.filter((resource) =>
    resourceMentionedIn(resource, tips.bullets),
  );
  const storesFromApi = stores.bullets.flatMap((bullet) =>
    plainText(bullet)
      .replace(/,?\s*etc\.?$/i, '')
      .split(',')
      .map((store) => store.trim().replaceAll('-', ' '))
      .filter(Boolean),
  );
  const unplacedResources = resources.filter(
    (resource) => !appResources.includes(resource) && !couponResources.includes(resource),
  );

  return (
    <div className={styles.panelContent}>
      <ResourceGroup title={apps.heading}>
        <div className={styles.linkStack}>
          {appResources.map((resource) => (
            <div key={resource.key}>
              <strong>{resource.title}</strong>
              <ExternalResourceLink section={resource}>
                {resourceDescription(resource, apps.bullets)}
              </ExternalResourceLink>
            </div>
          ))}
        </div>
      </ResourceGroup>

      <ResourceGroup title={stores.heading}>
        <TagList items={storesFromApi} />
      </ResourceGroup>

      <TipsCallout title={tips.heading}>
        <ul>
          {tips.bullets.map((tip) => (
            <li key={tip}>{linkifiedText(tip, couponResources)}</li>
          ))}
        </ul>
      </TipsCallout>

      {unplacedResources.length > 0 && (
        <section className={styles.resourceGroup} aria-label="Related resources">
          <div className={styles.linkStack}>
            {unplacedResources.map((resource) => (
              <ExternalResourceLink key={resource.key} section={resource} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function GenericDailyNeedsContent({ content }: { content: SubcategoryContent }) {
  if (isEmpty(content)) {
    return <p className={styles.status}>Content for this section is coming soon.</p>;
  }

  const documentCopy = content.items.find((item) => item.key === 'document-copy');
  const resources = content.items.filter((item) => item.key !== 'document-copy');

  return (
    <div className={styles.panelContent}>
      {documentCopy?.bodyMarkdown && (
        <div className={styles.documentContent}>
          <Markdown>{documentCopy.bodyMarkdown}</Markdown>
        </div>
      )}
      {content.description?.bodyMarkdown && (
        <div className={styles.documentContent}>
          <Markdown>{content.description.bodyMarkdown}</Markdown>
        </div>
      )}
      {resources.length > 0 && (
        <section className={styles.resourceGroup} aria-label="Related resources">
          <div className={styles.linkStack}>
            {resources.map((resource) => (
              <ExternalResourceLink key={resource.key} section={resource} />
            ))}
          </div>
        </section>
      )}
      {content.tip?.bodyMarkdown && (
        <section className={styles.tips}>
          <h3>
            <span className={styles.tipIcon} aria-hidden="true">
              <Icon name="lightbulb" size={16} />
            </span>
            {content.tip.title}
          </h3>
          <div className={styles.tipBody}>
            <Markdown>{content.tip.bodyMarkdown}</Markdown>
          </div>
        </section>
      )}
    </div>
  );
}

function DailyNeedsAccordion({
  section,
  open,
  onToggle,
}: {
  section: DailyNeedsSection;
  open: boolean;
  onToggle: () => void;
}) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<LoadState>({ status: 'idle' });
  const panelId = useId();
  const headingId = useId();

  useEffect(() => {
    if (!open) return;

    const controller = new AbortController();
    setState({ status: 'loading' });

    fetchSubcategoryContent('Daily Needs', section.subcategory, { signal: controller.signal })
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
    <section className={styles.accordion}>
      <h2 className={styles.accordionHeading}>
        <button
          id={headingId}
          type="button"
          className={styles.accordionHeader}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggle}
        >
          <span className={styles.iconBackground} aria-hidden="true">
            <Icon name={section.icon} size={27} />
          </span>
          <span className={styles.headerText}>
            <strong>{section.title}</strong>
            <span>{section.summary}</span>
          </span>
          <span
            className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`}
            aria-hidden="true"
          >
            <Icon name="chevron-down" size={16} />
          </span>
        </button>
      </h2>
      <div
        id={panelId}
        className={styles.panel}
        role="region"
        aria-labelledby={headingId}
        hidden={!open}
      >
        {state.status === 'loading' && (
          <p className={styles.status} role="status">
            Loading Daily Needs resources…
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
          (section.id === 'groceries' ? (
            <GroceryContent content={state.content} />
          ) : section.id === 'food-banks' ? (
            <FoodBanksContent content={state.content} />
          ) : section.id === 'transportation' ? (
            <TransportationContent content={state.content} />
          ) : section.id === 'mobile' ? (
            <MobileContent content={state.content} />
          ) : (
            <GenericDailyNeedsContent content={state.content} />
          ))}
      </div>
    </section>
  );
}

/** Daily Needs, matching the DN-01 through DN-07 accordion sequence. */
export function DailyNeedsPage() {
  const [openSection, setOpenSection] = useState<DailyNeedsSection['id'] | null>(null);

  return (
    <AppShell activeHref="/daily-needs">
      <div className={styles.page}>
        <header className={styles.hero}>
          <h1>Daily Needs</h1>
          <p>
            Find essential everyday services and resources, from home utilities and groceries to
            transportation, mobile services, and shopping.
          </p>
        </header>

        <div className={styles.sections}>
          {SECTIONS.map((section) => (
            <DailyNeedsAccordion
              key={section.id}
              section={section}
              open={openSection === section.id}
              onToggle={() =>
                setOpenSection((current) => (current === section.id ? null : section.id))
              }
            />
          ))}
        </div>
      </div>
    </AppShell>
  );
}

