import Link from "next/link";

export default function Week2Nav() {
  return (
    <nav className="week2-nav">
      <Link href="/categories" className="week2-back-link">
        ← Back to Categories
      </Link>

      <Link href="/profile" className="week2-profile-link">
        My Profile
      </Link>
    </nav>
  );
}
