import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/client", () => ({
  getAccessToken: vi.fn(async () => null),
}));

import { getAccessToken } from "@/lib/supabase/client";
import {
  reportClientError,
  resetClientErrorReportsForTests,
} from "../reportClientError";

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("reportClientError", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    resetClientErrorReportsForTests();
    fetchMock = vi.fn(async () => ({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.example.test/");
    window.history.pushState({}, "", "/housing/check?address=100+Queen+St");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("posts the kind, message, path and digest to /client-errors", async () => {
    reportClientError("render", new Error("Cannot read x"), "abc123");
    await flush();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.example.test/client-errors");
    expect(init.method).toBe("POST");
    expect(init.keepalive).toBe(true);
    expect(JSON.parse(init.body)).toEqual({
      kind: "render",
      message: "Cannot read x",
      page: "/housing/check",
      digest: "abc123",
    });
  });

  it("never sends the query string", async () => {
    reportClientError("error", "boom");
    await flush();

    expect(fetchMock.mock.calls[0][1].body).not.toContain("Queen");
  });

  it("sends the sign-in token when there is one", async () => {
    vi.mocked(getAccessToken).mockResolvedValueOnce("tok");
    reportClientError("error", "boom");
    await flush();

    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe("Bearer tok");
  });

  it("stops after five reports on one page load", async () => {
    for (let i = 0; i < 8; i += 1) reportClientError("error", `boom ${i}`);
    await flush();

    expect(fetchMock).toHaveBeenCalledTimes(5);
  });

  it("never throws when reporting fails", async () => {
    fetchMock.mockRejectedValueOnce(new Error("offline"));
    expect(() => reportClientError("unhandledrejection", new Error("x"))).not.toThrow();
    await flush();
  });

  it("trims a very long message before sending", async () => {
    reportClientError("error", "x".repeat(2000));
    await flush();

    expect(JSON.parse(fetchMock.mock.calls[0][1].body).message).toHaveLength(500);
  });
});

