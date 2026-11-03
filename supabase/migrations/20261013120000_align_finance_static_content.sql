-- Replace Finance content with the approved source copy.
-- Cost of Living & Budgeting is intentionally excluded from the MVP.

do $migration$
begin

delete from public.static_content
where category = 'Finance';

-- Preserve existing source rows while replacing three retired bank URLs.
update public.trusted_sources
set url = 'https://shinhan.ca/'
where name = 'Shinhan Bank Canada'
  and url = 'https://www.shinhancanada.com/';

update public.trusted_sources
set url = 'https://bank.hanabank.ca/'
where name = 'KEB Hana Bank Canada'
  and url = 'https://www.kebhanacanada.com/';

update public.trusted_sources
set url = 'https://canada.icbc.com.cn/'
where name = 'ICBC Canada'
  and url = 'https://www.icbc.com.cn/ICBC/%E6%B5%B7%E5%A4%96%E5%88%86%E8%A1%8C/%E5%8A%A0%E6%8B%BF%E5%A4%A7/';

insert into public.trusted_sources (name, url, authority_tier, jurisdiction)
select v.name, v.url, v.authority_tier, v.jurisdiction
from (values
  ('TD Bank', 'https://www.td.com/ca/en/personal-banking', 'C', 'Canada'),
  ('RBC', 'https://www.rbcroyalbank.com/personal.html', 'C', 'Canada'),
  ('National Bank', 'https://www.nbc.ca/', 'C', 'Canada'),
  ('BMO', 'https://www.bmo.com/en-ca/main/personal/', 'C', 'Canada'),
  ('CIBC', 'https://www.cibc.com/en/personal-banking.html', 'C', 'Canada'),
  ('Scotia Bank', 'https://www.scotiabank.com/ca/en/personal.html', 'C', 'Canada'),
  ('Equitable Bank', 'https://www.equitablebank.ca/', 'C', 'Canada'),
  ('Manulife Bank', 'https://www.manulifebank.ca/', 'C', 'Canada'),
  ('Canadian Tire Bank', 'https://www.ctfs.com/', 'C', 'Canada'),
  ('Neo', 'https://www.neofinancial.com/', 'C', 'Canada'),
  ('Tangerine', 'https://www.tangerine.ca/', 'C', 'Canada'),
  ('Best Online Bank Accounts in Canada', 'https://www.nerdwallet.com/ca/p/best/banking/best-online-bank-accounts-in-canada', 'C', 'Canada'),
  ('About Credit Unions', 'https://ccua.com/about-credit-unions/', 'C', 'Canada'),
  ('Meridian', 'https://www.meridiancu.ca/', 'C', 'Ontario'),
  ('DUCA', 'https://www.duca.com/', 'C', 'Ontario'),
  ('Alterna Savings', 'https://www.alterna.ca/', 'C', 'Ontario'),
  ('Bank of China (Canada)', 'https://www.bankofchina.com/ca/', 'C', 'Canada'),
  ('ICICI Bank Canada', 'https://www.icicibank.ca/', 'C', 'Canada'),
  ('SBI Canada Bank', 'https://www.sbicanada.com/', 'C', 'Canada'),
  ('Shinhan Bank Canada', 'https://shinhan.ca/', 'C', 'Canada'),
  ('KEB Hana Bank Canada', 'https://bank.hanabank.ca/', 'C', 'Canada'),
  ('CTBC Bank', 'https://www.ctbcbank.com/ca/', 'C', 'Canada'),
  ('ICBC Canada', 'https://canada.icbc.com.cn/', 'C', 'Canada'),
  ('Habib Canadian Bank', 'https://www.habibcanadian.com/', 'C', 'Canada'),
  ('Checking Account', 'https://www.canada.ca/en/financial-consumer-agency/services/banking/bank-accounts/chequing-accounts.html', 'A', 'Canada'),
  ('Checking Account Example', 'https://www.td.com/ca/en/personal-banking/products/bank-accounts/chequing-accounts', 'C', 'Canada'),
  ('Savings Account', 'https://www.canada.ca/en/financial-consumer-agency/services/banking/bank-accounts/savings-account.html', 'A', 'Canada'),
  ('Savings Account Example', 'https://www.td.com/ca/en/personal-banking/products/bank-accounts/savings-accounts', 'C', 'Canada'),
  ('Best Banks for Newcomers', 'https://www.nerdwallet.com/ca/p/best/banking/best-banks-for-newcomers', 'C', 'Canada'),
  ('Deposit Insurance', 'https://www.canada.ca/en/financial-consumer-agency/services/banking/deposit-insurance.html', 'A', 'Canada'),
  ('What documents do you need', 'https://www.canada.ca/en/financial-consumer-agency/services/banking/opening-bank-account.html', 'A', 'Canada'),
  ('Minimum Deposit', 'https://www.canada.ca/en/financial-consumer-agency/services/banking/bank-accounts/low-cost-no-cost.html', 'A', 'Canada'),
  ('Fees and Transactions', 'https://www.nerdwallet.com/ca/p/article/banking/bank-fees-and-charges', 'C', 'Canada'),
  ('Newcomers packages', 'https://www.canadavisa.com/banking-for-newcomers-in-canada.html', 'C', 'Canada'),
  ('Debit Card', 'https://www.canada.ca/en/financial-consumer-agency/services/banking/using-debit.html', 'A', 'Canada'),
  ('Direct Deposit', 'https://www.canada.ca/en/public-services-procurement/services/payments-to-from-government/direct-deposit.html', 'A', 'Canada'),
  ('Foreign Exchange', 'https://wise.com/us/blog/currency-exchange-toronto', 'C', 'International'),
  ('Foreign Exchange Example', 'https://www.td.com/ca/en/personal-banking/solutions/currency-exchange-services', 'C', 'Canada'),
  ('Alternatives to banks', 'https://wise.com/us/send-money/send-money-to-canada', 'C', 'International'),
  ('International Wire Transfers', 'https://www.canada.ca/en/revenue-agency/services/about-canada-revenue-agency-cra/pay-wire-transfer-non-residents.html', 'A', 'Canada'),
  ('International Wire Transfer Example', 'https://www.td.com/ca/en/personal-banking/ways-to-bank/ways-to-send/international-money-transfer/td-global-transfer/international-bank-transfer', 'C', 'Canada'),
  ('Credit score vs. Credit report', 'https://www.canada.ca/en/financial-consumer-agency/services/credit-reports-score/credit-report-score-basics.html', 'A', 'Canada'),
  ('How credit bureaus work', 'https://www.canada.ca/en/financial-consumer-agency/services/credit-reports-score.html', 'A', 'Canada'),
  ('Equifax', 'https://www.equifax.ca/personal/education/credit-report/articles/-/learn/what-is-a-credit-bureau/', 'C', 'Canada'),
  ('TransUnion', 'https://www.transunion.ca/', 'C', 'Canada'),
  ('What affects your score', 'https://www.canada.ca/en/financial-consumer-agency/services/credit-reports-score/improve-credit-score.html', 'A', 'Canada'),
  ('Equifax credit score', 'https://www.equifax.ca/personal/education/credit-score/articles/-/learn/what-impacts-credit-score/', 'C', 'Canada'),
  ('TransUnion credit score', 'https://www.transunion.ca/what-affect-credit-score', 'C', 'Canada'),
  ('Secured vs. unsecured cards', 'https://www.canada.ca/en/financial-consumer-agency/services/credit-cards/choose-credit-card.html', 'A', 'Canada'),
  ('How credit cards work', 'https://www.canada.ca/en/financial-consumer-agency/services/credit-cards/credit-card-work.html', 'A', 'Canada'),
  ('RBC newcomer credit card program', 'https://www.rbcroyalbank.com/new-to-canada/', 'C', 'Canada'),
  ('TD newcomer credit card program', 'https://www.td.com/ca/en/personal-banking/solutions/new-to-canada', 'C', 'Canada'),
  ('Scotiabank newcomer credit card program', 'https://startright.scotiabank.com/ca/en.html', 'C', 'Canada'),
  ('CIBC newcomer credit card program', 'https://www.cibc.com/en/journeys/new-to-canada.html', 'C', 'Canada'),
  ('BMO newcomer credit card program', 'https://www.bmo.com/en-ca/main/personal/newcomers-to-canada/', 'C', 'Canada'),
  ('No credit history? Your options', 'https://www.rbcroyalbank.com/new-to-canada/just-arrived/building-a-credit-history-in-canada/', 'C', 'Canada'),
  ('Credit Builder Loans', 'https://www.canada.ca/en/financial-consumer-agency/services/rights-responsibilities/rights-credit-loans/rights-personal-loans.html', 'A', 'Canada'),
  ('Co-signers & guarantors', 'https://fcnb.ca/en/consumer-resources/what-you-should-know-before-co-signing-a-loan', 'A', 'New Brunswick'),
  ('Reporting rent payments', 'https://www.equifax.ca/about-equifax/newsroom/-/intlpress/equifax-canada-is-committed-to-helping-canadians-benefit-from-paying-their-rent/', 'C', 'Canada'),
  ('Common mistakes to avoid', 'https://www.canada.ca/en/financial-consumer-agency/services/credit-reports-score/check-errors.html', 'A', 'Canada'),
  ('Personal loans', 'https://www.canada.ca/en/financial-consumer-agency/services/rights-responsibilities/rights-credit-loans/rights-personal-loans.html', 'A', 'Canada'),
  ('Line of credit', 'https://www.canada.ca/en/financial-consumer-agency/services/loans/loans-lines-credit.html', 'A', 'Canada'),
  ('Auto loan & financing', 'https://www.omvic.ca/buying/', 'A', 'Ontario'),
  ('Ontario vehicle-buying rights', 'https://www.ontario.ca/page/buying-new-or-used-vehicle-your-rights', 'A', 'Ontario'),
  ('Canada SIN application', 'https://www.canada.ca/en/employment-social-development/services/sin/apply.html', 'A', 'Canada'),
  ('CRA newcomers', 'https://www.canada.ca/en/revenue-agency/services/tax/international-non-residents/individuals-leaving-entering-canada-non-residents/newcomers-canada-immigrants.html', 'A', 'Canada'),
  ('CRA Groceries and Essentials Benefit', 'https://www.canada.ca/en/revenue-agency/services/child-family-benefits/canada-groceries-essentials-benefit.html', 'A', 'Canada'),
  ('CRA Canada Child Benefit', 'https://www.canada.ca/en/revenue-agency/services/child-family-benefits/canada-child-benefit.html', 'A', 'Canada'),
  ('Ontario Trillium Benefit', 'https://www.ontario.ca/page/ontario-trillium-benefit', 'A', 'Ontario'),
  ('CRA child and family benefits', 'https://www.canada.ca/en/revenue-agency/services/child-family-benefits.html', 'A', 'Canada'),
  ('Ontario Employment Standards guide', 'https://www.ontario.ca/document/your-guide-employment-standards-act-0', 'A', 'Ontario'),
  ('CRA payroll deductions', 'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/payroll/payroll-deductions-contributions.html', 'A', 'Canada')
) as v(name, url, authority_tier, jurisdiction)
where not exists (
  select 1
  from public.trusted_sources t
  where t.url = v.url
);

insert into public.static_content (
  category, subcategory, section_key, title, body_markdown, source_id, display_order
)
select
  'Finance',
  v.subcategory,
  v.section_key,
  v.title,
  v.body_markdown,
  case when v.source_name is null then null else (
    select t.id
    from public.trusted_sources t
    where t.url = v.source_url
    order by t.created_at
    limit 1
  ) end,
  v.display_order
from (values
  -- Banking & Moving Money
  ('Banking & Moving Money', 'description', 'Banking & Moving Money', $finance$Set up your banking in Canada and move your money with confidence.$finance$, null, null, 1),
  ('Banking & Moving Money', 'big-banks-vs-online-banks-vs-credit-unions', 'Big banks vs. online banks vs. credit unions', $finance$Understand your options from national banks to digital bank accounts and member-owned credit unions.$finance$, null, null, 2),
  ('Banking & Moving Money', 'td-bank', 'TD Bank', $finance$$finance$, 'TD Bank', 'https://www.td.com/ca/en/personal-banking', 3),
  ('Banking & Moving Money', 'rbc', 'RBC', $finance$$finance$, 'RBC', 'https://www.rbcroyalbank.com/personal.html', 4),
  ('Banking & Moving Money', 'national-bank', 'National Bank', $finance$$finance$, 'National Bank', 'https://www.nbc.ca/', 5),
  ('Banking & Moving Money', 'bmo', 'BMO', $finance$$finance$, 'BMO', 'https://www.bmo.com/en-ca/main/personal/', 6),
  ('Banking & Moving Money', 'cibc', 'CIBC', $finance$$finance$, 'CIBC', 'https://www.cibc.com/en/personal-banking.html', 7),
  ('Banking & Moving Money', 'scotia-bank', 'Scotia Bank', $finance$$finance$, 'Scotia Bank', 'https://www.scotiabank.com/ca/en/personal.html', 8),
  ('Banking & Moving Money', 'equitable-bank', 'Equitable Bank', $finance$$finance$, 'Equitable Bank', 'https://www.equitablebank.ca/', 10),
  ('Banking & Moving Money', 'manulife-bank', 'Manulife Bank', $finance$$finance$, 'Manulife Bank', 'https://www.manulifebank.ca/', 11),
  ('Banking & Moving Money', 'canadian-tire-bank', 'Canadian Tire Bank', $finance$$finance$, 'Canadian Tire Bank', 'https://www.ctfs.com/', 12),
  ('Banking & Moving Money', 'best-online-bank-accounts-in-canada', 'Best Online Bank Accounts in Canada', $finance$$finance$, 'Best Online Bank Accounts in Canada', 'https://www.nerdwallet.com/ca/p/best/banking/best-online-bank-accounts-in-canada', 14),
  ('Banking & Moving Money', 'neo', 'Neo', $finance$$finance$, 'Neo', 'https://www.neofinancial.com/', 15),
  ('Banking & Moving Money', 'tangerine', 'Tangerine', $finance$$finance$, 'Tangerine', 'https://www.tangerine.ca/', 16),
  ('Banking & Moving Money', 'ontario-credit-unions', 'Ontario Credit Unions', $finance$Member-owned. Most flexible with no credit file$finance$, 'About Credit Unions', 'https://ccua.com/about-credit-unions/', 17),
  ('Banking & Moving Money', 'meridian', 'Meridian', $finance$$finance$, 'Meridian', 'https://www.meridiancu.ca/', 18),
  ('Banking & Moving Money', 'duca', 'DUCA', $finance$$finance$, 'DUCA', 'https://www.duca.com/', 19),
  ('Banking & Moving Money', 'alterna-savings', 'Alterna Savings', $finance$$finance$, 'Alterna Savings', 'https://www.alterna.ca/', 20),
  ('Banking & Moving Money', 'country-of-origin-banks', 'Country of origin', $finance$For banks All CDIC Members, All Operation in Canada$finance$, null, null, 21),
  ('Banking & Moving Money', 'bank-of-china-canada', 'Bank of China (Canada)', $finance$$finance$, 'Bank of China (Canada)', 'https://www.bankofchina.com/ca/', 22),
  ('Banking & Moving Money', 'icici-bank-canada', 'ICICI Bank Canada', $finance$$finance$, 'ICICI Bank Canada', 'https://www.icicibank.ca/', 23),
  ('Banking & Moving Money', 'sbi-canada-bank', 'SBI Canada Bank', $finance$$finance$, 'SBI Canada Bank', 'https://www.sbicanada.com/', 24),
  ('Banking & Moving Money', 'shinhan-bank-canada', 'Shinhan Bank Canada', $finance$$finance$, 'Shinhan Bank Canada', 'https://shinhan.ca/', 25),
  ('Banking & Moving Money', 'keb-hana-bank-canada', 'KEB Hana Bank Canada', $finance$$finance$, 'KEB Hana Bank Canada', 'https://bank.hanabank.ca/', 26),
  ('Banking & Moving Money', 'ctbc-bank', 'CTBC Bank', $finance$$finance$, 'CTBC Bank', 'https://www.ctbcbank.com/ca/', 27),
  ('Banking & Moving Money', 'icbc-canada', 'ICBC (Canada)', $finance$$finance$, 'ICBC (Canada)', 'https://canada.icbc.com.cn/', 28),
  ('Banking & Moving Money', 'habib-canadian-bank', 'Habib Canadian Bank', $finance$$finance$, 'Habib Canadian Bank', 'https://www.habibcanadian.com/', 29),
  ('Banking & Moving Money', 'checking-vs-savings-accounts', 'Checking vs. Savings Accounts', $finance$Use checking accounts for daily transactions and savings accounts to earn interest on your funds safely.$finance$, null, null, 30),
  ('Banking & Moving Money', 'checking-account', 'Checking Account', $finance$$finance$, 'Checking Account', 'https://www.canada.ca/en/financial-consumer-agency/services/banking/bank-accounts/chequing-accounts.html', 31),
  ('Banking & Moving Money', 'checking-account-example', 'Example from one of the big banks', $finance$$finance$, 'Checking Account Example', 'https://www.td.com/ca/en/personal-banking/products/bank-accounts/chequing-accounts', 32),
  ('Banking & Moving Money', 'savings-account', 'Savings Account', $finance$$finance$, 'Savings Account', 'https://www.canada.ca/en/financial-consumer-agency/services/banking/bank-accounts/savings-account.html', 33),
  ('Banking & Moving Money', 'savings-account-example', 'Example of one of the big banks:', $finance$$finance$, 'Savings Account Example', 'https://www.td.com/ca/en/personal-banking/products/bank-accounts/savings-accounts', 34),
  ('Banking & Moving Money', 'choose-a-bank', 'How to choose a bank', $finance$Evaluate key parameters like branch access, fees, international transfer availability, and newcomers perks.$finance$, null, null, 35),
  ('Banking & Moving Money', 'best-banks-for-newcomers', 'Best Banks for Newcomers', $finance$$finance$, 'Best Banks for Newcomers', 'https://www.nerdwallet.com/ca/p/best/banking/best-banks-for-newcomers', 36),
  ('Banking & Moving Money', 'deposit-protection-cdic', 'Deposit protection/CDIC', $finance$Learn how your eligible deposits are protected up to $100,000 per insured category through federal insurance.$finance$, null, null, 37),
  ('Banking & Moving Money', 'deposit-insurance', 'Deposit Insurance', $finance$$finance$, 'Deposit Insurance', 'https://www.canada.ca/en/financial-consumer-agency/services/banking/deposit-insurance.html', 38),
  ('Banking & Moving Money', 'open-your-first-account', 'Open your first account', $finance$Everything you need to know to open a bank account as a newcomer$finance$, null, null, 39),
  ('Banking & Moving Money', 'documents-needed', 'What documents do you need', $finance$$finance$, 'What documents do you need', 'https://www.canada.ca/en/financial-consumer-agency/services/banking/opening-bank-account.html', 40),
  ('Banking & Moving Money', 'minimum-deposit', 'Minimum Deposit', $finance$$finance$, 'Minimum Deposit', 'https://www.canada.ca/en/financial-consumer-agency/services/banking/bank-accounts/low-cost-no-cost.html', 41),
  ('Banking & Moving Money', 'fees-and-transactions', 'Fees and Transactions', $finance$$finance$, 'Fees and Transactions', 'https://www.nerdwallet.com/ca/p/article/banking/bank-fees-and-charges', 42),
  ('Banking & Moving Money', 'newcomers-packages', 'Newcomers packages:', $finance$$finance$, 'Newcomers packages', 'https://www.canadavisa.com/banking-for-newcomers-in-canada.html', 43),
  ('Banking & Moving Money', 'debit-card', 'Debit Card', $finance$$finance$, 'Debit Card', 'https://www.canada.ca/en/financial-consumer-agency/services/banking/using-debit.html', 44),
  ('Banking & Moving Money', 'direct-deposit', 'Direct Deposit', $finance$$finance$, 'Direct Deposit', 'https://www.canada.ca/en/public-services-procurement/services/payments-to-from-government/direct-deposit.html', 45),
  ('Banking & Moving Money', 'move-money-internationally', 'Move money internationally', $finance$Send or receive money across borders and understand options$finance$, null, null, 46),
  ('Banking & Moving Money', 'foreign-exchange', 'Foreign Exchange', $finance$$finance$, 'Foreign Exchange', 'https://wise.com/us/blog/currency-exchange-toronto', 47),
  ('Banking & Moving Money', 'foreign-exchange-example', 'Example from one of big banks', $finance$$finance$, 'Foreign Exchange Example', 'https://www.td.com/ca/en/personal-banking/solutions/currency-exchange-services', 48),
  ('Banking & Moving Money', 'alternatives-to-banks', 'Alternatives to banks', $finance$$finance$, 'Alternatives to banks', 'https://wise.com/us/send-money/send-money-to-canada', 49),
  ('Banking & Moving Money', 'international-wire-transfers', 'International Wire Transfers', $finance$$finance$, 'International Wire Transfers', 'https://www.canada.ca/en/revenue-agency/services/about-canada-revenue-agency-cra/pay-wire-transfer-non-residents.html', 50),
  ('Banking & Moving Money', 'international-wire-transfer-example', 'Example from one of the big banks', $finance$$finance$, 'International Wire Transfer Example', 'https://www.td.com/ca/en/personal-banking/ways-to-bank/ways-to-send/international-money-transfer/td-global-transfer/international-bank-transfer', 51),

  -- Credit & Borrowing
  ('Credit & Borrowing', 'description', 'Credit & Borrowing', $finance$Learn about building credit, credit cards, loans, and borrowing options available to newcomers.$finance$, null, null, 1),
  ('Credit & Borrowing', 'understand-credit', 'Understand credit in Canada', $finance$Learn how credit works here so you can use it wisely from day one.$finance$, null, null, 2),
  ('Credit & Borrowing', 'credit-score-vs-report', 'Credit score vs. credit report', $finance$The difference between your score and your report, and who can see them.$finance$, 'Credit score vs. Credit report', 'https://www.canada.ca/en/financial-consumer-agency/services/credit-reports-score/credit-report-score-basics.html', 3),
  ('Credit & Borrowing', 'credit-bureaus', 'How credit bureaus work', $finance$Equifax and TransUnion track your borrowing history — here's what they record.$finance$, 'How credit bureaus work', 'https://www.canada.ca/en/financial-consumer-agency/services/credit-reports-score.html', 4),
  ('Credit & Borrowing', 'equifax', 'Equifax', $finance$$finance$, 'Equifax', 'https://www.equifax.ca/personal/education/credit-report/articles/-/learn/what-is-a-credit-bureau/', 5),
  ('Credit & Borrowing', 'transunion', 'TransUnion', $finance$$finance$, 'TransUnion', 'https://www.transunion.ca/', 6),
  ('Credit & Borrowing', 'what-affects-score', 'What affects your score', $finance$Payment history, credit used, and account age all shape your number.$finance$, 'What affects your score', 'https://www.canada.ca/en/financial-consumer-agency/services/credit-reports-score/improve-credit-score.html', 7),
  ('Credit & Borrowing', 'equifax-score', 'Equifax', $finance$$finance$, 'Equifax credit score', 'https://www.equifax.ca/personal/education/credit-score/articles/-/learn/what-impacts-credit-score/', 8),
  ('Credit & Borrowing', 'transunion-score', 'TransUnion', $finance$$finance$, 'TransUnion credit score', 'https://www.transunion.ca/what-affect-credit-score', 9),
  ('Credit & Borrowing', 'secured-vs-unsecured', 'Secured vs. unsecured cards', $finance$Compare card types and which fits your situation as a newcomer.$finance$, 'Secured vs. unsecured cards', 'https://www.canada.ca/en/financial-consumer-agency/services/credit-cards/choose-credit-card.html', 10),
  ('Credit & Borrowing', 'credit-card-work', 'How credit cards work', $finance$$finance$, 'How credit cards work', 'https://www.canada.ca/en/financial-consumer-agency/services/credit-cards/credit-card-work.html', 11),
  ('Credit & Borrowing', 'build-credit', 'Build your credit as a newcomer', $finance$Practical ways to establish a credit history from day one.$finance$, null, null, 12),
  ('Credit & Borrowing', 'newcomer-credit-card-programs', 'Newcomer credit card programs', $finance$$finance$, 'RBC newcomer credit card program', 'https://www.rbcroyalbank.com/new-to-canada/', 13),
  ('Credit & Borrowing', 'td-newcomer-program', 'TD', $finance$$finance$, 'TD newcomer credit card program', 'https://www.td.com/ca/en/personal-banking/solutions/new-to-canada', 14),
  ('Credit & Borrowing', 'scotiabank-newcomer-program', 'Scotiabank', $finance$$finance$, 'Scotiabank newcomer credit card program', 'https://startright.scotiabank.com/ca/en.html', 15),
  ('Credit & Borrowing', 'cibc-newcomer-program', 'CIBC', $finance$$finance$, 'CIBC newcomer credit card program', 'https://www.cibc.com/en/journeys/new-to-canada.html', 16),
  ('Credit & Borrowing', 'bmo-newcomer-program', 'BMO', $finance$$finance$, 'BMO newcomer credit card program', 'https://www.bmo.com/en-ca/main/personal/newcomers-to-canada/', 17),
  ('Credit & Borrowing', 'no-credit-history', 'No credit history? Your options', $finance$$finance$, 'No credit history? Your options', 'https://www.rbcroyalbank.com/new-to-canada/just-arrived/building-a-credit-history-in-canada/', 18),
  ('Credit & Borrowing', 'cosigners-guarantors', 'Co-signers & guarantors', $finance$$finance$, 'Co-signers & guarantors', 'https://fcnb.ca/en/consumer-resources/what-you-should-know-before-co-signing-a-loan', 19),
  ('Credit & Borrowing', 'credit-builder-loans', 'Credit Builder Loans', $finance$$finance$, 'Credit Builder Loans', 'https://www.canada.ca/en/financial-consumer-agency/services/rights-responsibilities/rights-credit-loans/rights-personal-loans.html', 20),
  ('Credit & Borrowing', 'reporting-rent-payments', 'Reporting rent payments', $finance$$finance$, 'Reporting rent payments', 'https://www.equifax.ca/about-equifax/newsroom/-/intlpress/equifax-canada-is-committed-to-helping-canadians-benefit-from-paying-their-rent/', 21),
  ('Credit & Borrowing', 'common-mistakes', 'Common mistakes to avoid', $finance$$finance$, 'Common mistakes to avoid', 'https://www.canada.ca/en/financial-consumer-agency/services/credit-reports-score/check-errors.html', 22),
  ('Credit & Borrowing', 'borrow-confidence', 'Borrow with confidence', $finance$Compare loan and credit options as your history grows.$finance$, null, null, 23),
  ('Credit & Borrowing', 'personal-loans', 'Personal loans', $finance$How instalment loans work, typical rates, and when to use one.$finance$, 'Personal loans', 'https://www.canada.ca/en/financial-consumer-agency/services/rights-responsibilities/rights-credit-loans/rights-personal-loans.html', 24),
  ('Credit & Borrowing', 'line-of-credit', 'Line of credit', $finance$Flexible borrowing you can draw on and repay as needed.$finance$, 'Line of credit', 'https://www.canada.ca/en/financial-consumer-agency/services/loans/loans-lines-credit.html', 25),
  ('Credit & Borrowing', 'auto-loan-financing', 'Auto loan & financing', $finance$What lenders look for and how down payments affect your rate.$finance$, 'Auto loan & financing', 'https://www.omvic.ca/buying/', 26),
  ('Credit & Borrowing', 'ontario-vehicle-rights', 'Ontario vehicle-buying rights', $finance$$finance$, 'Ontario vehicle-buying rights', 'https://www.ontario.ca/page/buying-new-or-used-vehicle-your-rights', 27),

  -- Taxes, Benefits & Pay
  ('Taxes, Benefits & Pay', 'description', 'Taxes, Benefits & Pay', $finance$Explore taxes in Canada, government benefits you may be eligible for, and how to get paid.$finance$, null, null, 1),
  ('Taxes, Benefits & Pay', 'understand-taxes', 'Understand taxes in Canada', $finance$The basics every newcomer needs before their first tax season.$finance$, null, null, 2),
  ('Taxes, Benefits & Pay', 'getting-your-sin', 'Getting your SIN', $finance$Your Social Insurance Number is required to work and to file taxes — here's how to apply.$finance$, 'Canada SIN application', 'https://www.canada.ca/en/employment-social-development/services/sin/apply.html', 3),
  ('Taxes, Benefits & Pay', 'income-tax-basics', 'Income tax basics', $finance$How federal and Ontario income tax work together, and what counts as taxable income.$finance$, 'CRA newcomers', 'https://www.canada.ca/en/revenue-agency/services/tax/international-non-residents/individuals-leaving-entering-canada-non-residents/newcomers-canada-immigrants.html', 4),
  ('Taxes, Benefits & Pay', 'tax-residency-status', 'Tax residency status', $finance$Why your arrival date matters and how it affects what you report in your first year.$finance$, 'CRA newcomers', 'https://www.canada.ca/en/revenue-agency/services/tax/international-non-residents/individuals-leaving-entering-canada-non-residents/newcomers-canada-immigrants.html', 5),
  ('Taxes, Benefits & Pay', 'benefits', 'Benefits you may qualify for', $finance$Cash benefits and credits many newcomers are eligible for — even in your first year.$finance$, null, null, 6),
  ('Taxes, Benefits & Pay', 'gst-hst-credit', 'GST/HST credit', $finance$$finance$, 'CRA Groceries and Essentials Benefit', 'https://www.canada.ca/en/revenue-agency/services/child-family-benefits/canada-groceries-essentials-benefit.html', 7),
  ('Taxes, Benefits & Pay', 'canada-child-benefit', 'Canada Child Benefit', $finance$$finance$, 'CRA Canada Child Benefit', 'https://www.canada.ca/en/revenue-agency/services/child-family-benefits/canada-child-benefit.html', 8),
  ('Taxes, Benefits & Pay', 'ontario-trillium-benefit', 'Ontario Trillium Benefit', $finance$$finance$, 'Ontario Trillium Benefit', 'https://www.ontario.ca/page/ontario-trillium-benefit', 9),
  ('Taxes, Benefits & Pay', 'other-child-family-benefits', 'Explore other topics child and family benefits', $finance$$finance$, 'CRA child and family benefits', 'https://www.canada.ca/en/revenue-agency/services/child-family-benefits.html', 10),
  ('Taxes, Benefits & Pay', 'understand-your-pay', 'Understand your pay', $finance$Make sense of your paycheque and know your rights as a worker in Ontario.$finance$, null, null, 11),
  ('Taxes, Benefits & Pay', 'reading-pay-stub', 'Reading your pay stub', $finance$What each line on a Canadian pay stub means, from gross pay to net deposit.$finance$, 'Ontario Employment Standards guide', 'https://www.ontario.ca/document/your-guide-employment-standards-act-0', 12),
  ('Taxes, Benefits & Pay', 'cpp-ei-deductions', 'CPP & EI deductions', $finance$Why these amounts come off every paycheque, and what they fund for you later.$finance$, 'CRA payroll deductions', 'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/payroll/payroll-deductions-contributions.html', 13)
) as v(subcategory, section_key, title, body_markdown, source_name, source_url, display_order);

end
$migration$;

