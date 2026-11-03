import type { ReactNode } from "react";

import styles from "./ui.module.css";

/**
 * The two 1147 x 122 blocks on profile-overview: "We'd love to hear from
 * you!" and "Moving Assistant 3-days free trial". Same shape, different copy
 * and action, so one component.
 */
export function PromoCard({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className={styles.promo}>
      <span className={styles.promoText}>
        <span className={styles.promoTitle}>{title}</span>
        <span className={styles.promoBody}>{body}</span>
      </span>
      {action}
    </div>
  );
}

