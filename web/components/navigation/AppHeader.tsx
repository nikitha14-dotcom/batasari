"use client";

import Link from "next/link";

import { Icon } from "./icons";
import styles from "./navigation.module.css";
import { useHeaderProfile } from "./useHeaderProfile";

/** Full-width top bar shared by every signed-in page (Figma: TopBar). */
export function AppHeader() {
  const { name, subtitle } = useHeaderProfile();

  return (
    <header className={styles.header}>
      <Link href="/categories" className={styles.wordmark} aria-label="Batasari home">
        <span className={styles.wordmarkBold}>Batasari</span>
      </Link>

      <div className={styles.headerRight}>
        <span className={styles.location}>
          <Icon name="map-pin" size={20} />
          India
        </span>
        <span className={styles.divider} aria-hidden="true" />
        <Link href="/profile" className={styles.profileCard} aria-label="Your profile">
          <span className={styles.profileIcon}>
            <Icon name="user-round" size={28} />
          </span>
          <span className={styles.profileText}>
            <span className={styles.profileName}>{name ?? "Profile"}</span>
            {subtitle && <span className={styles.profileSub}>{subtitle}</span>}
          </span>
        </Link>
      </div>
    </header>
  );
}

