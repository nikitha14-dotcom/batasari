"use client";

import Link from "next/link";
import AICopilot from "@/components/copilot/AICopilot";
import { AppShell } from "@/components/navigation";
import { Icon, type IconName } from "@/components/navigation/icons";
import styles from "@/components/content/content.module.css";
import { financeStarterQuestions } from "@/lib/copilot/starterQuestions";
import { RequireSession } from "@/lib/supabase/RequireSession";

const FINANCE_CARDS: readonly {
  href: string;
  title: string;
  description: string;
  icon: IconName;
}[] = [
  {
    href: "/finance/banking",
    title: "Banking & Money",
    description: "Set up your banking in Canada and move your money with confidence.",
    icon: "landmark",
  },
  {
    href: "/finance/credit",
    title: "Credit & Borrowing",
    description:
      "Learn about building credit, credit cards, loans, and borrowing options available to newcomers.",
    icon: "wallet-cards",
  },
  {
    href: "/finance/taxes-benefits-pay",
    title: "Taxes, Benefits & Pay",
    description:
      "Explore taxes in Canada, government benefits you may be eligible for, and how to get paid.",
    icon: "file-text",
  },
];

export default function FinancePage() {
  return (
    <RequireSession>
      <AppShell activeHref="/finance">
        <div className="fin-landing-layout">
          <main className="fin-landing-main">
            <div className={styles.page}>
              <div className={styles.hero}>
                <h1 className={styles.heading}>Finance</h1>
              </div>

              <div className="fin-landing-cards">
                {FINANCE_CARDS.map((card) => (
                  <Link key={card.href} href={card.href} className="fin-landing-card">
                    <div className="fin-landing-card-icon">
                      <Icon name={card.icon} size={24} />
                    </div>
                    <div className="fin-landing-card-text">
                      <div className="fin-landing-card-title">{card.title}</div>
                      <div className="fin-landing-card-desc">{card.description}</div>
                    </div>
                    <div className="fin-landing-card-chevron" aria-hidden="true">
                      &#8250;
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </main>

          <aside className="fin-copilot-col">
            <AICopilot
              category="Finance"
              subcategory="General"
              starterQuestions={financeStarterQuestions}
            />
          </aside>
        </div>
      </AppShell>
    </RequireSession>
  );
}

