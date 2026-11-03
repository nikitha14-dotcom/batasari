"use client";

import { useEffect } from "react";
import Link from "next/link";

import { reportClientError } from "@/lib/errors/reportClientError";

import styles from "./error.module.css";

/**
 * Route-level error boundary (Next.js App Router convention).
 *
 * Without this file a render crash anywhere under /app shows Next's own
 * error screen: unbranded, and in production a bare "Application error: a
 * client-side exception has occurred". This gives the person something they
 * can act on and a way out.
 *
 * Two deliberate choices:
 *
 * 1. `error.message` is shown only in development. Next strips messages from
 *    *server* errors in production, but a client-side throw keeps its text,
 *    which can name internal modules or endpoints. `error.digest` is safe --
 *    it is a hash Next also writes to the server log, so quoting it back to
 *    the user is what lets support match a report to a log line.
 *
 * 2. `reset()` is offered first. Most errors here are transient (a failed
 *    fetch during render, a cold-started API), and re-rendering the segment
 *    costs the user nothing.
 *
 * Note: this does NOT catch errors thrown by the root layout itself -- that
 * needs app/global-error.tsx. Added separately if the need appears.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app] unhandled render error", {
      digest: error.digest,
      message: error.message,
    });
    // Also to the API's /client-errors log, so it is not only in this browser.
    reportClientError("render", error, error.digest);
  }, [error]);

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.heading}>Something went wrong</h1>
        <p className={styles.body}>
          This page didn&apos;t load properly. Trying again usually fixes it.
        </p>

        {process.env.NODE_ENV === "development" && error.message && (
          <pre className={styles.detail}>{error.message}</pre>
        )}

        <div className={styles.actions}>
          <button type="button" className={styles.primary} onClick={reset}>
            Try again
          </button>
          <Link href="/housing" className={styles.secondary}>
            Go to Housing
          </Link>
        </div>

        {error.digest && (
          <p className={styles.digest}>
            If it keeps happening, quote this code: <code>{error.digest}</code>
          </p>
        )}
      </div>
    </main>
  );
}

