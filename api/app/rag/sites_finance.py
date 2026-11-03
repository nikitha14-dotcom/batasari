# sites_finance.py: Finance sites (specific pages/domains).
# Source: Final Restricted websites for Finance.docx (owner: Pia Rahman).
# The source doc has no tier column, so no site here sets "tier" -- sites_config.py
# defaults every untiered site to D automatically.

FINANCE_SITES = [
    {"url": "https://www.canada.ca", "label": "Canada.ca (main portal)", "category": "Finance"},
    {
        "url": "https://www.canada.ca/en/revenue-agency.html",
        "label": "Canada Revenue Agency (CRA)",
        "category": "Finance",
    },
    {
        "url": (
            "https://www.canada.ca/en/employment-social-development/corporate/portfolio/"
            "service-canada.html"
        ),
        "label": "Service Canada",
        "category": "Finance",
    },
    {
        "url": "https://www.canada.ca/en/financial-consumer-agency.html",
        "label": "Financial Consumer Agency of Canada (FCAC)",
        "category": "Finance",
    },
    {
        "url": "https://www.osfi-bsif.gc.ca",
        "label": "Office of the Superintendent of Financial Institutions (OSFI)",
        "category": "Finance",
    },
    {"url": "https://www.bankofcanada.ca", "label": "Bank of Canada", "category": "Finance"},
    {
        "url": "https://www.cdic.ca",
        "label": "Canada Deposit Insurance Corporation (CDIC)",
        "category": "Finance",
    },
    {
        "url": "https://www.cmhc-schl.gc.ca",
        "label": "Canada Mortgage and Housing Corporation (CMHC)",
        "category": "Finance",
    },
    {"url": "https://www.statcan.gc.ca", "label": "Statistics Canada", "category": "Finance"},
    {
        "url": "https://www.canada.ca/en/immigration-refugees-citizenship.html",
        "label": "Immigration, Refugees and Citizenship Canada (IRCC)",
        "category": "Finance",
    },
    {
        "url": "https://www.canada.ca/en/employment-social-development.html",
        "label": "Employment and Social Development Canada (ESDC)",
        "category": "Finance",
    },
    {
        "url": "https://ised-isde.canada.ca/site/office-superintendent-bankruptcy/en",
        "label": "Office of the Superintendent of Bankruptcy Canada (OSB)",
        "category": "Finance",
    },
    {"url": "https://www.ontario.ca", "label": "Ontario.ca (main portal)", "category": "Finance"},
    {
        "url": "https://www.ontario.ca/page/ministry-finance",
        "label": "Ontario Ministry of Finance",
        "category": "Finance",
    },
    {
        "url": "https://www.osc.ca/en",
        "label": "Ontario Securities Commission (OSC)",
        "category": "Finance",
    },
    {
        "url": "https://www.fsrao.ca",
        "label": "Financial Services Regulatory Authority of Ontario (FSRA)",
        "category": "Finance",
    },
    {
        "url": "https://www.toronto.ca/services-payments/",
        "label": "City of Toronto \u2014 Financial Assistance",
        "category": "Finance",
    },
    {
        "url": "https://tribunalsontario.ca/ltb/",
        "label": "Landlord and Tenant Board (Ontario)",
        "category": "Finance",
    },
    {
        "url": "https://www.obsi.ca",
        "label": "Ombudsman for Banking Services and Investments (OBSI)",
        "category": "Finance",
    },
    {
        "url": "https://www.ciro.ca",
        "label": "Canadian Investment Regulatory Organization (CIRO)",
        "category": "Finance",
    },
    {
        "url": "https://cba.ca",
        "label": "Canadian Bankers Association (CBA)",
        "category": "Finance",
    },
    {
        "url": "https://www.cipf.ca",
        "label": "Canadian Investor Protection Fund (CIPF)",
        "category": "Finance",
    },
    {
        "url": "https://www.fpcanada.ca",
        "label": "FP Canada (financial planner certification)",
        "category": "Finance",
    },
    {"url": "https://www.td.com", "label": "TD Bank", "category": "Finance"},
    {"url": "https://www.rbc.com", "label": "RBC", "category": "Finance"},
    {"url": "https://www.bmo.com", "label": "BMO", "category": "Finance"},
    {"url": "https://www.cibc.com", "label": "CIBC", "category": "Finance"},
    {"url": "https://www.scotiabank.com", "label": "Scotiabank", "category": "Finance"},
    {"url": "https://www.nbc.ca", "label": "National Bank of Canada", "category": "Finance"},
    {
        "url": "https://www.rbcroyalbank.com/new-to-canada/",
        "label": "RBC \u2014 New to Canada",
        "category": "Finance",
    },
    {
        "url": "https://www.td.com/ca/en/personal-banking/solutions/new-to-canada",
        "label": "TD \u2014 New to Canada",
        "category": "Finance",
    },
    {
        "url": "https://startright.scotiabank.com/ca/en.html",
        "label": "Scotiabank \u2014 StartRight Program",
        "category": "Finance",
    },
    {
        "url": "https://www.cibc.com/en/journeys/new-to-canada.html",
        "label": "CIBC \u2014 New to Canada",
        "category": "Finance",
    },
    {
        "url": "https://www.bmo.com/en-ca/main/personal/newcomers-to-canada/",
        "label": "BMO \u2014 Newcomers to Canada",
        "category": "Finance",
    },
    {"url": "https://www.equitablebank.ca", "label": "Equitable Bank", "category": "Finance"},
    {"url": "https://www.manulifebank.ca", "label": "Manulife Bank", "category": "Finance"},
    {"url": "https://www.ctfs.com", "label": "Canadian Tire Bank", "category": "Finance"},
    {"url": "https://www.simplii.com", "label": "Simplii Financial", "category": "Finance"},
    {"url": "https://www.eqbank.ca", "label": "EQ Bank", "category": "Finance"},
    {"url": "https://www.neofinancial.com", "label": "Neo Financial", "category": "Finance"},
    {"url": "https://www.tangerine.ca", "label": "Tangerine", "category": "Finance"},
    {"url": "https://www.koho.ca", "label": "KOHO", "category": "Finance"},
    {
        "url": "https://www.wealthsimple.com/en-ca/product/cash",
        "label": "Wealthsimple Cash",
        "category": "Finance",
    },
    {
        "url": "https://www.borrowell.com",
        "label": "Borrowell (credit monitoring, credit builder, rent reporting)",
        "category": "Finance",
    },
    {"url": "https://www.meridiancu.ca", "label": "Meridian Credit Union", "category": "Finance"},
    {"url": "https://www.duca.com", "label": "DUCA Credit Union", "category": "Finance"},
    {"url": "https://www.alterna.ca", "label": "Alterna Savings", "category": "Finance"},
    {
        "url": "https://www.firstontario.com",
        "label": "FirstOntario Credit Union",
        "category": "Finance",
    },
    {
        "url": "https://ccua.com",
        "label": "Canadian Credit Union Association (CCUA)",
        "category": "Finance",
    },
    {
        "url": "https://www.bankofchina.com/ca/",
        "label": "Bank of China (Canada)",
        "category": "Finance",
    },
    {"url": "https://www.icicibank.ca", "label": "ICICI Bank Canada", "category": "Finance"},
    {"url": "https://www.sbicanada.com", "label": "SBI Canada Bank", "category": "Finance"},
    {
        "url": "https://www.shinhancanada.com",
        "label": "Shinhan Bank Canada",
        "category": "Finance",
    },
    {
        "url": "https://www.kebhanacanada.com",
        "label": "KEB Hana Bank Canada",
        "category": "Finance",
    },
    {"url": "https://www.ctbcbank.com/ca/", "label": "CTBC Bank Canada", "category": "Finance"},
    {"url": "https://www.icbc.com.cn", "label": "ICBC (Canada)", "category": "Finance"},
    {
        "url": "https://www.habibcanadian.com",
        "label": "Habib Canadian Bank",
        "category": "Finance",
    },
    {"url": "https://www.hsbc.ca", "label": "HSBC Bank Canada", "category": "Finance"},
    {"url": "https://www.consumer.equifax.ca", "label": "Equifax Canada", "category": "Finance"},
    {"url": "https://www.transunion.ca", "label": "TransUnion Canada", "category": "Finance"},
    {"url": "https://www.nerdwallet.com/ca", "label": "NerdWallet Canada", "category": "Finance"},
    {"url": "https://www.ratehub.ca", "label": "Ratehub", "category": "Finance"},
    {"url": "https://www.moneysense.ca", "label": "MoneySense", "category": "Finance"},
    {
        "url": "https://financialpost.com/personal-finance",
        "label": "Financial Post \u2014 Personal Finance",
        "category": "Finance",
    },
    {"url": "https://youngandthrifty.ca", "label": "Young and Thrifty", "category": "Finance"},
    {"url": "https://prospercanada.org", "label": "Prosper Canada", "category": "Finance"},
    {
        "url": "https://www.getsmarteraboutmoney.ca",
        "label": "GetSmarterAboutMoney.ca",
        "category": "Finance",
    },
    {
        "url": "https://www.investingintroduction.ca",
        "label": "InvestingIntroduction.ca",
        "category": "Finance",
    },
    {
        "url": "https://www.checkbeforeyouinvest.ca",
        "label": "CheckBeforeYouInvest.ca",
        "category": "Finance",
    },
    {
        "url": "https://www.wealthsimple.com/en-ca/learn",
        "label": "Wealthsimple Learn",
        "category": "Finance",
    },
    {
        "url": "https://www.creditcounsellingcanada.ca",
        "label": "Credit Counselling Canada",
        "category": "Finance",
    },
    {
        "url": "https://creditcanada.com",
        "label": "Credit Canada Debt Solutions",
        "category": "Finance",
    },
    {"url": "https://www.costi.org", "label": "COSTI Immigrant Services", "category": "Finance"},
    {"url": "https://achev.ca", "label": "Ach\u0113v", "category": "Finance"},
    {"url": "https://www.ncpeel.ca", "label": "Newcomer Centre of Peel", "category": "Finance"},
    {
        "url": "https://ocasi.org",
        "label": "Ontario Council of Agencies Serving Immigrants (OCASI)",
        "category": "Finance",
    },
    {"url": "https://www.interac.ca", "label": "Interac", "category": "Finance"},
    {"url": "https://www.visa.ca", "label": "Visa Canada", "category": "Finance"},
    {"url": "https://www.mastercard.ca", "label": "Mastercard Canada", "category": "Finance"},
    {"url": "https://wise.com/ca", "label": "Wise", "category": "Finance"},
    {
        "url": "https://www.westernunion.com/ca/en/home.html",
        "label": "Western Union Canada",
        "category": "Finance",
    },
    {"url": "https://www.remitly.com", "label": "Remitly", "category": "Finance"},
    {"url": "https://www.xe.com", "label": "Xe", "category": "Finance"},
    {
        "url": "https://www.ontario.ca/page/apply-ohip-and-get-health-card",
        "label": "Ontario Health Insurance Plan (OHIP)",
        "category": "Finance",
    },
    {"url": "https://www.ibc.ca", "label": "Insurance Bureau of Canada", "category": "Finance"},
    {
        "url": "https://www.bdc.ca",
        "label": "Business Development Bank of Canada (BDC)",
        "category": "Finance",
    },
    {
        "url": "https://www.ontario.ca/page/ontario-business-registry",
        "label": "Ontario Business Registry",
        "category": "Finance",
    },
    {
        "url": "https://trreb.ca",
        "label": "Toronto Regional Real Estate Board (TRREB)",
        "category": "Finance",
    },
    {
        "url": "https://www.reco.on.ca",
        "label": "Real Estate Council of Ontario (RECO)",
        "category": "Finance",
    },
    {
        "url": "https://www.omvic.ca",
        "label": "Ontario Motor Vehicle Industry Council (OMVIC)",
        "category": "Finance",
    },
    {"url": "https://211ontario.ca", "label": "211 Ontario", "category": "Finance"},
    {
        "url": "https://www.wsib.ca",
        "label": "Workplace Safety and Insurance Board (WSIB)",
        "category": "Finance",
    },
    {
        "url": "https://www.ontario.ca/page/learn-about-osap",
        "label": "Ontario Student Assistance Program (OSAP)",
        "category": "Finance",
    },
    {
        "url": "https://www.csnpe-nslsc.canada.ca",
        "label": "National Student Loans Service Centre (NSLSC)",
        "category": "Finance",
    },
    {
        "url": (
            "https://www.canada.ca/en/revenue-agency/services/child-family-benefits/"
            "canada-child-benefit-overview.html"
        ),
        "label": "Canada Child Benefit (CCB)",
        "category": "Finance",
    },
    {
        "url": (
            "https://www.canada.ca/en/services/benefits/publicpensions/cpp/old-age-security.html"
        ),
        "label": "Old Age Security (OAS)",
        "category": "Finance",
    },
    {
        "url": "https://www.ontario.ca/page/tax-credits-and-benefits-people",
        "label": "Ontario Trillium Benefit",
        "category": "Finance",
    },
    {
        "url": (
            "https://www.canada.ca/en/financial-consumer-agency/services/credit-reports-score/"
            "credit-report-score-basics.html"
        ),
        "label": "FCAC \u2014 Credit report & score basics",
        "category": "Finance",
    },
    {
        "url": (
            "https://www.canada.ca/en/financial-consumer-agency/services/credit-reports-score.html"
        ),
        "label": "FCAC \u2014 Credit reports & scores hub",
        "category": "Finance",
    },
    {
        "url": (
            "https://www.canada.ca/en/financial-consumer-agency/services/credit-reports-score/"
            "improve-credit-score.html"
        ),
        "label": "FCAC \u2014 Improve your credit score",
        "category": "Finance",
    },
    {
        "url": (
            "https://www.canada.ca/en/financial-consumer-agency/services/credit-reports-score/"
            "check-errors.html"
        ),
        "label": "FCAC \u2014 Check your credit report for errors",
        "category": "Finance",
    },
    {
        "url": (
            "https://www.canada.ca/en/financial-consumer-agency/services/credit-cards/"
            "choose-credit-card.html"
        ),
        "label": "FCAC \u2014 Choosing a credit card",
        "category": "Finance",
    },
    {
        "url": (
            "https://www.canada.ca/en/financial-consumer-agency/services/credit-cards/"
            "credit-card-work.html"
        ),
        "label": "FCAC \u2014 How credit cards work",
        "category": "Finance",
    },
    {
        "url": (
            "https://www.canada.ca/en/financial-consumer-agency/services/rights-responsibilities/"
            "rights-credit-loans.html"
        ),
        "label": "FCAC \u2014 Rights on credit & loans",
        "category": "Finance",
    },
    {
        "url": (
            "https://www.canada.ca/en/financial-consumer-agency/services/rights-responsibilities/"
            "rights-credit-loans/rights-personal-loans.html"
        ),
        "label": "FCAC \u2014 Rights on personal loans",
        "category": "Finance",
    },
    {
        "url": "https://www.canada.ca/en/services/taxes/income-tax.html",
        "label": "CRA \u2014 Income tax basics hub",
        "category": "Finance",
    },
    {
        "url": (
            "https://www.canada.ca/en/revenue-agency/services/tax/international-non-residents/"
            "individuals-leaving-entering-canada-non-residents/newcomers-canada-immigrants.html"
        ),
        "label": "CRA \u2014 Newcomers to Canada and the CRA (tax residency)",
        "category": "Finance",
    },
    {
        "url": "https://www.canada.ca/en/revenue-agency/services/tax/newcomers-canada.html",
        "label": "CRA \u2014 Benefits, credits, and taxes for newcomers",
        "category": "Finance",
    },
    {
        "url": (
            "https://www.canada.ca/en/revenue-agency/services/forms-publications/publications/"
            "t4055/t4055-newcomers-canada.html"
        ),
        "label": "CRA \u2014 Newcomers to Canada guide (T4055)",
        "category": "Finance",
    },
    {
        "url": (
            "https://www.canada.ca/en/revenue-agency/news/cra-multimedia-library/"
            "individuals-video-gallery/webinar-benefits-credits-newcomers-canada.html"
        ),
        "label": "CRA \u2014 Webinar: Benefits & credits for newcomers",
        "category": "Finance",
    },
    {
        "url": (
            "https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/"
            "about-your-tax-return/tax-return/completing-a-tax-return/deductions-credits-expenses/"
            "gst-hst-credit.html"
        ),
        "label": "CRA \u2014 GST/HST credit",
        "category": "Finance",
    },
    {
        "url": "https://www.canada.ca/en/employment-social-development/services/sin.html",
        "label": "Service Canada \u2014 Social Insurance Number (SIN)",
        "category": "Finance",
    },
    {
        "url": "https://www.canada.ca/en/employment-social-development/services/sin/apply.html",
        "label": "Service Canada \u2014 Apply for a SIN",
        "category": "Finance",
    },
    {
        "url": "https://www.canada.ca/en/services/benefits/publicpensions/cpp.html",
        "label": "Service Canada \u2014 Canada Pension Plan (CPP)",
        "category": "Finance",
    },
    {
        "url": (
            "https://www.canada.ca/en/services/benefits/publicpensions/cpp/"
            "cpp-disability-benefit.html"
        ),
        "label": "Service Canada \u2014 CPP Disability Benefits",
        "category": "Finance",
    },
    {
        "url": (
            "https://www.canada.ca/en/services/benefits/publicpensions/cpp/old-age-security/"
            "guaranteed-income-supplement.html"
        ),
        "label": "Service Canada \u2014 Guaranteed Income Supplement (GIS)",
        "category": "Finance",
    },
    {
        "url": "https://www.canada.ca/en/services/benefits/ei.html",
        "label": "Service Canada \u2014 Employment Insurance (EI)",
        "category": "Finance",
    },
    {
        "url": (
            "https://ised-isde.canada.ca/site/office-superintendent-bankruptcy/en/"
            "i-cant-pay-my-debts/directory-licensed-insolvency-trustees"
        ),
        "label": "OSB \u2014 Directory of Licensed Insolvency Trustees",
        "category": "Finance",
    },
    {"url": "https://www.jobbank.gc.ca", "label": "Job Bank Canada", "category": "Finance"},
    {
        "url": "https://www.ontario.ca/page/ontario-energy-and-property-tax-credit",
        "label": "Ontario \u2014 Energy and Property Tax Credit",
        "category": "Finance",
    },
    {
        "url": "https://www.ontario.ca/page/low-income-workers-tax-credit",
        "label": "Ontario \u2014 Low-income Workers Tax Credit (LIFT)",
        "category": "Finance",
    },
    {
        "url": "https://www.ontario.ca/page/ontario-disability-support-program",
        "label": "Ontario Disability Support Program (ODSP)",
        "category": "Finance",
    },
    {
        "url": (
            "https://www.ontario.ca/page/ontario-disability-support-program-employment-supports"
        ),
        "label": "ODSP \u2014 Employment Supports",
        "category": "Finance",
    },
    {
        "url": "https://www.ontario.ca/page/employment-standards",
        "label": "Ontario \u2014 Employment Standards hub",
        "category": "Finance",
    },
    {
        "url": "https://www.ontario.ca/document/your-guide-employment-standards-act-0",
        "label": "Ontario \u2014 Employment Standards Act guide",
        "category": "Finance",
    },
    {
        "url": (
            "https://www.ontario.ca/document/your-guide-employment-standards-act-0/minimum-wage"
        ),
        "label": "Ontario \u2014 Minimum wage",
        "category": "Finance",
    },
    {
        "url": (
            "https://www.ontario.ca/document/your-guide-employment-standards-act-0/public-holidays"
        ),
        "label": "Ontario \u2014 Public holiday pay",
        "category": "Finance",
    },
    {
        "url": "https://www.fsrao.ca/consumers/auto-insurance",
        "label": "FSRA \u2014 Auto Insurance",
        "category": "Finance",
    },
    {
        "url": "https://www.ontario.ca/page/employment-ontario",
        "label": "Employment Ontario",
        "category": "Finance",
    },
    {
        "url": "https://www.ontario.ca/page/buying-new-or-used-vehicle-your-rights",
        "label": "Ontario \u2014 Buying a new or used vehicle, your rights",
        "category": "Finance",
    },
    {
        "url": (
            "https://www.equifax.ca/personal/education/credit-report/articles/-/learn/"
            "what-is-a-credit-bureau/"
        ),
        "label": "Equifax Canada \u2014 What is a credit bureau",
        "category": "Finance",
    },
    {
        "url": (
            "https://www.equifax.ca/personal/education/credit-score/articles/-/learn/"
            "what-impacts-credit-score/"
        ),
        "label": "Equifax Canada \u2014 What impacts your credit score",
        "category": "Finance",
    },
    {
        "url": (
            "https://www.equifax.ca/about-equifax/newsroom/-/intlpress/"
            "equifax-canada-is-committed-to-helping-canadians-benefit-from-paying-their-rent/"
        ),
        "label": "Equifax Canada \u2014 Rent reporting program",
        "category": "Finance",
    },
    {
        "url": "https://www.transunion.ca/what-affect-credit-score",
        "label": "TransUnion Canada \u2014 What affects your credit score",
        "category": "Finance",
    },
    {
        "url": (
            "https://www.rbcroyalbank.com/new-to-canada/just-arrived/"
            "building-a-credit-history-in-canada/"
        ),
        "label": "RBC \u2014 Building credit history in Canada",
        "category": "Finance",
    },
    {
        "url": "https://www.creditcounsellingcanada.ca/find-help/",
        "label": "Credit Counselling Canada \u2014 Find a counsellor",
        "category": "Finance",
    },
    {
        "url": "https://creditcanada.com/debt-help/",
        "label": "Credit Canada \u2014 Debt help resources",
        "category": "Finance",
    },
    {"url": "https://turbotax.intuit.ca", "label": "TurboTax Canada", "category": "Finance"},
    {
        "url": "https://www.wealthsimple.com/en-ca/tax",
        "label": "Wealthsimple Tax",
        "category": "Finance",
    },
    {"url": "https://www.hrblock.ca", "label": "H&R Block Canada", "category": "Finance"},
    {"url": "https://www.ufile.ca", "label": "UFile", "category": "Finance"},
    {
        "url": "https://www.ibc.ca/auto-insurance",
        "label": "Insurance Bureau of Canada \u2014 Auto insurance basics",
        "category": "Finance",
    },
]

