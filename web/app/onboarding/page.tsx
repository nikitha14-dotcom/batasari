"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { OnboardingShell, ProgressHeader, StepFooter } from "../../components/onboarding";
import { LogoutButton } from "../../components/onboarding/auth";
import { readErrorDetail, requestErrorMessage } from "../../lib/onboarding/apiError";
import {
  EMPTY_DRAFT,
  EMPTY_PROFILE,
  toDraft,
  type Draft,
  type Profile,
  type ProfilePatch,
} from "../../lib/onboarding/profile";
import { CLEAR_ALL_PATCH, STEPS } from "../../lib/onboarding/steps";
import { getAccessToken, getSupabaseClient } from "../../lib/supabase/client";
import { RequireSession } from "../../lib/supabase/RequireSession";

import styles from "../../components/onboarding/onboarding.module.css";

// Blank counts as unset. `??` keeps an empty string, which turns every call
// into a same-origin relative path that 404s against the frontend host.
const API_BASE = process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:8000";

const REQUEST_TIMEOUT_MS = 15_000;

async function apiHeaders(hasBody = false) {
  const headers: Record<string, string> = hasBody ? { "Content-Type": "application/json" } : {};

  // getAccessToken() goes through supabase-js, which refreshes a token that is
  // close to expiry.
  const token = await getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  // Local-only. The backend ignores this header unless ENVIRONMENT=development,
  // and NEXT_PUBLIC_TEST_USER_ID is never set in Vercel.
  if (process.env.NEXT_PUBLIC_TEST_USER_ID) {
    headers["x-test-user-id"] = process.env.NEXT_PUBLIC_TEST_USER_ID;
  }

  return headers;
}

async function parseApiResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => null);

  if (!response.ok) throw new Error(readErrorDetail(data));

  return data as T;
}

export default function OnboardingPage() {
  return (
    <RequireSession>
      <OnboardingFlow />
    </RequireSession>
  );
}

function OnboardingFlow() {
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = useCallback(
    (partial: Partial<Draft>) => setDraft((current) => ({ ...current, ...partial })),
    [],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE}/profile`, {
          credentials: "include",
          headers: await apiHeaders(),
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });
        const saved = await parseApiResponse<Partial<Profile>>(response);
        if (!cancelled) setDraft(toDraft({ ...EMPTY_PROFILE, ...saved }));
      } catch (err) {
        if (!cancelled) {
          setError(requestErrorMessage(err, "Could not load profile."));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, []);

  async function patch(body: ProfilePatch): Promise<boolean> {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/profile`, {
        method: "PATCH",
        headers: await apiHeaders(true),
        credentials: "include",
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      await parseApiResponse<Partial<Profile>>(response);
      return true;
    } catch (err) {
      setError(requestErrorMessage(err, "Could not save your answer."));
      return false;
    } finally {
      setSaving(false);
    }
  }

  const current = STEPS[step];
  const isLastStep = step === STEPS.length - 1;

  function advance() {
    if (isLastStep) router.push("/categories");
    else setStep((s) => s + 1);
  }

  async function handleContinue() {
    if (saving || !current.isComplete(draft)) return;
    if (!(await patch(current.toPatch(draft)))) return;
    if (!(await markOnboardingComplete())) return;
    advance();
  }

  async function handleSkip() {
    if (saving) return;
    if (!(await patch(current.skipPatch))) return;
    if (!(await markOnboardingComplete())) return;
    advance();
  }

  async function markOnboardingComplete(): Promise<boolean> {
    try {
      const { error } = await getSupabaseClient().auth.updateUser({
        data: { onboarding_completed: true },
      });
      if (error) throw error;
      return true;
    } catch (err) {
      setError(requestErrorMessage(err, "Could not finish onboarding. Please try again."));
      return false;
    }
  }

  /**
   * Clear the answers on the server as well as in the browser.
   *
   * By the time this button renders — ONB-09 onwards — the first four steps
   * have each already been PATCHed. Resetting local state alone left them
   * saved: they came back on the next load, and went on feeding the
   * assistant's prompt in the meantime.
   */
  async function handleRestart() {
    if (saving) return;
    if (!(await patch(CLEAR_ALL_PATCH))) return;

    setDraft(EMPTY_DRAFT);
    setStep(0);
    setError(null);
  }

  function handleBack() {
    // The banner belongs to the step that failed. Carrying it backwards left
    // an alert claiming a save failed on a question that had saved fine.
    setError(null);
    setStep((s) => Math.max(0, s - 1));
  }

  if (loading) {
    return (
      <OnboardingShell topBarAction={<LogoutButton />}>
        <p className={styles.loading}>Loading your profile…</p>
      </OnboardingShell>
    );
  }

  return (
    <OnboardingShell topBarAction={<LogoutButton />}>
      <ProgressHeader
        step={step}
        stepCount={STEPS.length}
        question={current.question}
        onBack={handleBack}
        backDisabled={step === 0 || saving}
      />

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      {current.render({ draft, update, disabled: saving })}

      <StepFooter
        canContinue={current.isComplete(draft)}
        busy={saving}
        onContinue={handleContinue}
        onSkip={handleSkip}
        onRestart={current.offersRestart ? handleRestart : undefined}
      />
    </OnboardingShell>
  );
}

