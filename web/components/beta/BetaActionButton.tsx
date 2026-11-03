import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './beta.module.css';

export function BetaActionButton({
  children,
  variant = 'secondary',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: 'secondary' | 'primary';
}) {
  return (
    <button className={variant === 'primary' ? styles.primary : styles.action} {...props}>
      {children}
    </button>
  );
}

