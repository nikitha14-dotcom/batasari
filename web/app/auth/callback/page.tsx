"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { getSupabaseClient, isSupabaseConfigured } from "../../../lib/supabase/client";
import { ROUTES, nextStepFor } from "../../../lib/auth/nextStep";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const exchanged = useRef(false);

  useEffect(() => {
    // React StrictMode runs effects twice in development. A PKCE code is
    // single-use, so the second run would fail and show a false error on a
    // sign-in that actually worked.
    if (exchanged.current) return;
    exchanged.current = true;

    async function completeSignIn() {
      if (!isSupabaseConfigured()) {
        setError("This build has no Supabase credentials, so sign-in cannot complete.");
        return;
      }

      // Read the query string directly rather than via useSearchParams, which
      // would force this page into a Suspense boundary and opt the whole route
      // out of static rendering at build time.
      const params = new URLSearchParams(window.location.search);

      // Supabase reports link-level failures (expired, already used, redirect
      // URL not on the allow list) in the URL fragment, not the query string.
      // Reading only the query string reports every one of them as a missing code.
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));

      const supabaseError =
        params.get("error_description") ??
        params.get("error") ??
        hashParams.get("error_description") ??
        hashParams.get("error");
      if (supabaseError) {
        setError(supabaseError);
        return;
      }

      const code = params.get("code");
      if (!code) {
        setError("This link is missing its sign-in code. Request a new one.");
        return;
      }

      const { data, error: exchangeError } = await getSupabaseClient().auth.exchangeCodeForSession(
        code
      );

      if (exchangeError) {
        setError(
          exchangeError.message.toLowerCase().includes("verifier")
            ? "This link was opened in a different browser from the one that requested " +
                "it. Request a new link and open it in the same browser."
            : exchangeError.message
        );
        return;
      }

      // Drop the used code from the URL so a refresh or a shared screenshot
      // cannot replay it, and so the browser history holds no credential.
      window.history.replaceState({}, "", "/auth/callback");

      // Continue to the first onboarding step this user hasn't done:
      // password (ONB-03), then names (ONB-04), then the profile questions.
      // The flags live in user_metadata, which the user can write, so this is
      // routing only and never a security decision.
      // A "Forgot your password?" link (resetPasswordForEmail) comes back as
      // redirectType "recovery": the user must choose a new password before
      // anything else, even if their account is otherwise complete.
      // redirectType is returned at runtime by supabase-js 2.x but is missing
      // from some versions' typings, hence the narrow cast.
      const redirectType = (data as { redirectType?: string | null } | null)?.redirectType;
      if (redirectType === "recovery") {
        router.replace(`${ROUTES.setPassword}?reset=1`);
        return;
      }
      router.replace(nextStepFor(data?.session?.user));
    }

    void completeSignIn();
  }, [router]);

  return (
    <main className="page">
      <div className="card">
        <div className="screen">
          {error ? (
            <>
              <h2>Could not sign you in</h2>
              <p className="error">{error}</p>
              <button
                type="button"
                className="primary-button"
                onClick={() => router.replace("/login")}
              >
                Back to sign in
              </button>
            </>
          ) : (
            <p className="muted">Signing you in...</p>
          )}
        </div>
      </div>
    </main>
  );
}

