import { apiUrl } from "@/lib/api/apiBase";
import { getAccessToken } from "@/lib/supabase/client";

export type AnswerRating = -1 | 1;
export interface AnswerRatingState {
  rating: AnswerRating | null;
  version: number;
}

export class AnswerFeedbackError extends Error {
  constructor(message: string, readonly status: number | null) {
    super(message);
    this.name = "AnswerFeedbackError";
  }
}

export class AnswerFeedbackConflictError extends AnswerFeedbackError {
  constructor(readonly state: AnswerRatingState) {
    super("Answer feedback changed elsewhere.", 409);
    this.name = "AnswerFeedbackConflictError";
  }
}

async function authHeaders(): Promise<Record<string, string>> {
  const token = await getAccessToken();
  if (!token) {
    throw new AnswerFeedbackError("Your session has expired. Please sign in again.", 401);
  }
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

async function request(path: string, init: RequestInit): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(apiUrl(path), init);
  } catch {
    throw new AnswerFeedbackError("We could not reach the server. Please try again.", null);
  }
  if (!response.ok) {
    if (response.status === 409) {
      const body = (await response.json()) as Partial<AnswerRatingState>;
      throw new AnswerFeedbackConflictError({
        rating: body.rating === 1 || body.rating === -1 ? body.rating : null,
        version: typeof body.version === "number" ? body.version : 0,
      });
    }
    throw new AnswerFeedbackError("We could not save answer feedback. Please try again.", response.status);
  }
  return response;
}

export async function saveAnswerRating(
  answerRunId: string, rating: AnswerRating, expectedVersion: number
): Promise<AnswerRatingState> {
  const response = await request(`/ai/answer-feedback/${encodeURIComponent(answerRunId)}`, {
    method: "PUT",
    headers: await authHeaders(),
    body: JSON.stringify({ rating, expected_version: expectedVersion }),
  });
  return response.json();
}

export async function removeAnswerRating(
  answerRunId: string, expectedVersion: number
): Promise<AnswerRatingState> {
  const response = await request(`/ai/answer-feedback/${encodeURIComponent(answerRunId)}`, {
    method: "DELETE",
    headers: await authHeaders(),
    body: JSON.stringify({ expected_version: expectedVersion }),
  });
  return response.json();
}

export async function getAnswerRatings(
  answerRunIds: string[]
): Promise<Record<string, AnswerRatingState>> {
  if (answerRunIds.length === 0) return {};
  const response = await request("/ai/answer-feedback/status", {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ answer_run_ids: answerRunIds }),
  });
  const body = (await response.json()) as { ratings?: Record<string, AnswerRatingState> };
  return body.ratings ?? {};
}

