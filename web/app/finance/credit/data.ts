// Shared data for Credit & Borrowing sub-pages
// Do not import this in banking/page.tsx or any other non-credit file.

export interface LinkItem { label: string; href: string; }
export interface SubItem { id: string; title: string; subtitle?: string; links: LinkItem[]; }

export const UNDERSTAND_ITEMS: SubItem[] = [
  {
    id: "score-vs-report",
    title: "Credit score vs. Credit report",
    subtitle: "The difference between your score and your report, and who can see them.",
    links: [{ label: "Credit Report & Score Basics — Canada.ca", href: "https://www.canada.ca/en/financial-consumer-agency/services/credit-reports-score/credit-report-score-basics.html" }],
  },
  {
    id: "bureaus",
    title: "How credit bureaus work",
    subtitle: "Equifax and TransUnion track your borrowing history — here'\''s what they record.",
    links: [
      { label: "Credit Reports & Scores Overview — Canada.ca", href: "https://www.canada.ca/en/financial-consumer-agency/services/credit-reports-score.html" },
      { label: "What is a Credit Bureau? — Equifax", href: "https://www.equifax.ca/personal/education/credit-report/articles/-/learn/what-is-a-credit-bureau/" },
      { label: "TransUnion Canada", href: "https://www.transunion.ca/" },
    ],
  },
  {
    id: "affects-score",
    title: "What affects your score",
    subtitle: "Payment history, credit used, and account age all shape your number.",
    links: [
      { label: "How to Improve Your Credit Score — Canada.ca", href: "https://www.canada.ca/en/financial-consumer-agency/services/credit-reports-score/improve-credit-score.html" },
      { label: "What Impacts Your Credit Score — Equifax", href: "https://www.equifax.ca/personal/education/credit-score/articles/-/learn/what-impacts-credit-score/" },
      { label: "What Affects Your Credit Score — TransUnion", href: "https://www.transunion.ca/what-affect-credit-score" },
    ],
  },
  {
    id: "secured-unsecured",
    title: "Secured vs. unsecured cards",
    subtitle: "Compare card types and which fits your situation as a newcomer.",
    links: [
      { label: "Choosing a Credit Card — Canada.ca", href: "https://www.canada.ca/en/financial-consumer-agency/services/credit-cards/choose-credit-card.html" },
      { label: "How Credit Cards Work — Canada.ca", href: "https://www.canada.ca/en/financial-consumer-agency/services/credit-cards/credit-card-work.html" },
    ],
  },
];

export const BUILD_ITEMS: SubItem[] = [
  {
    id: "newcomer-programs",
    title: "Newcomer credit card programs",
    subtitle: undefined,
    links: [
      { label: "RBC New to Canada", href: "https://www.rbcroyalbank.com/new-to-canada/" },
      { label: "TD New to Canada", href: "https://www.td.com/ca/en/personal-banking/solutions/new-to-canada" },
      { label: "Scotiabank StartRight", href: "https://startright.scotiabank.com/ca/en.html" },
      { label: "CIBC New to Canada", href: "https://www.cibc.com/en/journeys/new-to-canada.html" },
      { label: "BMO Newcomers", href: "https://www.bmo.com/en-ca/main/personal/newcomers-to-canada/" },
    ],
  },
  { id: "no-history", title: "No credit history? Your options", subtitle: undefined, links: [{ label: "Building Credit History in Canada — RBC", href: "https://www.rbcroyalbank.com/new-to-canada/just-arrived/building-a-credit-history-in-canada/" }] },
  { id: "cosigners", title: "Co-signers & guarantors", subtitle: undefined, links: [{ label: "What to Know Before Co-Signing a Loan — FCNB", href: "https://fcnb.ca/en/consumer-resources/what-you-should-know-before-co-signing-a-loan" }] },
  { id: "builder-loans", title: "Credit builder loans", subtitle: undefined, links: [{ label: "Rights on Personal Loans — Canada.ca", href: "https://www.canada.ca/en/financial-consumer-agency/services/rights-responsibilities/rights-credit-loans/rights-personal-loans.html" }] },
  { id: "rent-reporting", title: "Reporting rent payments", subtitle: undefined, links: [{ label: "Equifax Rent Reporting Program", href: "https://www.equifax.ca/about-equifax/newsroom/-/intlpress/equifax-canada-is-committed-to-helping-canadians-benefit-from-paying-their-rent/" }] },
  { id: "common-mistakes", title: "Common mistakes to avoid", subtitle: undefined, links: [{ label: "How to Check Your Credit Report for Errors — Canada.ca", href: "https://www.canada.ca/en/financial-consumer-agency/services/credit-reports-score/check-errors.html" }] },
];

export const BORROW_ITEMS: SubItem[] = [
  { id: "personal-loans", title: "Personal loans", subtitle: "How instalment loans work, typical rates, and when to use one.", links: [{ label: "Rights on Personal Loans — Canada.ca", href: "https://www.canada.ca/en/financial-consumer-agency/services/rights-responsibilities/rights-credit-loans/rights-personal-loans.html" }] },
  { id: "lines-of-credit", title: "Lines of credit", subtitle: "Flexible borrowing you can draw on and repay as needed.", links: [{ label: "Loans & Lines of Credit — Canada.ca", href: "https://www.canada.ca/en/financial-consumer-agency/services/loans/loans-lines-credit.html" }] },
  { id: "auto-loans", title: "Auto loans and Financing", subtitle: "What lenders look for and how down payments affect your rate.", links: [{ label: "Buying a Vehicle — OMVIC", href: "https://www.omvic.ca/buying/" }, { label: "Buying a New or Used Vehicle: Your Rights — Ontario.ca", href: "https://www.ontario.ca/page/buying-new-or-used-vehicle-your-rights" }] },
];
