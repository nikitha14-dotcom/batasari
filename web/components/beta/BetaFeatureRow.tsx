import type { ReactNode } from 'react';
import styles from './beta.module.css';

export function BetaFeatureRow({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className={styles.featureRow}>
      <span className={styles.featureIcon} aria-hidden="true">
        {icon}
      </span>
      <span>
        <strong>{title}</strong>
        <small>{children}</small>
      </span>
    </div>
  );
}

