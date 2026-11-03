
delete from public.static_content
where category = 'Education & Family';

insert into public.trusted_sources (name, url, authority_tier, jurisdiction)
select v.name, v.url, v.authority_tier, v.jurisdiction
from (values
  ('CICIC education authorities', 'https://www.cicic.ca/1301/ministries_departments_responsible_for_education_in_canada.canada', 'A', 'Canada'),
  ('EduCanada education system', 'https://www.educanada.ca/study-plan-etudes/system-education-systeme.aspx?lang=eng', 'A', 'Canada'),
  ('Fraser Institute – Ontario School Report Cards', 'https://www.fraserinstitute.org/categories/school-report-cards', 'C', 'Ontario'),
  ('EQAO Find My School', 'https://www.eqao.com/the-assessments/find-my-school/', 'B', 'Ontario'),
  ('Ontario School Rankings', 'https://ontarioschoolrankings.ca/map/', 'C', 'Ontario'),
  ('Canadian Homeschooler legal guide', 'https://thecanadianhomeschooler.com/legalities-of-homeschooling-in-canada-quick-guide/', 'C', 'Canada'),
  ('Toronto Public vs Private Schools – Our Kids', 'https://www.ourkids.net/school/toronto-private-vs-public-schools', 'C', 'Toronto'),
  ('Official Private-School Guidance', 'https://www.international.gc.ca/protocol-protocole/policies-politiques/education-schooling-scolarisation.aspx?lang=eng', 'A', 'Canada'),
  ('Canada.ca newcomer enrollment guidance', 'https://www.canada.ca/en/immigration-refugees-citizenship/services/settle-canada/education/school-life.html', 'A', 'Canada'),
  ('Canada.ca newcomer youth services', 'https://www.canada.ca/en/immigration-refugees-citizenship/services/settle-canada/youth-services.html', 'A', 'Canada'),
  ('CanCode Program', 'https://ised-isde.canada.ca/site/ised/en/programs-and-initiatives/cancode/cancode-program-2026-2028-applicant-guide', 'A', 'Canada'),
  ('Ontario – Education and Career Planning', 'https://www.ontario.ca/page/education-and-career-planning', 'A', 'Ontario'),
  ('Ontario – Cooperative Education', 'https://www.ontario.ca/page/cooperative-education-co-op-courses', 'A', 'Ontario'),
  ('Ontario – Creating Safe and Accepting Schools', 'https://www.ontario.ca/page/creating-safe-and-accepting-schools', 'A', 'Ontario'),
  ('TDSB – Safe Arrival Program', 'https://www.tdsb.on.ca/High-School/Caring-Safe-Schools/Safe-Arrival-Program', 'A', 'Toronto'),
  ('Canada – Healthy Settings for Young People', 'https://www.canada.ca/en/public-health/services/publications/science-research-data/healthy-settings-young-people-canada.html', 'A', 'Canada'),
  ('EduCanada – College and University Pathways', 'https://www.educanada.ca/programs-programmes/pathways-voies.aspx?lang=eng', 'A', 'Canada'),
  ('Ontario Colleges – Program Types', 'https://www.ontariocolleges.ca/en/program-types', 'A', 'Ontario'),
  ('Search Colleges & Universities – EduCanada', 'https://www.educanada.ca/programs-programmes/index.aspx?lang=eng', 'A', 'Canada'),
  ('Ontario Universities – OUAC', 'https://www.ouac.on.ca/', 'B', 'Ontario'),
  ('Toronto Universities – OUInfo', 'https://ouinfo.ca/universities/', 'B', 'Ontario'),
  ('Search Ontario College Programs', 'https://www.ontariocolleges.ca/en/programs/', 'A', 'Ontario'),
  ('Centennial College – Toronto / GTA', 'https://www.centennialcollege.ca', 'A', 'Toronto'),
  ('Times Higher Education – Best Universities in Canada', 'https://www.timeshighereducation.com/student/best-universities/best-universities-canada', 'C', 'Canada'),
  ('QS World University Rankings – Canada', 'https://www.topuniversities.com/world-university-rankings?region=North%20America&countries=ca', 'C', 'Canada'),
  ('EduCanada – How to Apply to School in Canada', 'https://www.educanada.ca/study-plan-etudes/before-avant/apply-school_canada_demande-ecole.aspx?lang=eng', 'A', 'Canada'),
  ('EduCanada – Universities in Canada', 'https://www.educanada.ca/study-plan-etudes/university-universite.aspx?lang=eng', 'A', 'Canada'),
  ('Ontario Colleges – How to Apply', 'https://www.ontariocolleges.ca/en/applying/how-to-apply', 'A', 'Ontario'),
  ('Ontario Student Assistance Program – OSAP', 'https://www.ontario.ca/page/learn-about-osap', 'A', 'Ontario'),
  ('Canada – Designated Learning Institutions', 'https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/study-permit/prepare/designated-learning-institutions-list.html', 'A', 'Canada'),
  ('EduCanada – Study Programs in Canada', 'https://www.educanada.ca/programs-programmes/index.aspx?lang=eng', 'A', 'Canada'),
  ('EduCanada – During Your Studies', 'https://www.educanada.ca/study-plan-etudes/during-pendant/index.aspx?lang=eng', 'A', 'Canada'),
  ('Canada.ca – Connecting with Your Community', 'https://www.canada.ca/en/immigration-refugees-citizenship/services/settle-canada/community-connections.html', 'A', 'Canada'),
  ('EduCanada – Get Ready to Come to Canada', 'https://www.educanada.ca/start-commencez/step-5-etape.aspx?lang=eng', 'A', 'Canada'),
  ('EduCanada – Study in Canada', 'https://www.educanada.ca/index.aspx?lang=eng', 'A', 'Canada'),
  ('Government of Canada Job Bank – Labour Market Information', 'https://www.jobbank.gc.ca/trend-analysis', 'A', 'Canada'),
  ('Job Bank – School-to-Work Transition Tool', 'https://www.jobbank.gc.ca/career-planning/school-work-transition', 'A', 'Canada'),
  ('Government of Canada – Language Classes for Newcomers', 'https://www.canada.ca/en/immigration-refugees-citizenship/services/settle-canada/language-skills/classes.html', 'A', 'Canada'),
  ('Ontario – Adult ESL Programs', 'https://www.ontario.ca/page/adult-learning-english-second-language', 'A', 'Ontario'),
  ('TDSB – Adult ESL Classes', 'https://www.tdsb.on.ca/communityservices/Adult-ESL', 'A', 'Toronto'),
  ('Government of Canada – Become an Apprentice', 'https://www.canada.ca/en/services/jobs/training/support-skilled-trades-apprentices/become-apprentice.html', 'A', 'Canada'),
  ('Ontario – Skilled Trades', 'https://www.ontario.ca/page/skilled-trades', 'A', 'Ontario'),
  ('Ontario – Apprenticeship', 'https://www.ontario.ca/page/apprenticeship-ontario', 'A', 'Ontario'),
  ('Red Seal – Trades in Canada', 'https://red-seal.ca/eng/trades/trades-canada.shtml', 'A', 'Canada'),
  ('Government of Canada – Red Seal Program', 'https://www.canada.ca/en/employment-social-development/programs/skilled-trades-apprenticeships.html', 'A', 'Canada'),
  ('Canada Apprentice Loan', 'https://www.canada.ca/en/services/jobs/training/support-skilled-trades-apprentices/loan.html', 'A', 'Canada')
) as v(name, url, authority_tier, jurisdiction)
where not exists (
  select 1
  from public.trusted_sources t
  where t.name = v.name and t.url = v.url
);

insert into public.static_content (
  category, subcategory, section_key, title, body_markdown, source_id, display_order
)
values
  ('Education & Family', 'Understand Schools in Canada', 'document-copy', 'Understand Schools in Canada', $education$#### How Canadian System Works

##### Province / Territory Curriculum & Learning Standards

Each province or territory defines

**Curriculum & Learning Standards**

Each province or territory defines what students learn and the skills they are expected to develop at each grade level.

**Grade Structure & School Year**

Each province or territory decides how grades are organized and sets the general school calender and compulsory-schooling rules.

**Graduation Requirements**

Each province or territory sets the courses, credits and other requirements students must complete to earn a high-school diploma.

**Education Policies & Funding**

Each province or territory sets education policies and determines how publicly funded schools are supported and governed.

##### School Board / District

**Student Enrollment**

School boards or districts manage the local process for registering students in public schools.

**Attendance Boundaries**

School boards may define geographic areas that determine which public school normally serves a student's home address.

**Transportation**

School boards may manage school-bus services and set eligibility rules based on factors such as distance, age and local policy.

**Student Support Services**

Boards coordinate services such as newcomer language support, special education, accessibility and other learning supports.

**Local Programs & Policies**

Boards manage local school policies and may offer programs such as French Immersion, gifted education or specialized learning.

**Parent & Community Involvement**

Parents may participate through school councils, volunteering, board engagement and local community organizations.

*Services, programs and policies vary by school board or district.*

##### Your Home Address

**Home Address**

The residential address where the child lives and that may be used for public-school enrollment.

→

**Attendance / Catchment Boundary**

The geographic area a school board may use to determine which public school serves a neighbourhood.

→

**Designated School**

The public school normally assigned to students living within that attendance area.

*Boundaries and exceptions vary by school board, so families should verify the designated school with an official source.*

##### Schools & Programs

**Language Options**

Schools may provide English-language, French-language, French Immersion and ESL/ELL learning options or support.

**Academic Programs**

Depending on the school or board, students may have access to STEM, robotics, gifted, IB, AP or other specialized programs.

**Arts, Sports & Activities**

Schools may offer music, visual arts, sports, clubs and extracurricular activities alongside regular academics.

**Newcomer Support**

Some schools provide language, settlement and adjustment support to help newcomer students transition into Canadian schooling.

**Special Education & Accessibility**

Schools and boards may provide individualized learning, special-education and accessibility support based on student needs.

*Programs and student supports vary by province, school board and individual school.*

#### School Levels & Grades

**Kindergarten**

Usually begins around age 5; the required age and cutoff date are set by each province or territory.

**Elementary / Primary School**

Usually begins around age 6 and covers the early school years; grade ranges vary across Canada.

**Middle School / Junior High**

Usually serves students around ages 11–14, but some school systems do not have a separate middle-school stage.

**High School / Secondary School**

Usually serves students around ages 14–18; placement is generally based on grade progression, previous schooling and local requirements.

**Age & Grade Placement**

Newcomer students may be placed based on age, previous school records and the local school board’s placement process.

#### How School Boards Work

Public schools are generally managed through local school boards, districts or other public education authorities. Private and independent schools operate separately under their own governance structures and must follow applicable provincial or territorial requirements.

**School Board / District**

Local school boards or districts manage groups of public schools in their communities.

**Attendance Boundaries**

Boards may divide communities into geographic areas that determine which public school normally serves a neighbourhood.

**Local Policies & Services**

Boards manage local rules and services such as enrollment, transportation, student support, school calendars and specialized programs.

**Home Address**

A family’s residential address may affect the child’s designated public school and sometimes transportation eligibility.

**Parent & Community Involvement**

Parents may participate through school councils, volunteering, board meetings and community organizations.

*School-board names, boundaries, policies and services can vary by province and community.*

#### Language of Education

**English-Language Education**

Most instruction is provided in English, with subjects taught using the provincial or territorial curriculum.

**French-Language Education**

Most instruction is provided in French through French-language schools where available.

**French Immersion**

Students learn some or much of their regular curriculum in French while enrolled in an immersion program.

**English-Language Learner Support (ESL / ELL)**

Students who are still learning English may receive additional language support to help them participate in regular classes.

*Language options and support programs vary by province, school board and individual school.*$education$, null, 1),

  ('Education & Family', 'Understand My School Choices', 'document-copy', 'Understand My School Choices', $education$#### Public Schools

**Publicly Funded Education**

Public schools are government-funded and generally do not charge regular tuition for eligible students.

**English & French Education**

Public education may be available in English or French depending on the province, territory and community.

**Catholic / Separate Schools**

Some provinces and territories also have publicly funded Catholic or separate school systems.

**French Immersion**

Some public schools offer programs where students learn part of their regular curriculum in French.

*Public-school systems and available options vary across Canada.*

#### Private / Independent Schools

**Tuition & Fees**

Families normally pay tuition and may also have registration, uniform, transportation or activity costs.

**Scholarships & Financial Assistance**

Some private or independent schools may offer scholarships, bursaries, discounts or other tuition assistance based on school-specific criteria.

**Admissions**

Private schools establish their own application, assessment and enrollment processes.

**Curriculum & Programs**

Schools may offer different curricula, teaching approaches, religious education or specialized programs.

**Single-Gender Schools**

Some private schools provide boys-only or girls-only education.

**Alternative / Microschool Models**

Some independent schools use smaller, personalized or condensed learning models, including microschool-style programs.

**Transportation**

Transportation may be provided by the school or arranged by the family.

**Provincial Requirements**

Recognition, oversight and education requirements for private schools vary by province or territory.

*Families should verify the school’s status and requirements with the applicable provincial or territorial education authority.*

#### Homeschool / Home Education

**Parent-Directed Education**

Parents or guardians take primary responsibility for educating their child outside a regular school setting.

**Provincial Requirements**

Home-education rules and family responsibilities differ by province or territory.

**Notification / Registration**

Some jurisdictions require families to notify or register with a school board or education authority.

**Curriculum & Learning**

Curriculum expectations, learning plans and required subjects may differ depending on the province.

**Assessment & Reporting**

Some jurisdictions may have requirements related to student progress, records, assessments or reporting.

**Learning Resources**

Families may use textbooks, online learning, community programs and other educational resources.

**Returning to School**

Local enrollment and grade-placement processes may apply if a homeschooled child later enters a school.

*Families should always check the official home-education requirements for their province or territory.*

#### Quick Comparison

**Compare Public & Private School Performance**

*This comparison explains the differences only. Moving Assistant does not rank or recommend one option over another.*

#### Trusted Sources

**Provincial / Territorial Education Authority**

Official education policies and schooling requirements.

**Local School Board / District**

Curriculum & Learning Standards.

**Official Private-School Guidance**

Private-school registration, recognition and provincial requirements.

**Official Home-Education Guidance**

Homeschool requirements, responsibilities and policies..$education$, null, 1),

  ('Education & Family', 'Eligibility, Enrollment & Preparation', 'document-copy', 'Eligibility, Enrollment & Preparation', $education$#### Eligibility to Attend

Eligibility generally depends on the child’s age, place of residence, immigration or residency status, and the rules of the applicable province and school board.

**Eligibility should always be confirmed with the official school board or provincial education authority.**

#### Enrollment Process

Families generally identify the appropriate school board or school, complete registration, submit required documents and attend any required assessment before placement is confirmed.

Canada.ca notes that when a child first enrolls in a Canadian school, the school or school board may assess the child’s education level and determine appropriate placement and language support.

#### Documents You May Need

Families may be asked for proof of the child’s age, home address, immigration or guardianship status, previous school records, and health or immunization information where required.

**Required documents vary by province, school board and family circumstances.**

#### Assessments & Placement

Schools or boards may review the child’s age, previous education and language or academic needs to determine an appropriate grade placement and support.

*Language assessment is used to identify support needs, not to prevent a child from attending school.*

Canada.ca specifically says first-time enrollment may include an education-level assessment and a determination of whether the student needs free English- or French-language support.

#### Special Education & Student Support

Schools and boards may provide learning, accessibility, gifted, language, counselling and newcomer support to help children succeed and adjust to their new school.

**Language • School Adjustment • Well-being • Social Connection**

*Newcomer programs, counsellors, settlement workers, peer activities and school clubs may help children learn the language, adjust to school life and build new friendships.*

*That is supported by current federal newcomer guidance. Canada.ca specifically recognizes learning a new language and making new friends as significant challenges for newcomer youth, and notes that schools may provide cultural liaisons, social workers, guidance counsellors and Settlement Workers in Schools.*

#### Prepare for School

Families can prepare by gathering school records and required documents, learning about the local school routine, and helping the child understand what to expect before the first day.

**Before Moving**

Gather report cards, transcripts, identification and other important school records.

**After Arrival**

Confirm the school or board, complete enrollment and attend any required assessment or orientation.

**Before the First Day**

Review the school schedule, transportation, supplies, routines and available newcomer supports.

**Trusted links: Canada.ca newcomer enrollment guidance, provincial ministry, local school board and official student-support pages.**$education$, null, 1),

  ('Education & Family', 'School Life & Family Decisions', 'document-copy', 'School Life & Family Decisions', $education$**Goal: Help families evaluate the overall student experience — academics, activities, future opportunities, safety, school culture and well-being — before choosing a school or neighbourhood.**

#### Academics & Specialized Programs

Explore the school’s curriculum and learning opportunities, including STEM, gifted education, French immersion, International Baccalaureate (IB), Advanced Placement (AP), arts, technology and other specialized programs. Availability and admission requirements vary by province, school board and individual school.

#### Extracurricular Activities & Student Life

Look beyond academics to understand opportunities for sports, arts, music, clubs, robotics/coding, debate, volunteering and student leadership. These programs can play an important role in a child’s social development, interests, friendships and overall school experience.

#### Future Pathways & Career Exploration

Understand how secondary-school course choices can prepare students for university, college, skilled trades, apprenticeships, co-operative education (co-op) or the workplace. Families should also explore guidance counselling, career-planning resources and experiential-learning opportunities available through the school or board.

#### Safety, Well-being & Family Notifications

Review how the school supports student safety, attendance monitoring, bullying prevention, emergency preparedness and student well-being. Families should also understand how schools communicate urgent information through absence notifications, emergency alerts, school-board notices and parent communication channels.

#### School Culture, Belonging & Inclusion

Consider the overall school climate, including respect, diversity, inclusion, student belonging, relationships between students and staff, parent engagement and support for different learning needs. A positive school culture can significantly influence a child’s comfort, confidence and ability to thrive.

Families may review school profiles, board policies, parent resources and school-community information to better understand whether the environment aligns with their child’s and family’s needs.$education$, null, 1),

  ('Education & Family', 'Colleges & Universities', 'document-copy', 'Colleges & Universities', $education$**Goal: Help students and families understand Canada’s post-secondary education options, compare programs and institutions, understand admission and cost requirements, and plan for future education and career opportunities.**

#### Understand Your Post-Secondary Options

##### College vs University

**Universities — deeper subject knowledge and degree-based pathways**

Universities commonly offer bachelor’s, master’s and doctoral degrees, combining academic knowledge, analytical skills and opportunities for research. They can support goals such as pursuing a career that requires a degree, entering graduate or professional studies, or developing expertise in a subject. Some programs also offer co-op placements and practical training.

**Colleges — practical skills for a specific career or career change**

Colleges commonly offer certificates, diplomas, graduate certificates and some degrees, with an emphasis on hands-on learning and industry skills. They can help students prepare for a particular occupation, change careers or add practical specialization to an existing qualification. Depending on the program, learning may include projects, labs and work placements.

**Choose the program that supports your next step**

Both routes can lead to employment and further education. Compare the qualification your intended career requires, the skills you will learn and the work experience offered. College-to-university transfer pathways also exist, but eligibility and credit transfers vary by program.

#### Find & Compare Colleges, Universities and Programs

**Search by Program & Career Interest**

Explore programs based on the student’s interests and career goals — such as business, engineering, healthcare, technology, artificial intelligence, sciences, skilled trades, arts and social sciences.

**Compare Institutions**

Consider factors beyond rankings, including program quality, location, campus environment, class size, student services, employer connections and experiential-learning opportunities.

#### Admissions, Eligibility & Cost Planning

##### Admission Requirements

Admission requirements vary by institution, program and level of study. Common factors may include academic grades or GPA, prerequisite courses, language proficiency and, for some programs, supplementary requirements such as tests, portfolios or other assessments.

Because requirements can differ significantly—especially for competitive, professional or graduate programs—students should always confirm the latest criteria directly on the institution or program website.

Internationally educated students may also need to provide additional academic documentation or credential assessments.

##### Tuition, Scholarships & Financial Assistance

Understand the complete cost of education, including tuition, books, transportation, housing and everyday living expenses.

Explore available scholarships, bursaries, grants and student financial-assistance programs.

Ontario Resource: Ontario Student Assistance Program (OSAP)

**Financial aid:** OSAP provides eligible Ontario students with grants and student loans for college or university.

##### International Student Considerations

International students should verify the institution’s DLI status and review current study-permit requirements before applying.

#### Student Experience, Career & Future Pathways

##### Co-op, Internships & Experiential Learning

Canadian programs often place strong value on practical experience such as co-op, internships, projects, volunteering, research and extracurricular activities—not only academic grades.

Students should check whether a program offers hands-on learning opportunities that align with their career goals.

##### Campus Life, Support & Well-being

International students can make the transition easier by actively using university support services, joining student and community activities, volunteering, building connections outside their own cultural group, and learning how Canadian academic and workplace culture may differ from what they are used to.

##### Career Outcomes & Further Education

Before choosing a program, look beyond the credential and check where graduates typically go next.

**Compare:**

* **Career paths** — What occupations does the program commonly lead to?
* **Employment outcomes** — How are graduates doing after completion?
* **Salary & job outlook** — What are typical wages and future prospects for related occupations?
* **Further education** — Can the credential lead to graduate study, professional certification or transfer to another program?

#### Useful links

**Canada-wide:** EduCanada lets users search programs, colleges and universities and explore study costs across Canada. [Search Colleges & Universities – EduCanada](https://www.educanada.ca/programs-programmes/index.aspx?lang=eng&utm_source=chatgpt.com)

**Ontario universities:** OUAC is Ontario's centralized university application service, while OUInfo helps students research programs and admission requirements. [Ontario Universities – OUAC](https://www.ouac.on.ca/?utm_source=chatgpt.com)

**Ontario colleges:** Ontario Colleges provides program search, admission information and the application process in one place. [Search Ontario College Programs](https://www.ontariocolleges.ca/en/programs?utm_source=chatgpt.com)

**Financial aid:** OSAP provides eligible Ontario students with grants and student loans for college or university. [Ontario Student Assistance Program – OSAP](https://www.ontario.ca/page/learn-about-osap?utm_source=chatgpt.com)

**International students:** Canada's official DLI list identifies public and private institutions authorized to host international students and also indicates relevant program eligibility information. [Canada – Designated Learning Institutions](https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/study-permit/prepare/designated-learning-institutions-list.html?utm_source=chatgpt.com)$education$, null, 1),

  ('Education & Family', 'ESL Classes', 'document-copy', 'ESL Classes', $education$**Goal: Support newcomers in developing English skills for daily communication, career growth, academic pursuits, and Canadian integration.**

#### Free Government-Funded Classes

Qualified permanent residents and protected persons may access Language Instruction for Newcomers to Canada (LINC) at no cost.

#### Flexible Learning Options

Programs often offer in-person or digital delivery with diverse scheduling, including part-time and full-time tracks ranging from introductory to senior levels.

#### Toronto ESL Programs

The TDSB provides adult learners with free English instruction across the city, specializing in general, professional, and college preparatory curriculum.

#### Language Assessment

Prior to enrollment in federal programs, families may undergo a language review to determine their Canadian Language Benchmark (CLB) standing.$education$, null, 1),

  ('Education & Family', 'Trade Schools & Certifications', 'document-copy', 'Trade Schools & Certifications', $education$**Goal: Help newcomers understand skilled-trade and career-focused training options in Canada, including apprenticeships, trade schools, certification requirements and pathways to employment.**

#### Understand Skilled Trades & Apprenticeships

**Skilled Trades**

Careers such as electrician, plumber, carpenter, welder, automotive service technician, cook, HVAC technician and many others combine specialized technical knowledge with hands-on work.

**Apprenticeship — Earn While You Learn**

An apprenticeship combines paid on-the-job training with periods of classroom or technical instruction. Apprentices generally work under experienced tradespeople while completing the requirements for certification.

**Typical pathway:**

Choose a Trade → Find an Employer/Sponsor → Register as an Apprentice → Complete Work + Technical Training → Obtain Certification

#### Find Trade Programs & Training

Training may be available through:

* Colleges and technical institutes
* Apprenticeship training centres
* Union or industry training programs
* Pre-apprenticeship programs
* Career and vocational schools

Some college skilled-trades programs can also satisfy part of the classroom-training requirements for an apprenticeship.

#### Certification & Red Seal

**Certificate of Qualification**

After completing the required training and work experience, workers in many trades can qualify for provincial or territorial trade certification.

**Red Seal Endorsement**

For designated Red Seal trades, qualified tradespeople can take the Red Seal examination. Passing demonstrates that the worker has met the Canadian national standard for that trade and helps facilitate recognition across provinces and territories.

**Certification and licensing requirements vary by trade and by province or territory. Newcomers should verify requirements with the applicable provincial or territorial apprenticeship authority.**

#### Cost, Financial Support & Career Pathway

Apprentices normally earn wages while completing their on-the-job training, but they may still have costs for classroom training, tools, equipment, examinations or certification.

Eligible apprentices in designated Red Seal trades may also have access to federal or provincial financial-support programs.

Before selecting a program, newcomers should compare:

**Training → Apprenticeship → Certification → Employment → Red Seal / Career Growth**

Also check whether the occupation requires mandatory certification or licensing in the province where you plan to work.$education$, null, 1);

-- Source-backed rows keep every published link available as source.url for
-- frontend Website buttons without duplicating the document copy.
insert into public.static_content (
  category, subcategory, section_key, title, body_markdown, source_id, display_order
)
select
  'Education & Family',
  v.subcategory,
  v.section_key,
  v.title,
  '',
  t.id,
  v.display_order
from (values
  ('Understand Schools in Canada', 'cicic-education-authorities', 'CICIC education authorities', 'CICIC education authorities', 'https://www.cicic.ca/1301/ministries_departments_responsible_for_education_in_canada.canada', 2),
  ('Understand Schools in Canada', 'fraser-school-report-cards', 'Fraser Institute – Ontario School Report Cards', 'Fraser Institute – Ontario School Report Cards', 'https://www.fraserinstitute.org/categories/school-report-cards', 3),
  ('Understand Schools in Canada', 'eqao-find-my-school', 'EQAO Find My School', 'EQAO Find My School', 'https://www.eqao.com/the-assessments/find-my-school/', 4),
  ('Understand Schools in Canada', 'ontario-school-rankings', 'Ontario School Rankings', 'Ontario School Rankings', 'https://ontarioschoolrankings.ca/map/', 5),
  ('Understand Schools in Canada', 'educanada-education-system', 'EduCanada education system', 'EduCanada education system', 'https://www.educanada.ca/study-plan-etudes/system-education-systeme.aspx?lang=eng', 6),
  ('Understand My School Choices', 'homeschool-guidance', 'Canadian Homeschooler legal guide', 'Canadian Homeschooler legal guide', 'https://thecanadianhomeschooler.com/legalities-of-homeschooling-in-canada-quick-guide/', 2),
  ('Understand My School Choices', 'fraser-school-report-cards', 'Fraser Institute – Ontario School Report Cards', 'Fraser Institute – Ontario School Report Cards', 'https://www.fraserinstitute.org/categories/school-report-cards', 3),
  ('Understand My School Choices', 'our-kids-comparison', 'Toronto Public vs Private Schools – Our Kids', 'Toronto Public vs Private Schools – Our Kids', 'https://www.ourkids.net/school/toronto-private-vs-public-schools', 4),
  ('Understand My School Choices', 'private-school-guidance', 'Official Private-School Guidance', 'Official Private-School Guidance', 'https://www.international.gc.ca/protocol-protocole/policies-politiques/education-schooling-scolarisation.aspx?lang=eng', 5),
  ('Eligibility, Enrollment & Preparation', 'newcomer-enrollment-guidance', 'Canada.ca newcomer enrollment guidance', 'Canada.ca newcomer enrollment guidance', 'https://www.canada.ca/en/immigration-refugees-citizenship/services/settle-canada/education/school-life.html', 2),
  ('Eligibility, Enrollment & Preparation', 'newcomer-youth-services', 'Canada.ca newcomer youth services', 'Canada.ca newcomer youth services', 'https://www.canada.ca/en/immigration-refugees-citizenship/services/settle-canada/youth-services.html', 3),
  ('School Life & Family Decisions', 'school-life', 'Canada.ca newcomer enrollment guidance', 'Canada.ca newcomer enrollment guidance', 'https://www.canada.ca/en/immigration-refugees-citizenship/services/settle-canada/education/school-life.html', 2),
  ('School Life & Family Decisions', 'cancode-program', 'CanCode Program', 'CanCode Program', 'https://ised-isde.canada.ca/site/ised/en/programs-and-initiatives/cancode/cancode-program-2026-2028-applicant-guide', 3),
  ('School Life & Family Decisions', 'newcomer-youth-services', 'Canada.ca newcomer youth services', 'Canada.ca newcomer youth services', 'https://www.canada.ca/en/immigration-refugees-citizenship/services/settle-canada/youth-services.html', 4),
  ('School Life & Family Decisions', 'education-career-planning', 'Ontario – Education and Career Planning', 'Ontario – Education and Career Planning', 'https://www.ontario.ca/page/education-and-career-planning', 5),
  ('School Life & Family Decisions', 'cooperative-education', 'Ontario – Cooperative Education', 'Ontario – Cooperative Education', 'https://www.ontario.ca/page/cooperative-education-co-op-courses', 6),
  ('School Life & Family Decisions', 'safe-accepting-schools', 'Ontario – Creating Safe and Accepting Schools', 'Ontario – Creating Safe and Accepting Schools', 'https://www.ontario.ca/page/creating-safe-and-accepting-schools', 7),
  ('School Life & Family Decisions', 'safe-arrival-program', 'TDSB – Safe Arrival Program', 'TDSB – Safe Arrival Program', 'https://www.tdsb.on.ca/High-School/Caring-Safe-Schools/Safe-Arrival-Program', 8),
  ('School Life & Family Decisions', 'healthy-settings', 'Canada – Healthy Settings for Young People', 'Canada – Healthy Settings for Young People', 'https://www.canada.ca/en/public-health/services/publications/science-research-data/healthy-settings-young-people-canada.html', 9),
  ('Colleges & Universities', 'college-university-pathways', 'EduCanada – College and University Pathways', 'EduCanada – College and University Pathways', 'https://www.educanada.ca/programs-programmes/pathways-voies.aspx?lang=eng', 2),
  ('Colleges & Universities', 'ontario-college-program-types', 'Ontario Colleges – Program Types', 'Ontario Colleges – Program Types', 'https://www.ontariocolleges.ca/en/program-types', 3),
  ('Colleges & Universities', 'educanada-program-search', 'Search Colleges & Universities – EduCanada', 'Search Colleges & Universities – EduCanada', 'https://www.educanada.ca/programs-programmes/index.aspx?lang=eng', 4),
  ('Colleges & Universities', 'ouac', 'Ontario Universities – OUAC', 'Ontario Universities – OUAC', 'https://www.ouac.on.ca/', 5),
  ('Colleges & Universities', 'ouinfo', 'Toronto Universities – OUInfo', 'Toronto Universities – OUInfo', 'https://ouinfo.ca/universities/', 6),
  ('Colleges & Universities', 'ontario-college-program-search', 'Search Ontario College Programs', 'Search Ontario College Programs', 'https://www.ontariocolleges.ca/en/programs/', 7),
  ('Colleges & Universities', 'centennial-college', 'Centennial College – Toronto / GTA', 'Centennial College – Toronto / GTA', 'https://www.centennialcollege.ca', 8),
  ('Colleges & Universities', 'times-higher-education', 'Times Higher Education – Best Universities in Canada', 'Times Higher Education – Best Universities in Canada', 'https://www.timeshighereducation.com/student/best-universities/best-universities-canada', 9),
  ('Colleges & Universities', 'qs-rankings', 'QS World University Rankings – Canada', 'QS World University Rankings – Canada', 'https://www.topuniversities.com/world-university-rankings?region=North%20America&countries=ca', 10),
  ('Colleges & Universities', 'educanada-apply', 'EduCanada – How to Apply to School in Canada', 'EduCanada – How to Apply to School in Canada', 'https://www.educanada.ca/study-plan-etudes/before-avant/apply-school_canada_demande-ecole.aspx?lang=eng', 11),
  ('Colleges & Universities', 'educanada-universities', 'EduCanada – Universities in Canada', 'EduCanada – Universities in Canada', 'https://www.educanada.ca/study-plan-etudes/university-universite.aspx?lang=eng', 12),
  ('Colleges & Universities', 'ontario-colleges-apply', 'Ontario Colleges – How to Apply', 'Ontario Colleges – How to Apply', 'https://www.ontariocolleges.ca/en/applying/how-to-apply', 13),
  ('Colleges & Universities', 'osap', 'Ontario Student Assistance Program – OSAP', 'Ontario Student Assistance Program – OSAP', 'https://www.ontario.ca/page/learn-about-osap', 14),
  ('Colleges & Universities', 'dli-list', 'Canada – Designated Learning Institutions', 'Canada – Designated Learning Institutions', 'https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/study-permit/prepare/designated-learning-institutions-list.html', 15),
  ('Colleges & Universities', 'cooperative-education', 'Ontario – Cooperative Education', 'Ontario – Cooperative Education', 'https://www.ontario.ca/page/cooperative-education-co-op-courses', 16),
  ('Colleges & Universities', 'study-programs', 'EduCanada – Study Programs in Canada', 'EduCanada – Study Programs in Canada', 'https://www.educanada.ca/programs-programmes/index.aspx?lang=eng', 17),
  ('Colleges & Universities', 'during-your-studies', 'EduCanada – During Your Studies', 'EduCanada – During Your Studies', 'https://www.educanada.ca/study-plan-etudes/during-pendant/index.aspx?lang=eng', 18),
  ('Colleges & Universities', 'community-connections', 'Canada.ca – Connecting with Your Community', 'Canada.ca – Connecting with Your Community', 'https://www.canada.ca/en/immigration-refugees-citizenship/services/settle-canada/community-connections.html', 19),
  ('Colleges & Universities', 'get-ready', 'EduCanada – Get Ready to Come to Canada', 'EduCanada – Get Ready to Come to Canada', 'https://www.educanada.ca/start-commencez/step-5-etape.aspx?lang=eng', 20),
  ('Colleges & Universities', 'study-in-canada', 'EduCanada – Study in Canada', 'EduCanada – Study in Canada', 'https://www.educanada.ca/index.aspx?lang=eng', 21),
  ('Colleges & Universities', 'labour-market-information', 'Government of Canada Job Bank – Labour Market Information', 'Government of Canada Job Bank – Labour Market Information', 'https://www.jobbank.gc.ca/trend-analysis', 22),
  ('Colleges & Universities', 'school-work-transition', 'Job Bank – School-to-Work Transition Tool', 'Job Bank – School-to-Work Transition Tool', 'https://www.jobbank.gc.ca/career-planning/school-work-transition', 23),
  ('ESL Classes', 'language-classes-newcomers', 'Government of Canada – Language Classes for Newcomers', 'Government of Canada – Language Classes for Newcomers', 'https://www.canada.ca/en/immigration-refugees-citizenship/services/settle-canada/language-skills/classes.html', 2),
  ('ESL Classes', 'adult-esl-programs', 'Ontario – Adult ESL Programs', 'Ontario – Adult ESL Programs', 'https://www.ontario.ca/page/adult-learning-english-second-language', 3),
  ('ESL Classes', 'tdsb-adult-esl', 'TDSB – Adult ESL Classes', 'TDSB – Adult ESL Classes', 'https://www.tdsb.on.ca/communityservices/Adult-ESL', 4),
  ('Trade Schools & Certifications', 'become-apprentice', 'Government of Canada – Become an Apprentice', 'Government of Canada – Become an Apprentice', 'https://www.canada.ca/en/services/jobs/training/support-skilled-trades-apprentices/become-apprentice.html', 2),
  ('Trade Schools & Certifications', 'ontario-skilled-trades', 'Ontario – Skilled Trades', 'Ontario – Skilled Trades', 'https://www.ontario.ca/page/skilled-trades', 3),
  ('Trade Schools & Certifications', 'ontario-apprenticeship', 'Ontario – Apprenticeship', 'Ontario – Apprenticeship', 'https://www.ontario.ca/page/apprenticeship-ontario', 4),
  ('Trade Schools & Certifications', 'red-seal-trades', 'Red Seal – Trades in Canada', 'Red Seal – Trades in Canada', 'https://red-seal.ca/eng/trades/trades-canada.shtml', 5),
  ('Trade Schools & Certifications', 'red-seal-program', 'Government of Canada – Red Seal Program', 'Government of Canada – Red Seal Program', 'https://www.canada.ca/en/employment-social-development/programs/skilled-trades-apprenticeships.html', 6),
  ('Trade Schools & Certifications', 'apprentice-loan', 'Canada Apprentice Loan', 'Canada Apprentice Loan', 'https://www.canada.ca/en/services/jobs/training/support-skilled-trades-apprentices/loan.html', 7)
) as v(subcategory, section_key, title, source_name, source_url, display_order)
join public.trusted_sources t
  on t.name = v.source_name
 and t.url = v.source_url
on conflict (category, subcategory, section_key) do update set
  title = excluded.title,
  body_markdown = excluded.body_markdown,
  source_id = excluded.source_id,
  display_order = excluded.display_order,
  updated_at = now();

