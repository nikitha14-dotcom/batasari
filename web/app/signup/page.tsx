"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { OnboardingShell } from "../../components/onboarding";
import { AuthField, LoginLink, MailIcon } from "../../components/onboarding/auth";
import { PrivacyStatementModal } from "../../components/privacy/PrivacyStatementModal";
import { TermsOfServiceModal } from "../../components/terms/TermsOfServiceModal";
import styles from "../../components/onboarding/auth.module.css";
import {
  RESEND_COOLDOWN_SECONDS,
  callbackUrl,
  friendlyAuthError,
  isValidEmail,
} from "../../lib/auth/email";
import { checkEmailStatus, rememberLoginEmail } from "../../lib/auth/emailStatus";
import { nextStepFor } from "../../lib/auth/nextStep";
import { getSupabaseClient, isSupabaseConfigured } from "../../lib/supabase/client";
import { useSession } from "../../lib/supabase/useSession";

/** Pre-account waitlist. The in-app /beta/waitlist endpoint needs a user_id,
 *  so people who cannot sign up yet have nowhere to leave an address. */
const WAITLIST_FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSee_mkjAI1y0eZpJv2ING18zGHiwbTjkailbWXj26HZNcq4LQ/viewform";

/**
 * ONB-01 Sign Up and ONB-02 Verify Email.
 *
 * ONB-02 is the "sent" state of this page rather than its own route: the
 * address only lives in this component, and "Change email address" returns to
 * the form with it filled in.
 *
 * Sign-up is open (shouldCreateUser: true). The pilot cap is enforced in the
 * database by the Before User Created hook; see
 * supabase/migrations/20260922090000_signup_user_cap.sql.
 */
export default function SignUpPage() {
  const router = useRouter();
  const { session, loading, configured } = useSession();
  const [email, setEmail] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [emailTouched, setEmailTouched] = useState(false);
  // Set when the address already has an account: show "log in instead".
  const [existing, setExisting] = useState<string | null>(null);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);

  // Already signed in: continue wherever they left off.
  useEffect(() => {
    if (configured && !loading && session) router.replace(nextStepFor(session.user));
  }, [configured, loading, session, router]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const canSubmit = isValidEmail(email) && !sending;

  async function send(address: string) {
    setSending(true);
    setError(null);
    try {
      const { error: otpError } = await getSupabaseClient().auth.signInWithOtp({
        email: address,
        options: { emailRedirectTo: callbackUrl(), shouldCreateUser: true },
      });
      if (otpError) throw otpError;
      setSentTo(address);
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      setError(friendlyAuthError(err, "We couldn't send the verification email. Try again."));
    } finally {
      setSending(false);
    }
  }

  async function onSubmit() {
    const trimmed = email.trim();
    if (!isValidEmail(trimmed)) {
      setError("Please enter a valid email address.");
      return;
    }
    setSending(true);
    setError(null);
    // One account per email. An existing user is sent to Login rather than
    // emailed a sign-up link. If the check can't be made, stop and say so.
    const status = await checkEmailStatus(trimmed);
    if (status === "registered") {
      setSending(false);
      setExisting(trimmed);
      return;
    }
    if (status === "rate_limited") {
      setSending(false);
      setError("Too many attempts. Please wait a minute and try again.");
      return;
    }
    if (status === "unavailable") {
      setSending(false);
      setError("We couldn't check your email right now. Please try again in a moment.");
      return;
    }
    await send(trimmed);
  }

  function goToLogin() {
    if (existing) rememberLoginEmail(existing);
    router.push("/login");
  }

  // While the session is being read, or a signed-in user is being forwarded,
  // show only the page background. Rendering the form here is what caused a
  // one-second flash of Sign Up before the redirect.
  if (configured && (loading || session)) {
    return <div className={styles.blank} role="status" aria-label="Loading" />;
  }

  if (sentTo) {
    return (
      <OnboardingShell topBarAction={<LoginLink />} cardClassName={`${styles.card} ${styles.cardTall}`}>
        <div className={styles.head}>
          <h1 className={styles.title}>Verify Your Email</h1>
        </div>
        <div className={styles.body} aria-live="polite">
          <p>
            We’ve sent a verification email to <strong>{sentTo}</strong>. Please check your inbox
            and follow the instructions to verify your account.
          </p>
          <p>Thank you for signing up with us!</p>
        </div>
        <button
          type="button"
          className={styles.linkButton}
          onClick={() => {
            setEmail(sentTo);
            setSentTo(null);
            setError(null);
          }}
        >
          Change email address
        </button>
        <p className={styles.resend}>
          Didn’t get it?{" "}
          <button
            type="button"
            className={styles.inlineLink}
            disabled={sending || cooldown > 0}
            onClick={() => void send(sentTo)}
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend email"}
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

  return (
    <OnboardingShell topBarAction={<LoginLink />} cardClassName={styles.card} aside={<Welcome />}>
      <div className={styles.head}>
        <h1 className={styles.title}>Sign Up</h1>
      </div>

      <form
        className={styles.form}
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          void onSubmit();
        }}
      >
        <AuthField
          label="Email"
          icon={<MailIcon />}
          type="email"
          autoComplete="email"
          placeholder="Enter your email address"
          value={email}
          error={
            emailTouched && email.trim() && !isValidEmail(email)
              ? "Enter a valid email, like name@example.com."
              : null
          }
          onBlur={() => setEmailTouched(true)}
          onChange={(e) => {
            setEmail(e.target.value);
            setError(null);
            setExisting(null);
          }}
        />
        {error && (
          <p className={styles.formError} role="alert">
            {error}
          </p>
        )}
        {existing && (
          <div className={styles.notice} role="alert">
            <p>
              An account already exists for <strong>{existing}</strong>. Please log in with your
              password.
            </p>
            <button type="button" className={styles.noticeButton} onClick={goToLogin}>
              Go to Login
            </button>
          </div>
        )}
        <button type="submit" className={styles.button} disabled={!canSubmit || Boolean(existing)}>
          {sending ? "Sending…" : "Continue"}
        </button>
      </form>

      <p className={styles.waitlist}>
        Our Beta opens later this year.{" "}
        <a
          className={styles.waitlistLink}
          href={WAITLIST_FORM_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          Join the waitlist
        </a>{" "}
        to get early access.
      </p>

      <p className={styles.legal}>
        By signing up, you agree to Batasari’s{" "}
        <button type="button" className={styles.legalButton} onClick={() => setTermsOpen(true)}>
          terms of service
        </button>{" "}
        and{" "}
        <button type="button" className={styles.legalButton} onClick={() => setPrivacyOpen(true)}>
          privacy policy
        </button>
      </p>
      <TermsOfServiceModal open={termsOpen} onClose={() => setTermsOpen(false)} />
      <PrivacyStatementModal open={privacyOpen} onClose={() => setPrivacyOpen(false)} />
    </OnboardingShell>
  );
}

function Welcome() {
  return (
    <>
      <h2 className={styles.welcomeTitle}>Welcome to Batasari!</h2>
      <div className={styles.welcomeBody}>
        <p>Your move to India, made clearer.</p>
        <p>
          Moving within India or preparing to make a home here from abroad? Bring your important
          plans, questions, and next steps together in one place.
        </p>
        <p>Save time, reduce stress, and avoid preventable mistakes.</p>
        <p>Create your account to get started.</p>
      </div>
    </>
  );
}

