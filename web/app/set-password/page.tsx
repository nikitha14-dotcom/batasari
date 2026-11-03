"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { OnboardingShell } from "../../components/onboarding";
import { AuthField } from "../../components/onboarding/auth";
import styles from "../../components/onboarding/auth.module.css";
import { friendlyAuthError } from "../../lib/auth/email";
import { nextStepFor } from "../../lib/auth/nextStep";
import {
  MAX_PASSWORD_LENGTH,
  PASSWORD_RULES,
  isStrongPassword,
} from "../../lib/auth/password";
import { getSupabaseClient } from "../../lib/supabase/client";
import { RequireSession } from "../../lib/supabase/RequireSession";


/**
 * ONB-03 Create Password. Reached from the verification email link, so the
 * user is already signed in; this adds a password so later sign-ins don't need
 * an email.
 */
export default function SetPasswordPage() {
  return (
    <RequireSession>
      <SetPasswordForm />
    </RequireSession>
  );
}

function SetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Arrived from a "Forgot your password?" email. Read after mount: the page
  // is server-rendered first, where there is no window.
  const [isReset, setIsReset] = useState(false);
  useEffect(() => {
    setIsReset(new URLSearchParams(window.location.search).get("reset") === "1");
  }, []);

  const strong = isStrongPassword(password);
  const canSubmit = strong && confirmation.length > 0 && !saving;

  async function save() {
    if (!strong) {
      setError("Choose a password that meets every requirement below the field.");
      return;
    }
    if (password !== confirmation) {
      setError("Those two passwords do not match.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const { data, error: updateError } = await getSupabaseClient().auth.updateUser({
        password,
        data: { has_password: true },
      });
      if (updateError) throw updateError;
      router.replace(nextStepFor(data?.user ?? { user_metadata: { has_password: true } }));
    } catch (err) {
      setError(friendlyAuthError(err, "Could not save that password. Try again."));
      setSaving(false);
    }
  }

  return (
    <OnboardingShell cardClassName={styles.card}>
      <div className={styles.head}>
        <h1 className={styles.title}>{isReset ? "Reset Password" : "Create Password"}</h1>
        <p className={styles.subtitle}>
          {isReset ? "Choose a new password for your account" : "Choose a password for your account"}
        </p>
      </div>

      <form
        className={styles.form}
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <AuthField
          label="Enter Password"
          revealable
          autoComplete="new-password"
          placeholder="Enter your password"
          maxLength={MAX_PASSWORD_LENGTH}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError(null);
          }}
        />
        <ul className={styles.rules} aria-label="Password requirements">
          {PASSWORD_RULES.map((rule) => {
            const met = rule.test(password);
            return (
              <li key={rule.id} className={met ? styles.ruleMet : styles.rule}>
                <span aria-hidden="true">{met ? "✓" : "•"}</span> {rule.label}
                <span className={styles.srOnly}>{met ? " (met)" : " (not yet)"}</span>
              </li>
            );
          })}
        </ul>
        <AuthField
          label="Re-enter Password"
          revealable
          autoComplete="new-password"
          placeholder="Confirm your password"
          maxLength={MAX_PASSWORD_LENGTH}
          error={confirmation && confirmation !== password ? "Passwords do not match yet." : null}
          value={confirmation}
          onChange={(e) => {
            setConfirmation(e.target.value);
            setError(null);
          }}
        />
        {error && (
          <p className={styles.formError} role="alert">
            {error}
          </p>
        )}
        <button type="submit" className={styles.button} disabled={!canSubmit}>
          {saving ? "Saving…" : "Continue"}
        </button>
      </form>
    </OnboardingShell>
  );
}

