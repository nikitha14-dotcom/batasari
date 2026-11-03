-- Each subcategory also includes its canonical description and editorial tip.
-- Depends on 20260907090000_claim_store_and_static_content.sql.

delete from public.static_content where category = 'Work';

insert into public.trusted_sources (name, url, authority_tier, jurisdiction)
select v.name, v.url, v.authority_tier, v.jurisdiction
from (values
  ('JVS Toronto', 'https://www.jvstoronto.org/', 'C', 'Toronto'),
  ('YMCA of Greater Toronto', 'https://www.ymcagta.org/', 'C', 'Toronto'),
  ('COSTI Immigrant Services', 'https://www.costi.org/', 'C', 'Toronto'),
  ('ACCES Employment', 'https://accesemployment.ca/', 'C', 'Toronto'),
  ('Employment Ontario', 'https://www.ontario.ca/page/employment-ontario', 'A', 'Ontario'),
  ('YMCA Newcomer Information Centre', 'https://newcomersincanada.ca/', 'C', 'Ontario'),
  ('Ontario Bridge Training Program', 'https://www.ontario.ca/page/adult-learning-ontario-bridge-training-program', 'A', 'Ontario'),
  ('Job Bank Canada', 'https://www.jobbank.gc.ca/', 'A', 'Canada'),
  ('LinkedIn Jobs', 'https://www.linkedin.com/jobs/', 'C', 'Canada'),
  ('Indeed Canada', 'https://ca.indeed.com/', 'C', 'Canada'),
  ('Eluta.ca', 'https://www.eluta.ca/', 'C', 'Canada'),
  ('TorontoJobs.ca', 'https://www.torontojobs.ca/', 'C', 'Toronto'),
  ('City of Toronto Careers', 'https://jobs.toronto.ca/', 'A', 'Toronto'),
  ('Glassdoor Canada', 'https://www.glassdoor.ca/', 'C', 'Canada'),
  ('Employment Standards Act guide (Ontario)', 'https://www.ontario.ca/document/your-guide-employment-standards-act-0', 'A', 'Ontario'),
  ('Occupational Health and Safety (OHSA)', 'https://www.ontario.ca/page/occupational-health-and-safety', 'A', 'Ontario'),
  ('Human Rights Tribunal of Ontario (HRTO)', 'https://tribunalsontario.ca/hrto/', 'A', 'Ontario'),
  ('File an employment standards claim', 'https://www.ontario.ca/page/file-employment-standards-claim', 'A', 'Ontario'),
  ('Workplace Safety and Insurance Board (WSIB)', 'https://www.wsib.ca/', 'A', 'Ontario'),
  ('Ontario Human Rights Commission', 'https://www.ohrc.on.ca/', 'A', 'Ontario'),
  ('Workers'' Action Centre', 'https://workersactioncentre.org/', 'C', 'Ontario'),
  ('World Education Services (WES) Canada', 'https://www.wes.org/ca/', 'C', 'Canada'),
  ('ICAS of Canada', 'https://www.icascanada.ca/', 'C', 'Canada'),
  ('Comparative Education Service — U of T SCS', 'https://learn.utoronto.ca/comparative-education-service', 'C', 'Canada'),
  ('IRCC designated ECA organizations', 'https://www.canada.ca/', 'A', 'Canada'),
  ('Office of the Fairness Commissioner', 'https://www.fairnesscommissioner.ca/', 'A', 'Ontario'),
  ('CICIC credential directory', 'https://www.cicic.ca/', 'C', 'Canada'),
  ('Professional Engineers Ontario (PEO)', 'https://www.peo.on.ca/', 'A', 'Ontario'),
  ('TRIEC Mentoring Partnership', 'https://mentoringpartnership.ca/', 'C', 'Toronto'),
  ('Ten Thousand Coffees', 'https://www.tenthousandcoffees.com/', 'C', 'Canada'),
  ('Eventbrite Toronto (Professional)', 'https://www.eventbrite.ca/', 'C', 'Toronto'),
  ('Meetup Toronto', 'https://www.meetup.com/cities/ca/on/toronto/', 'C', 'Toronto'),
  ('Toronto Region Board of Trade', 'https://bot.com/', 'C', 'Toronto'),
  ('LinkedIn Alumni search', 'https://www.linkedin.com/', 'C', 'Canada'),
  ('Toronto Public Library programs', 'https://www.torontopubliclibrary.ca/', 'A', 'Toronto'),
  ('Settlement.org resume guide', 'https://settlement.org/', 'C', 'Ontario'),
  ('Job Bank Resume Builder', 'https://www.jobbank.gc.ca/resume-builder', 'A', 'Canada'),
  ('Job Bank career planning', 'https://www.jobbank.gc.ca/career-planning', 'A', 'Canada'),
  ('Toronto Public Library job help', 'https://www.torontopubliclibrary.ca/jobs-careers/', 'A', 'Toronto'),
  ('JVS Toronto resume clinics', 'https://www.jvstoronto.org/', 'C', 'Toronto'),
  ('YMCA employment workshops', 'https://www.ymcagta.org/', 'C', 'Toronto'),
  ('Job Bank wage trend analysis', 'https://www.jobbank.gc.ca/trend-analysis/search-wages', 'B', 'Canada'),
  ('Randstad Canada — Toronto salary guide', 'https://www.randstad.ca/employers/salary-guide/toronto/', 'C', 'Toronto'),
  ('Statistics Canada labour data', 'https://www.statcan.gc.ca/', 'B', 'Canada'),
  ('Levels.fyi', 'https://www.levels.fyi/', 'C', 'Canada'),
  ('Ontario public sector salary disclosure', 'https://www.ontario.ca/page/public-sector-salary-disclosure', 'B', 'Ontario'),
  ('CRA payroll deductions calculator', 'https://www.canada.ca/', 'A', 'Canada')
) as v(name, url, authority_tier, jurisdiction)
where not exists (
  select 1 from public.trusted_sources t
  where t.name = v.name and t.url = v.url
);

insert into public.static_content (
  category, subcategory, section_key, title, body_markdown, source_id, display_order
)
select
  'Work', v.subcategory, v.section_key, v.title, v.body_markdown,
  case when v.source_name is null then null else (
    select t.id from public.trusted_sources t
    where t.name = v.source_name order by t.created_at limit 1
  ) end,
  v.display_order
from (values
  -- Employment Services & Support Agencies
  ('Employment Services & Support Agencies', 'description', 'Employment Services & Support Agencies', $work$
Free programs and personalized support to help you find work, build skills, and settle in your career.
$work$, null, 1),
  ('Employment Services & Support Agencies', 'tip', 'Tip', $work$
Government-funded settlement agencies offer 100% free services to eligible newcomers — including Permanent Residents, Protected Persons, approved PR applicants, and participants in select economic classes (always verify eligibility directly with the agency or on Canada.ca). In contrast, provincial programs like Employment Ontario assist anyone holding basic legal work authorization.
$work$, null, 2),
  ('Employment Services & Support Agencies', 'jvs-toronto', 'JVS Toronto', $work$
Free employment counselling, job-search coaching, skills training and language assessment for newcomers across the GTA.
$work$, 'JVS Toronto', 3),
  ('Employment Services & Support Agencies', 'ymca-greater-toronto', 'YMCA of Greater Toronto', $work$
Job search help, career counselling, mentorship and newcomer employment programs at branches throughout the GTA.
$work$, 'YMCA of Greater Toronto', 4),
  ('Employment Services & Support Agencies', 'costi-immigrant-services', 'COSTI Immigrant Services', $work$
Employment services, settlement support, language training and skills development delivered specifically for immigrants.
$work$, 'COSTI Immigrant Services', 5),
  ('Employment Services & Support Agencies', 'acces-employment', 'ACCES Employment', $work$
Sector-specific bridging programs and job-search coaching built for internationally trained professionals.
$work$, 'ACCES Employment', 6),
  ('Employment Services & Support Agencies', 'employment-ontario', 'Employment Ontario', $work$
Province-wide employment services open to anyone legally entitled to work in Ontario, not only newcomers.
$work$, 'Employment Ontario', 7),
  ('Employment Services & Support Agencies', 'ymca-newcomer-information-centre', 'YMCA Newcomer Information Centre', $work$
Drop-in and virtual settlement information, with referrals into the right employment program for your status.
$work$, 'YMCA Newcomer Information Centre', 8),
  ('Employment Services & Support Agencies', 'ontario-bridge-training-program', 'Ontario Bridge Training Program', $work$
Short programs that help internationally trained professionals get licensed and working in their own field faster.
$work$, 'Ontario Bridge Training Program', 9),

  -- Job Posting Sites
  ('Job Posting Sites', 'description', 'Job Posting Sites', $work$
Top websites and platforms to search and apply for jobs in Canada.
$work$, null, 1),
  ('Job Posting Sites', 'tip', 'Tip', $work$
When using Job Bank Canada, explicitly look for postings with the "LMIA approved" badge if your visa status requires employer sponsorship.
$work$, null, 2),
  ('Job Posting Sites', 'job-bank-canada', 'Job Bank Canada', $work$
The official federal job board — the best place to find LMIA-approved employers and verified Canadian businesses.
$work$, 'Job Bank Canada', 3),
  ('Job Posting Sites', 'linkedin-jobs', 'LinkedIn Jobs', $work$
The main platform for tapping Canada's hidden job market and reaching Toronto recruiters directly.
$work$, 'LinkedIn Jobs', 4),
  ('Job Posting Sites', 'indeed-canada', 'Indeed Canada', $work$
The highest-volume aggregator, covering all industries and experience levels across the Greater Toronto Area.
$work$, 'Indeed Canada', 5),
  ('Job Posting Sites', 'eluta-ca', 'Eluta.ca', $work$
Indexes postings straight from employer career pages, so roles often appear here before the big aggregators.
$work$, 'Eluta.ca', 6),
  ('Job Posting Sites', 'toronto-jobs-ca', 'TorontoJobs.ca', $work$
A GTA-focused board with local employers and regular virtual job fairs you can attend from home.
$work$, 'TorontoJobs.ca', 7),
  ('Job Posting Sites', 'city-of-toronto-careers', 'City of Toronto Careers', $work$
Municipal government postings with published pay bands, including entry-level and seasonal roles.
$work$, 'City of Toronto Careers', 8),
  ('Job Posting Sites', 'glassdoor-canada', 'Glassdoor Canada', $work$
Job listings paired with company reviews, so you can screen an employer before you apply.
$work$, 'Glassdoor Canada', 9),

  -- Employee Rights
  ('Employee Rights', 'description', 'Employee Rights', $work$
Learn about your legal rights and responsibilities in the workplace.
$work$, null, 1),
  ('Employee Rights', 'tip', 'Tip', $work$
Ontario sets a general minimum wage that is reviewed and adjusted periodically — check the current rate and its effective date on the Employment Standards Act guide before you accept an offer. Under the law, employers cannot ask you to complete unpaid "trial shifts" or withhold training wages.
$work$, null, 2),
  ('Employee Rights', 'employment-standards-act-guide', 'Employment Standards Act guide (Ontario)', $work$
The official guide to minimum wage, hours of work, overtime, vacation, public holidays and termination pay.
$work$, 'Employment Standards Act guide (Ontario)', 3),
  ('Employee Rights', 'occupational-health-and-safety', 'Occupational Health and Safety (OHSA)', $work$
Your legal right to a safe workplace, including mandatory WHMIS hazardous-materials training.
$work$, 'Occupational Health and Safety (OHSA)', 4),
  ('Employee Rights', 'human-rights-tribunal-ontario', 'Human Rights Tribunal of Ontario (HRTO)', $work$
Where to file if you face workplace discrimination based on race, gender, age, disability or origin.
$work$, 'Human Rights Tribunal of Ontario (HRTO)', 5),
  ('Employee Rights', 'employment-standards-claim', 'File an employment standards claim', $work$
The step-by-step process for recovering unpaid wages, overtime or vacation pay from an employer.
$work$, 'File an employment standards claim', 6),
  ('Employee Rights', 'wsib', 'Workplace Safety and Insurance Board (WSIB)', $work$
Coverage, benefits and the claim process if you are injured or become ill because of your job.
$work$, 'Workplace Safety and Insurance Board (WSIB)', 7),
  ('Employee Rights', 'ontario-human-rights-commission', 'Ontario Human Rights Commission', $work$
Plain-language explanations of the Human Rights Code and what counts as workplace discrimination.
$work$, 'Ontario Human Rights Commission', 8),
  ('Employee Rights', 'workers-action-centre', 'Workers'' Action Centre', $work$
Free, confidential advice for workers in precarious or temporary jobs, available in multiple languages.
$work$, 'Workers'' Action Centre', 9),

  -- Credential Recognition
  ('Credential Recognition', 'description', 'Credential Recognition', $work$
Get your foreign credentials assessed and recognized in Canada.
$work$, null, 1),
  ('Credential Recognition', 'tip', 'Tip', $work$
Request academic transcripts in a digital format directly from your home university to WES or ICAS to cut processing time from months to weeks.
$work$, null, 2),
  ('Credential Recognition', 'wes-canada', 'World Education Services (WES) Canada', $work$
Canada's most widely used IRCC-designated evaluator and the fastest route to an Educational Credential Assessment.
$work$, 'World Education Services (WES) Canada', 3),
  ('Credential Recognition', 'icas-canada', 'ICAS of Canada', $work$
An alternative government-approved credential assessment service for academic degrees and diplomas.
$work$, 'ICAS of Canada', 4),
  ('Credential Recognition', 'comparative-education-service', 'Comparative Education Service — U of T SCS', $work$
Academic credential evaluation operated by the University of Toronto School of Continuing Studies.
$work$, 'Comparative Education Service — U of T SCS', 5),
  ('Credential Recognition', 'ircc-designated-eca-organizations', 'IRCC designated ECA organizations', $work$
The official list of designated assessment bodies and which one applies to your profession.
$work$, 'IRCC designated ECA organizations', 6),
  ('Credential Recognition', 'office-fairness-commissioner', 'Office of the Fairness Commissioner', $work$
Find the regulatory body that licenses your profession in Ontario and what its registration actually requires.
$work$, 'Office of the Fairness Commissioner', 7),
  ('Credential Recognition', 'cicic-credential-directory', 'CICIC credential directory', $work$
A national directory that tells you who assesses or licenses your specific occupation in Canada.
$work$, 'CICIC credential directory', 8),
  ('Credential Recognition', 'professional-engineers-ontario', 'Professional Engineers Ontario (PEO)', $work$
An example of a regulated-profession path: the full licensing route to the P.Eng designation in Ontario.
$work$, 'Professional Engineers Ontario (PEO)', 9),

  -- Networking
  ('Networking', 'description', 'Networking', $work$
Connect with professionals and grow your career network.
$work$, null, 1),
  ('Networking', 'tip', 'Tip', $work$
Reaching out on LinkedIn for a 15-minute virtual "informational interview" is widely accepted in Toronto corporate culture — focus on learning about the industry, not asking directly for a job.
$work$, null, 2),
  ('Networking', 'triec-mentoring-partnership', 'TRIEC Mentoring Partnership', $work$
A Toronto program that matches skilled newcomers with established professionals working in their exact industry.
$work$, 'TRIEC Mentoring Partnership', 3),
  ('Networking', 'ten-thousand-coffees', 'Ten Thousand Coffees', $work$
A Canadian platform for scheduling virtual coffee chats and building local corporate connections.
$work$, 'Ten Thousand Coffees', 4),
  ('Networking', 'eventbrite-toronto-professional', 'Eventbrite Toronto (Professional)', $work$
Local industry meetups, tech events and career fairs happening across the GTA this week.
$work$, 'Eventbrite Toronto (Professional)', 5),
  ('Networking', 'meetup-toronto', 'Meetup Toronto', $work$
Recurring professional and interest groups — a low-pressure way to build informal industry contacts.
$work$, 'Meetup Toronto', 6),
  ('Networking', 'toronto-region-board-trade', 'Toronto Region Board of Trade', $work$
Business networking events, member programs and industry councils across the Toronto region.
$work$, 'Toronto Region Board of Trade', 7),
  ('Networking', 'linkedin-alumni-search', 'LinkedIn Alumni search', $work$
Find graduates of your university or former colleagues who now work in Toronto and ask for a warm introduction.
$work$, 'LinkedIn Alumni search', 8),
  ('Networking', 'toronto-public-library-programs', 'Toronto Public Library programs', $work$
Free career and networking events in every neighbourhood, accessible with a library card.
$work$, 'Toronto Public Library programs', 9),

  -- Resume & Interview Guidance
  ('Resume & Interview Guidance', 'description', 'Resume & Interview Guidance', $work$
Improve your resume, prepare for interviews, and stand out to employers.
$work$, null, 1),
  ('Resume & Interview Guidance', 'tip', 'Tip', $work$
Never include personal photos, birthdates, marital status, or your full street address on a Canadian resume; keep it strictly achievement-focused to pass ATS filters.
$work$, null, 2),
  ('Resume & Interview Guidance', 'settlement-resume-guide', 'Settlement.org resume guide', $work$
Government-backed templates showing how to build a strict Canadian-style resume.
$work$, 'Settlement.org resume guide', 3),
  ('Resume & Interview Guidance', 'acces-employment', 'ACCES Employment', $work$
Free interview preparation workshops, resume critiques and sector-specific bridging programs for newcomers.
$work$, 'ACCES Employment', 4),
  ('Resume & Interview Guidance', 'job-bank-resume-builder', 'Job Bank Resume Builder', $work$
A free official tool that formats your experience for Canadian applicant tracking systems (ATS).
$work$, 'Job Bank Resume Builder', 5),
  ('Resume & Interview Guidance', 'job-bank-career-planning', 'Job Bank career planning', $work$
Occupation profiles, required skills and interview expectations for thousands of Canadian job titles.
$work$, 'Job Bank career planning', 6),
  ('Resume & Interview Guidance', 'toronto-public-library-job-help', 'Toronto Public Library job help', $work$
Free workshops, one-on-one resume review and online courses available with a library card.
$work$, 'Toronto Public Library job help', 7),
  ('Resume & Interview Guidance', 'jvs-toronto-resume-clinics', 'JVS Toronto resume clinics', $work$
Book a free session with an employment counsellor to review your resume line by line.
$work$, 'JVS Toronto resume clinics', 8),
  ('Resume & Interview Guidance', 'ymca-employment-workshops', 'YMCA employment workshops', $work$
Group sessions on Canadian interview norms, behavioural questions and salary conversations.
$work$, 'YMCA employment workshops', 9),

  -- Salary Information
  ('Salary Information', 'description', 'Salary Information', $work$
Explore salary ranges and compensation trends in Canada.
$work$, null, 1),
  ('Salary Information', 'tip', 'Tip', $work$
Budget for standard payroll deductions. Gross salary in Ontario includes mandatory deductions for federal/provincial tax, CPP (Canada Pension Plan), and EI (Employment Insurance).
$work$, null, 2),
  ('Salary Information', 'job-bank-wage-trends', 'Job Bank wage trend analysis', $work$
Official government data on prevailing low, median and high wages for a specific occupation and region.
$work$, 'Job Bank wage trend analysis', 3),
  ('Salary Information', 'glassdoor-canada', 'Glassdoor Canada', $work$
User-submitted salaries, company reviews and real interview questions for thousands of Toronto employers.
$work$, 'Glassdoor Canada', 4),
  ('Salary Information', 'randstad-toronto-salary-guide', 'Randstad Canada — Toronto salary guide', $work$
Annual data on current starting salaries and hiring trends specific to the Toronto market.
$work$, 'Randstad Canada — Toronto salary guide', 5),
  ('Salary Information', 'statistics-canada-labour-data', 'Statistics Canada labour data', $work$
Official earnings and employment statistics broken down by industry, occupation and region.
$work$, 'Statistics Canada labour data', 6),
  ('Salary Information', 'levels-fyi', 'Levels.fyi', $work$
Detailed compensation data for technology roles, including the Toronto offices of global companies.
$work$, 'Levels.fyi', 7),
  ('Salary Information', 'ontario-public-sector-salary-disclosure', 'Ontario public sector salary disclosure', $work$
Public-sector salaries above $100,000 — a useful benchmark for government, hospital and university roles.
$work$, 'Ontario public sector salary disclosure', 8),
  ('Salary Information', 'cra-payroll-deductions-calculator', 'CRA payroll deductions calculator', $work$
Estimate your actual take-home pay after federal and provincial tax, CPP and EI.
$work$, 'CRA payroll deductions calculator', 9)
) as v(subcategory, section_key, title, body_markdown, source_name, display_order)
on conflict (category, subcategory, section_key) do update set
  title = excluded.title,
  body_markdown = excluded.body_markdown,
  source_id = excluded.source_id,
  display_order = excluded.display_order,
  updated_at = now();

