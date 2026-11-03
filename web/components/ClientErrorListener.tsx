"use client";

import { useEffect } from "react";

import { reportClientError } from "@/lib/errors/reportClientError";

/**
 * Reports errors that happen outside React rendering (event handlers, timers,
 * promises nobody awaited). Render errors go through app/error.tsx instead.
 * Mounted once in the root layout; renders nothing.
 */
export function ClientErrorListener() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => reportClientError("error", event.error ?? event.message);
    const onRejection = (event: PromiseRejectionEvent) =>
      reportClientError("unhandledrejection", event.reason);

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}

