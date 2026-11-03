"use client";

import { useEffect, useState, type FormEvent } from "react";

import { AppShell } from "@/components/navigation";
import { ProfileField } from "@/components/profile/ProfileField";
import { QuestionEditor } from "@/components/profile/QuestionEditor";
import { Button, PageHero } from "@/components/ui";
import type { Profile } from "@/lib/onboarding/profile";
import {
  dateError,
  identityFromUser,
  QUESTIONS,
  questionOtherValue,
  questionValue,
  normalizeEmail,
  validateIdentity,
  type IdentityDraft,
  type IdentityErrors,
  type QuestionKey,
} from "@/lib/profile/profileEdit";
import { getAccessToken, getSupabaseClient } from "@/lib/supabase/client";
import { RequireSession } from "@/lib/supabase/RequireSession";
import { useSession } from "@/lib/supabase/useSession";
import styles from "../profile.module.css";

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:8000";
const REQUEST_TIMEOUT_MS = 15_000;

type ApiErrorBody = { detail?: string | Array<{ msg?: string }> } | null;

async function readError(response: Response, fallback: string): Promise<Error> {
  const body = await response.json().catch(() => null) as ApiErrorBody;
  if (typeof body?.detail === "string") return new Error(body.detail);
  if (Array.isArray(body?.detail)) {
    const message = body.detail.map((item) => item.msg).filter(Boolean).join("; ");
    if (message) return new Error(message);
  }
  return new Error(fallback);
}

function EditProfile() {
  const { session, refreshSession } = useSession();
  const [identity, setIdentity] = useState<IdentityDraft>(() => identityFromUser(session?.user ?? null));
  const [identityErrors, setIdentityErrors] = useState<IdentityErrors>({});
  const [profile, setProfile] = useState<Partial<Profile>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [savingIdentity, setSavingIdentity] = useState(false);
  const [identityMessage, setIdentityMessage] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [savingQuestion, setSavingQuestion] = useState<QuestionKey | null>(null);
  const [questionMessages, setQuestionMessages] = useState<Partial<Record<QuestionKey, string>>>({});
  const [questionErrors, setQuestionErrors] = useState<Partial<Record<QuestionKey, string>>>({});

  useEffect(() => setIdentity(identityFromUser(session?.user ?? null)), [session?.user]);

  useEffect(() => {
    if (!pendingEmail) return;
    const currentEmail = normalizeEmail(session?.user?.email);
    if (currentEmail !== pendingEmail) return;

    setPendingEmail(null);
    setIdentityMessage("Your email was updated.");
  }, [pendingEmail, session?.user?.email]);

  useEffect(() => {
    let active = true;
    async function loadProfile() {
      try {
        const token = await getAccessToken();
        const response = await fetch(`${API_BASE}/profile`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          credentials: "include",
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });
        if (!response.ok) throw await readError(response, "Could not load your profile.");
        const body = await response.json();
        if (active) setProfile(body ?? {});
      } catch (error) {
        if (active) setLoadError(error instanceof Error ? error.message : "Could not load your profile.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadProfile();
    return () => { active = false; };
  }, []);

  async function saveIdentity(event: FormEvent) {
    event.preventDefault();
    const errors = validateIdentity(identity);
    setIdentityErrors(errors);
    setIdentityMessage(null);
    if (Object.keys(errors).length) return;

    setSavingIdentity(true);
    try {
      const requestedEmail = normalizeEmail(identity.email);
      const currentEmail = normalizeEmail(session?.user?.email);
      const { data, error } = await getSupabaseClient().auth.updateUser({
        email: identity.email.trim(),
        data: {
          first_name: identity.firstName.trim(),
          last_name: identity.lastName.trim() || null,
          display_name: identity.displayName.trim() || null,
        },
      });
      if (error) throw error;

      const updatedEmail = normalizeEmail(data.user?.email);
      if (requestedEmail !== currentEmail && updatedEmail !== requestedEmail) {
        setPendingEmail(requestedEmail);
        setIdentityMessage(
          "For your security, confirmation links were sent to both your current and new email addresses. Open both links to finish updating your email."
        );
      } else {
        setPendingEmail(null);
        setIdentityMessage("Your profile details were saved.");
      }

      if (requestedEmail !== currentEmail) {
        // If the confirmation was completed in another tab while this page
        // was open, refresh the session immediately and update the form in
        // place.
        const refreshed = await refreshSession();
        const refreshedEmail = normalizeEmail(refreshed?.user?.email);
        if (refreshedEmail === requestedEmail) {
          setPendingEmail(null);
          setIdentity(identityFromUser(refreshed?.user ?? null));
          setIdentityMessage("Your email was updated.");
        }
      }
    } catch (error) {
      setIdentityMessage(error instanceof Error ? error.message : "Could not save your profile details.");
    } finally {
      setSavingIdentity(false);
    }
  }

  function setQuestionValue(key: QuestionKey, value: string) {
    const patch: Partial<Profile> = key === "move_type" ? { move_type: (value || null) as Profile["move_type"] }
      : key === "destination_city" ? { destination_city: value || null }
      : key === "move_date" ? { move_date: value || null }
      : key === "visa_type" ? { visa_type: (value || null) as Profile["visa_type"] }
      : key === "household_type" ? { household_type: (value || null) as Profile["household_type"], ...(value === "other" ? {} : { household_other: null }) }
      : key === "city_country" ? { city_country: value || null }
      : key === "pets" ? { pets: value === "none" ? [] : value ? value.split(",").filter(Boolean) as Profile["pets"] : null, ...(value.includes("other") ? {} : { pets_other: null }) }
      : { has_accommodation: value === "" ? null : value === "yes" };
    setProfile((current) => ({ ...current, ...patch }));
    setQuestionErrors((current) => ({ ...current, [key]: undefined }));
    setQuestionMessages((current) => ({ ...current, [key]: undefined }));
  }

  async function saveQuestion(key: QuestionKey) {
    const value = questionValue(profile, key);
    const validationError = key === "move_date" ? dateError(value) : null;
    if (validationError) {
      setQuestionErrors((current) => ({ ...current, [key]: validationError }));
      return;
    }

    const body: Partial<Profile> = key === "pets"
      ? { pets: value === "none" ? [] : value ? value.split(",").filter(Boolean) as Profile["pets"] : null, pets_other: value.includes("other") ? profile.pets_other?.trim() || null : null }
      : key === "has_accommodation"
        ? { has_accommodation: value === "" ? null : value === "yes" }
        : key === "household_type"
          ? { household_type: (value || null) as Profile["household_type"], household_other: value === "other" ? profile.household_other?.trim() || null : null }
        : { [key]: value || null } as Partial<Profile>;

    setSavingQuestion(key);
    setQuestionErrors((current) => ({ ...current, [key]: undefined }));
    setQuestionMessages((current) => ({ ...current, [key]: undefined }));
    try {
      const token = await getAccessToken();
      const response = await fetch(`${API_BASE}/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        credentials: "include",
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (!response.ok) throw await readError(response, "Could not save this answer.");
      const result = await response.json();
      setProfile(result ?? profile);
      setQuestionMessages((current) => ({ ...current, [key]: "Saved." }));
    } catch (error) {
      setQuestionErrors((current) => ({ ...current, [key]: error instanceof Error ? error.message : "Could not save this answer." }));
    } finally {
      setSavingQuestion(null);
    }
  }

  if (loading) return <div className={styles.page}><p className={styles.status}>Loading your profile…</p></div>;
  if (loadError) return <div className={styles.page}><p className={styles.error} role="alert">{loadError}</p></div>;

  return (
    <div className={styles.page}>
      <PageHero title="Edit Profile" subtitle="Keep your personal details and relocation preferences up to date." />
      <form className={styles.editCard} onSubmit={saveIdentity} noValidate>
        <h2 className={styles.sectionTitle}>Personal information</h2>
        <div className={styles.editGrid}>
          <ProfileField label="First name" note="(required)" value={identity.firstName} error={identityErrors.firstName} autoComplete="given-name" onChange={(value) => setIdentity((current) => ({ ...current, firstName: value }))} />
          <ProfileField label="Last name" note="(optional)" value={identity.lastName} error={identityErrors.lastName} autoComplete="family-name" onChange={(value) => setIdentity((current) => ({ ...current, lastName: value }))} />
          <ProfileField label="Display name" note="(optional)" value={identity.displayName} error={identityErrors.displayName} autoComplete="nickname" onChange={(value) => setIdentity((current) => ({ ...current, displayName: value }))} />
          <ProfileField label="Email" note="(required)" type="email" value={identity.email} error={identityErrors.email} autoComplete="email" onChange={(value) => setIdentity((current) => ({ ...current, email: value }))} />
        </div>
        {identityMessage && <p className={identityMessage.includes("saved") ? styles.success : styles.error} role={identityMessage.includes("saved") ? "status" : "alert"}>{identityMessage}</p>}
        <Button type="submit" size="medium" disabled={savingIdentity}>{savingIdentity ? "Saving…" : "Save Changes"}</Button>
      </form>

      <section className={styles.editCard} aria-labelledby="preferences-title">
        <h2 id="preferences-title" className={styles.sectionTitle}>Your moving preferences</h2>
        {QUESTIONS.map((question) => (
          <QuestionEditor
            key={question.key}
            question={question}
            value={questionValue(profile, question.key)}
            error={questionErrors[question.key]}
            message={questionMessages[question.key]}
            saving={savingQuestion !== null}
            otherValue={questionOtherValue(profile, question.key)}
            onOtherChange={(value) => setProfile((current) => question.key === "pets" ? { ...current, pets_other: value } : { ...current, household_other: value })}
            onChange={(value) => setQuestionValue(question.key, value)}
            onSave={() => void saveQuestion(question.key)}
          />
        ))}
      </section>
    </div>
  );
}

export default function ProfileEditPage() {
  return <RequireSession><AppShell><EditProfile /></AppShell></RequireSession>;
}

