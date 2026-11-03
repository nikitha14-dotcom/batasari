'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';

import { AppShell } from '@/components/navigation';
import { Icon } from '@/components/navigation/icons';
import { PageHero } from '@/components/ui';
import {
  ContentRequestError,
  fetchSubcategoryContent,
  type ContentSection,
  type SubcategoryContent,
} from '@/lib/content/contentApi';
import { safeExternalUrl } from '@/lib/copilot/safeUrl';
import { withKnewSoonerBrand } from '@/lib/content/brandCopy';
import { RequireSession } from '@/lib/supabase/RequireSession';
import styles from './help.module.css';

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; content: SubcategoryContent };

function normalizeLinks(markdown: string) {
  return markdown
    .replace(/\[Feedback page link\]/g, '[Feedback page](/feedback)')
    .replace(/\[Privacy Statement link\]/g, '[Privacy Statement](/privacy-statement)')
    .replace(/\[Privacy Statement\](?!\()/g, '[Privacy Statement](/privacy-statement)')
    .replace(/\[support email\]/g, '[Contact Support](/contact-us)');
}

function FaqMarkdown({ children }: { children: string }) {
  return (
    <ReactMarkdown
      components={{
        a: ({ href, children: label }) => {
          if (href?.startsWith('/') && !href.startsWith('//') && !href.includes('\\')) {
            return <Link href={href}>{label}</Link>;
          }
          const safeHref = safeExternalUrl(href);
          return safeHref ? (
            <a href={safeHref} target="_blank" rel="noopener noreferrer">
              {label}
            </a>
          ) : (
            <span>{label}</span>
          );
        },
      }}
      skipHtml
    >
      {normalizeLinks(withKnewSoonerBrand(children))}
    </ReactMarkdown>
  );
}

function FaqItem({
  item,
  index,
  open,
  onToggle,
}: {
  item: ContentSection;
  index: number;
  open: boolean;
  onToggle: () => void;
}) {
  const panelId = `faq-answer-${index}`;
  const buttonId = `faq-question-${index}`;

  return (
    <div className={`${styles.item} ${open ? styles.itemOpen : ''}`}>
      <button
        type="button"
        id={buttonId}
        className={styles.itemButton}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
      >
        <span>{withKnewSoonerBrand(item.title)}</span>
        <Icon name="chevron-down" size={16} />
      </button>
      {open && (
        <div id={panelId} className={styles.answer} role="region" aria-labelledby={buttonId}>
          <FaqMarkdown>{item.bodyMarkdown}</FaqMarkdown>
        </div>
      )}
    </div>
  );
}

function HelpContent() {
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: 'loading' });
    fetchSubcategoryContent('Help & FAQ', 'Help & FAQ', { signal: controller.signal })
      .then((content) => {
        if (controller.signal.aborted) return;
        setOpenIndex(null);
        setState({ status: 'ready', content });
      })
      .catch((cause: unknown) => {
        if ((cause as Error)?.name === 'AbortError') return;
        setState({
          status: 'error',
          message: cause instanceof ContentRequestError ? cause.message : 'Something went wrong.',
        });
      });
    return () => controller.abort();
  }, [attempt]);

  return (
    <AppShell activeHref="/help">
      <div className={styles.page}>
        <PageHero title="FAQ" />
        {state.status === 'ready' && state.content.description && (
          <div className={styles.description}>
            <FaqMarkdown>{state.content.description.bodyMarkdown}</FaqMarkdown>
          </div>
        )}
        <section className={styles.faqSection} aria-labelledby="faq-heading">
          <h2 id="faq-heading">Frequently asked questions</h2>
          {state.status === 'loading' && (
            <p className={styles.status} role="status">
              Loading…
            </p>
          )}
          {state.status === 'error' && (
            <div className={styles.error} role="alert">
              <p>Couldn&apos;t load the FAQs. {state.message}</p>
              <button type="button" onClick={() => setAttempt((value) => value + 1)}>
                Try again
              </button>
            </div>
          )}
          {state.status === 'ready' && state.content.items.length === 0 && (
            <p className={styles.status} role="status">
              The FAQs are unavailable right now.
            </p>
          )}
          {state.status === 'ready' && state.content.items.length > 0 && (
            <>
              <div className={styles.card} data-testid="faq-accordion">
                {state.content.items.map((item, index) => (
                  <FaqItem
                    key={`${item.key}-${index}`}
                    item={item}
                    index={index}
                    open={openIndex === index}
                    onToggle={() => setOpenIndex((current) => (current === index ? null : index))}
                  />
                ))}
              </div>
              <p className={styles.feedbackPrompt}>
                Can&apos;t find what you&apos;re looking for?{' '}
                <Link href="/feedback">Send us feedback</Link> and let us know what would help.
              </p>
            </>
          )}
        </section>
      </div>
    </AppShell>
  );
}

export default function Page() {
  return (
    <RequireSession>
      <HelpContent />
    </RequireSession>
  );
}

