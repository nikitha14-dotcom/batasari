"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { OnboardingShell } from "../../components/onboarding";
import { AuthField, MailIcon } from "../../components/onboarding/auth";
import { PrivacyStatementModal } from "../../components/privacy/PrivacyStatementModal";
import styles from "../../components/onboarding/auth.module.css";
import {
  RESEND_COOLDOWN_SECONDS,
  callbackUrl,
  friendlyAuthError,
  isValidEmail,
} from "../../lib/auth/email";
import { takeLoginEmail } from "../../lib/auth/emailStatus";
import { nextStepFor } from "../../lib/auth/nextStep";
import { getSupabaseClient, isSupabaseConfigured } from "../../lib/supabase/client";
import { useSession } from "../../lib/supabase/useSession";

/**
 * Login, styled like ONB-01..04 (Figma has no Login frame, so this reuses the
 * Sign Up card).
 *
 * Two modes:
 *  - password (default): everyone sets one on ONB-03.
 *  - reset: "Forgot your password?" emails a recovery link
 *    (resetPasswordForEmail). /auth/callback recognises it and sends the user
 *    to Reset Password before anything else.
 */
export default function LoginPage() {
  const router = useRouter();
  const { session, loading, configured } = useSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"password" | "reset">("password");
  const [sending, setSending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [emailTouched, setEmailTouched] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);

  useEffect(() => {
    if (configured && !loading && session) router.replace(nextStepFor(session.user));
  }, [configured, loading, session, router]);

  // Arrived from Sign Up with an address that already has an account.
  useEffect(() => {
    const handedOver = takeLoginEmail();
    if (handedOver) {
      setEmail(handedOver);
      setEmailTouched(true);
    }
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  function switchMode(next: "password" | "reset") {
    setMode(next);
    setPassword("");
    setError(null);
  }

  async function sendResetLink(address = email.trim()) {
    if (!isValidEmail(address)) {
      setError("Please enter a valid email address.");
      return;
    }
    setSending(true);
    setError(null);
    try {
      // Supabase answers the same way whether or not the address has an
      // account, so this page never reveals who is registered.
      const { error: resetError } = await getSupabaseClient().auth.resetPasswordForEmail(address, {
        redirectTo: callbackUrl(),
      });
      if (resetError) throw resetError;
      setSentTo(address);
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      setError(friendlyAuthError(err, "Could not send the reset link."));
    } finally {
      setSending(false);
    }
  }

  async function signInWithPassword() {
    const trimmed = email.trim();
    if (!isValidEmail(trimmed)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!password) {
      setError("Enter your password.");
      return;
    }
    setSending(true);
    setError(null);
    try {
      const { data, error: signInError } = await getSupabaseClient().auth.signInWithPassword({
        email: trimmed,
        password,
      });
      if (signInError) throw signInError;
      router.replace(nextStepFor(data?.user));
    } catch (err) {
      // Supabase says "Invalid login credentials" whether the password is wrong
      // or the account has none yet, by design. Name both.
      const raw = err instanceof Error ? err.message.toLowerCase() : "";
      setError(
        raw.includes("invalid login credentials")
          ? "Wrong email or password. If you've forgotten it, use “Forgot your password?” below."
          : friendlyAuthError(err, "Could not sign you in."),
      );
      setSending(false);
    }
  }

  const topBar = (
    <Link href="/signup" className={styles.loginButton}>
      Sign up
    </Link>
  );

  if (!isSupabaseConfigured()) {
    return (
      <OnboardingShell topBarAction={topBar} cardClassName={styles.card}>
        <div className={styles.head}>
          <h1 className={styles.title}>Sign in is not configured</h1>
          <p className={styles.subtitle}>
            This build has no Supabase credentials, so it is running in local mode. Set
            NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in the repo-root .env, then
            restart the dev server.
          </p>
        </div>
      </OnboardingShell>
    );
  }

  // Signed in already, or still finding out: don't flash the form.
  if (configured && (loading || session)) {
    return <div className={styles.blank} role="status" aria-label="Loading" />;
  }

  if (sentTo) {
    return (
      <OnboardingShell topBarAction={topBar} cardClassName={`${styles.card} ${styles.cardTall}`}>
        <div className={styles.head}>
          <h1 className={styles.title}>Check Your Email</h1>
        </div>
        <div className={styles.body} aria-live="polite">
          <p>
            If an account exists for <strong>{sentTo}</strong>, we’ve sent a link to reset your
            password. It expires in about an hour and has to be opened in this same browser.
          </p>
        </div>
        <button
          type="button"
          className={styles.linkButton}
          onClick={() => {
            setSentTo(null);
            switchMode("password");
          }}
        >
          Back to login
        </button>
        <p className={styles.resend}>
          Didn’t get it?{" "}
          <button
            type="button"
            className={styles.inlineLink}
            disabled={sending || cooldown > 0}
            onClick={() => void sendResetLink(sentTo)}
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend link"}
          </button>
        </p>
        {error && (
          <p className={styles.formError} role="alert">
            {error}
          </p>
        )}
      </OnboardingShell>
    );
  }

  const emailOk = isValidEmail(email);
  const emailError =
    emailTouched && email.trim() && !emailOk ? "Enter a valid email, like name@example.com." : null;
  const canLogin = emailOk && password.length > 0 && !sending;
  const canSendReset = emailOk && !sending;

  const emailField = (
    <AuthField
      label="Email"
      icon={<MailIcon />}
      type="email"
      autoComplete="email"
      placeholder="Enter your email address"
      value={email}
      error={emailError}
      onBlur={() => setEmailTouched(true)}
      onChange={(e) => {
        setEmail(e.target.value);
        setError(null);
      }}
    />
  );

  return (
    <OnboardingShell topBarAction={topBar} cardClassName={styles.card}>
      <div className={styles.head}>
        <h1 className={styles.title}>{mode === "reset" ? "Reset Password" : "Login"}</h1>
        <p className={styles.subtitle}>
          {mode === "reset"
            ? "We’ll email you a link to choose a new password."
            : "Welcome back to KnewSooner"}
        </p>
      </div>

      {mode === "password" ? (
        <form
          className={styles.form}
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            void signInWithPassword();
          }}
        >
          {emailField}
          <AuthField
            label="Password"
            revealable
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(null);
            }}
          />
          {error && (
            <p className={styles.formError} role="alert">
              {error}
            </p>
          )}
          <button type="submit" className={styles.button} disabled={!canLogin}>
            {sending ? "Signing in…" : "Login"}
          </button>
          <button type="button" className={styles.centerLink} onClick={() => switchMode("reset")}>
            Forgot your password?
          </button>
        </form>
      ) : (
        <form
          className={styles.form}
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            void sendResetLink();
          }}
        >
          {emailField}
          {error && (
            <p className={styles.formError} role="alert">
              {error}
            </p>
          )}
          <button type="submit" className={styles.button} disabled={!canSendReset}>
            {sending ? "Sending…" : "Send reset link"}
          </button>
          <button
            type="button"
            className={styles.centerLink}
            onClick={() => switchMode("password")}
          >
            Back to login
          </button>
        </form>
      )}
      <p className={styles.legal}>
        <button type="button" className={styles.legalButton} onClick={() => setPrivacyOpen(true)}>
          Privacy policy
        </button>
      </p>
      <PrivacyStatementModal open={privacyOpen} onClose={() => setPrivacyOpen(false)} />
    </OnboardingShell>
  );
}

