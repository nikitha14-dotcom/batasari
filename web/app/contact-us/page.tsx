'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';

import { AppShell } from '@/components/navigation';
import { PageHero, SelectField } from '@/components/ui';
import { RequireSession } from '@/lib/supabase/RequireSession';
import { ContactError, submitContactMessage } from '@/lib/contact/contactApi';
import styles from './contact-us.module.css';

const TOPICS = [
  { value: 'technical_issue', label: 'Technical Issue' },
  { value: 'account_sign_in', label: 'Account & Sign-in' },
  { value: 'privacy_data', label: 'Privacy & Data' },
  { value: 'subscriptions', label: 'Subscriptions' },
  { value: 'general_question', label: 'General Question' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'other', label: 'Other' },
] as const;

function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [topicError, setTopicError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSent(false);
    if (!topic) {
      setTopicError('Choose a topic.');
      return;
    }
    setTopicError(null);
    setSending(true);
    try {
      await submitContactMessage({ name, email, topic, message });
      setSent(true);
      setName('');
      setEmail('');
      setTopic(null);
      setMessage('');
    } catch (cause) {
      setError(
        cause instanceof ContactError
          ? cause.message
          : 'We could not send your message. Please try again.',
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <form className={styles.formCard} onSubmit={handleSubmit}>
      <div className={styles.fields}>
        <label className={styles.field}>
          <span>Your name</span>
          <input
            autoComplete="name"
            maxLength={120}
            onChange={(event) => setName(event.target.value)}
            placeholder="Enter your name"
            required
            value={name}
          />
        </label>
        <label className={styles.field}>
          <span>Email address</span>
          <input
            autoComplete="email"
            maxLength={254}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
            type="email"
            value={email}
          />
        </label>
        <SelectField
          compact
          error={topicError}
          label="What can we help you with?"
          onChange={(value) => {
            setTopic(value);
            setTopicError(null);
          }}
          options={TOPICS}
          placeholder="Select a topic"
          value={topic}
        />
        <label className={styles.field}>
          <span>Message</span>
          <textarea
            maxLength={5000}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Tell us how we can help..."
            required
            value={message}
          />
        </label>
      </div>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      {sent && (
        <p className={styles.success} role="status">
          Your message has been received.
        </p>
      )}
      <button className={styles.submit} disabled={sending} type="submit">
        {sending ? 'Sending...' : 'Send Message'}
      </button>
    </form>
  );
}

export default function Page() {
  return (
    <RequireSession>
      <AppShell activeHref="/contact-us">
        <div className={styles.page}>
          <PageHero
            title="Contact Us"
            subtitle="Have a question or need help? Send us a message and our team will get back to you."
          />
          <div className={styles.grid}>
            <ContactForm />
            <aside className={styles.aside}>
              <div className={styles.infoCard}>
                <h2>We&apos;re here to help</h2>
                <p>
                  Whether you have a question about Batasari or need help with your account,
                  we&apos;re here to help.
                </p>
                <div className={styles.infoDetail}>
                  <strong>Contact</strong>
                  <span>Use the form on this page</span>
                </div>
                <div className={styles.infoDetail}>
                  <strong>Response time</strong>
                  <span>We aim to respond within 3 business days during the Beta.</span>
                </div>
              </div>
              <p className={styles.note}>
                Please do not include sensitive information in your message.
              </p>
              <p className={styles.feedbackPrompt}>
                Have a suggestion for improving Batasari?{' '}
                <Link href="/feedback">Share your feedback</Link>.
              </p>
            </aside>
          </div>
        </div>
      </AppShell>
    </RequireSession>
  );
}

