import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { withKnewSoonerBrand } from '@/lib/content/brandCopy';
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
    title: 'Help & FAQ',
    bodyMarkdown:
      'Moving Assistant is currently in Beta. Features, AI models and policies may change as we learn from users and improve the product.',
    source: null,
  },
  tip: null,
  items: [
    {
      key: 'personalize',
      title: 'How does Moving Assistant personalize my experience?',
      bodyMarkdown: 'We use your saved context. See [Feedback page link] and [Privacy Statement].',
      source: null,
    },
    {
      key: 'delete',
      title: 'Can I delete my information?',
      bodyMarkdown: 'Yes. Contact [support email].',
      source: null,
    },
  ],
};

describe('Help & FAQ page', () => {
  beforeEach(() => {
    fetchSubcategoryContent.mockReset();
    fetchSubcategoryContent.mockResolvedValue(CONTENT);
  });

  it('loads FAQ items from the content API in the shared shell', async () => {
    render(<Page />);
    expect(fetchSubcategoryContent).toHaveBeenCalledWith(
      'Help & FAQ',
      'Help & FAQ',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(await screen.findByRole('heading', { level: 1, name: 'FAQ' })).toBeInTheDocument();
    expect(
      screen.getByText(
        'Batasari is currently in Beta. Features, AI models and policies may change as we learn from users and improve the product.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Frequently asked questions' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('Find answers to common questions about Batasari.'),
    ).toBeNull();
    expect(screen.getAllByRole('button')).toHaveLength(2);
    const accordion = screen.getByTestId('faq-accordion');
    expect(within(accordion).queryByRole('heading')).toBeNull();
    expect(within(accordion).queryByRole('link', { name: 'Send us feedback' })).toBeNull();
    expect(screen.getByRole('link', { name: 'Send us feedback' })).toHaveAttribute(
      'href',
      '/feedback',
    );
  });

  it('opens one answer at a time and resolves API placeholders to internal links', async () => {
    render(<Page />);
    const first = await screen.findByRole('button', {
      name: 'How does Batasari personalize my experience?',
    });
    fireEvent.click(first);
    expect(first).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/We use your saved context/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Feedback page' })).toHaveAttribute(
      'href',
      '/feedback',
    );
    expect(
      screen
        .getAllByRole('link', { name: 'Privacy Statement' })
        .some((link) => link.getAttribute('href') === '/privacy-statement'),
    ).toBe(true);

    const second = screen.getByRole('button', { name: 'Can I delete my information?' });
    fireEvent.click(second);
    expect(first).toHaveAttribute('aria-expanded', 'false');
    expect(second).toHaveAttribute('aria-expanded', 'true');
    expect(
      screen
        .getAllByRole('link', { name: 'Contact Support' })
        .some((link) => link.getAttribute('href') === '/contact-us'),
    ).toBe(true);
  });

  it('shows an unavailable state when the API has no FAQ rows', async () => {
    fetchSubcategoryContent.mockResolvedValue({ description: null, tip: null, items: [] });
    render(<Page />);
    expect(await screen.findByText('The FAQs are unavailable right now.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /personalize/i })).toBeNull();
  });

  it('does not render an empty accordion when the API only returns a description', async () => {
    fetchSubcategoryContent.mockResolvedValue({
      description: CONTENT.description,
      tip: null,
      items: [],
    });
    render(<Page />);
    expect(await screen.findByText(withKnewSoonerBrand(CONTENT.description.bodyMarkdown))).toBeInTheDocument();
    expect(screen.getByText('The FAQs are unavailable right now.')).toBeInTheDocument();
    expect(screen.queryByTestId('faq-accordion')).toBeNull();
  });

  it('keeps accordion controls and regions uniquely addressable for duplicate API keys', async () => {
    fetchSubcategoryContent.mockResolvedValue({
      ...CONTENT,
      items: [CONTENT.items[0], { ...CONTENT.items[0], title: 'A second question' }],
    });
    render(<Page />);
    // Wait for FAQ items to load before counting all buttons
    await screen.findByRole('button', { name: withKnewSoonerBrand(CONTENT.items[0].title) });
    const questions = screen.getAllByRole('button').filter(
      (btn) => btn.getAttribute('aria-controls') !== null,
    );
    expect(questions).toHaveLength(2);
    expect(questions[0]).toHaveAttribute('aria-controls', 'faq-answer-0');
    expect(questions[1]).toHaveAttribute('aria-controls', 'faq-answer-1');

    fireEvent.click(questions[0]);
    expect(screen.getByRole('region', { name: withKnewSoonerBrand(CONTENT.items[0].title) })).toHaveAttribute(
      'aria-labelledby',
      'faq-question-0',
    );
    expect(screen.queryByRole('region', { name: 'A second question' })).toBeNull();
  });

  it('does not turn raw HTML from API markdown into DOM elements', async () => {
    fetchSubcategoryContent.mockResolvedValue({
      ...CONTENT,
      items: [{ ...CONTENT.items[0], bodyMarkdown: '<img src="/tracking" />Safe text' }],
    });
    render(<Page />);
    fireEvent.click(await screen.findByRole('button', { name: withKnewSoonerBrand(CONTENT.items[0].title) }));
    expect(screen.queryByRole('img')).toBeNull();
    expect(screen.getByText('Safe text')).toBeInTheDocument();
  });
});

