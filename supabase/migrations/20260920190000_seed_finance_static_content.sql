-- Seed the four Finance subcategories included in the MVP.

delete from public.static_content
where category = 'Finance'
  and subcategory in (
    'Banking & Moving Money',
    'Cost of Living & Budgeting',
    'Credit & Borrowing',
    'Taxes, Benefits & Pay'
  );

insert into public.trusted_sources (name, url, authority_tier, jurisdiction)
select v.name, v.url, v.authority_tier, v.jurisdiction
from (values
  ('CDIC member institutions', 'https://www.cdic.ca/depositors/list-of-members/', 'A', 'Canada'),
  ('TD Bank', 'https://www.td.com/ca/en/personal-banking', 'C', 'Canada'),
  ('RBC Royal Bank', 'https://www.rbcroyalbank.com/personal.html', 'C', 'Canada'),
  ('National Bank', 'https://www.nbc.ca/', 'C', 'Canada'),
  ('BMO', 'https://www.bmo.com/en-ca/main/personal/', 'C', 'Canada'),
  ('CIBC', 'https://www.cibc.com/en/personal-banking.html', 'C', 'Canada'),
  ('Scotiabank', 'https://www.scotiabank.com/ca/en/personal.html', 'C', 'Canada'),
  ('Equitable Bank', 'https://www.equitablebank.ca/', 'C', 'Canada'),
  ('Manulife Bank', 'https://www.manulifebank.ca/', 'C', 'Canada'),
  ('Canadian Tire Bank', 'https://www.ctfs.com/', 'C', 'Canada'),
  ('Neo Financial', 'https://www.neofinancial.com/', 'C', 'Canada'),
  ('Tangerine Bank', 'https://www.tangerine.ca/', 'C', 'Canada'),
  ('Canadian Credit Union Association', 'https://ccua.com/about-credit-unions/', 'C', 'Canada'),
  ('Meridian Credit Union', 'https://www.meridiancu.ca/', 'C', 'Ontario'),
  ('DUCA Credit Union', 'https://www.duca.com/', 'C', 'Ontario'),
  ('Alterna Savings', 'https://www.alterna.ca/', 'C', 'Ontario'),
  ('Bank of China Canada', 'https://www.bankofchina.com/ca/', 'C', 'Canada'),
  ('ICICI Bank Canada', 'https://www.icicibank.ca/', 'C', 'Canada'),
  ('SBI Canada Bank', 'https://www.sbicanada.com/', 'C', 'Canada'),
  ('Shinhan Bank Canada', 'https://www.shinhancanada.com/', 'C', 'Canada'),
  ('KEB Hana Bank Canada', 'https://www.kebhanacanada.com/', 'C', 'Canada'),
  ('CTBC Bank Canada', 'https://www.ctbcbank.com/ca/', 'C', 'Canada'),
  ('ICBC Canada', 'https://www.icbc.com.cn/ICBC/%E6%B5%B7%E5%A4%96%E5%88%86%E8%A1%8C/%E5%8A%A0%E6%8B%BF%E5%A4%A7/', 'C', 'Canada'),
  ('Habib Canadian Bank', 'https://www.habibcanadian.com/', 'C', 'Canada'),
  ('FCAC chequing accounts', 'https://www.canada.ca/en/financial-consumer-agency/services/banking/bank-accounts/chequing-accounts.html', 'A', 'Canada'),
  ('FCAC savings accounts', 'https://www.canada.ca/en/financial-consumer-agency/services/banking/bank-accounts/savings-account.html', 'A', 'Canada'),
  ('TD chequing accounts', 'https://www.td.com/ca/en/personal-banking/products/bank-accounts/chequing-accounts', 'C', 'Canada'),
  ('TD savings accounts', 'https://www.td.com/ca/en/personal-banking/products/bank-accounts/savings-accounts', 'C', 'Canada'),
  ('NerdWallet banks for newcomers', 'https://www.nerdwallet.com/ca/p/best/banking/best-banks-for-newcomers', 'C', 'Canada'),
  ('FCAC deposit insurance', 'https://www.canada.ca/en/financial-consumer-agency/services/banking/deposit-insurance.html', 'A', 'Canada'),
  ('FCAC opening a bank account', 'https://www.canada.ca/en/financial-consumer-agency/services/banking/opening-bank-account.html', 'A', 'Canada'),
  ('FCAC low-cost bank accounts', 'https://www.canada.ca/en/financial-consumer-agency/services/banking/bank-accounts/low-cost-no-cost.html', 'A', 'Canada'),
  ('FCAC debit cards', 'https://www.canada.ca/en/financial-consumer-agency/services/banking/using-debit.html', 'A', 'Canada'),
  ('Canada direct deposit', 'https://www.canada.ca/en/public-services-procurement/services/payments-to-from-government/direct-deposit.html', 'A', 'Canada'),
  ('NerdWallet bank fees', 'https://www.nerdwallet.com/ca/p/article/banking/bank-fees-and-charges', 'C', 'Canada'),
  ('CanadaVisa newcomer banking', 'https://www.canadavisa.com/banking-for-newcomers-in-canada.html', 'C', 'Canada'),
  ('Wise currency exchange', 'https://wise.com/us/blog/currency-exchange-toronto', 'C', 'International'),
  ('TD currency exchange', 'https://www.td.com/ca/en/personal-banking/solutions/currency-exchange-services', 'C', 'Canada'),
  ('CRA international wire transfer', 'https://www.canada.ca/en/revenue-agency/services/about-canada-revenue-agency-cra/pay-wire-transfer-non-residents.html', 'A', 'Canada'),
  ('TD international bank transfer', 'https://www.td.com/ca/en/personal-banking/ways-to-bank/ways-to-send/international-money-transfer/td-global-transfer/international-bank-transfer', 'C', 'Canada'),
  ('Wise money transfer to Canada', 'https://wise.com/us/send-money/send-money-to-canada', 'C', 'International'),
  ('Statistics Canada household spending', 'https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=4610009201', 'B', 'Canada'),
  ('Statistics Canada consumer price data', 'https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1810000413', 'B', 'Canada'),
  ('CanadianVisa cost of raising children', 'https://canadianvisa.org/blog/immigration/cost-of-raising-children-in-canada-vs-usa', 'C', 'Canada'),
  ('FCAC credit report and score basics', 'https://www.canada.ca/en/financial-consumer-agency/services/credit-reports-score/credit-report-score-basics.html', 'A', 'Canada'),
  ('FCAC credit reports and scores', 'https://www.canada.ca/en/financial-consumer-agency/services/credit-reports-score.html', 'A', 'Canada'),
  ('Equifax credit bureaus', 'https://www.equifax.ca/personal/education/credit-report/articles/-/learn/what-is-a-credit-bureau/', 'C', 'Canada'),
  ('TransUnion Canada', 'https://www.transunion.ca/', 'C', 'Canada'),
  ('FCAC improve credit score', 'https://www.canada.ca/en/financial-consumer-agency/services/credit-reports-score/improve-credit-score.html', 'A', 'Canada'),
  ('Equifax credit score factors', 'https://www.equifax.ca/personal/education/credit-score/articles/-/learn/what-impacts-credit-score/', 'C', 'Canada'),
  ('TransUnion credit score factors', 'https://www.transunion.ca/what-affect-credit-score', 'C', 'Canada'),
  ('FCAC choosing a credit card', 'https://www.canada.ca/en/financial-consumer-agency/services/credit-cards/choose-credit-card.html', 'A', 'Canada'),
  ('FCAC how credit cards work', 'https://www.canada.ca/en/financial-consumer-agency/services/credit-cards/credit-card-work.html', 'A', 'Canada'),
  ('RBC newcomer banking', 'https://www.rbcroyalbank.com/new-to-canada/', 'C', 'Canada'),
  ('TD newcomer banking', 'https://www.td.com/ca/en/personal-banking/solutions/new-to-canada', 'C', 'Canada'),
  ('Scotiabank StartRight', 'https://startright.scotiabank.com/ca/en.html', 'C', 'Canada'),
  ('CIBC newcomer banking', 'https://www.cibc.com/en/journeys/new-to-canada.html', 'C', 'Canada'),
  ('BMO newcomer banking', 'https://www.bmo.com/en-ca/main/personal/newcomers-to-canada/', 'C', 'Canada'),
  ('RBC building credit history', 'https://www.rbcroyalbank.com/new-to-canada/just-arrived/building-a-credit-history-in-canada/', 'C', 'Canada'),
  ('FCAC personal loan rights', 'https://www.canada.ca/en/financial-consumer-agency/services/rights-responsibilities/rights-credit-loans/rights-personal-loans.html', 'A', 'Canada'),
  ('FCNB co-signing guidance', 'https://fcnb.ca/en/consumer-resources/what-you-should-know-before-co-signing-a-loan', 'A', 'New Brunswick'),
  ('Equifax rent reporting', 'https://www.equifax.ca/about-equifax/newsroom/-/intlpress/equifax-canada-is-committed-to-helping-canadians-benefit-from-paying-their-rent/', 'C', 'Canada'),
  ('FCAC checking credit-report errors', 'https://www.canada.ca/en/financial-consumer-agency/services/credit-reports-score/check-errors.html', 'A', 'Canada'),
  ('FCAC lines of credit', 'https://www.canada.ca/en/financial-consumer-agency/services/loans/loans-lines-credit.html', 'A', 'Canada'),
  ('OMVIC vehicle buying', 'https://www.omvic.ca/buying/', 'A', 'Ontario'),
  ('Ontario vehicle-buying rights', 'https://www.ontario.ca/page/buying-new-or-used-vehicle-your-rights', 'A', 'Ontario'),
  ('Canada SIN application', 'https://www.canada.ca/en/employment-social-development/services/sin/apply.html', 'A', 'Canada'),
  ('CRA newcomers', 'https://www.canada.ca/en/revenue-agency/services/tax/international-non-residents/individuals-leaving-entering-canada-non-residents/newcomers-canada-immigrants.html', 'A', 'Canada'),
  ('Canada newcomer taxation', 'https://www.canada.ca/en/immigration-refugees-citizenship/services/settle-canada/money/taxes.html', 'A', 'Canada'),
  ('CRA benefits and credits', 'https://www.canada.ca/en/services/taxes/child-and-family-benefits.html', 'A', 'Canada'),
  ('CRA payroll deductions', 'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/payroll/calculating-deductions.html', 'A', 'Canada')
) as v(name, url, authority_tier, jurisdiction)
where not exists (
  select 1 from public.trusted_sources t
  where t.name = v.name and t.url = v.url
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
    select t.id from public.trusted_sources t
    where t.name = v.source_name and t.url = v.source_url
    order by t.created_at limit 1
  ) end,
  v.display_order
from (values
  -- Banking & Moving Money
  ('Banking & Moving Money', 'description', 'Banking & Moving Money', $finance$Big banks vs. online banks vs. credit unions$finance$, null, null, 1),
  ('Banking & Moving Money', 'cdic-members', 'CDIC Member Institutions', $finance$Other CDIC banks$finance$, 'CDIC member institutions', 'https://www.cdic.ca/depositors/list-of-members/', 2),
  ('Banking & Moving Money', 'td-bank', 'TD Bank', $finance$TD Bank$finance$, 'TD Bank', 'https://www.td.com/ca/en/personal-banking', 3),
  ('Banking & Moving Money', 'rbc-royal-bank', 'RBC Royal Bank', $finance$RBC Royal Bank$finance$, 'RBC Royal Bank', 'https://www.rbcroyalbank.com/personal.html', 4),
  ('Banking & Moving Money', 'national-bank', 'National Bank', $finance$National Bank$finance$, 'National Bank', 'https://www.nbc.ca/', 5),
  ('Banking & Moving Money', 'bmo', 'BMO', $finance$BMO$finance$, 'BMO', 'https://www.bmo.com/en-ca/main/personal/', 6),
  ('Banking & Moving Money', 'cibc', 'CIBC', $finance$CIBC$finance$, 'CIBC', 'https://www.cibc.com/en/personal-banking.html', 7),
  ('Banking & Moving Money', 'scotiabank', 'Scotiabank', $finance$Scotiabank$finance$, 'Scotiabank', 'https://www.scotiabank.com/ca/en/personal.html', 8),
  ('Banking & Moving Money', 'equitable-bank', 'Equitable Bank', $finance$Equitable Bank$finance$, 'Equitable Bank', 'https://www.equitablebank.ca/', 9),
  ('Banking & Moving Money', 'manulife-bank', 'Manulife Bank', $finance$Manulife Bank$finance$, 'Manulife Bank', 'https://www.manulifebank.ca/', 10),
  ('Banking & Moving Money', 'canadian-tire-bank', 'Canadian Tire Bank', $finance$Canadian Tire Bank$finance$, 'Canadian Tire Bank', 'https://www.ctfs.com/', 11),
  ('Banking & Moving Money', 'neo-financial', 'Neo Financial', $finance$Neo Financial$finance$, 'Neo Financial', 'https://www.neofinancial.com/', 12),
  ('Banking & Moving Money', 'tangerine-bank', 'Tangerine Bank', $finance$Tangerine Bank$finance$, 'Tangerine Bank', 'https://www.tangerine.ca/', 13),
  ('Banking & Moving Money', 'credit-unions', 'About Credit Unions', $finance$Member-owned. Most flexible with no credit file.$finance$, 'Canadian Credit Union Association', 'https://ccua.com/about-credit-unions/', 14),
  ('Banking & Moving Money', 'meridian-credit-union', 'Meridian Credit Union', $finance$Meridian Credit Union$finance$, 'Meridian Credit Union', 'https://www.meridiancu.ca/', 15),
  ('Banking & Moving Money', 'duca-credit-union', 'DUCA Credit Union', $finance$DUCA Credit Union$finance$, 'DUCA Credit Union', 'https://www.duca.com/', 16),
  ('Banking & Moving Money', 'alterna-savings', 'Alterna Savings', $finance$Alterna Savings$finance$, 'Alterna Savings', 'https://www.alterna.ca/', 17),
  ('Banking & Moving Money', 'bank-of-china-canada', 'Bank of China (Canada)', $finance$Bank of China (Canada)$finance$, 'Bank of China Canada', 'https://www.bankofchina.com/ca/', 18),
  ('Banking & Moving Money', 'icici-bank-canada', 'ICICI Bank Canada', $finance$ICICI Bank Canada$finance$, 'ICICI Bank Canada', 'https://www.icicibank.ca/', 19),
  ('Banking & Moving Money', 'sbi-canada-bank', 'SBI Canada Bank', $finance$SBI Canada Bank$finance$, 'SBI Canada Bank', 'https://www.sbicanada.com/', 20),
  ('Banking & Moving Money', 'shinhan-bank-canada', 'Shinhan Bank Canada', $finance$Shinhan Bank Canada$finance$, 'Shinhan Bank Canada', 'https://www.shinhancanada.com/', 21),
  ('Banking & Moving Money', 'keb-hana-bank-canada', 'KEB Hana Bank Canada', $finance$KEB Hana Bank Canada$finance$, 'KEB Hana Bank Canada', 'https://www.kebhanacanada.com/', 22),
  ('Banking & Moving Money', 'ctbc-bank-canada', 'CTBC Bank Canada', $finance$CTBC Bank Canada$finance$, 'CTBC Bank Canada', 'https://www.ctbcbank.com/ca/', 23),
  ('Banking & Moving Money', 'icbc-canada', 'ICBC (Canada)', $finance$ICBC (Canada)$finance$, 'ICBC Canada', 'https://www.icbc.com.cn/ICBC/%E6%B5%B7%E5%A4%96%E5%88%86%E8%A1%8C/%E5%8A%A0%E6%8B%BF%E5%A4%A7/', 24),
  ('Banking & Moving Money', 'habib-canadian-bank', 'Habib Canadian Bank', $finance$Habib Canadian Bank$finance$, 'Habib Canadian Bank', 'https://www.habibcanadian.com/', 25),
  ('Banking & Moving Money', 'chequing-accounts', 'Checking vs. Savings Accounts', $finance$Understand the difference and when to use each type of account.$finance$, 'FCAC chequing accounts', 'https://www.canada.ca/en/financial-consumer-agency/services/banking/bank-accounts/chequing-accounts.html', 26),
  ('Banking & Moving Money', 'td-chequing-example', 'Checking Account Example', $finance$Example from one of the big banks.$finance$, 'TD chequing accounts', 'https://www.td.com/ca/en/personal-banking/products/bank-accounts/chequing-accounts', 27),
  ('Banking & Moving Money', 'savings-accounts', 'Savings Account', $finance$Savings Account$finance$, 'FCAC savings accounts', 'https://www.canada.ca/en/financial-consumer-agency/services/banking/bank-accounts/savings-account.html', 28),
  ('Banking & Moving Money', 'td-savings-example', 'Savings Account Example', $finance$Example from one of the big banks.$finance$, 'TD savings accounts', 'https://www.td.com/ca/en/personal-banking/products/bank-accounts/savings-accounts', 29),
  ('Banking & Moving Money', 'choose-a-bank', 'How to Choose a Bank', $finance$Key factors to consider before you open an account.$finance$, 'NerdWallet banks for newcomers', 'https://www.nerdwallet.com/ca/p/best/banking/best-banks-for-newcomers', 30),
  ('Banking & Moving Money', 'deposit-protection', 'Deposit Protection and CDIC', $finance$How your money is protected in Canada and what CDIC covers.$finance$, 'FCAC deposit insurance', 'https://www.canada.ca/en/financial-consumer-agency/services/banking/deposit-insurance.html', 31),
  ('Banking & Moving Money', 'opening-account', 'Open Your First Account', $finance$Everything you need to know to open a bank account as a newcomer.$finance$, 'FCAC opening a bank account', 'https://www.canada.ca/en/financial-consumer-agency/services/banking/opening-bank-account.html', 32),
  ('Banking & Moving Money', 'low-cost-accounts', 'Minimum Deposit', $finance$Minimum Deposit$finance$, 'FCAC low-cost bank accounts', 'https://www.canada.ca/en/financial-consumer-agency/services/banking/bank-accounts/low-cost-no-cost.html', 33),
  ('Banking & Moving Money', 'debit-cards', 'Debit Cards', $finance$Debit Cards$finance$, 'FCAC debit cards', 'https://www.canada.ca/en/financial-consumer-agency/services/banking/using-debit.html', 34),
  ('Banking & Moving Money', 'direct-deposit', 'Direct Deposit', $finance$Direct Deposit$finance$, 'Canada direct deposit', 'https://www.canada.ca/en/public-services-procurement/services/payments-to-from-government/direct-deposit.html', 35),
  ('Banking & Moving Money', 'fees-transactions', 'Fees and Transactions', $finance$Fees and Transactions$finance$, 'NerdWallet bank fees', 'https://www.nerdwallet.com/ca/p/article/banking/bank-fees-and-charges', 36),
  ('Banking & Moving Money', 'newcomer-packages', 'Newcomer Packages', $finance$Newcomer packages$finance$, 'CanadaVisa newcomer banking', 'https://www.canadavisa.com/banking-for-newcomers-in-canada.html', 37),
  ('Banking & Moving Money', 'foreign-exchange', 'Move Money Internationally', $finance$Send or receive money across borders and understand options.$finance$, 'Wise currency exchange', 'https://wise.com/us/blog/currency-exchange-toronto', 38),
  ('Banking & Moving Money', 'td-foreign-exchange', 'Foreign Exchange', $finance$Example from one of the big banks.$finance$, 'TD currency exchange', 'https://www.td.com/ca/en/personal-banking/solutions/currency-exchange-services', 39),
  ('Banking & Moving Money', 'wire-transfers', 'International Wire Transfers', $finance$Send or receive money across borders and understand options.$finance$, 'CRA international wire transfer', 'https://www.canada.ca/en/revenue-agency/services/about-canada-revenue-agency-cra/pay-wire-transfer-non-residents.html', 40),
  ('Banking & Moving Money', 'td-wire-example', 'International Bank Transfer Example', $finance$Example from one of the big banks.$finance$, 'TD international bank transfer', 'https://www.td.com/ca/en/personal-banking/ways-to-bank/ways-to-send/international-money-transfer/td-global-transfer/international-bank-transfer', 41),
  ('Banking & Moving Money', 'money-transfer-apps', 'Alternatives to Banks', $finance$Compare apps and services for money transfer and exchange.$finance$, 'Wise money transfer to Canada', 'https://wise.com/us/send-money/send-money-to-canada', 42),

  -- Cost of Living & Budgeting
  ('Cost of Living & Budgeting', 'description', 'Cost of Living & Budgeting', $finance$Understand your major expenses. Explore the key factors that affect your monthly costs.$finance$, null, null, 1),
  ('Cost of Living & Budgeting', 'housing', 'Housing', $finance$Room: $830. 1 bedroom: $2,110. 2 bedroom: $2,660. 3 bedroom: $3,570.$finance$, 'Statistics Canada household spending', 'https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=4610009201', 2),
  ('Cost of Living & Budgeting', 'food-groceries', 'Food & Groceries', $finance$Groceries for a single person: $379.40 per month. Dining out: $196.80 per month.$finance$, 'Statistics Canada household spending', 'https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=4610009201', 3),
  ('Cost of Living & Budgeting', 'transportation', 'Transportation', $finance$Private transportation: $160.60. Public transportation: $173.30.$finance$, 'Statistics Canada household spending', 'https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=4610009201', 4),
  ('Cost of Living & Budgeting', 'utilities-communications', 'Utilities & Communications', $finance$Average cost: $454. Energy + digital economic services + services.$finance$, 'Statistics Canada household spending', 'https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=4610009201', 5),
  ('Cost of Living & Budgeting', 'household-setup', 'Household Setup', $finance$Household setup$finance$, null, null, 6),
  ('Cost of Living & Budgeting', 'children', 'Children', $finance$Children: $1,441.90.$finance$, 'CanadianVisa cost of raising children', 'https://canadianvisa.org/blog/immigration/cost-of-raising-children-in-canada-vs-usa', 7),
  ('Cost of Living & Budgeting', 'health-insurance-personal', 'Health, Insurance & Personal', $finance$Medical expenses and personal care: $155.00.$finance$, 'Statistics Canada consumer price data', 'https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1810000413', 8),
  ('Cost of Living & Budgeting', 'other-expenses', 'Other Expenses', $finance$Miscellaneous expenses: $616.10.$finance$, 'Statistics Canada consumer price data', 'https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1810000413', 9),
  ('Cost of Living & Budgeting', 'baseline-estimate', 'Estimate Your Cost of Living', $finance$This is a baseline essential monthly budget based on typical costs in Toronto. Your actual costs may be higher or lower. Based on a static average cost for the city; the user's situation may vary.$finance$, null, null, 10),

  -- Credit & Borrowing
  ('Credit & Borrowing', 'description', 'Credit & Borrowing', $finance$Build a Canadian credit history and borrow with confidence.

Your credit score affects renting an apartment, financing a car, getting a phone plan, and qualifying for a mortgage — and it starts from zero when you arrive in Canada.$finance$, null, null, 1),
  ('Credit & Borrowing', 'credit-report-score', 'Credit Score vs. Credit Report', $finance$The difference between your score and your report, and who can see them.$finance$, 'FCAC credit report and score basics', 'https://www.canada.ca/en/financial-consumer-agency/services/credit-reports-score/credit-report-score-basics.html', 2),
  ('Credit & Borrowing', 'credit-bureaus', 'How Credit Bureaus Work', $finance$Equifax and TransUnion track your borrowing history — here's what they record.$finance$, 'FCAC credit reports and scores', 'https://www.canada.ca/en/financial-consumer-agency/services/credit-reports-score.html', 3),
  ('Credit & Borrowing', 'equifax', 'Equifax Canada', $finance$Equifax Canada$finance$, 'Equifax credit bureaus', 'https://www.equifax.ca/personal/education/credit-report/articles/-/learn/what-is-a-credit-bureau/', 4),
  ('Credit & Borrowing', 'transunion', 'TransUnion Canada', $finance$TransUnion Canada$finance$, 'TransUnion Canada', 'https://www.transunion.ca/', 5),
  ('Credit & Borrowing', 'improve-credit-score', 'What Affects Your Score', $finance$Payment history, credit used, and account age all shape your number.$finance$, 'FCAC improve credit score', 'https://www.canada.ca/en/financial-consumer-agency/services/credit-reports-score/improve-credit-score.html', 6),
  ('Credit & Borrowing', 'equifax-score-factors', 'Equifax Credit Factors', $finance$Equifax Credit Factors$finance$, 'Equifax credit score factors', 'https://www.equifax.ca/personal/education/credit-score/articles/-/learn/what-impacts-credit-score/', 7),
  ('Credit & Borrowing', 'transunion-score-factors', 'TransUnion Credit Factors', $finance$TransUnion Credit Factors$finance$, 'TransUnion credit score factors', 'https://www.transunion.ca/what-affect-credit-score', 8),
  ('Credit & Borrowing', 'choose-credit-card', 'Secured vs. Unsecured Cards', $finance$Compare card types and which fits your situation as a newcomer.$finance$, 'FCAC choosing a credit card', 'https://www.canada.ca/en/financial-consumer-agency/services/credit-cards/choose-credit-card.html', 9),
  ('Credit & Borrowing', 'credit-card-basics', 'How Credit Cards Work', $finance$How Credit Cards Work$finance$, 'FCAC how credit cards work', 'https://www.canada.ca/en/financial-consumer-agency/services/credit-cards/credit-card-work.html', 10),
  ('Credit & Borrowing', 'rbc-newcomer', 'Newcomer Credit Card Programs', $finance$Practical ways to establish a credit history from day one.$finance$, 'RBC newcomer banking', 'https://www.rbcroyalbank.com/new-to-canada/', 11),
  ('Credit & Borrowing', 'td-newcomer', 'TD New to Canada', $finance$TD New to Canada$finance$, 'TD newcomer banking', 'https://www.td.com/ca/en/personal-banking/solutions/new-to-canada', 12),
  ('Credit & Borrowing', 'scotia-newcomer', 'Scotiabank StartRight', $finance$Scotiabank StartRight$finance$, 'Scotiabank StartRight', 'https://startright.scotiabank.com/ca/en.html', 13),
  ('Credit & Borrowing', 'cibc-newcomer', 'CIBC New to Canada', $finance$CIBC New to Canada$finance$, 'CIBC newcomer banking', 'https://www.cibc.com/en/journeys/new-to-canada.html', 14),
  ('Credit & Borrowing', 'bmo-newcomer', 'BMO Newcomers to Canada', $finance$BMO Newcomers to Canada$finance$, 'BMO newcomer banking', 'https://www.bmo.com/en-ca/main/personal/newcomers-to-canada/', 15),
  ('Credit & Borrowing', 'no-credit-history', 'No Credit History? Your Options', $finance$No credit history? Your options$finance$, 'RBC building credit history', 'https://www.rbcroyalbank.com/new-to-canada/just-arrived/building-a-credit-history-in-canada/', 16),
  ('Credit & Borrowing', 'credit-builder-loans', 'Credit Builder Loans', $finance$Credit builder loans$finance$, 'FCAC personal loan rights', 'https://www.canada.ca/en/financial-consumer-agency/services/rights-responsibilities/rights-credit-loans/rights-personal-loans.html', 17),
  ('Credit & Borrowing', 'cosigners-guarantors', 'Co-signers and Guarantors', $finance$Co-signers and Guarantors$finance$, 'FCNB co-signing guidance', 'https://fcnb.ca/en/consumer-resources/what-you-should-know-before-co-signing-a-loan', 18),
  ('Credit & Borrowing', 'rent-reporting', 'Reporting Rent Payments', $finance$Reporting Rent Payments$finance$, 'Equifax rent reporting', 'https://www.equifax.ca/about-equifax/newsroom/-/intlpress/equifax-canada-is-committed-to-helping-canadians-benefit-from-paying-their-rent/', 19),
  ('Credit & Borrowing', 'common-mistakes', 'Common Mistakes to Avoid', $finance$Common mistakes to avoid$finance$, 'FCAC checking credit-report errors', 'https://www.canada.ca/en/financial-consumer-agency/services/credit-reports-score/check-errors.html', 20),
  ('Credit & Borrowing', 'personal-loans', 'Personal Loans', $finance$How instalment loans work, typical rates, and when to use one.$finance$, 'FCAC personal loan rights', 'https://www.canada.ca/en/financial-consumer-agency/services/rights-responsibilities/rights-credit-loans/rights-personal-loans.html', 21),
  ('Credit & Borrowing', 'lines-of-credit', 'Lines of Credit', $finance$Flexible borrowing you can draw on and repay as needed.$finance$, 'FCAC lines of credit', 'https://www.canada.ca/en/financial-consumer-agency/services/loans/loans-lines-credit.html', 22),
  ('Credit & Borrowing', 'omvic-auto-financing', 'Auto Loans & Financing', $finance$What lenders look for and how down payments affect your rate.$finance$, 'OMVIC vehicle buying', 'https://www.omvic.ca/buying/', 23),
  ('Credit & Borrowing', 'ontario-auto-rights', 'Ontario Vehicle-Buying Rights', $finance$Ontario Vehicle-Buying Rights$finance$, 'Ontario vehicle-buying rights', 'https://www.ontario.ca/page/buying-new-or-used-vehicle-your-rights', 24),

  -- Taxes, Benefits & Pay
  ('Taxes, Benefits & Pay', 'description', 'Taxes, Benefits & Pay', $finance$Understand the Canadian tax system, claim the benefits you qualify for, and make sense of your paycheque.

Filing a tax return — even with little or no income — is how you unlock benefit payments, get your SIN working correctly with employers, and avoid penalties. Newcomers often qualify for cash benefits they don't know exist.$finance$, null, null, 1),
  ('Taxes, Benefits & Pay', 'sin', 'Getting Your SIN', $finance$Your Social Insurance Number is required to work and to file taxes — here's how to apply.$finance$, 'Canada SIN application', 'https://www.canada.ca/en/employment-social-development/services/sin/apply.html', 2),
  ('Taxes, Benefits & Pay', 'income-tax-basics', 'Income Tax Basics', $finance$How federal and Ontario income tax work together, and what counts as taxable income.$finance$, 'Canada newcomer taxation', 'https://www.canada.ca/en/immigration-refugees-citizenship/services/settle-canada/money/taxes.html', 3),
  ('Taxes, Benefits & Pay', 'tax-residency', 'Tax Residency Status', $finance$Why your arrival date matters and how it affects what you report in your first year.$finance$, 'CRA newcomers', 'https://www.canada.ca/en/revenue-agency/services/tax/international-non-residents/individuals-leaving-entering-canada-non-residents/newcomers-canada-immigrants.html', 4),
  ('Taxes, Benefits & Pay', 'benefits-credits', 'Benefits You May Qualify For', $finance$Cash benefits and credits many newcomers are eligible for — even in your first year.$finance$, 'CRA benefits and credits', 'https://www.canada.ca/en/services/taxes/child-and-family-benefits.html', 5),
  ('Taxes, Benefits & Pay', 'newcomer-benefits', 'Explore Other Topics', $finance$Child and family benefits$finance$, 'CRA benefits and credits', 'https://www.canada.ca/en/services/taxes/child-and-family-benefits.html', 6),
  ('Taxes, Benefits & Pay', 'gst-hst-credit', 'GST/HST Credit', $finance$GST/HST credit$finance$, 'CRA benefits and credits', 'https://www.canada.ca/en/services/taxes/child-and-family-benefits.html', 7),
  ('Taxes, Benefits & Pay', 'canada-child-benefit', 'Canada Child Benefit', $finance$Canada Child Benefit$finance$, 'CRA benefits and credits', 'https://www.canada.ca/en/services/taxes/child-and-family-benefits.html', 8),
  ('Taxes, Benefits & Pay', 'ontario-trillium-benefit', 'Ontario Trillium Benefit', $finance$Ontario Trillium Benefit$finance$, 'CRA newcomers', 'https://www.canada.ca/en/revenue-agency/services/tax/international-non-residents/individuals-leaving-entering-canada-non-residents/newcomers-canada-immigrants.html', 9),
  ('Taxes, Benefits & Pay', 'reading-pay-stub', 'Reading Your Pay Stub', $finance$What each line on a Canadian pay stub means, from gross pay to net deposit.$finance$, null, null, 10),
  ('Taxes, Benefits & Pay', 'cpp-ei-deductions', 'CPP & EI Deductions', $finance$Why these amounts come off every paycheque, and what they fund for you later.$finance$, 'CRA payroll deductions', 'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/payroll/calculating-deductions.html', 11)
) as v(subcategory, section_key, title, body_markdown, source_name, source_url, display_order)
on conflict (category, subcategory, section_key) do update set
  title = excluded.title,
  body_markdown = excluded.body_markdown,
  source_id = excluded.source_id,
  display_order = excluded.display_order,
  updated_at = now();

