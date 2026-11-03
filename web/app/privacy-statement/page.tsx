'use client';

import { useCallback, useEffect, useState } from 'react';

import { AppShell } from '@/components/navigation';
import { PrivacyStatementBody } from '@/components/privacy/PrivacyStatementBody';
import { PageHero } from '@/components/ui';
import {
  ContentRequestError,
  fetchSubcategoryContent,
  isEmpty,
  type SubcategoryContent,
} from '@/lib/content/contentApi';
import { RequireSession } from '@/lib/supabase/RequireSession';
import styles from './privacy-statement.module.css';

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; content: SubcategoryContent };

function PrivacyContent() {
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt((count) => count + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: 'loading' });
    fetchSubcategoryContent('Privacy Statement', 'Privacy Statement', {
      signal: controller.signal,
    })
      .then((content) => setState({ status: 'ready', content }))
      .catch((cause: unknown) => {
        if ((cause as Error)?.name === 'AbortError') return;
        setState({
          status: 'error',
          message: cause instanceof ContentRequestError ? cause.message : 'Something went wrong.',
        });
      });
    return () => controller.abort();
  }, [attempt]);

  return (
    <AppShell activeHref="/privacy-statement">
      <div className={styles.page}>
        <PageHero
          title="Privacy Statement"
          subtitle="Learn how KnewSooner handles information when you use the service."
        />
        <div className={styles.layout}>
          <article className={styles.article}>
            {state.status === 'loading' && <p role="status">Loading privacy statement…</p>}
            {state.status === 'error' && (
              <div className={styles.error} role="alert">
                <p>Couldn&apos;t load the privacy statement. {state.message}</p>
                <button type="button" onClick={retry}>
                  Try again
                </button>
              </div>
            )}
            {state.status === 'ready' && isEmpty(state.content) && (
              <p role="status">The privacy statement is unavailable right now.</p>
            )}
            {state.status === 'ready' && !isEmpty(state.content) && (
              <PrivacyStatementBody content={state.content} />
            )}
          </article>
        </div>
      </div>
    </AppShell>
  );
}

export default function Page() {
  return (
    <RequireSession>
      <PrivacyContent />
    </RequireSession>
  );
}

