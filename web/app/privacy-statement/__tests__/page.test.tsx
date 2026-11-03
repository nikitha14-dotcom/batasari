import { render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { fetchSubcategoryContent } = vi.hoisted(() => ({
  fetchSubcategoryContent: vi.fn(),
}));

vi.mock('@/lib/supabase/RequireSession', () => ({
  RequireSession: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('@/lib/content/contentApi', async () => {
  const actual = await vi.importActual<typeof import('@/lib/content/contentApi')>(
    '@/lib/content/contentApi',
  );
  return { ...actual, fetchSubcategoryContent };
});

import Page from '../page';

const CONTENT = {
  description: {
    key: 'description',
    title: 'Current privacy copy',
    bodyMarkdown: '**Last updated: Nov 2 2026**\n\nCurrent introductory text.',
    source: null,
  },
  tip: null,
  items: [
    {
      key: 'collection',
      title: 'Information we collect',
      bodyMarkdown: 'Current details from the API.',
      source: null,
    },
    {
      key: 'about',
      title: 'About this statement',
      bodyMarkdown: 'For privacy questions, contact: **[email]**.',
      source: null,
    },
  ],
};

describe('privacy statement', () => {
  beforeEach(() => {
    fetchSubcategoryContent.mockReset();
    fetchSubcategoryContent.mockResolvedValue(CONTENT);
  });

  it('loads ordered detailed content from the backend and links to contact us', async () => {
    render(<Page />);

    expect(fetchSubcategoryContent).toHaveBeenCalledWith(
      'Privacy Statement',
      'Privacy Statement',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    const article = screen.getByRole('article');
    expect(
      await within(article).findByRole('heading', { level: 2, name: 'Current privacy copy' }),
    ).toBeInTheDocument();
    expect(within(article).getByText('Last updated: Nov 2 2026')).toBeInTheDocument();
    expect(within(article).getByText('Current introductory text.')).toBeInTheDocument();
    expect(
      within(article)
        .getAllByRole('heading', { level: 3 })
        .map((heading) => heading.textContent),
    ).toEqual(['Information we collect', 'About this statement']);
    expect(within(article).getByText('Current details from the API.')).toBeInTheDocument();
    expect(within(article).getByRole('link', { name: 'contact us' })).toHaveAttribute(
      'href',
      '/contact-us',
    );
    expect(screen.queryByRole('navigation', { name: 'Privacy statement sections' })).toBeNull();
  });

  it('shows an unavailable state when the backend has no rows', async () => {
    fetchSubcategoryContent.mockResolvedValue({ description: null, tip: null, items: [] });
    render(<Page />);
    expect(
      await screen.findByText('The privacy statement is unavailable right now.'),
    ).toBeInTheDocument();
  });

  it('does not turn a protocol-relative URL from content into a navigable link', async () => {
    fetchSubcategoryContent.mockResolvedValue({
      ...CONTENT,
      items: [{ ...CONTENT.items[0], bodyMarkdown: '[Review](//example.invalid/path)' }],
    });
    render(<Page />);
    expect(await screen.findByText('Review')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Review' })).toBeNull();
  });
});

