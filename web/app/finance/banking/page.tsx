"use client";
import { useState } from "react";
import Link from "next/link";
import { RequireSession } from "@/lib/supabase/RequireSession";
import { AppShell } from "@/components/navigation";
import AICopilot from "@/components/copilot/AICopilot";
import { financeStarterQuestions } from "@/lib/copilot/starterQuestions";

interface BankEntry { name: string; href: string; }
interface BankDropdownData { id: string; label: string; note?: string; refLink?: { label: string; href: string }; banks: BankEntry[]; }

const BANK_DROPDOWNS: BankDropdownData[] = [
  { id: "major6", label: "Major 6 banks", banks: [
    { name: "TD Bank", href: "https://www.td.com/ca/en/personal-banking" },
    { name: "RBC", href: "https://www.rbcroyalbank.com/personal.html" },
    { name: "BMO", href: "https://www.bmo.com/en-ca/main/personal/" },
    { name: "CIBC", href: "https://www.cibc.com/en/personal-banking.html" },
    { name: "Scotiabank", href: "https://www.scotiabank.com/ca/en/personal.html" },
    { name: "National Bank", href: "https://www.nbc.ca/" },
  ]},
  { id: "other-cdic", label: "Other CDIC Banks", banks: [
    { name: "Equitable Bank", href: "https://www.equitablebank.ca/" },
    { name: "Manulife Bank", href: "https://www.manulifebank.ca/" },
    { name: "Canadian Tire Bank", href: "https://www.ctfs.com/" },
  ]},
  { id: "online", label: "Online Banks", refLink: { label: "Best online banks in Canada", href: "https://www.nerdwallet.com/ca/p/best/banking/best-online-bank-accounts-in-canada" }, banks: [
    { name: "Neo", href: "https://www.neofinancial.com/" },
    { name: "Tangerine", href: "https://www.tangerine.ca/" },
  ]},
  { id: "credit-unions", label: "Ontario Credit Unions", note: "Member-owned. Most flexible with no credit file", banks: [
    { name: "About Credit Unions", href: "https://ccua.com/about-credit-unions/" },
    { name: "Meridian", href: "https://www.meridiancu.ca/" },
    { name: "DUCA", href: "https://www.duca.com/" },
    { name: "Alterna Savings", href: "https://www.alterna.ca/" },
  ]},
  { id: "country-origin", label: "Country of origin", banks: [
    { name: "Bank of China (Canada)", href: "https://www.bankofchina.com/ca/" },
    { name: "ICICI Bank Canada", href: "https://www.icicibank.ca/" },
    { name: "SBI Canada Bank", href: "https://www.sbicanada.com/" },
    { name: "Shinhan Bank Canada", href: "https://shinhan.ca/" },
    { name: "KEB Hana Bank Canada", href: "https://bank.hanabank.ca/" },
    { name: "CTBC Bank", href: "https://www.ctbcbank.com/ca/" },
    { name: "ICBC (Canada)", href: "https://canada.icbc.com.cn/" },
    { name: "Habib Canadian Bank", href: "https://www.habibcanadian.com/" },
  ]},
];

const INTL_CARDS = [
  { id: "fx", title: "Foreign Exchange",
    icon: (<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#2a7a4b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/></svg>),
    bankLabel: "Example from one of big banks:", learnHref: "https://wise.com/us/blog/currency-exchange-toronto" },
  { id: "wire", title: "International Wire Tr...",
    icon: (<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#2a7a4b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="10" width="18" height="11" rx="1"/><path d="M3 10l9-7 9 7"/><rect x="9" y="15" width="6" height="6"/></svg>),
    bankLabel: "Example from one of big banks:", learnHref: "https://www.canada.ca/en/revenue-agency/services/about-canada-revenue-agency-cra/pay-wire-transfer-non-residents.html" },
  { id: "alt", title: "Alternatives to Banks",
    icon: (<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#2a7a4b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>),
    bankLabel: null, learnHref: "https://wise.com/us/send-money/send-money-to-canada" },
];

const MODAL_ITEMS = [
  { id: "docs", label: "Documents Needed", href: "https://www.canada.ca/en/financial-consumer-agency/services/banking/opening-bank-account.html" },
  { id: "deposit", label: "Minimum Deposit", href: "https://www.canada.ca/en/financial-consumer-agency/services/banking/bank-accounts/low-cost-no-cost.html" },
  { id: "fees", label: "Fees & Transaction Limits", href: "https://www.nerdwallet.com/ca/p/article/banking/bank-fees-and-charges" },
  { id: "newcomer", label: "Newcomer Packages", href: "https://www.canadavisa.com/banking-for-newcomers-in-canada.html" },
  { id: "direct", label: "Direct Deposit", href: "https://www.canada.ca/en/public-services-procurement/services/payments-to-from-government/direct-deposit.html" },
];
// ─── BankDropdown: controlled — open/onToggle from parent ────────────────────
function BankDropdown({ data, open, onToggle }: { data: BankDropdownData; open: boolean; onToggle: () => void }) {
  return (
    <div className="bmm-drop">
      <button className="bmm-drop-btn" onClick={onToggle} aria-expanded={open}>
        <span>{data.label}</span>
        <span className="bmm-drop-arrow" aria-hidden="true">{open ? "˄" : "˅"}</span>
      </button>
      {open && (
        <div className="bmm-drop-body">
          {data.note && <p className="bmm-drop-note">{data.note}</p>}
          {data.refLink && <a href={data.refLink.href} target="_blank" rel="noopener noreferrer" className="bmm-bank-link bmm-bank-link--ref">{data.refLink.label} ›</a>}
          <ul className="bmm-bank-list">
            {data.banks.map(b => (<li key={b.name}><a href={b.href} target="_blank" rel="noopener noreferrer" className="bmm-bank-link">{b.name}</a></li>))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── AccordionRow: controlled — open/onToggle from parent ────────────────────
function AccordionRow({ title, subtitle, chevron, open, onToggle, children }: {
  title: string; subtitle: string; chevron: "up-down" | "right";
  open: boolean; onToggle: () => void; children?: React.ReactNode;
}) {
  return (
    <div className={`bmm-acc-row${open ? " bmm-acc-row--open" : ""}`}>
      <button className="bmm-acc-header" onClick={onToggle} aria-expanded={open}>
        <div className="bmm-acc-header-text">
          <span className="bmm-acc-title">{title}</span>
          <span className="bmm-acc-sub">{subtitle}</span>
        </div>
        <span className="bmm-acc-chevron" aria-hidden="true">
          {chevron === "right" ? "›" : open ? "∧" : "˅"}
        </span>
      </button>
      {open && children && <div className="bmm-acc-body">{children}</div>}
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function OpenAccountModal({ onClose }: { onClose: () => void }) {
  return (
    <>
      <div className="bmm-modal-backdrop" onClick={onClose} aria-hidden="true" />
      <div className="bmm-modal" role="dialog" aria-modal="true" aria-label="Open your first account">
        <button className="bmm-modal-close" onClick={onClose} aria-label="Close">✕</button>
        <p className="bmm-modal-intro"><em>Basic banking needs to get started as a newcomer:</em></p>
        <div className="bmm-modal-list">
          {MODAL_ITEMS.map((item) => (
            <a key={item.id} href={item.href} target="_blank" rel="noopener noreferrer" className="bmm-modal-item">
              <span className="bmm-modal-item-label">{item.label}</span>
              <span className="bmm-modal-item-chevron" aria-hidden="true">›</span>
            </a>
          ))}
        </div>
        <div className="bmm-modal-footer">
          <a href="https://www.canada.ca/en/financial-consumer-agency/services/banking/opening-bank-account.html" target="_blank" rel="noopener noreferrer" className="bmm-modal-explore">Explore more options →</a>
        </div>
      </div>
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
// All accordion + dropdown state lives here so only one item can be open at a time.
// openAccordion: id of the currently open accordion row (null = all closed)
// openBankDrop:  id of the currently open bank dropdown (null = all closed)
// Opening a bank dropdown does NOT close the accordion — they are independent
// within their own group. Opening accordion row 1 closes rows 2/3/4. Opening
// any bank dropdown closes the other bank dropdowns.

function BankingPageContent() {
  const [openAccordion, setOpenAccordion] = useState<string | null>("banks");
  const [openBankDrop, setOpenBankDrop] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  function toggleAccordion(id: string) {
    setOpenAccordion(prev => prev === id ? null : id);
    // When switching accordion rows, close any open bank dropdown
    if (id !== "banks") setOpenBankDrop(null);
  }

  function toggleBankDrop(id: string) {
    setOpenBankDrop(prev => prev === id ? null : id);
  }

  return (
    <AppShell activeHref="/finance">
      <div className="fin-page-layout">
        <div className="fin-page-main">
          <Link href="/finance" className="back-link fin-back-link">
            &lt; Finance
          </Link>
          <h1 className="bmm-heading">Banking and Moving Money:</h1>

          <div className="bmm-acc-list">

            {/* Row 1: Banks vs. Online Banks — open by default */}
            <AccordionRow
              title="Banks vs. Online Banks vs. Credit Unions"
              subtitle="Understand your options from national banks to digital bank accounts and member-owned credit unions."
              chevron="up-down"
              open={openAccordion === "banks"}
              onToggle={() => toggleAccordion("banks")}
            >
              <div className="bmm-bank-grid">
                {BANK_DROPDOWNS.map(dd => (
                  <BankDropdown
                    key={dd.id}
                    data={dd}
                    open={openBankDrop === dd.id}
                    onToggle={() => toggleBankDrop(dd.id)}
                  />
                ))}
              </div>
            </AccordionRow>

            {/* Row 2: Chequing vs. Savings */}
            <AccordionRow
              title="Chequing vs. Savings Accounts"
              subtitle="Use chequing accounts for daily transactions and savings accounts to earn interest on your funds safely."
              chevron="up-down"
              open={openAccordion === "chequing"}
              onToggle={() => toggleAccordion("chequing")}
            >
              <div className="bmm-detail">
                <p className="bmm-detail-intro">Understand the difference and when to use each type of account.</p>
                <div className="bmm-detail-row">
                  <div><div className="bmm-detail-title">Chequing account</div><div className="bmm-detail-ex">Example from one of the big banks</div></div>
                  <a href="https://www.td.com/ca/en/personal-banking/products/bank-accounts/chequing-accounts" target="_blank" rel="noopener noreferrer" className="bmm-detail-link">TD Chequing ›</a>
                </div>
                <div className="bmm-detail-row">
                  <div><div className="bmm-detail-title">Savings Account</div><div className="bmm-detail-ex">Example from one of the big banks</div></div>
                  <a href="https://www.td.com/ca/en/personal-banking/products/bank-accounts/savings-accounts" target="_blank" rel="noopener noreferrer" className="bmm-detail-link">TD Savings ›</a>
                </div>
              </div>
            </AccordionRow>

            {/* Row 3: How to Choose a Bank */}
            <AccordionRow
              title="How to Choose a Bank"
              subtitle="Evaluate key parameters like branch access, fees, international transfer availability, and newcomer perks."
              chevron="right"
              open={openAccordion === "choose"}
              onToggle={() => toggleAccordion("choose")}
            >
              <div className="bmm-detail">
                <a href="https://www.nerdwallet.com/ca/p/best/banking/best-banks-for-newcomers" target="_blank" rel="noopener noreferrer" className="bmm-detail-link">Best Banks for Newcomers — NerdWallet ›</a>
              </div>
            </AccordionRow>

            {/* Row 4: Deposit Protection / CDIC */}
            <AccordionRow
              title="Deposit Protection / CDIC"
              subtitle="Learn how your eligible deposits are protected up to $100,000 per insured category through federal insurance."
              chevron="right"
              open={openAccordion === "cdic"}
              onToggle={() => toggleAccordion("cdic")}
            >
              <div className="bmm-detail">
                <a href="https://www.canada.ca/en/financial-consumer-agency/services/banking/deposit-insurance.html" target="_blank" rel="noopener noreferrer" className="bmm-detail-link">Deposit Insurance — Government of Canada ›</a>
              </div>
            </AccordionRow>

          </div>

          <button className="bmm-cta-btn" onClick={() => setModalOpen(true)}>
            Open Your First Account
          </button>

          {modalOpen && <OpenAccountModal onClose={() => setModalOpen(false)} />}

          <h2 className="bmm-intl-heading">Move Money Internationally</h2>

          <div className="bmm-intl-grid">
            {INTL_CARDS.map(card => (
              <div key={card.id} className="bmm-intl-card">
                <div className="bmm-intl-card-top">
                  <div className="bmm-intl-icon">{card.icon}</div>
                  <span className="bmm-intl-title">{card.title}</span>
                </div>
                {card.bankLabel && <div className="bmm-intl-bank">{card.bankLabel}</div>}
                <a href={card.learnHref} target="_blank" rel="noopener noreferrer" className="bmm-intl-learn">Learn more →</a>
              </div>
            ))}
          </div>

        </div>
        <aside className="fin-copilot-col">
          <AICopilot
  category="Finance"
  subcategory="Banking & Moving Money"
  starterQuestions={financeStarterQuestions}
/>
        </aside>
      </div>
    </AppShell>
  );
}

export default function BankingPage() {
  return (
    <RequireSession>
      <BankingPageContent />
    </RequireSession>
  );
}

