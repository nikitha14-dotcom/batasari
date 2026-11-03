import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as copilotService from '@/lib/copilot/copilotService';

// Signed-in user, as in work.test.tsx. The real co-pilot renders here; only
// the network call is replaced.
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

vi.mock('../../components/navigation', async () => {
  const { createElement } = await import('react');
  return {
    AppShell: ({ children }: { children: ReactNode }) => createElement('div', null, children),
  };
});

import WorkPage from '../work/page';

function copilot() {
  return screen.getByRole('complementary', { name: 'AI Co-Pilot' });
}

describe('Work co-pilot', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('sits beside the directory, which keeps all seven sections', () => {
    render(<WorkPage />);

    const directory = screen.getByRole('region', { name: 'Work directory' });
    expect(within(directory).getByRole('heading', { level: 1, name: 'Work' })).toBeInTheDocument();
    expect(within(directory).getAllByRole('heading', { level: 2 })).toHaveLength(7);
    expect(copilot()).toBeInTheDocument();
  });

  it("opens with Work's two questions, not Housing's", () => {
    render(<WorkPage />);

    const panel = within(copilot());
    expect(panel.getByRole('button', { name: 'Will my degree count here?' })).toBeInTheDocument();
    expect(
      panel.getByRole('button', { name: 'How do I spot a fake job offer?' }),
    ).toBeInTheDocument();
    expect(panel.queryByText(/rental application/)).toBeNull();
    expect(panel.queryByText(/commute planning/)).toBeNull();
    expect(panel.getByText(/finding work, your rights at work/)).toBeInTheDocument();
  });

  it('sends the full question under the Work category when a card is tapped', () => {
    const send = vi
      .spyOn(copilotService, 'getCopilotResponse')
      .mockImplementation(async () => undefined);

    render(<WorkPage />);
    fireEvent.click(within(copilot()).getByRole('button', { name: 'Will my degree count here?' }));

    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        question: 'Will my degree or qualification be recognised in Ontario?',
        category: 'Work',
      }),
    );
    // The chat shows what was actually asked.
    expect(
      within(copilot()).getByText('Will my degree or qualification be recognised in Ontario?'),
    ).toBeInTheDocument();
  });
});

