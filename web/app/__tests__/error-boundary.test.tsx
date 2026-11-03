import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ErrorBoundary from "../error";

const reset = vi.fn();

describe("app/error.tsx", () => {
  beforeEach(() => {
    reset.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("tells the person what happened and offers a way out", () => {
    render(<ErrorBoundary error={new Error("boom")} reset={reset} />);

    expect(screen.getByRole("heading", { name: "Something went wrong" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go to Housing" })).toHaveAttribute(
      "href",
      "/housing",
    );
  });

  it("re-renders the segment when Try again is pressed", () => {
    render(<ErrorBoundary error={new Error("boom")} reset={reset} />);

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("does not leak the error message in production", () => {
    vi.stubEnv("NODE_ENV", "production");

    render(<ErrorBoundary error={new Error("connect ECONNREFUSED 10.0.0.4:5432")} reset={reset} />);

    expect(screen.queryByText(/ECONNREFUSED/)).not.toBeInTheDocument();
  });

  it("shows the message in development, where it is useful", () => {
    vi.stubEnv("NODE_ENV", "development");

    render(<ErrorBoundary error={new Error("boom")} reset={reset} />);

    expect(screen.getByText("boom")).toBeInTheDocument();
  });

  it("shows the digest so a report can be matched to a server log line", () => {
    const error = Object.assign(new Error("boom"), { digest: "abc123" });

    render(<ErrorBoundary error={error} reset={reset} />);

    expect(screen.getByText("abc123")).toBeInTheDocument();
  });

  it("omits the digest line when there is no digest", () => {
    render(<ErrorBoundary error={new Error("boom")} reset={reset} />);

    expect(screen.queryByText(/quote this code/)).not.toBeInTheDocument();
  });

  it("logs the error for whoever is looking at the console", () => {
    const error = Object.assign(new Error("boom"), { digest: "abc123" });

    render(<ErrorBoundary error={error} reset={reset} />);

    expect(console.error).toHaveBeenCalledWith(
      "[app] unhandled render error",
      expect.objectContaining({ digest: "abc123" }),
    );
  });
});

