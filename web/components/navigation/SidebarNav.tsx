"use client";

import React from 'react';
import Link from 'next/link';

import { Icon, type IconName } from './icons';
import styles from './navigation.module.css';
import { SignOutButton } from './SignOutButton';

type NavItem = { label: string; href: string; icon: IconName };

/** The ten category tabs, in the order and with the icons of the Figma design. */
export const NAV_ITEMS: readonly NavItem[] = [
  { label: 'My move', href: '/categories', icon: 'house' },
  { label: 'City guide', href: '/india-guide', icon: 'map-pinned' },
  { label: 'Compare cities', href: '/city-compare', icon: 'map' },
  { label: 'Moving services', href: '/moving-shipping', icon: 'truck' },
  { label: 'Stay & documents', href: '/immigration', icon: 'globe' },
  { label: 'Checklist', href: '/checklist', icon: 'square-check' },
];

/**
 * Below the divider. The design shows icon-only help and log-out here; per
 * product these are labelled FAQ, Privacy Statement, Contact Support and Feedback, styled like
 * the tabs above, followed by Log out (SignOutButton: an action, not a link).
 */
export const FOOTER_ITEMS: readonly NavItem[] = [
  { label: 'FAQ', href: '/help', icon: 'circle-help' },
  { label: 'Privacy Statement', href: '/privacy-statement', icon: 'file-text' },
  { label: 'Contact Support', href: '/contact-us', icon: 'mail' },
  { label: 'Feedback', href: '/feedback', icon: 'lightbulb' },
];

/**
 * Sub-items shown inside the Education & Family dropdown when the user is on
 * the /education-family route. Labels match the Figma sidebar exactly.
 * Each item links to /education-family with a `?group=<slug>` param so the
 * page can highlight the right group without a separate route.
 */
export const EDUCATION_SUB_ITEMS = [
  { label: 'Child Care',                    group: 'childcare' },
  { label: 'Schools in Canada',             group: 'schools' },
  { label: 'Colleges & Universities',       group: 'colleges' },
  { label: 'ESL Classes',                   group: 'esl' },
  { label: 'Trade Schools & Certification', group: 'trade' },
] as const;

export type EducationGroup = (typeof EDUCATION_SUB_ITEMS)[number]['group'];

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      className={`${styles.navItem} ${active ? styles.navItemActive : ''}`}
      aria-current={active ? 'page' : undefined}
    >
      <span className={styles.navIcon}>
        <Icon name={item.icon} />
      </span>
      <span className={styles.navLabel}>{item.label}</span>
      {active && <span className={styles.activeDot} aria-hidden="true" />}
    </Link>
  );
}

/**
 * Education & Family nav item with inline dropdown sub-items.
 *
 * Two ways the dropdown opens:
 * 1. Already on /education-family (active) — always expanded.
 * 2. User clicks the parent button from another page — expands locally
 *    without navigating, so the current page content stays visible.
 *    Once the user picks a sub-item, that Link navigates normally.
 */
function EducationNavItem({
  active,
  activeGroup,
}: {
  active: boolean;
  activeGroup: EducationGroup | null;
}) {
  // Local expansion state for when the user is NOT on /education-family.
  // When active (on /education-family), the dropdown is always shown.
  const [localExpanded, setLocalExpanded] = React.useState(false);

  const dropdownOpen = active || localExpanded;

  return (
    <div className={styles.educationGroup}>
      {active ? (
        // Already on /education-family — render as a plain link (normal behaviour).
        <Link
          href="/education-family"
          className={`${styles.navItem} ${styles.navItemActive}`}
          aria-current="page"
        >
          <span className={styles.navIcon}>
            <Icon name="graduation-cap" />
          </span>
          <span className={styles.navLabel}>Education &amp; Family</span>
          <span className={styles.activeDot} aria-hidden="true" />
        </Link>
      ) : (
        // On a different page — clicking toggles the dropdown WITHOUT navigating.
        <button
          type="button"
          className={`${styles.navItem} ${styles.navButton} ${localExpanded ? styles.navItemActive : ''}`}
          aria-expanded={localExpanded}
          onClick={() => setLocalExpanded((v) => !v)}
        >
          <span className={styles.navIcon}>
            <Icon name="graduation-cap" />
          </span>
          <span className={styles.navLabel}>Education &amp; Family</span>
          {localExpanded && <span className={styles.activeDot} aria-hidden="true" />}
        </button>
      )}

      {dropdownOpen && (
        <ul className={styles.subList} role="list">
          {EDUCATION_SUB_ITEMS.map((sub) => {
            const isSubActive = activeGroup === sub.group;
            return (
              <li key={sub.group}>
                <Link
                  href={`/education-family?group=${sub.group}`}
                  className={`${styles.subItem} ${isSubActive ? styles.subItemActive : ''}`}
                  aria-current={isSubActive ? 'page' : undefined}
                >
                  {isSubActive && (
                    <span className={styles.subDot} aria-hidden="true" />
                  )}
                  <span className={styles.subLabel}>{sub.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/** Left-hand navigation shared by every signed-in page. */
export function SidebarNav({
  activeHref,
  activeEducationGroup,
}: {
  activeHref?: string;
  activeEducationGroup?: EducationGroup | null;
}) {
  const isEducationActive = activeHref === '/education-family';

  return (
    <aside className={styles.sidebar}>
      <nav aria-label="Categories" className={styles.navList}>
        {NAV_ITEMS.map((item) => {
          if (item.href === '/education-family') {
            return (
              <EducationNavItem
                key={item.href}
                active={isEducationActive}
                activeGroup={activeEducationGroup ?? null}
              />
            );
          }
          return (
            <NavLink key={item.href} item={item} active={item.href === activeHref} />
          );
        })}
      </nav>
      <hr className={styles.navDivider} />
      <nav aria-label="Support" className={styles.navList}>
        {FOOTER_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} active={item.href === activeHref} />
        ))}
        <SignOutButton />
      </nav>
    </aside>
  );
}

