"use client";

/**
 * Loading and failure states for anything fed by GET /content.
 *
 * These pages used to render literals, so they could never be empty or
 * wrong. Now that the copy comes from the database, "nothing rendered" has
 * to be distinguishable from "nothing to render" -- otherwise a failed fetch
 * looks exactly like a category we have no advice for, which is the more
 * damaging of the two to show a newcomer.
 */

export function ContentLoading({ label }: { label: string }) {
  return (
    <div className="housing-state" role="status" aria-live="polite">
      <span className="housing-state-spinner" aria-hidden="true" />
      <p>{label}</p>
    </div>
  );
}

export function ContentError({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="housing-state housing-state--error" role="alert">
      <p>{message}</p>
      {onRetry && (
        <button type="button" className="housing-state-retry" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function ContentEmpty({ message }: { message: string }) {
  return (
    <div className="housing-state">
      <p>{message}</p>
    </div>
  );
}

