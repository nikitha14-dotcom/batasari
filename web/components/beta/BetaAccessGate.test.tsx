import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/beta/betaApi', () => ({
  getBetaStatus: vi.fn(),
  joinBetaWaitlist: vi.fn(),
  recordBetaEvent: vi.fn(),
  submitDeclineReason: vi.fn(),
}));

vi.mock('@/lib/supabase/client', () => ({
  isSupabaseConfigured: () => true,
}));

vi.mock('@/lib/supabase/useSession', () => ({
  // Deliberately return a new object on each render. The access check must
  // follow the user identity, not the unstable object identity.
  useSession: () => ({
    session: { user: { id: 'person-1' } },
    loading: false,
  }),
}));

vi.mock('@/lib/supabase/useSignOut', () => ({
  useSignOut: () => ({ signOut: vi.fn(), signingOut: false }),
}));

vi.mock('@/lib/copilot/copilotService', () => ({
  deleteConversationHistory: vi.fn(),
  deleteInsights: vi.fn(),
}));

import { getBetaStatus } from '@/lib/beta/betaApi';
import { deleteConversationHistory, deleteInsights } from '@/lib/copilot/copilotService';
import { BetaAccessGate } from './BetaAccessGate';

afterEach(() => vi.clearAllMocks());

describe('BetaAccessGate', () => {
  it('loads access status once when a session object is recreated during a render', async () => {
    vi.mocked(getBetaStatus).mockResolvedValue({
      state: 'active',
      reason: null,
      trial_started_at: null,
      trial_ends_at: null,
      spend_usd: 0,
      credit_limit_usd: 1,
      remaining_credit_usd: 1,
      waitlist_joined: false,
      waitlist_email: null,
      decline_submitted: false,
    });

    render(
      <BetaAccessGate>
        <p>Protected page</p>
      </BetaAccessGate>,
    );

    await waitFor(() => expect(getBetaStatus).toHaveBeenCalledTimes(1));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(screen.getByText('Protected page')).toBeInTheDocument();
    expect(getBetaStatus).toHaveBeenCalledTimes(1);
  });

  it('lets an expired user delete conversations and AI insights', async () => {
    vi.mocked(getBetaStatus).mockResolvedValue({
      state: 'expired',
      reason: 'beta_expired',
      trial_started_at: '2026-09-28T12:00:00+00:00',
      trial_ends_at: '2026-10-01T12:00:00+00:00',
      spend_usd: 0,
      credit_limit_usd: 1,
      remaining_credit_usd: 1,
      waitlist_joined: false,
      waitlist_email: null,
      decline_submitted: false,
    });
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(
      <BetaAccessGate>
        <p>Protected page</p>
      </BetaAccessGate>,
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Delete conversations' }));
    await waitFor(() => expect(deleteConversationHistory).toHaveBeenCalledWith());
    expect(
      await screen.findByText('Your saved conversations were deleted.'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Delete AI insights' }));
    await waitFor(() => expect(deleteInsights).toHaveBeenCalledWith());
    expect(await screen.findByText('Your AI insights were deleted.')).toBeInTheDocument();
  });
});

