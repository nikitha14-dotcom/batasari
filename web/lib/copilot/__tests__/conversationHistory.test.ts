import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { getAccessToken } = vi.hoisted(() => ({ getAccessToken: vi.fn() }));
vi.mock("@/lib/supabase/client", () => ({ getAccessToken }));

import { getConversationHistory } from "../copilotService";

describe("getConversationHistory", () => {
  beforeEach(() => {
    getAccessToken.mockReset();
    getAccessToken.mockResolvedValue("token");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("asks for one category with the token and returns oldest first", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        history: [
          { question: "second", answer: "b" },
          { question: "first", answer: "a" },
        ],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const turns = await getConversationHistory("Education & Family");

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/ai/conversation/history?category=Education%20%26%20Family");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer token");
    expect(turns.map((turn) => turn.question)).toEqual(["first", "second"]);
  });

  it("rejects when the request fails, so the panel can stay empty", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    await expect(getConversationHistory("Housing")).rejects.toThrow("500");
  });
});
