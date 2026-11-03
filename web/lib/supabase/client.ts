import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// NEXT_PUBLIC_* values are inlined by the bundler at build time, so these reads
// must stay at module scope -- they are not looked up at runtime in the browser.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;

/**
 * Whether the browser build actually received Supabase credentials.
 *
 * This is not paranoia: CI builds without any .env, and a teammate who has not
 * filled in the shared secrets note yet should get the local-dev experience
 * rather than a white screen. The backend has the matching fallback.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY in the repo-root .env (see .env.example), " +
        "then restart the dev server."
    );
  }

  // Single instance per tab. Two clients would each hold their own auto-refresh
  // timer against the same localStorage key and race each other on refresh.
  if (!client) {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        // PKCE: the magic link carries a short-lived code, and the secret that
        // redeems it never leaves this browser. See ADR 0007 for the
        // cross-device tradeoff this creates.
        flowType: "pkce",
        persistSession: true,
        autoRefreshToken: true,
        // We redeem the code ourselves in /auth/callback. Letting the library
        // auto-detect it means racing an implicit background exchange, which
        // makes both the redirect and the tests nondeterministic.
        detectSessionInUrl: false,
      },
    });
  }

  return client;
}

/**
 * The access token to send to /api as `Authorization: Bearer <token>`.
 *
 * Always read through this. Do not parse the `sb-<ref>-auth-token` localStorage
 * key by hand -- that shape is a supabase-js implementation detail and it has
 * changed between major versions. getSession() also refreshes a token that is
 * about to expire, which hand-parsing cannot do.
 */
export async function getAccessToken(): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await getSupabaseClient().auth.getSession();
  if (error) return null;
  return data.session?.access_token ?? null;
}

