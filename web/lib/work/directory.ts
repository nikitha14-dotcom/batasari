/**
 * Work directory content: seven subcategories, one editorial tip each, and 49
 * curated links.
 *
 * This is a typed fixture, not the long-term source. Per the system design (§6),
 * authored category content lives in the repository and loads into the
 * database via migration; the UI will read it from the content API once that
 * lands. The shape here mirrors the planned table so the swap is a data-source
 * change, not a component change.
 *
 * Copy is canonical: where a mockup differs, this file wins (Work spec §3.4).
 */

export type WorkIconName =
  | 'employmentServices'
  | 'jobPosting'
  | 'employeeRights'
  | 'credentialRecognition'
  | 'networking'
  | 'resumeInterview'
  | 'salary';

export type WorkLink = {
  /** Stable catalog id, e.g. WORK-ES-01. */
  id: string;
  name: string;
  url: string;
  /** 25 words or fewer (FR-1.4). */
  description: string;
};

export type WorkSubcategory = {
  id: string;
  code: string;
  title: string;
  blurb: string;
  /** Exactly one per subcategory (FR-1.3). Links figures, never states them. */
  tip: string;
  icon: WorkIconName;
  links: WorkLink[];
};

export const WORK_SUBCATEGORIES: WorkSubcategory[] = [
  {
    id: 'employment-services',
    code: 'ES',
    title: 'Employment services & Support Agencies',
    blurb:
      'Free programs and personalized support to help you find work, build skills, and settle in your career.',
    tip: 'Government-funded settlement agencies offer free services to eligible newcomers, including Permanent Residents, Protected Persons, approved PR applicants, and participants in select economic classes (always verify eligibility directly with the agency or on Canada.ca). Provincial programs like Employment Ontario assist anyone holding basic legal work authorization.',
    icon: 'employmentServices',
    links: [
      {
        id: 'WORK-ES-01',
        name: 'JVS Toronto',
        url: 'https://jvstoronto.org',
        description:
          'Free employment counselling, job-search coaching, interview preparation, skills training and language assessment for newcomers across the GTA.',
      },
      {
        id: 'WORK-ES-02',
        name: 'YMCA of Greater Toronto',
        url: 'https://ymcagta.org',
        description:
          'Job search help, career counselling, mentorship and newcomer employment programs at branches throughout the GTA.',
      },
      {
        id: 'WORK-ES-03',
        name: 'COSTI Immigrant Services',
        url: 'https://costi.org',
        description:
          'Employment services, settlement support, interview and job-search preparation, language training and skills development for immigrants.',
      },
      {
        id: 'WORK-ES-04',
        name: 'ACCES Employment',
        url: 'https://accesemployment.ca',
        description:
          'Sector-specific bridging programs, mock interview practice and job-search coaching for internationally trained professionals.',
      },
      {
        id: 'WORK-ES-05',
        name: 'Employment Ontario',
        url: 'https://www.ontario.ca/page/employment-ontario',
        description:
          'Province-wide employment services open to anyone legally entitled to work in Ontario, not only newcomers.',
      },
      {
        id: 'WORK-ES-06',
        name: 'YMCA Newcomer Information Centre',
        url: 'https://newcomersincanada.ca',
        description:
          'Drop-in and virtual settlement information, with referrals into the right employment program for your status.',
      },
      {
        id: 'WORK-ES-07',
        name: 'Ontario Bridge Training Program',
        url: 'https://www.ontario.ca/page/adult-learning-ontario-bridge-training-program',
        description:
          'Short programs that help internationally trained professionals get licensed and working in their own field faster.',
      },
    ],
  },
  {
    id: 'job-posting-sites',
    code: 'JP',
    title: 'Job Posting Sites',
    blurb: 'Top websites and platforms to search and apply for jobs in Canada.',
    tip: 'When using Job Bank Canada, explicitly look for postings with the "LMIA approved" badge if your visa status requires employer sponsorship.',
    icon: 'jobPosting',
    links: [
      {
        id: 'WORK-JP-01',
        name: 'Job Bank Canada',
        url: 'https://jobbank.gc.ca',
        description:
          'The official federal job board — the best place to find LMIA-approved employers and verified Canadian businesses.',
      },
      {
        id: 'WORK-JP-02',
        name: 'LinkedIn Jobs',
        url: 'https://linkedin.com/jobs',
        description:
          "The main platform for tapping Canada's hidden job market and reaching Toronto recruiters directly.",
      },
      {
        id: 'WORK-JP-03',
        name: 'Indeed Canada',
        url: 'https://ca.indeed.com',
        description:
          'The highest-volume aggregator, covering all industries and experience levels across the Greater Toronto Area.',
      },
      {
        id: 'WORK-JP-04',
        name: 'Eluta.ca',
        url: 'https://eluta.ca',
        description:
          'Indexes postings straight from employer career pages, so roles often appear here before the big aggregators.',
      },
      {
        id: 'WORK-JP-05',
        name: 'TorontoJobs.ca',
        url: 'https://torontojobs.ca',
        description:
          'A GTA-focused board with local employers and regular virtual job fairs you can attend from home.',
      },
      {
        id: 'WORK-JP-06',
        name: 'City of Toronto Careers',
        url: 'https://jobs.toronto.ca',
        description:
          'Municipal government postings with published pay bands, including entry-level and seasonal roles.',
      },
      {
        id: 'WORK-JP-07',
        name: 'Glassdoor Canada',
        url: 'https://glassdoor.ca',
        description:
          'Job listings paired with company reviews, so you can screen an employer before you apply.',
      },
    ],
  },
  {
    id: 'employee-rights',
    code: 'ER',
    title: 'Employee Rights',
    blurb: 'Learn about your rights and responsibilities in the workplace.',
    tip: 'Ontario sets a general minimum wage that is reviewed and adjusted periodically — check the current rate and its effective date on the Employment Standards Act guide before you accept an offer. Under the law, employers cannot ask you to complete unpaid "trial shifts" or withhold training wages.',
    icon: 'employeeRights',
    links: [
      {
        id: 'WORK-ER-01',
        name: 'Employment Standards Act guide (Ontario)',
        url: 'https://www.ontario.ca/document/your-guide-employment-standards-act-0',
        description:
          'The official guide to minimum wage, hours of work, overtime, vacation, public holidays and termination pay.',
      },
      {
        id: 'WORK-ER-02',
        name: 'Occupational Health and Safety (OHSA)',
        url: 'https://www.ontario.ca/page/occupational-health-and-safety-act-ohsa',
        description:
          'Your legal right to a safe workplace, including mandatory WHMIS hazardous-materials training.',
      },
      {
        id: 'WORK-ER-03',
        name: 'Human Rights Tribunal of Ontario (HRTO)',
        url: 'https://tribunalsontario.ca/hrto',
        description:
          'Where to file if you face workplace discrimination based on race, gender, age, disability or origin.',
      },
      {
        id: 'WORK-ER-04',
        name: 'File an employment standards claim',
        url: 'https://www.ontario.ca/document/your-guide-employment-standards-act-0/filing-claim',
        description:
          'The step-by-step process for recovering unpaid wages, overtime or vacation pay from an employer.',
      },
      {
        id: 'WORK-ER-05',
        name: 'Workplace Safety and Insurance Board (WSIB)',
        url: 'https://wsib.ca',
        description:
          'Coverage, benefits and the claim process if you are injured or become ill because of your job.',
      },
      {
        id: 'WORK-ER-06',
        name: 'Ontario Human Rights Commission',
        url: 'https://ohrc.on.ca',
        description:
          'Plain-language explanations of the Human Rights Code and what counts as workplace discrimination.',
      },
      {
        id: 'WORK-ER-07',
        name: "Workers' Action Centre",
        url: 'https://workersactioncentre.org',
        description:
          'Free, confidential advice for workers in precarious or temporary jobs, available in multiple languages.',
      },
    ],
  },
  {
    id: 'credential-recognition',
    code: 'CR',
    title: 'Credential recognition',
    blurb: 'Get your foreign credentials assessed and recognized in Canada.',
    tip: 'Request academic transcripts in a digital format directly from your home university to WES or ICAS to cut processing time from months to weeks.',
    icon: 'credentialRecognition',
    links: [
      {
        id: 'WORK-CR-01',
        name: 'World Education Services (WES) Canada',
        url: 'https://www.wes.org/eca/',
        description:
          "An IRCC-designated organization for Educational Credential Assessments (ECAs).",
      },
      {
        id: 'WORK-CR-02',
        name: 'ICAS of Canada',
        url: 'https://icascanada.ca',
        description:
          'An alternative government-approved credential assessment service for academic degrees and diplomas.',
      },
      {
        id: 'WORK-CR-03',
        name: 'Comparative Education Service — U of T SCS',
        url: 'https://learn.utoronto.ca/comparative-education-service',
        description:
          'Academic credential evaluation operated by the University of Toronto School of Continuing Studies.',
      },
      {
        id: 'WORK-CR-04',
        name: 'IRCC designated ECA organizations',
        url: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/documents/education-assessed.html',
        description:
          'The official list of designated assessment bodies and which one applies to your profession.',
      },
      {
        id: 'WORK-CR-05',
        name: 'Office of the Fairness Commissioner',
        url: 'https://www.fairnesscommissioner.ca/en',
        description:
          'Find the regulatory body that licenses your profession in Ontario and what its registration actually requires.',
      },
      {
        id: 'WORK-CR-06',
        name: 'CICIC credential directory',
        url: 'https://cicic.ca',
        description:
          'A national directory that tells you who assesses or licenses your specific occupation in Canada.',
      },
      {
        id: 'WORK-CR-07',
        name: 'Professional Engineers Ontario (PEO)',
        url: 'https://peo.on.ca',
        description:
          'An example of a regulated-profession path: the full licensing route to the P.Eng designation in Ontario.',
      },
    ],
  },
  {
    id: 'networking',
    code: 'NW',
    title: 'Networking',
    blurb: 'Connect with professionals and grow your career network.',
    tip: 'Reaching out on LinkedIn for a 15-minute virtual "informational interview" is widely accepted in Toronto corporate culture — focus on learning about the industry, not asking directly for a job.',
    icon: 'networking',
    links: [
      {
        id: 'WORK-NW-01',
        name: 'TRIEC Mentoring Partnership',
        url: 'https://mentoringpartnership.ca',
        description:
          'A Toronto program that matches skilled newcomers with established professionals working in their exact industry.',
      },
      {
        id: 'WORK-NW-02',
        name: 'Ten Thousand Coffees',
        url: 'https://tenthousandcoffees.com',
        description:
          'A Canadian platform for scheduling virtual coffee chats and building local corporate connections.',
      },
      {
        id: 'WORK-NW-03',
        name: 'Eventbrite Toronto (Professional)',
        url: 'https://www.eventbrite.ca/d/canada--toronto/business--events/',
        description:
          'Local industry meetups, tech events and career fairs happening across the GTA this week.',
      },
      {
        id: 'WORK-NW-04',
        name: 'Meetup — Toronto professional networking',
        url: 'https://www.meetup.com/find/ca--toronto/professional-networking/',
        description:
          'Recurring professional and interest groups — a low-pressure way to build informal industry contacts.',
      },
      {
        id: 'WORK-NW-05',
        name: 'Toronto Region Board of Trade',
        url: 'https://bot.com',
        description:
          'Business networking events, member programs and industry councils across the Toronto region.',
      },
      {
        id: 'WORK-NW-06',
        name: 'LinkedIn Alumni search',
        url: 'https://linkedin.com',
        description:
          'Find graduates of your university or former colleagues who now work in Toronto and ask for a warm introduction.',
      },
      {
        id: 'WORK-NW-07',
        name: 'Toronto Public Library programs',
        url: 'https://torontopubliclibrary.ca',
        description:
          'Free career and networking events in every neighbourhood, accessible with a library card.',
      },
    ],
  },
  {
    id: 'resume-interview',
    code: 'RI',
    title: 'Resume & Interview Guidance',
    blurb: 'Improve your resume, prepare for interviews, and stand out to employers.',
    tip: 'Never include personal photos, birthdates, marital status, or your full street address on a Canadian resume; keep it strictly achievement-focused to pass ATS filters.',
    icon: 'resumeInterview',
    links: [
      {
        id: 'WORK-RI-01',
        name: 'Settlement.org resume guide',
        url: 'https://settlement.org/ontario/employment/find-a-job/resume/how-do-i-create-a-canadian-style-resume/',
        description:
          'Government-backed templates showing how to build a strict Canadian-style resume.',
      },
      {
        id: 'WORK-RI-02',
        name: 'ACCES Employment',
        url: 'https://accesemployment.ca',
        description:
          'Free interview preparation workshops, resume critiques and sector-specific bridging programs for newcomers.',
      },
      {
        id: 'WORK-RI-03',
        name: 'Job Bank Resume Builder',
        url: 'https://www.jobbank.gc.ca/findajob/resume-builder',
        description:
          'A free official tool that formats your experience for Canadian applicant tracking systems (ATS).',
      },
      {
        id: 'WORK-RI-04',
        name: 'Job Bank career planning',
        url: 'https://www.jobbank.gc.ca/career-planning',
        description:
          'Occupation profiles, required skills and interview expectations for thousands of Canadian job titles.',
      },
      {
        id: 'WORK-RI-05',
        name: 'Toronto Public Library job help',
        url: 'https://tpl.ca/using-the-library/services/job-career-help/',
        description:
          'Free workshops, one-on-one resume review and online courses available with a library card.',
      },
      {
        id: 'WORK-RI-06',
        name: 'JVS Toronto resume clinics',
        url: 'https://jvstoronto.org',
        description:
          'Book a free session with an employment counsellor to review your resume line by line.',
      },
      {
        id: 'WORK-RI-07',
        name: 'YMCA employment workshops',
        url: 'https://ymcagta.org',
        description:
          'Group sessions on Canadian interview norms, behavioural questions and salary conversations.',
      },
    ],
  },
  {
    id: 'salary-information',
    code: 'SI',
    title: 'Salary Information',
    blurb: 'Explore salary ranges and compensation trends in Canada.',
    tip: 'Budget for standard payroll deductions. Gross salary in Ontario includes mandatory deductions for federal/provincial tax, CPP (Canada Pension Plan), and EI (Employment Insurance).',
    icon: 'salary',
    links: [
      {
        id: 'WORK-SI-01',
        name: 'Job Bank wage trend analysis',
        url: 'https://www.jobbank.gc.ca/trend-analysis/search-wages',
        description:
          'Official government data on prevailing low, median and high wages for a specific occupation and region.',
      },
      {
        id: 'WORK-SI-02',
        name: 'Glassdoor Canada',
        url: 'https://glassdoor.ca',
        description:
          'User-submitted salaries, company reviews and real interview questions for thousands of Toronto employers.',
      },
      {
        id: 'WORK-SI-03',
        name: 'Randstad Canada — Toronto salary guide',
        url: 'https://randstad.ca/employers/salary-guide/toronto',
        description:
          'Annual data on current starting salaries and hiring trends specific to the Toronto market.',
      },
      {
        id: 'WORK-SI-04',
        name: 'Statistics Canada labour data',
        url: 'https://statcan.gc.ca',
        description:
          'Official earnings and employment statistics broken down by industry, occupation and region.',
      },
      {
        id: 'WORK-SI-05',
        name: 'Levels.fyi',
        url: 'https://levels.fyi',
        description:
          'Detailed compensation data for technology roles, including the Toronto offices of global companies.',
      },
      {
        id: 'WORK-SI-06',
        name: 'Ontario public sector salary disclosure',
        url: 'https://www.ontario.ca/page/public-sector-salary-disclosure',
        description:
          'Public-sector salaries above $100,000 — a useful benchmark for government, hospital and university roles.',
      },
      {
        id: 'WORK-SI-07',
        name: 'CRA payroll deductions calculator',
        url: 'https://www.canada.ca/en/revenue-agency/services/e-services/digital-services-businesses/payroll-deductions-online-calculator.html',
        description:
          'Estimate your actual take-home pay after federal and provincial tax, CPP and EI.',
      },
    ],
  },
];

