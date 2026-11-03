import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { getSession, onAuthStateChange, refreshSession, unsubscribe, isSupabaseConfigured } = vi.hoisted(() => ({
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
  refreshSession: vi.fn(),
  unsubscribe: vi.fn(),
  isSupabaseConfigured: vi.fn(() => true),
}));

vi.mock("../client", () => ({
  isSupabaseConfigured,
  getSupabaseClient: () => ({ auth: { getSession, onAuthStateChange, refreshSession } }),
}));

import { useSession } from "../useSession";

const SESSION = { user: { id: "u1", email: "someone@example.com" } };

describe("useSession", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    isSupabaseConfigured.mockReturnValue(true);
    getSession.mockResolvedValue({ data: { session: SESSION }, error: null });
    refreshSession.mockResolvedValue({ data: { session: SESSION }, error: null });
    onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe } } });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it("returns the session once getSession resolves", async () => {
    const { result } = renderHook(() => useSession());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.session).toEqual(SESSION);
  });

  it("refreshes the session on demand", async () => {
    const NEXT_SESSION = { user: { id: "u1", email: "new@example.com" } };
    refreshSession.mockResolvedValue({ data: { session: NEXT_SESSION }, error: null });
    const { result } = renderHook(() => useSession());

    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await expect(result.current.refreshSession()).resolves.toEqual(NEXT_SESSION);
    });

    expect(refreshSession).toHaveBeenCalledTimes(1);
    expect(result.current.session).toEqual(NEXT_SESSION);
  });

  it("shares an in-flight refresh across focus events", async () => {
    let resolveRefresh: ((value: { data: { session: typeof SESSION }; error: null }) => void) | undefined;
    refreshSession.mockReturnValue(new Promise((resolve) => { resolveRefresh = resolve; }));
    const { result } = renderHook(() => useSession());

    await waitFor(() => expect(result.current.loading).toBe(false));
    const first = result.current.refreshSession();
    const second = result.current.refreshSession();
    expect(refreshSession).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveRefresh?.({ data: { session: SESSION }, error: null });
      await expect(first).resolves.toEqual(SESSION);
      await expect(second).resolves.toEqual(SESSION);
    });
  });

  /**
   * The regression this file exists for: the hook used to console.log the
   * signed-in user's email on mount and on every auth state change, in
   * production builds.
   */
  it("never writes the user's email to the console", async () => {
    const { result } = renderHook(() => useSession());
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Fire an auth state change too -- the second place it used to log.
    // act() because the handler calls setSession/setLoading.
    const handler = onAuthStateChange.mock.calls[0][0];
    act(() => handler("SIGNED_IN", SESSION));

    const everythingLogged = [
      ...(console.log as unknown as { mock: { calls: unknown[][] } }).mock.calls,
      ...(console.warn as unknown as { mock: { calls: unknown[][] } }).mock.calls,
    ]
      .flat()
      .map((arg) => JSON.stringify(arg))
      .join(" ");

    expect(everythingLogged).not.toContain("someone@example.com");
  });

  it("does not log at all on a healthy load", async () => {
    const { result } = renderHook(() => useSession());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(console.log).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
  });

  it("warns with the reason, and nothing else, when getSession fails", async () => {
    getSession.mockResolvedValue({
      data: { session: null },
      error: { message: "network error" },
    });

    const { result } = renderHook(() => useSession());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(console.warn).toHaveBeenCalledWith("[useSession] getSession failed:", "network error");
  });

  it("stays idle and unconfigured when Supabase has no credentials", () => {
    isSupabaseConfigured.mockReturnValue(false);

    const { result } = renderHook(() => useSession());

    expect(result.current.configured).toBe(false);
    expect(result.current.loading).toBe(false);
    expect(getSession).not.toHaveBeenCalled();
  });

  it("unsubscribes on unmount", async () => {
    const { result, unmount } = renderHook(() => useSession());
    await waitFor(() => expect(result.current.loading).toBe(false));

    unmount();

    expect(unsubscribe).toHaveBeenCalled();
  });
});

