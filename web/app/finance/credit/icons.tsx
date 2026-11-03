/**
 * Icons for the Finance - Credit & Borrowing section.
 * Each icon is a 24x24 stroke SVG matching the screenshots.
 * Rendered inside an icon tile: 40x40 light-green rounded square.
 */

// Reusable tile wrapper — matches content.module.css .accordionIcon dimensions
export function IconTile({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ display: "flex", flexShrink: 0, alignItems: "center", justifyContent: "center", width: 40, height: 40, borderRadius: 8, background: "#d1edd8" }} aria-hidden="true">
      {children}
    </span>
  );
}

const S = "#4C4C4C"; // stroke colour matching Work icons

// Credit score vs. credit report — document with star/badge
export function CreditScoreIcon() {
  return (
    <IconTile>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={S} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
    </IconTile>
  );
}

// How credit bureaus work — magnifying glass / search
export function BureausIcon() {
  return (
    <IconTile>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={S} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/>
        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    </IconTile>
  );
}

// What affects your score — bar chart
export function ScoreFactorsIcon() {
  return (
    <IconTile>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={S} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
        <line x1="2" y1="20" x2="22" y2="20"/>
      </svg>
    </IconTile>
  );
}

// Secured vs. unsecured cards — credit card
export function CardIcon() {
  return (
    <IconTile>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={S} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
        <line x1="1" y1="10" x2="23" y2="10"/>
      </svg>
    </IconTile>
  );
}

// Newcomer credit card programs — wallet / card stack
export function NewcomerIcon() {
  return (
    <IconTile>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={S} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2"/>
        <line x1="1" y1="10" x2="23" y2="10"/>
        <line x1="5" y1="15" x2="9" y2="15"/>
      </svg>
    </IconTile>
  );
}

// No credit history — person / circle with question
export function NoCreditIcon() {
  return (
    <IconTile>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={S} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4"/>
        <path d="M6 20v-2a6 6 0 0112 0v2"/>
      </svg>
    </IconTile>
  );
}

// Co-signers & guarantors — people / group
export function CosignersIcon() {
  return (
    <IconTile>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={S} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 00-3-3.87"/>
        <path d="M16 3.13a4 4 0 010 7.75"/>
      </svg>
    </IconTile>
  );
}

// Credit builder loans — refresh / cycle
export function BuilderLoanIcon() {
  return (
    <IconTile>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={S} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 4 23 10 17 10"/>
        <polyline points="1 20 1 14 7 14"/>
        <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
      </svg>
    </IconTile>
  );
}

// Reporting rent payments — house
export function RentIcon() {
  return (
    <IconTile>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={S} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    </IconTile>
  );
}

// Common mistakes to avoid — checklist / tick on document
export function MistakesIcon() {
  return (
    <IconTile>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={S} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <polyline points="9 15 11 17 15 13"/>
      </svg>
    </IconTile>
  );
}

// Personal loans — dollar sign
export function PersonalLoanIcon() {
  return (
    <IconTile>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={S} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23"/>
        <path d="M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 110 7H6"/>
      </svg>
    </IconTile>
  );
}

// Lines of credit — two-way arrows / swap
export function LineOfCreditIcon() {
  return (
    <IconTile>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={S} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="17 1 21 5 17 9"/>
        <path d="M3 11V9a4 4 0 014-4h14"/>
        <polyline points="7 23 3 19 7 15"/>
        <path d="M21 13v2a4 4 0 01-4 4H3"/>
      </svg>
    </IconTile>
  );
}

// Auto loans — car
export function AutoLoanIcon() {
  return (
    <IconTile>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={S} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 17H3v-5l2-5h14l2 5v5h-2"/>
        <circle cx="7.5" cy="17.5" r="1.5"/>
        <circle cx="16.5" cy="17.5" r="1.5"/>
        <path d="M5 12h14"/>
      </svg>
    </IconTile>
  );
}

// Section-level icons for the landing page rows
// Understand credit — graduation cap / book
export function UnderstandIcon() {
  return (
    <IconTile>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={S} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/>
        <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/>
      </svg>
    </IconTile>
  );
}

// Build credit — seedling / upward arrow with person
export function BuildIcon() {
  return (
    <IconTile>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={S} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
        <polyline points="17 6 23 6 23 12"/>
      </svg>
    </IconTile>
  );
}

// Borrow with confidence — shield / protection
export function BorrowIcon() {
  return (
    <IconTile>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={S} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    </IconTile>
  );
}

