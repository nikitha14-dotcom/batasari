import { readErrorDetail } from '@/lib/onboarding/apiError';
import { getAccessToken } from '@/lib/supabase/client';

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.trim() || 'http://localhost:8000';

export type ContactDraft = {
  name: string;
  email: string;
  topic: string;
  message: string;
};

export class ContactError extends Error {
  constructor(
    message: string,
    readonly status: number | null,
  ) {
    super(message);
    this.name = 'ContactError';
  }
}

export async function submitContactMessage(draft: ContactDraft): Promise<void> {
  const token = await getAccessToken();
  if (!token) {
    throw new ContactError('Your session has expired. Please sign in again.', 401);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}/contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: draft.name.trim(),
        email: draft.email.trim(),
        topic: draft.topic,
        message: draft.message.trim(),
      }),
    });
  } catch {
    throw new ContactError(
      'We could not reach the server. Check your connection and try again.',
      null,
    );
  }

  if (response.ok) return;
  if (response.status === 401) {
    throw new ContactError('Your session has expired. Please sign in again.', 401);
  }

  let detail = '';
  try {
    detail = readErrorDetail(await response.json());
  } catch {
    detail = '';
  }

  throw new ContactError(
    detail || 'We could not send your message. Please try again.',
    response.status,
  );
}

