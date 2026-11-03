import type { ReactNode } from "react";

import styles from "./ui.module.css";

/** Hero-Text / Hero-Header: title, optional subtitle, optional right action. */
export function PageHero({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  const heading = (
    <div className={styles.hero}>
      <h1 className={styles.heroTitle}>{title}</h1>
      {subtitle && <p className={styles.heroSubtitle}>{subtitle}</p>}
    </div>
  );

  if (!action) return heading;

  return (
    <div className={styles.heroRow}>
      {heading}
      {action}
    </div>
  );
}

