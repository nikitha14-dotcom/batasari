'use client';

import { useEffect, useState } from 'react';
import {
  ContentRequestError,
  fetchSubcategoryContent,
  type ContentSection,
  type SubcategoryContent,
} from '@/lib/content/contentApi';

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; content: SubcategoryContent };

export const TAX_KEYS = ['getting-your-sin', 'income-tax-basics', 'tax-residency-status'];
export const BENEFIT_KEYS = [
  'gst-hst-credit',
  'canada-child-benefit',
  'ontario-trillium-benefit',
  'other-child-family-benefits',
];
export const PAY_KEYS = ['reading-pay-stub', 'cpp-ei-deductions'];

export function useTaxesBenefitsPayContent() {
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  useEffect(() => {
    const controller = new AbortController();
    fetchSubcategoryContent('Finance', 'Taxes, Benefits & Pay', { signal: controller.signal })
      .then((content) => {
        if (!controller.signal.aborted) setState({ status: 'ready', content });
      })
      .catch((error: unknown) => {
        if ((error as Error)?.name === 'AbortError') return;
        setState({
          status: 'error',
          message: error instanceof ContentRequestError ? error.message : 'Something went wrong.',
        });
      });
    return () => controller.abort();
  }, []);
  return state;
}

export function sectionsForKeys(content: SubcategoryContent | null, keys: string[]) {
  if (!content) return [];
  return keys
    .map((key) => content.items.find((item) => item.key === key))
    .filter((item): item is ContentSection => Boolean(item));
}

export function descriptionParagraphs(section: ContentSection | null) {
  return section?.bodyMarkdown.split(/\n\s*\n/).filter(Boolean) ?? [];
}

