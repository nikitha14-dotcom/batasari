"use client";

import { useEffect, useState } from "react";

import { AppShell } from "@/components/navigation";
import { Icon } from "@/components/navigation/icons";
import { Button, ButtonLink, PageHero, PromoCard } from "@/components/ui";
import { fullName, handle, initials, timelineLabel } from "@/lib/profile/accountSummary";
import { getAccessToken } from "@/lib/supabase/client";
import { RequireSession } from "@/lib/supabase/RequireSession";
import { useSession } from "@/lib/supabase/useSession";
import styles from "./profile.module.css";

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:8000";

// The product serves one destination, and the header hard-codes it too
// (AppHeader renders "India"). Kept as a constant so there is one place
// to change when a second city appears.
const TARGET_DESTINATION = "India";

type TrialStatus = {
  trial_ends_at: string | null;
  remaining_credit_usd: number;
};

function formatTrialSummary(status: TrialStatus): string | null {
  if (!status.trial_ends_at || !Number.isFinite(status.remaining_credit_usd)) return null;

  const expiresAt = new Date(status.trial_ends_at);
  if (Number.isNaN(expiresAt.getTime())) return null;

  const expiration = new Intl.DateTimeFormat("en-CA", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
    timeZoneName: "short",
  }).format(expiresAt);
  const credit = `$${Math.max(0, status.remaining_credit_usd).toFixed(2)}`;

  return `You're currently on a 3-day Premium trial. It'll expire on ${expiration}, and you have ${credit} of AI credit remaining.`;
}

/** Figma UserFeedback / profile-overview (4:190). */
function ProfileOverview() {
  const { session } = useSession();
  const user = session?.user ?? null;
  const [moveDate, setMoveDate] = useState<string | null>(null);
  const [trialSummary, setTrialSummary] = useState<string | null>(null);
  const [trialStatusLoaded, setTrialStatusLoaded] = useState(false);

  const userId = user?.id ?? null;

  useEffect(() => {
    if (!userId) return;
    let active = true;

    (async () => {
      try {
        const token = await getAccessToken();
        if (!token) return;
        const headers = { Authorization: `Bearer ${token}` };
        const [profileResult, trialResult] = await Promise.allSettled([
          fetch(`${API_BASE}/profile`, { headers }),
          fetch(`${API_BASE}/beta/status`, { headers }),
        ]);
        if (profileResult.status === "fulfilled" && profileResult.value.ok) {
          const body = (await profileResult.value.json()) as { move_date?: string | null };
          if (active) setMoveDate(body.move_date ?? null);
        }
        if (trialResult.status !== "fulfilled" || !trialResult.value.ok) return;
        const trialStatus = (await trialResult.value.json()) as TrialStatus;
        const summary = formatTrialSummary(trialStatus);
        if (active) setTrialSummary(summary);
      } catch {
        // Profile and trial details are supplementary. The account identity
        // remains readable if either API request fails.
      } finally {
        if (active) setTrialStatusLoaded(true);
      }
    })();

    return () => {
      active = false;
    };
  }, [userId]);

  const name = fullName(user);
  const at = handle(user);
  const timeline = timelineLabel(moveDate);

  return (
    <div className={styles.page}>
      <PageHero
        title="Profile Overview"
        subtitle="Review your current relocation settings, subscription status, and platform account details below."
        action={
          <ButtonLink href="/profile/edit" size="small">
            <Icon name="pencil" size={16} />
            Edit Profile
          </ButtonLink>
        }
      />

      <div className={styles.card}>
        <div className={styles.identity}>
          <span className={styles.avatar}>
            <span className={styles.avatarInitials}>{initials(user)}</span>
            <span className={styles.avatarBadge} aria-hidden="true">
              <Icon name="globe" size={12} />
            </span>
          </span>
          <span className={styles.identityText}>
            <span className={styles.name}>{name ?? "Your profile"}</span>
            {at && <span className={styles.handle}>{at}</span>}
          </span>
        </div>

        <dl className={styles.fields}>
          <div className={styles.fieldPair}>
            <dt className={styles.fieldLabel}>Target Destination</dt>
            <dd className={styles.fieldValue}>{TARGET_DESTINATION}</dd>
          </div>
          <div className={styles.fieldPair}>
            <dt className={styles.fieldLabel}>Relocation Timeline</dt>
            <dd className={styles.fieldValue}>{timeline ?? "Not set yet"}</dd>
          </div>
          <div className={styles.fieldPair}>
            <dt className={styles.fieldLabel}>Account Email</dt>
            <dd className={styles.fieldValue}>{user?.email ?? "-"}</dd>
          </div>
        </dl>
      </div>

      <PromoCard
        title="We'd love to hear from you!"
        body="Help us make MovingAssistant better"
        action={
          <ButtonLink href="/feedback" size="medium">
            Share Your Feedback
          </ButtonLink>
        }
      />

      <PromoCard
        title="Batasari 3-days free trial"
        body={
          trialSummary ??
          (trialStatusLoaded
            ? "We couldn't load your trial details. Please refresh and try again."
            : "Loading your trial details…")
        }
      />
    </div>
  );
}

export default function ProfilePage() {
  return (
    <RequireSession>
      <AppShell>
        <ProfileOverview />
      </AppShell>
    </RequireSession>
  );
}

