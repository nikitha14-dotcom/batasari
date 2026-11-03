import { readErrorDetail } from "@/lib/onboarding/apiError";
import { getAccessToken } from "@/lib/supabase/client";
import { apiUrl } from "@/lib/api/apiBase";

export class FeedbackError extends Error {
  constructor(
    message: string,
    readonly status: number | null,
  ) {
    super(message);
    this.name = "FeedbackError";
  }
}

export interface FeedbackDraft {
  rating: number;
  feedbackType: string;
  message: string;
}

/**
 * POST /feedback.
 *
 * Every failure becomes a FeedbackError with a sentence the form can show.
 * A raw "Failed to fetch" reaching the user was a real bug on the onboarding
 * screen; the same trap is here, because the API base URL is a build-time
 * variable that can easily be wrong on a preview deploy.
 */
export async function submitFeedback(draft: FeedbackDraft): Promise<void> {
  const token = await getAccessToken();
  if (!token) {
    throw new FeedbackError("Your session has expired. Please sign in again.", 401);
  }

  const body = {
    rating: draft.rating,
    feedback_type: draft.feedbackType,
    // The API treats blank as "not answered"; send null rather than "".
    message: draft.message.trim() ? draft.message : null,
  };

  let response: Response;
  try {
    response = await fetch(apiUrl("/feedback"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new FeedbackError(
      "We could not reach the server. Check your connection and try again.",
      null,
    );
  }

  if (response.ok) return;

  if (response.status === 401) {
    throw new FeedbackError("Your session has expired. Please sign in again.", 401);
  }

  let detail = "";
  try {
    detail = readErrorDetail(await response.json());
  } catch {
    detail = "";
  }

  if (response.status === 429) {
    throw new FeedbackError(
      detail || "You have sent a lot of feedback today. Please try again tomorrow.",
      429,
    );
  }

  throw new FeedbackError(
    detail || "We could not save your feedback. Please try again.",
    response.status,
  );
}

