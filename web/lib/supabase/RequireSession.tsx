"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { useSession } from "./useSession";

/**
 * Gate for pages that need a signed-in user.
 *
 * When Supabase is not configured (a teammate without the shared secrets, or a
 * CI build) this renders children unguarded, matching AuthMiddleware's
 * development fallback in /api.
 *
 * That fallback is a development convenience only. A production build with a
 * missing or blank NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY must fail closed: an
 * open gate would serve every signed-out visitor straight into the app, and a
 * blank Vercel variable is a one-keystroke mistake we have already made on
 * another variable this week.
 *
 * It only gates. It renders no chrome of its own: sign-out lives in the
 * sidebar (SidebarNav) and the onboarding top bar. An earlier version appended
 * a fixed "Signed in as ... / Sign out" bar here, which sat over the header's
 * location and profile card on every page once the shared shell existed.
 */
export function RequireSession({ children }: { children: ReactNode }) {
  const { session, loading, configured } = useSession();
  const router = useRouter();

  // Unconfigured disables the gate in development only. /login explains the
  // missing-credentials case, so a misconfigured production build lands there
  // rather than rendering the app to an anonymous visitor.
  const gated = configured || process.env.NODE_ENV === "production";

  useEffect(() => {
    if (gated && !loading && !session) {
      router.replace("/login");
    }
  }, [gated, loading, session, router]);

  if (!gated) return <>{children}</>;

  if (loading) {
    return (
      <main className="page">
        <p className="muted">Checking your session...</p>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="page">
        <p className="muted">Redirecting to sign in...</p>
      </main>
    );
  }

  return <>{children}</>;
}

