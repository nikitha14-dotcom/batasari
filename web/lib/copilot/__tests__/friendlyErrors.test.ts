import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { getAccessToken } = vi.hoisted(() => ({ getAccessToken: vi.fn() }));
vi.mock("@/lib/supabase/client", () => ({ getAccessToken }));

import { friendlyErrorMessage, getCopilotResponse } from "../copilotService";

describe("friendlyErrorMessage", () => {
  it("never shows the server's raw JSON", () => {
    const message = friendlyErrorMessage(
      429,
      '{"detail":"Daily request limit reached"}'
    );
    expect(message).toBe(
      "You've reached today's limit for questions. Please try again tomorrow."
    );
    expect(message).not.toContain("{");
  });

  it("uses a readable message from the server when it sends one", () => {
    const body = JSON.stringify({
      detail: { code: "beta_access_expired", message: "Your Beta access has ended." },
    });
    expect(friendlyErrorMessage(403, body)).toBe("Your Beta access has ended.");
  });

  it("handles a body that is not JSON", () => {
    expect(friendlyErrorMessage(502, "<html>Bad gateway</html>")).toBe(
      "Something went wrong on our side. Please try again in a moment."
    );
  });
});

describe("getCopilotResponse when the request is refused", () => {
  beforeEach(() => {
    getAccessToken.mockReset();
    getAccessToken.mockResolvedValue("token");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("rejects with a friendly message, not the raw body", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        text: async () => '{"detail":"Daily request limit reached"}',
      })
    );

    await expect(
      getCopilotResponse({
        question: "q",
        onStage: () => {},
        onComplete: () => {},
        onError: () => {},
      })
    ).rejects.toThrow("today's limit for questions");
  });
});
