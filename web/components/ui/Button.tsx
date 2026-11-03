import type { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";

import styles from "./ui.module.css";

/**
 * The three button sizes in the UserFeedback section.
 *
 * block   Submit Feedback (933 x 75, filled)
 * medium  Share Your Feedback (239 x 59) and View plans (204 x 59)
 * small   Edit Profile (138 x 41, outline)
 */
export type ButtonSize = "block" | "medium" | "small";

const SIZE_CLASS: Record<ButtonSize, string> = {
  block: styles.buttonBlock,
  medium: styles.buttonMedium,
  small: styles.buttonSmall,
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: ButtonSize;
};

export function Button({ size = "medium", className, children, ...rest }: ButtonProps) {
  return (
    <button
      type="button"
      className={`${styles.button} ${SIZE_CLASS[size]} ${className ?? ""}`}
      {...rest}
    >
      {children}
    </button>
  );
}

/** Same skin, but a real link -- for navigation rather than an action. */
export function ButtonLink({
  href,
  size = "medium",
  children,
}: {
  href: string;
  size?: ButtonSize;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={`${styles.button} ${SIZE_CLASS[size]}`}>
      {children}
    </Link>
  );
}

