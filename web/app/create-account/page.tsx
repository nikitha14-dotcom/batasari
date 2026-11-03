"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { OnboardingShell } from "../../components/onboarding";
import { AuthField } from "../../components/onboarding/auth";
import styles from "../../components/onboarding/auth.module.css";
import {
  MAX_NAME,
  draftFromMetadata,
  toAccountDetails,
  validateDraft,
  type AccountDraft,
  type DraftErrors,
} from "../../lib/auth/accountDetails";
import { friendlyAuthError } from "../../lib/auth/email";
import { ROUTES } from "../../lib/auth/nextStep";
import { getSupabaseClient } from "../../lib/supabase/client";
import { RequireSession } from "../../lib/supabase/RequireSession";
import { useSession } from "../../lib/supabase/useSession";

/**
 * ONB-04 Create Account ("Let's get to know you!"). Saves names and the
 * product-email opt-in to the Supabase user's metadata, then continues to the
 * profile questions (ONB-05).
 */
export default function CreateAccountPage() {
  return (
    <RequireSession>
      <CreateAccountForm />
    </RequireSession>
  );
}

const EMPTY: AccountDraft = { firstName: "", lastName: "", displayName: "", productUpdates: false };

function CreateAccountForm() {
  const router = useRouter();
  const { session } = useSession();
  const [draft, setDraft] = useState<AccountDraft>(EMPTY);
  const [errors, setErrors] = useState<DraftErrors>({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  // Pre-fill anything saved on an earlier visit, once, without clobbering typing.
  const meta = session?.user?.user_metadata;
  useEffect(() => {
    if (!touched && meta) setDraft(draftFromMetadata(meta));
  }, [meta, touched]);

  function update(patch: Partial<AccountDraft>) {
    setTouched(true);
    setDraft((d) => ({ ...d, ...patch }));
    setErrors({});
    setFormError(null);
  }

  const canSubmit = draft.firstName.trim().length > 0 && !saving;

  async function save() {
    const found = validateDraft(draft);
    if (Object.keys(found).length) {
      setErrors(found);
      return;
    }
    setSaving(true);
    try {
      const { error } = await getSupabaseClient().auth.updateUser({ data: toAccountDetails(draft) });
      if (error) throw error;
      router.replace(ROUTES.onboarding);
    } catch (err) {
      setFormError(friendlyAuthError(err, "Could not save your details. Try again."));
      setSaving(false);
    }
  }

  return (
    <OnboardingShell cardClassName={styles.card}>
      <div className={styles.head}>
        <h1 className={styles.title}>Let’s get to know you!</h1>
      </div>

      <form
        className={styles.form}
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <div className={styles.nameRow}>
          <AuthField
            label="First Name"
            note="(required)"
            autoComplete="given-name"
            maxLength={MAX_NAME}
            required
            value={draft.firstName}
            error={errors.firstName}
            onChange={(e) => update({ firstName: e.target.value })}
          />
          <AuthField
            label="Last Name"
            note="(optional)"
            autoComplete="family-name"
            maxLength={MAX_NAME}
            value={draft.lastName}
            error={errors.lastName}
            onChange={(e) => update({ lastName: e.target.value })}
          />
        </div>

        <AuthField
          label="Choose a display name"
          note="(optional)"
          hint="This can be your name or a pseudonym."
          autoComplete="nickname"
          maxLength={MAX_NAME}
          value={draft.displayName}
          error={errors.displayName}
          onChange={(e) => update({ displayName: e.target.value })}
        />

        <hr className={styles.divider} />

        <div className={styles.switchRow}>
          <div className={styles.switchText}>
            <span id="updates-label" className={styles.switchTitle}>
              Subscribe to product update emails
            </span>
            <span id="updates-desc" className={styles.switchSub}>
              Get the latest updates about features and product updates. You can unsubscribe at any time.
            </span>
          </div>
          <button
            type="button"
            role="switch"
            className={styles.switch}
            aria-checked={draft.productUpdates}
            aria-labelledby="updates-label"
            aria-describedby="updates-desc"
            onClick={() => update({ productUpdates: !draft.productUpdates })}
          />
        </div>

        {formError && (
          <p className={styles.formError} role="alert">
            {formError}
          </p>
        )}
        <button type="submit" className={styles.button} disabled={!canSubmit}>
          {saving ? "Saving…" : "Continue"}
        </button>
      </form>
    </OnboardingShell>
  );
}

