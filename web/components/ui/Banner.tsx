import { Icon } from "@/components/navigation/icons";
import styles from "./ui.module.css";

/**
 * Success-Toast (1147 x 64). Rendered in the page flow above the hero, which
 * is where Feedback_4 puts it -- not floated over the content.
 *
 * The error variant is ours: the design has no failure state, and POST
 * /feedback can return 429 or 503.
 */
export function Banner({
  tone = "success",
  title,
  body,
  onDismiss,
}: {
  tone?: "success" | "error";
  title: string;
  body?: string;
  onDismiss?: () => void;
}) {
  return (
    <div
      className={`${styles.banner} ${tone === "error" ? styles.bannerError : ""}`}
      role={tone === "error" ? "alert" : "status"}
    >
      <span className={styles.bannerBadge} aria-hidden="true">
        <Icon name={tone === "error" ? "x" : "check"} size={14} />
      </span>
      <span className={styles.bannerText}>
        <span className={styles.bannerTitle}>{title}</span>
        {body && <span className={styles.bannerBody}>{body}</span>}
      </span>
      {onDismiss && (
        <button
          type="button"
          className={styles.bannerDismiss}
          onClick={onDismiss}
          aria-label="Dismiss"
        >
          <Icon name="x" size={16} />
        </button>
      )}
    </div>
  );
}

