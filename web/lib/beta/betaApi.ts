import { getAccessToken } from '@/lib/supabase/client';
import { apiUrl } from '@/lib/api/apiBase';

export type BetaState = 'active' | 'credit_exhausted' | 'expired';
export type BetaStatus = {
  state: BetaState;
  reason: 'beta_expired' | 'credit_limit_reached' | null;
  trial_started_at: string | null;
  trial_ends_at: string | null;
  spend_usd: number;
  credit_limit_usd: number;
  remaining_credit_usd: number;
  waitlist_joined: boolean;
  waitlist_email: string | null;
  decline_submitted: boolean;
};

function isBetaState(value: unknown): value is BetaState {
  return value === 'active' || value === 'credit_exhausted' || value === 'expired';
}

async function headers(): Promise<Record<string, string>> {
  const token = await getAccessToken();
  const result: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) result.Authorization = `Bearer ${token}`;
  return result;
}

export async function getBetaStatus(signal?: AbortSignal): Promise<BetaStatus> {
  const response = await fetch(apiUrl('/beta/status'), { headers: await headers(), signal });
  if (!response.ok) throw new Error('Could not load Beta access status');
  const body: unknown = await response.json();
  if (
    !body ||
    typeof body !== 'object' ||
    !isBetaState((body as { state?: unknown }).state)
  ) {
    throw new Error('Could not read Beta access status');
  }
  return body as BetaStatus;
}

export async function joinBetaWaitlist(): Promise<{
  status: 'joined' | 'already_joined';
  email: string | null;
}> {
  const response = await fetch(apiUrl('/beta/waitlist'), {
    method: 'POST',
    headers: await headers(),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(body.detail || 'We could not join the waitlist. Please try again.');
  return { status: body.status, email: body.email ?? null };
}

export async function recordBetaEvent(event_name: string, metadata: Record<string, unknown> = {}) {
  try {
    await fetch(apiUrl('/beta/events'), {
      method: 'POST',
      headers: await headers(),
      body: JSON.stringify({ event_name, metadata }),
    });
  } catch {
    // Analytics must never surface as an unhandled rejection or block access.
  }
}

export async function submitDeclineReason(
  reason: string,
  explanation?: string,
  reasons: string[] = [reason],
) {
  const response = await fetch(apiUrl('/beta/decline'), {
    method: 'POST',
    headers: await headers(),
    body: JSON.stringify({ reason, reasons, explanation }),
  });
  if (!response.ok) throw new Error('We could not save your response. Please try again.');
}

