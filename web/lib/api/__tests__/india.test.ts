import { afterEach, describe, expect, it, vi } from "vitest";
import { listIndiaCities } from "../india";

describe("India city directory API", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("returns the city metadata supplied by the public India API", async () => {
    const cities = [{ name: "Surat", state: "Gujarat", region: "West", languages: ["Gujarati", "Hindi"] }];
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ cities }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(listIndiaCities()).resolves.toEqual(cities);
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("/india/cities"), { cache: "no-store" });
  });

  it("surfaces a clear error when the city directory is unavailable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("unavailable", { status: 503 })));
    await expect(listIndiaCities()).rejects.toThrow("Unable to load the city directory.");
  });
});
