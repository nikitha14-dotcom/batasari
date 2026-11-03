import { afterEach, describe, expect, it, vi } from "vitest";

const { getAccessToken } = vi.hoisted(() => ({ getAccessToken: vi.fn() }));
vi.mock("@/lib/supabase/client", () => ({ getAccessToken }));

import { ContactError, submitContactMessage } from "../contactApi";

const DRAFT = {
  name: " Jia ",
  email: " jia@example.com ",
  topic: "privacy_data",
  message: " Please help. ",
};

afterEach(() => {
  vi.unstubAllGlobals();
  getAccessToken.mockReset();
});

describe("submitContactMessage", () => {
  it("sends the trimmed message with the user's token", async () => {
    getAccessToken.mockResolvedValue("token");
    const fetchMock = vi.fn(async () => ({ ok: true, status: 201 }));
    vi.stubGlobal("fetch", fetchMock);

    await submitContactMessage(DRAFT);

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toMatch(/\/contact$/);
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer token");
    expect(JSON.parse(init.body as string)).toEqual({
      name: "Jia",
      email: "jia@example.com",
      topic: "privacy_data",
      message: "Please help.",
    });
  });

  it("does not submit when the session has expired", async () => {
    getAccessToken.mockResolvedValue(null);
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(submitContactMessage(DRAFT)).rejects.toBeInstanceOf(ContactError);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

