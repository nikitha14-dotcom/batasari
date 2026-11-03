import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

// Same session mocks as housing-crime.test.tsx: the page sits behind
// RequireSession, so the tests render it as a signed-in user.
vi.mock('../../lib/supabase/client', () => ({
  isSupabaseConfigured: () => true,
  getSupabaseClient: () => ({ auth: { signOut: vi.fn() } }),
  getAccessToken: vi.fn(),
}));

vi.mock('../../lib/supabase/useSession', () => ({
  useSession: () => ({
    session: { user: { email: 'someone@example.com' } },
    loading: false,
    configured: true,
  }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

// The shared header and sidebar have their own tests (SidebarNav.test.tsx).
// Here the shell is a pass-through that records which tab the page asks
// for, so these tests stay about the Work content.
vi.mock('../../components/navigation', async () => {
  const { createElement } = await import('react');
  return {
    AppShell: ({ activeHref, children }: { activeHref?: string; children: ReactNode }) =>
      createElement(
        'div',
        { 'data-testid': 'app-shell', 'data-active-href': activeHref },
        children,
      ),
  };
});

// The co-pilot beside the directory has its own tests (work-copilot.test.tsx
// and copilot.test.tsx). Here it is a stub, so these tests stay about the
// directory.
vi.mock('@/components/copilot/AICopilot', async () => {
  const { createElement } = await import('react');
  return {
    default: ({ category }: { category?: string }) =>
      createElement('div', { 'data-testid': 'copilot' }, category),
  };
});

import WorkPage from '../work/page';

describe('Work page', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders the Work heading and the seven-section directory', () => {
    render(<WorkPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'Work' })).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(7);
    // Seven section headers: count the buttons that expand a section, so a
    // control added around the page later does not change this number.
    expect(screen.getAllByRole('button', { expanded: false })).toHaveLength(7);
  });

  it('sits inside the shared shell with the Work tab active', () => {
    render(<WorkPage />);

    expect(screen.getByTestId('app-shell')).toHaveAttribute('data-active-href', '/work');
  });

  it('walks a newcomer from agencies to their rights and back out', () => {
    render(<WorkPage />);

    // Open Employment Services and find a specific agency.
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Employment services & Support Agencies',
      }),
    );
    const agencies = screen.getByRole('region', {
      name: 'Employment services & Support Agencies',
    });
    expect(
      within(agencies).getByRole('heading', { level: 3, name: 'JVS Toronto' }),
    ).toBeInTheDocument();
    expect(within(agencies).getByRole('link', { name: /JVS Toronto/ })).toHaveAttribute(
      'href',
      'https://jvstoronto.org',
    );

    // Move to Employee Rights: agencies close, the ESA guide appears.
    fireEvent.click(screen.getByRole('button', { name: 'Employee Rights' }));
    expect(
      screen.queryByRole('region', {
        name: 'Employment services & Support Agencies',
      }),
    ).toBeNull();
    const rights = screen.getByRole('region', { name: 'Employee Rights' });
    expect(
      within(rights).getByRole('link', {
        name: /Employment Standards Act guide \(Ontario\)/,
      }),
    ).toHaveAttribute(
      'href',
      'https://www.ontario.ca/document/your-guide-employment-standards-act-0',
    );

    // Close it again: back to the collapsed directory.
    fireEvent.click(screen.getByRole('button', { name: 'Employee Rights' }));
    expect(screen.queryAllByRole('link')).toHaveLength(0);
  });
});

