import Link from "next/link";

import styles from "../auth.module.css";

/** Top-bar "Login" button on the auth screens. */
export function LoginLink() {
  return (
    <Link href="/login" className={styles.loginButton}>
      Login
    </Link>
  );
}

