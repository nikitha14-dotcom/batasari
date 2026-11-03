import { afterEach, describe, expect, it, vi } from "vitest";

const { getAccessToken } = vi.hoisted(() => ({ getAccessToken: vi.fn() }));

// feedbackApi imports through the "@" alias, so the mock has to use the same
// specifier -- a relative path here would register a different module.
vi.mock("@/lib/supabase/client", () => ({
  getAccessToken,
}));

import { FeedbackError, submitFeedback } from "../feedbackApi";

const DRAFT = { rating: 4, feedbackType: "bug_report", message: "Search is broken" };

function mockFetch(response: Partial<Response> & { json?: () => Promise<unknown> }) {
  const fetchMock = vi.fn(async () => response as Response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
  getAccessToken.mockReset();
});

describe("submitFeedback", () => {
  it("posts the draft with the bearer token", async () => {
    getAccessToken.mockResolvedValue("tok");
    const fetchMock = mockFetch({ ok: true, status: 201 });

    await submitFeedback(DRAFT);

    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(JSON.parse(init.body as string)).toEqual({
      rating: 4,
      feedback_type: "bug_report",
      message: "Search is broken",
    });
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer tok");
  });

  it("sends null rather than an empty message", async () => {
    getAccessToken.mockResolvedValue("tok");
    const fetchMock = mockFetch({ ok: true, status: 201 });

    await submitFeedback({ ...DRAFT, message: "   " });

    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(JSON.parse(init.body as string).message).toBeNull();
  });

  it("does not call the API without a session", async () => {
    getAccessToken.mockResolvedValue(null);
    const fetchMock = mockFetch({ ok: true, status: 201 });

    await expect(submitFeedback(DRAFT)).rejects.toThrow(/session has expired/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("turns a network failure into a sentence a person can act on", async () => {
    getAccessToken.mockResolvedValue("tok");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("Failed to fetch");
      }),
    );

    await expect(submitFeedback(DRAFT)).rejects.toThrow(/could not reach the server/i);
  });

  it("passes the server's 429 message through", async () => {
    getAccessToken.mockResolvedValue("tok");
    mockFetch({
      ok: false,
      status: 429,
      json: async () => ({ detail: "You have sent a lot of feedback today." }),
    });

    await expect(submitFeedback(DRAFT)).rejects.toThrow("You have sent a lot of feedback today.");
  });

  it("carries the status on the error", async () => {
    getAccessToken.mockResolvedValue("tok");
    mockFetch({ ok: false, status: 503, json: async () => ({}) });

    await expect(submitFeedback(DRAFT)).rejects.toMatchObject({
      name: "FeedbackError",
      status: 503,
    });
  });

  it("survives an error body that is not JSON", async () => {
    getAccessToken.mockResolvedValue("tok");
    mockFetch({
      ok: false,
      status: 500,
      json: async () => {
        throw new SyntaxError("Unexpected token <");
      },
    });

    await expect(submitFeedback(DRAFT)).rejects.toThrow(
      "We could not save your feedback. Please try again.",
    );
  });

  it("is a FeedbackError in every failure path", async () => {
    getAccessToken.mockResolvedValue("tok");
    mockFetch({ ok: false, status: 401, json: async () => ({}) });

    await expect(submitFeedback(DRAFT)).rejects.toBeInstanceOf(FeedbackError);
  });
});

