import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/supabase/client', () => ({ getAccessToken: vi.fn(async () => 'token') }));
import { getBetaStatus, joinBetaWaitlist, submitDeclineReason } from '../betaApi';

afterEach(() => vi.unstubAllGlobals());

describe('betaApi', () => {
  it('reads the server-owned access state', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ state: 'expired' }), { status: 200 })),
    );
    await expect(getBetaStatus()).resolves.toMatchObject({ state: 'expired' });
  });

  it('rejects a malformed access-status response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ sections: [] }), { status: 200 })),
    );

    await expect(getBetaStatus()).rejects.toThrow('Could not read Beta access status');
  });

  it('returns the idempotent waitlist result', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () => new Response(JSON.stringify({ status: 'already_joined' }), { status: 200 }),
      ),
    );
    await expect(joinBetaWaitlist()).resolves.toMatchObject({ status: 'already_joined' });
  });

  it('surfaces a waitlist failure without exposing a raw response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () => new Response(JSON.stringify({ detail: 'Please try again.' }), { status: 503 }),
      ),
    );
    await expect(joinBetaWaitlist()).rejects.toThrow('Please try again.');
  });

  it('submits all selected decline reasons with the primary reason', async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);

    await submitDeclineReason('price', undefined, ['price', 'ai_quality']);

    const [, init] = (fetchMock.mock.calls as unknown as [unknown, RequestInit][]) [0];
    expect(JSON.parse(init.body as string)).toEqual({
      reason: 'price',
      reasons: ['price', 'ai_quality'],
    });
  });
});

