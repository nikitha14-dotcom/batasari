'use client';

import { useEffect, useRef } from 'react';
import type { WorkSubcategory } from '../../lib/work/directory';
import { ChevronDownIcon, LightbulbIcon, SubcategoryIcon } from './icons';
import { LinkCard } from './LinkCard';
import styles from './work.module.css';

/** Matches the panel's open animation in work.module.css. */
const OPEN_ANIMATION_MS = 250;

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return true;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

type DirectorySectionProps = {
  subcategory: WorkSubcategory;
  isOpen: boolean;
  onToggle: (id: string) => void;
};

export function DirectorySection({ subcategory, isOpen, onToggle }: DirectorySectionProps) {
  const { id, title, blurb, tip, icon, links } = subcategory;
  const headerRef = useRef<HTMLButtonElement>(null);

  const titleId = `work-${id}-title`;
  const blurbId = `work-${id}-blurb`;
  const panelId = `work-${id}-panel`;

  // Only one section is open at a time, so opening this one can close a
  // longer one above it. When that happens this header moves up the page and
  // can end up off-screen. Once the section has opened, scroll its header back
  // into view; "nearest" does nothing when it is already visible.
  useEffect(() => {
    if (!isOpen) return;
    const reduced = prefersReducedMotion();
    const timer = window.setTimeout(
      () => {
        headerRef.current?.scrollIntoView?.({
          block: 'nearest',
          behavior: reduced ? 'auto' : 'smooth',
        });
      },
      reduced ? 0 : OPEN_ANIMATION_MS,
    );
    return () => window.clearTimeout(timer);
  }, [isOpen]);

  const sectionClass = [styles.section, isOpen && styles.sectionOpen].filter(Boolean).join(' ');

  return (
    <div className={sectionClass}>
      <h2 className={styles.sectionHeading}>
        <button
          ref={headerRef}
          type="button"
          className={styles.sectionButton}
          aria-expanded={isOpen}
          aria-controls={panelId}
          aria-labelledby={titleId}
          aria-describedby={blurbId}
          onClick={() => onToggle(id)}
        >
          <span className={styles.iconTile} aria-hidden="true">
            <SubcategoryIcon name={icon} />
          </span>
          <span className={styles.titleBlock}>
            <span id={titleId} className={styles.sectionTitle}>
              {title}
            </span>
            <span id={blurbId} className={styles.sectionBlurb}>
              {blurb}
            </span>
          </span>
          <span className={styles.chevron} aria-hidden="true">
            <ChevronDownIcon />
          </span>
        </button>
      </h2>

      <div
        id={panelId}
        role="region"
        aria-labelledby={titleId}
        className={styles.panel}
        hidden={!isOpen}
      >
        <div className={styles.panelInner}>
          <div className={styles.panelBody}>
            <p className={styles.tip}>
              <span className={styles.tipIcon} aria-hidden="true">
                <LightbulbIcon />
              </span>
              <span className={styles.tipText}>
                <strong className={styles.tipLabel}>Tip</strong> {tip}
              </span>
            </p>

            <hr className={styles.divider} />

            <ul className={styles.linkList}>
              {links.map((link) => (
                <li key={link.id} className={styles.linkItem}>
                  <LinkCard link={link} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

