/**
 * copilotService.ts
 *
 * The single swappable gateway function for AI Copilot responses in Moving Assistant.
 * Connects to the /ai/answer endpoint with Supabase auth headers and consumes its SSE stream.
 */

import { getAccessToken } from "@/lib/supabase/client";

export interface Source {
  title?: string;
  url?: string;
}

export interface CopilotResponseOptions {
  question: string;
  category?: string;
  subcategory?: string;
  conversationId?: string | null;
  onStage?: (stage: string) => void;
  onComplete?: (data: {
    answer: string;
    sources?: Source[];
    metadata?: { run_id?: string };
  }) => void;
  onError?: (error: {
    code?: string;
    message?: string;
  }) => void;
  signal?: AbortSignal;
}

interface SseHandlers {
  onStage?: (stage: string) => void;
  onComplete?: (data: {
    answer: string;
    sources?: Source[];
    metadata?: { run_id?: string };
  }) => void;
  onError?: (error: {
    code?: string;
    message?: string;
  }) => void;
}

async function getApiHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const token = await getAccessToken();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  } else {
    console.warn(
      "[copilotService] No Supabase access token found. Request may be rejected with 401."
    );
  }

  return headers;
}

/**
 * Process one Server-Sent Event block.
 */
function processSSEEvent(
  eventText: string,
  handlers: SseHandlers
): void {
  const lines = eventText.split(/\r?\n/);

  let eventName: string | null = null;
  let data: any = null;

  for (const line of lines) {
    if (line.startsWith("event:")) {
      eventName = line.slice(6).trim();
    } else if (line.startsWith("data:")) {
      const rawData = line.slice(5).trim();

      try {
        data = JSON.parse(rawData);
      } catch (error) {
        console.error(
          "Failed to parse SSE data:",
          rawData,
          error
        );
        return;
      }
    }
  }

  if (!eventName || !data) {
    return;
  }

  switch (eventName) {
    case "stage":
      handlers.onStage?.(data.stage);
      break;

    case "complete":
      handlers.onComplete?.(data);
      break;

    case "error":
      handlers.onError?.(data);
      break;

    default:
      console.warn(
        "Unknown SSE event:",
        eventName,
        data
      );
  }
}
/**
 * A short message a person can read, instead of the server's raw JSON body
 * (for example {"detail":"Daily request limit reached"}).
 */
export function friendlyErrorMessage(status: number, body: string): string {
  let detail: unknown;
  try {
    detail = (JSON.parse(body) as { detail?: unknown }).detail;
  } catch {
    detail = undefined;
  }

  if (status === 429) {
    return "You've reached today's limit for questions. Please try again tomorrow.";
  }
  if (status === 401) {
    return "Your session has expired. Please sign in again.";
  }
  // Some endpoints send {"detail": {"code": ..., "message": ...}} with text
  // meant for people. Use it when it is there.
  if (detail && typeof detail === "object") {
    const message = (detail as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }
  if (status === 403) {
    return "You don't have access to this right now.";
  }
  if (status === 422) {
    return "That question couldn't be processed. Please rephrase it and try again.";
  }
  return "Something went wrong on our side. Please try again in a moment.";
}
/**
 * THE SINGLE SWAPPABLE FUNCTION.
 * Calls /ai/answer endpoint with auth headers.
 */
export async function getCopilotResponse({
  question,
  category = "Housing",
  subcategory = "Find Housing",
  conversationId = null,
  onStage,
  onComplete,
  onError,
  signal,
}: CopilotResponseOptions): Promise<void> {
  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8000";

  try {
    const headers = await getApiHeaders();

    const response = await fetch(
      `${apiUrl}/ai/answer`,
      {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify({
          question,
          category,
          subcategory,
          conversation_id: conversationId,
        }),
        signal,
      }
    );

    if (!response.ok) {
      const errorText = await response
        .text()
        .catch(() => "");

      throw new Error(friendlyErrorMessage(response.status, errorText));
    }

    if (!response.body) {
      throw new Error(
        "AI response does not contain a readable stream"
      );
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { value, done } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, {
          stream: true,
        });

        const events = buffer.split("\n\n");
        buffer = events.pop() || "";

        for (const eventText of events) {
          processSSEEvent(eventText, {
            onStage,
            onComplete,
            onError,
          });
        }
      }

      buffer += decoder.decode();

      if (buffer.trim()) {
        processSSEEvent(buffer, {
          onStage,
          onComplete,
          onError,
        });
      }
    } finally {
      reader.releaseLock();
    }
  } catch (err: any) {
    if (err.name === "AbortError") {
      throw err;
    }

    console.error(
      "[copilotService] AI backend request failed:",
      err
    );

    throw err;
  }
}

/**
 * Delete conversation history for the current user.
 * If category is provided, only that category's history is deleted.
 */
export async function deleteConversationHistory(
  category?: string
): Promise<void> {
  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8000";

  const headers = await getApiHeaders();

  const response = await fetch(
    `${apiUrl}/ai/conversations`,
    {
      method: "DELETE",
      credentials: "include",
      headers,
      body: JSON.stringify({ category: category || null }),
    }
  );

  if (!response.ok) {
    const errorText = await response
      .text()
      .catch(() => "");
    throw new Error(
      errorText || `Delete conversations failed with status ${response.status}`
    );
  }
}

/**
 * Delete derived insights (AI memory) for the current user.
 * If category is provided, only that category's insights are deleted.
 */
export async function deleteInsights(
  category?: string
): Promise<void> {
  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8000";

  const headers = await getApiHeaders();

  const response = await fetch(
    `${apiUrl}/ai/insights`,
    {
      method: "DELETE",
      credentials: "include",
      headers,
      body: JSON.stringify({ category: category || null }),
    }
  );

  if (!response.ok) {
    const errorText = await response
      .text()
      .catch(() => "");
    throw new Error(
      errorText || `Delete insights failed with status ${response.status}`
    );
  }
}


export interface SavedTurn {
  question: string;
  answer: string;
  run_id?: string | null;
  subcategory?: string | null;
  created_at?: string | null;
}

/**
 * Load this user's saved conversation for one category, oldest first.
 * The API returns the newest turns first (up to 20), so the list is reversed.
 */
export async function getConversationHistory(
  category: string
): Promise<SavedTurn[]> {
  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8000";

  const headers = await getApiHeaders();

  const response = await fetch(
    `${apiUrl}/ai/conversation/history?category=${encodeURIComponent(category)}`,
    {
      method: "GET",
      credentials: "include",
      headers,
    }
  );

  if (!response.ok) {
    throw new Error(
      `Loading conversation history failed with status ${response.status}`
    );
  }

  const body = (await response.json()) as { history?: SavedTurn[] };
  return [...(body.history ?? [])].reverse();
}

