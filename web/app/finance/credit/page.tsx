"use client";

import Link from "next/link";
import { RequireSession } from "@/lib/supabase/RequireSession";
import { AppShell } from "@/components/navigation";
import AICopilot from "@/components/copilot/AICopilot";
import { UnderstandIcon, BuildIcon, BorrowIcon } from "./icons";

const SECTIONS = [
  {
    href: "/finance/credit/understand",
    title: "Understand credit in Canada",
    subtitle: "Learn how credit works and what affects your credit score.",
    icon: <UnderstandIcon />,
  },
  {
    href: "/finance/credit/build",
    title: "Build your credit as a newcomer",
    subtitle: "Discover practical ways to start building credit as a newcomer.",
    icon: <BuildIcon />,
  },
  {
    href: "/finance/credit/borrow",
    title: "Borrow with confidence",
    subtitle: "Explore borrowing options and understand what to consider before you borrow.",
    icon: <BorrowIcon />,
  },
];

function CreditPageContent() {
  return (
    <AppShell activeHref="/finance">
      <div className="fin-page-layout">
        <div className="fin-page-main">
          <Link href="/finance" className="back-link fin-back-link">
            &lt; Finance
          </Link>
          <h1 className="bmm-heading">Credit &amp; Borrowing</h1>
          <p className="bmm-acc-sub" style={{ marginBottom: "24px" }}>
            Understand credit, build your history, and make informed borrowing decisions.
          </p>

          {/* Three navigation rows — each opens a new page */}
          <div className="bmm-acc-list" style={{ marginBottom: "24px" }}>
            {SECTIONS.map((s) => (
              <Link key={s.href} href={s.href} className="bmm-acc-row" style={{ display: "block", textDecoration: "none" }}>
                <div className="bmm-acc-header" style={{ pointerEvents: "none" }}>
                  {s.icon}
                  <div className="bmm-acc-header-text">
                    <span className="bmm-acc-title">{s.title}</span>
                    <span className="bmm-acc-sub">{s.subtitle}</span>
                  </div>
                  <span className="bmm-acc-chevron" aria-hidden="true">›</span>
                </div>
              </Link>
            ))}
          </div>

          {/* Why this matters */}
          <div style={{ padding: "14px 18px", borderRadius: "12px", border: "1px solid #bbf7d0", background: "#f0fdf4", color: "#14532d", fontSize: "13px", lineHeight: "1.6" }}>
            <strong>Why this matters: </strong>
            Your credit score affects renting an apartment, financing a car, getting a phone plan, and qualifying for a mortgage — and it starts from zero when you arrive in Canada.
          </div>
        </div>

        <aside className="fin-copilot-col">
          <AICopilot category="Finance" subcategory="Credit & Borrowing" />
        </aside>
      </div>
    </AppShell>
  );
}

export default function CreditPage() {
  return (
    <RequireSession>
      <CreditPageContent />
    </RequireSession>
  );
}

