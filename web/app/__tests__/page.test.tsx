import { describe, expect, it, vi } from "vitest";

// Next's real redirect() throws to abort rendering — it never returns. The mock
// throws too, so anything added after the redirect call in the page would fail
// here exactly as it would in production, rather than silently running.
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

import { redirect } from "next/navigation";
import Home from "../page";

describe("home page", () => {
  it("sends visitors to Sign Up (ONB-01)", () => {
    expect(() => Home()).toThrow("NEXT_REDIRECT:/signup");
    expect(redirect).toHaveBeenCalledWith("/signup");
  });
});
