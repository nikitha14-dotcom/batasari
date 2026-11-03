'use client';

import { useState } from 'react';
import Link from 'next/link';
import { RequireSession } from '@/lib/supabase/RequireSession';
import { AppShell } from '@/components/navigation';
import AICopilot from '@/components/copilot/AICopilot';
import {
  BENEFIT_KEYS,
  descriptionParagraphs,
  sectionsForKeys,
  useTaxesBenefitsPayContent,
} from './content';
import { BenefitsIcon, PayIcon, TaxesIcon } from './icons';

function PageContent() {
  const [benefitsOpen, setBenefitsOpen] = useState(false);
  const state = useTaxesBenefitsPayContent();
  const content = state.status === 'ready' ? state.content : null;
  const description = content?.description ?? null;
  const [intro, whyThisMatters] = descriptionParagraphs(description);
  const benefitsIntro = content?.items.find((item) => item.key === 'benefits');
  const benefits = sectionsForKeys(content, BENEFIT_KEYS);

  return (
    <AppShell activeHref="/finance">
      <div className="fin-page-layout">
        <div className="fin-page-main">
          <Link href="/finance" className="back-link fin-back-link">
            &lt; Finance
          </Link>
          <h1 className="bmm-heading" style={{ marginBottom: '12px' }}>
            {description?.title ?? 'Taxes, Benefits & Pay'}
          </h1>
          {intro && (
            <p className="bmm-acc-sub" style={{ marginBottom: '24px' }}>
              {intro}
            </p>
          )}
          {state.status === 'error' && (
            <p className="bmm-acc-sub">Couldn&apos;t load this section. {state.message}</p>
          )}
          <div className="bmm-acc-list" style={{ marginBottom: '24px' }}>
            <Link
              href="/finance/taxes-benefits-pay/taxes"
              className="bmm-acc-row"
              style={{ display: 'block', textDecoration: 'none' }}
            >
              <div className="bmm-acc-header" style={{ pointerEvents: 'none' }}>
                <TaxesIcon />
                <div className="bmm-acc-header-text">
                  <span className="bmm-acc-title">Understand taxes in Canada</span>
                  <span className="bmm-acc-sub">
                    The basics every newcomer needs before their first tax season.
                  </span>
                </div>
                <span className="bmm-acc-chevron" aria-hidden="true">
                  ›
                </span>
              </div>
            </Link>
            <div className={'bmm-acc-row' + (benefitsOpen ? ' bmm-acc-row--open' : '')}>
              <button
                className="bmm-acc-header"
                onClick={() => setBenefitsOpen((open) => !open)}
                aria-expanded={benefitsOpen}
              >
                <BenefitsIcon />
                <div className="bmm-acc-header-text">
                  <span className="bmm-acc-title">
                    {benefitsIntro?.title ?? 'Benefits you may qualify for'}
                  </span>
                  <span className="bmm-acc-sub">
                    {benefitsIntro?.bodyMarkdown ??
                      'Cash benefits and credits many newcomers are eligible for — even in your first year.'}
                  </span>
                </div>
                <span className="bmm-acc-chevron" aria-hidden="true">
                  {benefitsOpen ? '⌄' : '›'}
                </span>
              </button>
              {benefitsOpen && (
                <div className="bmm-acc-body">
                  <div className="bmm-detail">
                    {benefits.map(
                      (item) =>
                        item.source?.url && (
                          <a
                            key={item.key}
                            href={item.source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bmm-detail-link"
                          >
                            {item.title} ›
                          </a>
                        ),
                    )}
                  </div>
                </div>
              )}
            </div>
            <Link
              href="/finance/taxes-benefits-pay/pay"
              className="bmm-acc-row"
              style={{ display: 'block', textDecoration: 'none' }}
            >
              <div className="bmm-acc-header" style={{ pointerEvents: 'none' }}>
                <PayIcon />
                <div className="bmm-acc-header-text">
                  <span className="bmm-acc-title">Understand your pay</span>
                  <span className="bmm-acc-sub">
                    Make sense of your paycheque and know your rights as a worker in Ontario.
                  </span>
                </div>
                <span className="bmm-acc-chevron" aria-hidden="true">
                  ›
                </span>
              </div>
            </Link>
          </div>
          {whyThisMatters && (
            <div
              style={{
                padding: '14px 18px',
                borderRadius: '12px',
                border: '1px solid #bbf7d0',
                background: '#f0fdf4',
                color: '#14532d',
                fontSize: '13px',
                lineHeight: '1.6',
              }}
            >
              <strong>Why this matters: </strong>
              {whyThisMatters}
            </div>
          )}
        </div>
        <aside className="fin-copilot-col">
          <AICopilot category="Finance" subcategory="Taxes, Benefits & Pay" />
        </aside>
      </div>
    </AppShell>
  );
}

export default function TaxesBenefitsPayPage() {
  return (
    <RequireSession>
      <PageContent />
    </RequireSession>
  );
}

