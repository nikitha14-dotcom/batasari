'use client';

import { useState } from 'react';
import Link from 'next/link';
import { RequireSession } from '@/lib/supabase/RequireSession';
import { AppShell } from '@/components/navigation';
import AICopilot from '@/components/copilot/AICopilot';
import { sectionsForKeys, TAX_KEYS, useTaxesBenefitsPayContent } from '../content';
import { IncomeTaxIcon, ResidencyIcon, SinIcon } from '../icons';

const ICONS: Record<string, React.ReactNode> = {
  'getting-your-sin': <SinIcon />,
  'income-tax-basics': <IncomeTaxIcon />,
  'tax-residency-status': <ResidencyIcon />,
};

function PageContent() {
  const [open, setOpen] = useState<string | null>(null);
  const state = useTaxesBenefitsPayContent();
  const items = sectionsForKeys(state.status === 'ready' ? state.content : null, TAX_KEYS);
  return (
    <AppShell activeHref="/finance">
      <div className="fin-page-layout">
        <div className="fin-page-main">
          <Link href="/finance/taxes-benefits-pay" className="back-link fin-back-link">
            &lt; Taxes, Benefits &amp; Pay
          </Link>
          <h1 className="bmm-heading">Understand taxes in Canada</h1>
          <div className="bmm-acc-list" style={{ marginTop: '24px' }}>
            {items.map((item) => {
              const isOpen = open === item.key;
              return (
                <div
                  key={item.key}
                  className={'bmm-acc-row' + (isOpen ? ' bmm-acc-row--open' : '')}
                >
                  <button
                    className="bmm-acc-header"
                    onClick={() => setOpen((current) => (current === item.key ? null : item.key))}
                    aria-expanded={isOpen}
                  >
                    {ICONS[item.key]}
                    <div className="bmm-acc-header-text">
                      <span className="bmm-acc-title">{item.title}</span>
                      <span className="bmm-acc-sub">{item.bodyMarkdown}</span>
                    </div>
                    <span className="bmm-acc-chevron" aria-hidden="true">
                      ›
                    </span>
                  </button>
                  {isOpen && item.source?.url && (
                    <div className="bmm-acc-body">
                      <div className="bmm-detail">
                        <a
                          href={item.source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bmm-detail-link"
                        >
                          Learn more ›
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {state.status === 'error' && (
            <p className="bmm-acc-sub">Couldn&apos;t load this section. {state.message}</p>
          )}
        </div>
        <aside className="fin-copilot-col">
          <AICopilot category="Finance" subcategory="Taxes, Benefits & Pay" />
        </aside>
      </div>
    </AppShell>
  );
}

export default function TaxesPage() {
  return (
    <RequireSession>
      <PageContent />
    </RequireSession>
  );
}

