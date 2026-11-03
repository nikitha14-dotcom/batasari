import type { WorkLink } from '../../lib/work/directory';
import { ArrowRightIcon } from './icons';
import styles from './work.module.css';

/**
 * The source logo slot shows the source's initial until a logo decision is
 * made. Collecting 49 logos is its own piece of work, with its own questions
 * about where they come from.
 */
function initialOf(name: string): string {
  const match = name.match(/[A-Za-z0-9]/);
  return match ? match[0].toUpperCase() : '';
}

export function LinkCard({ link }: { link: WorkLink }) {
  return (
    <div className={styles.linkRow}>
      <span className={styles.logoTile} aria-hidden="true">
        {initialOf(link.name)}
      </span>

      <div className={styles.linkDetails}>
        <h3 className={styles.linkName}>{link.name}</h3>
        <p className={styles.linkDescription}>{link.description}</p>
      </div>

      <a
        className={styles.visitButton}
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Visit Website: ${link.name} (opens in a new tab)`}
      >
        <span className={styles.visitLabel}>Visit Website</span>
        <ArrowRightIcon />
      </a>
    </div>
  );
}

