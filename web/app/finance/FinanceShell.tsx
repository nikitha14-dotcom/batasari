"use client";

import Link from "next/link";

const NAV_ITEMS = [
  { label: "Housing",            href: "/housing" },
  { label: "Finance",            href: "/finance" },
  { label: "Daily Needs",        href: "#" },
  { label: "Health",             href: "#" },
  { label: "Work",               href: "/work" },
  { label: "Immigration",        href: "#" },
  { label: "Education & Family", href: "/education-family" },
  { label: "The City",           href: "#" },
  { label: "Moving & Shipping",  href: "#" },
  { label: "Checklist",          href: "#" },
];

interface FinanceShellProps {
  children: React.ReactNode;
}

export default function FinanceShell({ children }: FinanceShellProps) {
  return (
    <div className="moving-app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">M</div>
          <div>
            <div className="brand-title">Moving</div>
            <div className="brand-title">Assistant</div>
          </div>
        </div>
        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`nav-item${item.label === "Finance" ? " active" : ""}`}
            >
              <span className="nav-icon">○</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      <main className="housing-main">
        <header className="top-header">
          <div>
            <span className="location-dot">●</span>
            India
          </div>
          <div className="profile">
            <div className="profile-avatar">N</div>
            <span>Profile</span>
          </div>
        </header>
        <div className="housing-content">
          {children}
        </div>
      </main>
    </div>
  );
}

