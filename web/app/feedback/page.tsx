'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { AppShell } from '@/components/navigation';
import {
  Banner,
  Button,
  Confetti,
  Modal,
  PageHero,
  SelectField,
  StarRating,
  TextAreaField,
} from '@/components/ui';
import {
  FEEDBACK_TYPES,
  FEEDBACK_TYPE_PLACEHOLDER,
  MAX_FEEDBACK_MESSAGE,
} from '@/lib/feedback/feedbackTypes';
import { FeedbackError, submitFeedback } from '@/lib/feedback/feedbackApi';
import { RequireSession } from '@/lib/supabase/RequireSession';
import styles from './feedback.module.css';

// Where the user came from, and where the flow returns them.
const ROUTES_PROFILE = '/profile';

const HERO_TITLE = 'Share your feedback';
const HERO_SUBTITLE = "Tell us what's working, what isn't, or what you'd like to see next.";

/**
 * Figma UserFeedback, Feedback_1 through Feedback_4.
 *
 * One page, four states:
 *   Feedback_1  form at rest
 *   Feedback_2  type menu open (owned by SelectField)
 *   Feedback_3  "Thanks for Your Feedback" modal, after a successful POST
 *   Feedback_4  modal dismissed -> the user is sent to /profile
 *
 * Feedback_4 in the mock leaves the user on this page behind a banner. Per
 * product we return them to Profile Overview instead, which is where they
 * came from: the modal has already confirmed the submission, so a banner
 * saying the same thing over an empty form is a second confirmation and a
 * dead end.
 */
function FeedbackForm() {
  const [rating, setRating] = useState<number | null>(null);
  const [feedbackType, setFeedbackType] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const [sending, setSending] = useState(false);
  const [showThanks, setShowThanks] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  // Rating and type are required; the free text is not. Those two are the
  // fields that can be counted across the pilot, and gating on typing effort
  // would cost submissions without adding anything countable.
  const canSubmit = rating !== null && feedbackType !== null && !sending;

  async function onSubmit() {
    if (!canSubmit) return;

    setSending(true);
    setError(null);

    try {
      await submitFeedback({ rating, feedbackType, message });
      setShowThanks(true);
    } catch (err) {
      setError(
        err instanceof FeedbackError
          ? err.message
          : 'We could not save your feedback. Please try again.',
      );
    } finally {
      setSending(false);
    }
  }

  function closeThanks() {
    setShowThanks(false);
    // Clear before navigating. The page unmounts on the route change so this
    // is belt and braces, but a client-side back would otherwise be able to
    // show the old answers as if they had not been sent.
    setRating(null);
    setFeedbackType(null);
    setMessage('');
    router.push(ROUTES_PROFILE);
  }

  return (
    <div className={styles.page}>
      {error && <Banner tone="error" title="We could not send your feedback" body={error} />}

      <PageHero title={HERO_TITLE} subtitle={HERO_SUBTITLE} />

      <div className={styles.card}>
        <div className={styles.intro}>
          <h2 className={styles.question}>How was your experience?</h2>
          <p className={styles.lead}>Your feedback helps us improve MovingAssistant.</p>
          <StarRating value={rating} onChange={setRating} />
        </div>

        <SelectField
          label="Feedback Type:"
          options={FEEDBACK_TYPES}
          value={feedbackType}
          onChange={setFeedbackType}
          placeholder={FEEDBACK_TYPE_PLACEHOLDER}
        />

        <TextAreaField
          label="Tell us More:"
          value={message}
          onChange={setMessage}
          placeholder="Share your thoughts......"
          maxLength={MAX_FEEDBACK_MESSAGE}
        />

        <Button size="block" onClick={() => void onSubmit()} disabled={!canSubmit}>
          {sending ? 'Sending...' : 'Submit Feedback'}
        </Button>
      </div>

      {showThanks && (
        <Modal
          title="Thanks for Your Feedback"
          onClose={closeThanks}
          tone="celebration"
          decoration={<Confetti />}
        >
          <p className={styles.modalBody}>
            We&apos;ve successfully received your feedback. Our team will take it into
            consideration.
          </p>
        </Modal>
      )}
    </div>
  );
}

export default function FeedbackPage() {
  return (
    <RequireSession>
      <AppShell activeHref="/feedback">
        <FeedbackForm />
      </AppShell>
    </RequireSession>
  );
}

