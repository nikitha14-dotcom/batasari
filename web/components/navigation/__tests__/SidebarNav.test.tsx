import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams('group=childcare'),
  notFound: vi.fn(),
}));
vi.mock('../../../lib/supabase/RequireSession', () => ({
  RequireSession: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('@/components/copilot/AICopilot', () => ({
  default: ({ category }: { category?: string }) => <div data-testid="copilot">{category}</div>,
}));

import { NAV_ITEMS, SidebarNav } from '../SidebarNav';
import HousingPage from '../../../app/housing/page';
import FinancePage from '../../../app/finance/page';
import WorkPage from '../../../app/work/page';
import EducationFamilyPage from '../../../app/education-family/page';
import ChecklistPage from '../../../app/checklist/page';
import HelpPage from '../../../app/help/page';
import StatementPage from '../../../app/privacy-statement/page';
import FeedbackPage from '../../../app/feedback/page';
import CompareOptionsPage from '../../../app/housing/compare/page';

const EXPECTED: [string, string][] = [
  ['Housing', '/housing'],
  ['Finance', '/finance'],
  ['Daily Needs', '/daily-needs'],
  ['Health', '/health'],
  ['Work', '/work'],
  ['Immigration', '/immigration'],
  ['The City', '/the-city'],
  ['Moving & Shipping', '/moving-shipping'],
  ['Checklist', '/checklist'],
];

function sidebar() {
  return screen.getByRole('navigation', { name: 'Categories' });
}

describe('SidebarNav', () => {
  afterEach(() => {
    cleanup();
  });

  it('links all ten tabs, in order', () => {
    render(<SidebarNav activeHref="/health" />);
    const links = within(sidebar()).getAllByRole('link');
    expect(links.map((a) => [a.textContent, a.getAttribute('href')])).toEqual(EXPECTED);
    // Education & Family is a toggle button (not a link) when not on /education-family
    expect(
      within(sidebar()).getByRole('button', { name: 'Education & Family' }),
    ).toBeInTheDocument();
    expect(NAV_ITEMS).toHaveLength(10);
  });

  it('has FAQ, Privacy Statement, Contact Support, and Feedback below the divider', () => {
    render(<SidebarNav activeHref="/health" />);
    const support = screen.getByRole('navigation', { name: 'Support' });
    expect(
      within(support)
        .getAllByRole('link')
        .map((link) => link.getAttribute('href')),
    ).toEqual(['/help', '/privacy-statement', '/contact-us', '/feedback']);
    expect(within(support).getByRole('link', { name: 'FAQ' })).toHaveAttribute('href', '/help');
    expect(within(support).getByRole('link', { name: 'Privacy Statement' })).toHaveAttribute(
      'href',
      '/privacy-statement',
    );
    expect(within(support).getByRole('link', { name: 'Contact Support' })).toHaveAttribute(
      'href',
      '/contact-us',
    );
    expect(within(support).getByRole('link', { name: 'Feedback' })).toHaveAttribute(
      'href',
      '/feedback',
    );
  });

  it('highlights nothing when no activeHref is given', () => {
    render(<SidebarNav />);
    expect(screen.getAllByRole('link').some((a) => a.hasAttribute('aria-current'))).toBe(false);
  });

  it('marks only the active page', () => {
    render(<SidebarNav activeHref="/health" />);
    const current = screen
      .getAllByRole('link')
      .filter((a) => a.getAttribute('aria-current') === 'page');
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveTextContent('Health');
  });
});

describe('pages using the shared sidebar', () => {
  afterEach(() => {
    cleanup();
  });

  it('/finance renders its navigation cards and Copilot', () => {
    render(<FinancePage />);
    expect(screen.getByRole('heading', { level: 1, name: 'Finance' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Banking & Money/i })).toHaveAttribute(
      'href',
      '/finance/banking',
    );
    expect(screen.getByRole('link', { name: /Credit & Borrowing/i })).toHaveAttribute(
      'href',
      '/finance/credit',
    );
    expect(screen.getByRole('link', { name: /Taxes, Benefits & Pay/i })).toHaveAttribute(
      'href',
      '/finance/taxes-benefits-pay',
    );
    expect(screen.getByTestId('copilot')).toHaveTextContent('Finance');
    expect(within(sidebar()).getByRole('link', { name: 'Finance' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('/housing marks Housing as the current page in the sidebar', () => {
    render(<HousingPage />);
    // Scoped to the Categories nav: the brand wordmark also links to
    // /housing, and the stepper's first step carries aria-current="step".
    // The old assertion matched a global 'active' class that the scoped CSS
    // module renames, so it passed on markup that no longer exists.
    const housingLink = within(sidebar()).getByRole('link', { name: 'Housing' });
    expect(housingLink).toHaveAttribute('aria-current', 'page');
  });

  it('/education-family renders the active group with the shared accordion UI', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, json: async () => ({ sections: [] }) })),
    );
    render(await EducationFamilyPage({ searchParams: Promise.resolve({ group: 'childcare' }) }));
    // With group=childcare only the Child Care group heading is rendered
    expect(screen.getByRole('heading', { level: 2, name: 'Child Care' })).toBeInTheDocument();
    expect(screen.queryByText('Content to come.')).toBeNull();
    // The 4 Child Care subcategory accordions are present
    expect(
      screen.getByRole('button', { name: /Understand Childcare in Canada/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Find and Compare Childcare/i })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Costs and Financial Support/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Apply and Prepare/i })).toBeInTheDocument();
    // All 4 accordion buttons have aria-expanded
    expect(
      screen.getAllByRole('button').filter((button) => button.hasAttribute('aria-expanded')),
    ).toHaveLength(4);
    // Sidebar highlights Education & Family as active
    expect(within(sidebar()).getByRole('link', { name: 'Education & Family' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    vi.unstubAllGlobals();
  });

  // Work is no longer a placeholder: it renders the seven-section directory.
  // Its own behaviour is covered by components/work and app/__tests__/work.test.tsx.
  it('/work shows the Work directory, with Work active', () => {
    render(<WorkPage />);
    expect(screen.getByRole('heading', { level: 1, name: 'Work' })).toBeInTheDocument();
    expect(screen.queryByText('Content to come.')).toBeNull();
    expect(screen.getAllByRole('button', { expanded: false })).toHaveLength(8);
    expect(within(sidebar()).getByRole('link', { name: 'Work' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('/checklist shows the copilot, with Checklist active', () => {
    render(<ChecklistPage />);
    expect(screen.getByRole('heading', { level: 1, name: 'Checklist' })).toBeInTheDocument();
    expect(screen.getByTestId('copilot')).toHaveTextContent('Checklist');
    expect(within(sidebar()).getByRole('link', { name: 'Checklist' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('housing sub-pages keep Housing highlighted', () => {
    render(<CompareOptionsPage />);
    expect(within(sidebar()).getByRole('link', { name: 'Housing' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('/help shows the FAQ page and keeps FAQ active', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, json: async () => ({ sections: [] }) })),
    );
    render(<HelpPage />);
    expect(screen.getByRole('heading', { level: 1, name: 'FAQ' })).toBeInTheDocument();
    expect(await screen.findByText('The FAQs are unavailable right now.')).toBeInTheDocument();
    expect(
      within(screen.getByRole('navigation', { name: 'Support' })).getByRole('link', {
        name: 'FAQ',
      }),
    ).toHaveAttribute('aria-current', 'page');
  });

  it('/privacy-statement shows the statement and keeps its sidebar link active', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, json: async () => ({ sections: [] }) })),
    );
    render(<StatementPage />);
    expect(
      screen.getByRole('heading', { level: 1, name: 'Privacy Statement' }),
    ).toBeInTheDocument();
    expect(
      await screen.findByText('The privacy statement is unavailable right now.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Content to come.')).toBeNull();
    expect(
      within(screen.getByRole('navigation', { name: 'Support' })).getByRole('link', {
        name: 'Privacy Statement',
      }),
    ).toHaveAttribute('aria-current', 'page');
  });

  it('/feedback marks Feedback active in the sidebar', () => {
    render(<FeedbackPage />);
    expect(
      within(screen.getByRole('navigation', { name: 'Support' })).getByRole('link', {
        name: 'Feedback',
      }),
    ).toHaveAttribute('aria-current', 'page');
  });

  it('every page shows the shared header', () => {
    render(<FinancePage />);
    expect(screen.getByRole('banner')).toHaveTextContent(/Knew\s*Sooner/);
    expect(screen.getByRole('banner')).toHaveTextContent('Toronto, ON');
    expect(screen.getByRole('link', { name: 'Your profile' })).toHaveAttribute('href', '/profile');
  });
});

