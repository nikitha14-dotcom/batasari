'use client';

import { useEffect, useState } from 'react';
import {
  getBetaStatus,
  joinBetaWaitlist,
  recordBetaEvent,
  submitDeclineReason,
  type BetaStatus,
} from '@/lib/beta/betaApi';
import { useSignOut } from '@/lib/supabase/useSignOut';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { useSession } from '@/lib/supabase/useSession';
import {
  deleteConversationHistory,
  deleteInsights,
} from '@/lib/copilot/copilotService';
import styles from './beta.module.css';
import { BetaActionButton } from './BetaActionButton';
import { BetaFeatureRow } from './BetaFeatureRow';

const DECLINE_REASONS = [
  { value: 'not_helpful', label: "I don't find the app helpful" },
  { value: 'ai_quality', label: "The AI answers aren't good enough" },
  { value: 'non_ai_quality', label: "The non-AI sections aren't good enough" },
  { value: 'price', label: "I won't pay for the app" },
  { value: 'not_needed', label: "I don't need it right now" },
  { value: 'other', label: 'Other' },
] as const;

export function BetaAccessGate({
  children,
  allowExpired = false,
}: {
  children: React.ReactNode;
  allowExpired?: boolean;
}) {
  const { signOut, signingOut } = useSignOut();
  const { session, loading } = useSession();
  const userId = session?.user.id;
  const [status, setStatus] = useState<BetaStatus | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [view, setView] = useState<
    'entry' | 'waitlist' | 'thanks' | 'decline' | 'other' | 'declined'
  >('entry');
  const [waitlistState, setWaitlistState] = useState<
    'idle' | 'loading' | 'joined' | 'already_joined' | 'error'
  >('idle');
  const [waitlistEmail, setWaitlistEmail] = useState<string | null>(null);
  const [explanation, setExplanation] = useState('');
  const [declineReasons, setDeclineReasons] = useState<string[]>([]);
  const [declineSaving, setDeclineSaving] = useState(false);
  const [declineError, setDeclineError] = useState(false);
  const [deletionState, setDeletionState] = useState<
    | 'idle'
    | 'deleting-conversations'
    | 'deleted-conversations'
    | 'deleting-insights'
    | 'deleted-insights'
    | 'error'
  >('idle');

  useEffect(() => {
    if (!isSupabaseConfigured() || loading || !userId) return;
    const controller = new AbortController();
    let active = true;
    getBetaStatus(controller.signal)
      .then((next) => {
        if (!active) return;
        setStatus(next);
        if (next.decline_submitted && next.state !== 'active') {
          setView('declined');
        } else if (next.waitlist_joined) {
          setWaitlistState('already_joined');
          setWaitlistEmail(next.waitlist_email);
          if (next.state !== 'active') setView('thanks');
        }
        window.dispatchEvent(new CustomEvent('beta-status', { detail: next }));
        setShowModal(next.state !== 'active');
        if (next.state !== 'active')
          void recordBetaEvent(
            next.state === 'expired' ? 'paywall_exposure_app' : 'paywall_exposure_ai',
          );
      })
      .catch(() => undefined);
    return () => {
      active = false;
      controller.abort();
    };
  }, [loading, userId]);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && showModal) setShowModal(false);
    }
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [showModal]);

  if (!isSupabaseConfigured()) return <>{children}</>;

  function giveFeedback() {
    void recordBetaEvent('feedback_clicked');
  }

  async function join() {
    setWaitlistState('loading');
    try {
      const result = await joinBetaWaitlist();
      setWaitlistState(result.status);
      setWaitlistEmail(result.email);
      setView('thanks');
    } catch {
      setWaitlistState('error');
    }
  }

  async function chooseReasons(reasons: string[]) {
    if (reasons.includes('other')) {
      setView('other');
      return;
    }
    setDeclineSaving(true);
    setDeclineError(false);
    try {
      await submitDeclineReason(reasons[0], undefined, reasons);
      setView('declined');
    } catch {
      setDeclineError(true);
    } finally {
      setDeclineSaving(false);
    }
  }

  async function saveOther() {
    setDeclineSaving(true);
    setDeclineError(false);
    try {
      await submitDeclineReason(declineReasons[0] ?? 'other', explanation, declineReasons);
      setView('declined');
    } catch {
      setDeclineError(true);
    } finally {
      setDeclineSaving(false);
    }
  }

  async function deleteConversations() {
    if (
      !window.confirm(
        'Delete all saved conversations? This action cannot be undone.',
      )
    )
      return;
    setDeletionState('deleting-conversations');
    try {
      await deleteConversationHistory();
      setDeletionState('deleted-conversations');
    } catch {
      setDeletionState('error');
    }
  }

  async function deleteAiInsights() {
    if (!window.confirm('Delete all AI insights? This action cannot be undone.')) return;
    setDeletionState('deleting-insights');
    try {
      await deleteInsights();
      setDeletionState('deleted-insights');
    } catch {
      setDeletionState('error');
    }
  }

  const expired = status?.state === 'expired';
  const restricted = Boolean(status && status.state !== 'active');
  if (allowExpired && expired) return <>{children}</>;
  return (
    <>
      <div className={expired && restricted ? styles.lockedContent : undefined}>{children}</div>
      {restricted && (showModal || expired) && (
        <div className={styles.overlay} role="presentation">
          <section
            className={`${styles.modal} ${view === 'decline' ? styles.reasonModal : ''}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby={view === 'waitlist' ? undefined : 'beta-title'}
            aria-label={view === 'waitlist' ? 'Paid access details' : undefined}
          >
            {view === 'entry' && (
              <>
                <div className={styles.icon} aria-hidden="true">
                  ✦
                </div>
                <h1 id="beta-title">
                  {expired ? 'Your free 3-day Beta access has ended' : 'Free AI access has ended'}
                </h1>
                <p>
                  {expired
                    ? 'Your free 3-day Beta access has ended (counting 72 hours after email verification). We are considering a monthly subscription. No payment is being collected today. Please let us know about your experience and whether you are interested in continuing.'
                    : 'You have used all of your $1 USD AI credits. You can continue viewing your saved AI conversations and using the rest of the app.'}
                </p>
                <div className={styles.actions}>
                  <BetaActionButton
                    onClick={() => {
                      void recordBetaEvent('waitlist_clicked');
                      setView('waitlist');
                    }}
                  >
                    Join the paid-access waitlist
                  </BetaActionButton>
                  {expired && (
                    <BetaActionButton
                      onClick={() => {
                        void recordBetaEvent('no_thanks_clicked');
                        setDeclineReasons([]);
                        setDeclineError(false);
                        setView('decline');
                      }}
                    >
                      No thanks
                    </BetaActionButton>
                  )}
                  <a className={styles.action} href="/feedback?source=beta" onClick={giveFeedback}>
                    Give feedback
                  </a>
                </div>
                <p className={styles.reassurance}>
                  No credit card required · Your data remains secure
                </p>
                {!expired && (
                  <button className={styles.linkButton} onClick={() => setShowModal(false)}>
                    Continue using the app
                  </button>
                )}
              </>
            )}
            {view === 'waitlist' && (
              <>
                <div className={styles.waitlistIcon} aria-hidden="true">
                  ✧
                </div>
                <p className={styles.waitlistIntro}>
                  We&apos;re exploring a paid plan for MovingAssistant. Here&apos;s what it may
                  include:
                </p>
                <div className={styles.featureList}>
                  <BetaFeatureRow icon="✓" title="Unlimited non-AI features">
                    Use all non-AI features without limits.
                  </BetaFeatureRow>
                  <BetaFeatureRow icon="$" title="$Y AI credits">
                    Get $Y of AI credits each month.
                  </BetaFeatureRow>
                  <BetaFeatureRow icon="＋" title="Additional AI credits">
                    Purchase more AI credits after your included credits are used.
                  </BetaFeatureRow>
                </div>
                <p className={styles.waitlistDisclaimer}>
                  Payment is not available yet. We&apos;ll contact you by email when paid access is
                  ready.
                </p>
                {waitlistState === 'loading' && <p role="status">Joining the waitlist…</p>}
                {waitlistState === 'error' && (
                  <p role="alert">We could not join the waitlist. Please try again.</p>
                )}
                {waitlistState === 'idle' || waitlistState === 'error' ? (
                  <button className={styles.primary} onClick={() => void join()}>
                    Notify me when available
                  </button>
                ) : null}
                <p className={styles.noPayment}>♧ &nbsp; No payment is being collected today.</p>
                <button className={styles.linkButton} onClick={() => setView('entry')}>
                  Back
                </button>
              </>
            )}
            {view === 'thanks' && (
              <>
                <div className={styles.waitlistIcon} aria-hidden="true">
                  ✓
                </div>
                <h1 id="beta-title">Thanks for your interest</h1>
                <p>
                  We&apos;ve saved your interest in continuing with MovingAssistant. We&apos;ll email you
                  with next steps when paid access is available.
                </p>
                {waitlistEmail && <p>We&apos;ll use {waitlistEmail} to keep you posted.</p>}
                <a className={styles.action} href="/feedback?source=beta" onClick={giveFeedback}>
                  Share your feedback
                </a>
                {!expired && (
                  <button className={styles.linkButton} onClick={() => setShowModal(false)}>
                    Continue using the app
                  </button>
                )}
              </>
            )}
            {view === 'decline' && (
              <div className={styles.reasonScreen}>
                <div className={styles.reasonIcon} aria-hidden="true">
                  ?
                </div>
                <h1 id="beta-title">What is the main reason?</h1>
                <p className={styles.reasonIntro}>Your feedback helps us improve MovingAssistant.</p>
                <div className={styles.reasonList} role="group" aria-label="Reasons">
                  {DECLINE_REASONS.map(({ value, label }) => {
                    const selected = declineReasons.includes(value);
                    return (
                      <button
                        className={`${styles.reasonOption} ${selected ? styles.reasonOptionSelected : ''}`}
                        key={value}
                        type="button"
                        role="checkbox"
                        aria-checked={selected}
                        onClick={() =>
                          setDeclineReasons((current) =>
                            selected
                              ? current.filter((reason) => reason !== value)
                              : [...current, value],
                          )
                        }
                      >
                        <span>{label}</span>
                        <span className={`${styles.radio} ${selected ? styles.radioSelected : ''}`} aria-hidden="true" />
                      </button>
                    );
                  })}
                </div>
                {declineError && (
                  <p className={styles.formError} role="alert">
                    We couldn&apos;t save your response. Please try again.
                  </p>
                )}
                <button
                  className={styles.primary}
                  type="button"
                  disabled={declineReasons.length === 0 || declineSaving}
                  onClick={() => void chooseReasons(declineReasons)}
                >
                  {declineSaving ? 'Saving…' : 'Next'}
                </button>
                <button
                  className={styles.linkButton}
                  type="button"
                  onClick={() => {
                    setDeclineReasons([]);
                    setView('entry');
                  }}
                >
                  Back
                </button>
              </div>
            )}
            {view === 'declined' && (
              <>
                <div className={styles.reasonIcon} aria-hidden="true">
                  ✓
                </div>
                <h1 id="beta-title">Thanks for sharing your feedback</h1>
                <p>
                  Your response has been saved. We&apos;ll use it to improve MovingAssistant.
                </p>
                <a className={styles.action} href="/feedback?source=beta" onClick={giveFeedback}>
                  Tell us more about your experience
                </a>
                {!expired && (
                  <button className={styles.linkButton} onClick={() => setShowModal(false)}>
                    Continue using the app
                  </button>
                )}
              </>
            )}
            {view === 'other' && (
              <>
                <h1 id="beta-title">Tell us more</h1>
                <textarea
                  aria-label="Why are you not interested?"
                  maxLength={2000}
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                />
                <button
                  className={styles.primary}
                  onClick={() => void saveOther()}
                  disabled={!explanation.trim() || declineSaving}
                >
                  {declineSaving ? 'Saving…' : 'Submit'}
                </button>
                {declineError && (
                  <p className={styles.formError} role="alert">
                    We couldn&apos;t save your response. Please try again.
                  </p>
                )}
                <button className={styles.linkButton} onClick={() => setView('decline')}>
                  Back
                </button>
              </>
            )}
            {expired && view === 'entry' && (
              <div className={styles.deletionActions}>
                <h2>Delete your data</h2>
                <p>You can remove your saved conversations and AI insights at any time.</p>
                <button
                  className={styles.action}
                  type="button"
                  disabled={deletionState === 'deleting-conversations'}
                  onClick={() => void deleteConversations()}
                >
                  {deletionState === 'deleting-conversations'
                    ? 'Deleting conversations…'
                    : 'Delete conversations'}
                </button>
                <button
                  className={styles.action}
                  type="button"
                  disabled={deletionState === 'deleting-insights'}
                  onClick={() => void deleteAiInsights()}
                >
                  {deletionState === 'deleting-insights'
                    ? 'Deleting AI insights…'
                    : 'Delete AI insights'}
                </button>
                {deletionState === 'deleted-conversations' && (
                  <p className={styles.deletionStatus} role="status">
                    Your saved conversations were deleted.
                  </p>
                )}
                {deletionState === 'deleted-insights' && (
                  <p className={styles.deletionStatus} role="status">
                    Your AI insights were deleted.
                  </p>
                )}
                {deletionState === 'error' && (
                  <p className={styles.formError} role="alert">
                    We couldn&apos;t delete that data. Please try again.
                  </p>
                )}
              </div>
            )}
            {expired && (
              <button
                className={styles.logout}
                onClick={() => void signOut()}
                disabled={signingOut}
              >
                {signingOut ? 'Logging out…' : 'Log out'}
              </button>
            )}
          </section>
        </div>
      )}
    </>
  );
}

