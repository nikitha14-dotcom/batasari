import { describe, expect, it } from 'vitest';
import type { SubcategoryContent } from '@/lib/content/contentApi';
import { BENEFIT_KEYS, sectionsForKeys, TAX_KEYS } from './content';

const section = (key: string) => ({
  key,
  title: key,
  bodyMarkdown: '',
  source: {
    name: `${key} source`,
    url: `https://example.com/${key}`,
    authorityTier: 'A' as const,
    jurisdiction: 'Canada',
  },
});

describe('Taxes, Benefits & Pay section mapping', () => {
  it('uses every link-bearing section key from the aligned Finance migration', () => {
    const expectedKeys = [...TAX_KEYS, ...BENEFIT_KEYS];
    const content: SubcategoryContent = {
      description: null,
      tip: null,
      items: expectedKeys.map(section),
    };

    expect(sectionsForKeys(content, TAX_KEYS).map((item) => item.key)).toEqual(TAX_KEYS);
    expect(sectionsForKeys(content, BENEFIT_KEYS).map((item) => item.key)).toEqual(BENEFIT_KEYS);
    expect(expectedKeys).toEqual([
      'getting-your-sin',
      'income-tax-basics',
      'tax-residency-status',
      'gst-hst-credit',
      'canada-child-benefit',
      'ontario-trillium-benefit',
      'other-child-family-benefits',
    ]);
  });
});

