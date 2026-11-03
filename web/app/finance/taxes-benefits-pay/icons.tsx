import { IconTile } from '../credit/icons';

const STROKE = '#4C4C4C';

function FinanceIcon({ children }: { children: React.ReactNode }) {
  return (
    <IconTile>
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke={STROKE}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {children}
      </svg>
    </IconTile>
  );
}

export function TaxesIcon() {
  return (
    <FinanceIcon>
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="13" y2="17" />
    </FinanceIcon>
  );
}

export function BenefitsIcon() {
  return (
    <FinanceIcon>
      <path d="M20 12v8a2 2 0 01-2 2H6a2 2 0 01-2-2v-8" />
      <path d="M2 7h20v5H2z" />
      <path d="M12 22V7" />
      <path d="M12 7H8.5a2.5 2.5 0 110-5C11 2 12 7 12 7z" />
      <path d="M12 7h3.5a2.5 2.5 0 100-5C13 2 12 7 12 7z" />
    </FinanceIcon>
  );
}

export function PayIcon() {
  return (
    <FinanceIcon>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="7" y1="15" x2="11" y2="15" />
    </FinanceIcon>
  );
}

export function SinIcon() {
  return (
    <FinanceIcon>
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="14" y2="17" />
    </FinanceIcon>
  );
}

export function IncomeTaxIcon() {
  return (
    <FinanceIcon>
      <line x1="12" y1="2" x2="12" y2="22" />
      <path d="M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 110 7H6" />
    </FinanceIcon>
  );
}

export function ResidencyIcon() {
  return (
    <FinanceIcon>
      <circle cx="12" cy="8" r="4" />
      <path d="M5 22v-2a7 7 0 0114 0v2" />
    </FinanceIcon>
  );
}

export function PayStubIcon() {
  return (
    <FinanceIcon>
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="16" y2="17" />
    </FinanceIcon>
  );
}

export function DeductionsIcon() {
  return (
    <FinanceIcon>
      <path d="M3 12h18" />
      <path d="M12 3v18" />
      <circle cx="12" cy="12" r="9" />
    </FinanceIcon>
  );
}

