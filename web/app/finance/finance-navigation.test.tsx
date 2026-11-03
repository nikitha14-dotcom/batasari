import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));
vi.mock('@/lib/supabase/RequireSession', () => ({
  RequireSession: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('@/components/copilot/AICopilot', () => ({
  default: () => <div data-testid="copilot" />,
}));
vi.mock('./taxes-benefits-pay/content', () => ({
  BENEFIT_KEYS: [],
  PAY_KEYS: [],
  TAX_KEYS: [],
  descriptionParagraphs: () => [],
  sectionsForKeys: () => [],
  useTaxesBenefitsPayContent: () => ({ status: 'loading' }),
}));

import BankingPage from './banking/page';
import BorrowPage from './credit/borrow/page';
import BuildCreditPage from './credit/build/page';
import CreditPage from './credit/page';
import UnderstandCreditPage from './credit/understand/page';
import TaxesBenefitsPayPage from './taxes-benefits-pay/page';
import PayPage from './taxes-benefits-pay/pay/page';
import TaxesPage from './taxes-benefits-pay/taxes/page';

describe('Finance subsection navigation', () => {
  afterEach(() => cleanup());

  it.each([
    ['Banking and Moving Money:', BankingPage],
    ['Credit & Borrowing', CreditPage],
    ['Taxes, Benefits & Pay', TaxesBenefitsPayPage],
  ])('%s returns to the Finance landing page', (heading, Page) => {
    render(<Page />);
    expect(screen.getByRole('heading', { level: 1, name: heading })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '< Finance' })).toHaveAttribute('href', '/finance');
  });

  it.each([
    ['Understand credit in Canada', UnderstandCreditPage],
    ['Build your credit as a newcomer', BuildCreditPage],
    ['Borrow with confidence', BorrowPage],
  ])('%s returns to Credit & Borrowing', (heading, Page) => {
    render(<Page />);
    expect(screen.getByRole('heading', { level: 1, name: heading })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '< Credit & Borrowing' })).toHaveAttribute(
      'href',
      '/finance/credit',
    );
  });

  it.each([
    ['Understand taxes in Canada', TaxesPage],
    ['Understand your pay', PayPage],
  ])('%s returns to Taxes, Benefits & Pay', (heading, Page) => {
    render(<Page />);
    expect(screen.getByRole('heading', { level: 1, name: heading })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '< Taxes, Benefits & Pay' })).toHaveAttribute(
      'href',
      '/finance/taxes-benefits-pay',
    );
  });
});

