-- Seed the Schools content area for Education & Family.
-- Depends on 20260907090000_claim_store_and_static_content.sql.

delete from public.static_content
where category = 'Education & Family'
  and subcategory in (
    'Understand Schools in Canada',
    'Understand My School Choices',
    'Eligibility, Enrollment & Preparation',
    'School Life & Family Decisions'
  );

insert into public.trusted_sources (name, url, authority_tier, jurisdiction)
select v.name, v.url, v.authority_tier, v.jurisdiction
from (values
  ('CICIC education authorities', 'https://www.cicic.ca/1301/ministries_departments_responsible_for_education_in_canada.canada', 'A', 'Canada'),
  ('EduCanada education system', 'https://www.educanada.ca/study-plan-etudes/system-education-systeme.aspx?lang=eng', 'A', 'Canada'),
  ('Fraser Institute school report cards', 'https://www.fraserinstitute.org/categories/school-report-cards', 'C', 'Ontario'),
  ('EQAO Find My School', 'https://www.eqao.com/the-assessments/find-my-school/', 'B', 'Ontario'),
  ('Ontario School Rankings', 'https://ontarioschoolrankings.ca/map/', 'C', 'Ontario'),
  ('Canadian Homeschooler legal guide', 'https://thecanadianhomeschooler.com/legalities-of-homeschooling-in-canada-quick-guide/', 'C', 'Canada'),
  ('Canada private-school guidance', 'https://www.international.gc.ca/protocol-protocole/policies-politiques/education-schooling-scolarisation.aspx?lang=eng', 'A', 'Canada'),
  ('Our Kids public and private school comparison', 'https://www.ourkids.net/school/toronto-private-vs-public-schools', 'C', 'Toronto'),
  ('Canada school life guidance', 'https://www.canada.ca/en/immigration-refugees-citizenship/services/settle-canada/education/school-life.html', 'A', 'Canada'),
  ('Canada newcomer youth services', 'https://www.canada.ca/en/immigration-refugees-citizenship/services/settle-canada/youth-services.html', 'A', 'Canada'),
  ('CanCode program', 'https://ised-isde.canada.ca/site/ised/en/programs-and-initiatives/cancode/cancode-program-2026-2028-applicant-guide', 'A', 'Canada'),
  ('Ontario education and career planning', 'https://www.ontario.ca/page/education-and-career-planning', 'A', 'Ontario'),
  ('Ontario cooperative education', 'https://www.ontario.ca/page/cooperative-education-co-op-courses', 'A', 'Ontario'),
  ('Ontario safe and accepting schools', 'https://www.ontario.ca/page/creating-safe-and-accepting-schools', 'A', 'Ontario'),
  ('TDSB Safe Arrival Program', 'https://www.tdsb.on.ca/High-School/Caring-Safe-Schools/Safe-Arrival-Program', 'A', 'Toronto'),
  ('Canada healthy settings for young people', 'https://www.canada.ca/en/public-health/services/publications/science-research-data/healthy-settings-young-people-canada.html', 'A', 'Canada')
) as v(name, url, authority_tier, jurisdiction)
where not exists (
  select 1
  from public.trusted_sources t
  where t.name = v.name and t.url = v.url
);

insert into public.static_content (
  category, subcategory, section_key, title, body_markdown, source_id, display_order
)
select
  'Education & Family',
  v.subcategory,
  v.section_key,
  v.title,
  v.body_markdown,
  case when v.source_name is null then null else (
    select t.id
    from public.trusted_sources t
    where t.name = v.source_name and t.url = v.source_url
    order by t.created_at
    limit 1
  ) end,
  v.display_order
from (values
  -- Understand Schools in Canada
  ('Understand Schools in Canada', 'description', 'Understand Schools in Canada', $education$Learn the basics of how the Canadian school system works.$education$, null, null, 1),
  ('Understand Schools in Canada', 'canadian-education-system', 'How the Canadian School System Works', $education$**Province / Territory Curriculum & Learning Standards**

Each province or territory defines:

- Curriculum & Learning Standards
- Grade Structure & School Year
- Graduation Requirements
- Education Policies & Funding$education$, 'CICIC education authorities', 'https://www.cicic.ca/1301/ministries_departments_responsible_for_education_in_canada.canada', 2),
  ('Understand Schools in Canada', 'school-board-district', 'School Board / District', $education$
  
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

*Services, programs and policies vary by school board or district.*$education$, null, null, 3),
  ('Understand Schools in Canada', 'home-address', 'Your Home Address', $education$
  
**Home Address**

The residential address where the child lives and that may be used for public-school enrollment.

**Attendance / Catchment Boundary**

The geographic area a school board may use to determine which public school serves a neighbourhood.

**Designated School**

The public school normally assigned to students living within that attendance area.

*Boundaries and exceptions vary by school board, so families should verify the designated school with an official source.*$education$, 'EQAO Find My School', 'https://www.eqao.com/the-assessments/find-my-school/', 4),
  ('Understand Schools in Canada', 'fraser-school-report-cards', 'Fraser Institute - Ontario School Report Cards', $education$Neighbourhood school report cards for public and private schools.$education$, 'Fraser Institute school report cards', 'https://www.fraserinstitute.org/categories/school-report-cards', 5),
  ('Understand Schools in Canada', 'ontario-school-rankings', 'Ontario School Rankings Map', $education$Neighbourhood school rankings map.$education$, 'Ontario School Rankings', 'https://ontarioschoolrankings.ca/map/', 6),
  ('Understand Schools in Canada', 'schools-programs', 'Schools & Programs', $education$**Language Options**

Schools may provide English-language, French-language, French Immersion and ESL/ELL learning options or support.

**Academic Programs**

Depending on the school or board, students may have access to STEM, robotics, gifted, IB, AP or other specialized programs.

**Arts, Sports & Activities**

Schools may offer music, visual arts, sports, clubs and extracurricular activities alongside regular academics.

**Newcomer Support**

Some schools provide language, settlement and adjustment support to help newcomer students transition into Canadian schooling.

**Special Education & Accessibility**

Schools and boards may provide individualized learning, special-education and accessibility support based on student needs.

*Programs and student supports vary by province, school board and individual school.*$education$, null, null, 7),
  ('Understand Schools in Canada', 'school-levels-grades', 'School Levels & Grades', $education$**Kindergarten**

Usually begins around age 5; the required age and cutoff date are set by each province or territory.

**Elementary / Primary School**

Usually begins around age 6 and covers the early school years; grade ranges vary across Canada.

**Middle School / Junior High**

Usually serves students around ages 11-14, but some school systems do not have a separate middle-school stage.

**High School / Secondary School**

Usually serves students around ages 14-18; placement is generally based on grade progression, previous schooling and local requirements.

**Age & Grade Placement**

Newcomer students may be placed based on age, previous school records and the local school board's placement process.$education$, null, null, 8),
  ('Understand Schools in Canada', 'how-school-boards-work', 'How School Boards Work', $education$Public schools are generally managed through local school boards, districts or other public education authorities. Private and independent schools operate separately under their own governance structures and must follow applicable provincial or territorial requirements.

**School Board / District**

Local school boards or districts manage groups of public schools in their communities.

**Attendance Boundaries**

Boards may divide communities into geographic areas that determine which public school normally serves a neighbourhood.

**Local Policies & Services**

Boards manage local rules and services such as enrollment, transportation, student support, school calendars and specialized programs.

**Home Address**

A family's residential address may affect the child's designated public school and sometimes transportation eligibility.

**Parent & Community Involvement**

Parents may participate through school councils, volunteering, board meetings and community organizations.

*School-board names, boundaries, policies and services can vary by province and community.*$education$, null, null, 9),
  ('Understand Schools in Canada', 'language-of-education', 'Language of Education', $education$**English-Language Education**

Most instruction is provided in English, with subjects taught using the provincial or territorial curriculum.

**French-Language Education**

Most instruction is provided in French through French-language schools where available.

**French Immersion**

Students learn some or much of their regular curriculum in French while enrolled in an immersion program.

**English-Language Learner Support (ESL / ELL)**

Students who are still learning English may receive additional language support to help them participate in regular classes.

*Language options and support programs vary by province, school board and individual school.*$education$, 'EduCanada education system', 'https://www.educanada.ca/study-plan-etudes/system-education-systeme.aspx?lang=eng', 10),

  -- Understand My School Choices
  ('Understand My School Choices', 'description', 'Understand My School Choices', $education$Explore the types of schools available for your child.$education$, null, null, 1),
  ('Understand My School Choices', 'public-schools', 'Public Schools', $education$**Publicly Funded Education**

Public schools are government-funded and generally do not charge regular tuition for eligible students.

**English & French Education**

Public education may be available in English or French depending on the province, territory and community.

**Catholic / Separate Schools**

Some provinces and territories also have publicly funded Catholic or separate school systems.

**French Immersion**

Some public schools offer programs where students learn part of their regular curriculum in French.

*Public-school systems and available options vary across Canada.*$education$, null, null, 2),
  ('Understand My School Choices', 'private-independent-schools', 'Private / Independent Schools', $education$**Tuition & Fees**

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

*Families should verify the school's status and requirements with the applicable provincial or territorial education authority.*$education$, 'Canada private-school guidance', 'https://www.international.gc.ca/protocol-protocole/policies-politiques/education-schooling-scolarisation.aspx?lang=eng', 3),
  ('Understand My School Choices', 'homeschool-home-education', 'Homeschool / Home Education', $education$**Parent-Directed Education**

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

*Families should always check the official home-education requirements for their province or territory.*$education$, 'Canadian Homeschooler legal guide', 'https://thecanadianhomeschooler.com/legalities-of-homeschooling-in-canada-quick-guide/', 4),
  ('Understand My School Choices', 'school-performance-comparison', 'Compare Public & Private School Performance', $education$This comparison explains the differences only. Moving Assistant does not rank or recommend one option over another.$education$, 'Fraser Institute school report cards', 'https://www.fraserinstitute.org/categories/school-report-cards', 5),
  ('Understand My School Choices', 'public-private-comparison', 'Toronto Public vs. Private Schools', $education$This comparison explains the differences only. Moving Assistant does not rank or recommend one option over another.$education$, 'Our Kids public and private school comparison', 'https://www.ourkids.net/school/toronto-private-vs-public-schools', 6),
  ('Understand My School Choices', 'trusted-sources', 'Trusted Sources', $education$**Provincial / Territorial Education Authority**

Official education policies and schooling requirements.

**Local School Board / District**

Curriculum & Learning Standards.

**Official Private-School Guidance**

Private-school registration, recognition and provincial requirements.

**Official Home-Education Guidance**

Homeschool requirements, responsibilities and policies.$education$, null, null, 7),

  -- Eligibility, Enrollment & Preparation
  ('Eligibility, Enrollment & Preparation', 'description', 'Eligibility, Enrollment & Preparation', $education$Understand requirements, steps and how to prepare.$education$, null, null, 1),
  ('Eligibility, Enrollment & Preparation', 'eligibility-to-attend', 'Eligibility to Attend', $education$Eligibility generally depends on the child's age, place of residence, immigration or residency status, and the rules of the applicable province and school board.

*Eligibility should always be confirmed with the official school board or provincial education authority.*$education$, null, null, 2),
  ('Eligibility, Enrollment & Preparation', 'enrollment-process', 'Enrollment Process', $education$Families generally identify the appropriate school board or school, complete registration, submit required documents and attend any required assessment before placement is confirmed.

Canada.ca notes that when a child first enrolls in a Canadian school, the school or school board may assess the child's education level and determine appropriate placement and language support.$education$, 'Canada school life guidance', 'https://www.canada.ca/en/immigration-refugees-citizenship/services/settle-canada/education/school-life.html', 3),
  ('Eligibility, Enrollment & Preparation', 'documents-you-may-need', 'Documents You May Need', $education$Families may be asked for proof of the child's age, home address, immigration or guardianship status, previous school records, and health or immunization information where required.

*Required documents vary by province, school board and family circumstances.*$education$, null, null, 4),
  ('Eligibility, Enrollment & Preparation', 'assessments-placement', 'Assessments & Placement', $education$Schools or boards may review the child's age, previous education and language or academic needs to determine an appropriate grade placement and support.

*Language assessment is used to identify support needs, not to prevent a child from attending school.*

Canada.ca specifically says first-time enrollment may include an education-level assessment and a determination of whether the student needs free English- or French-language support.$education$, 'Canada school life guidance', 'https://www.canada.ca/en/immigration-refugees-citizenship/services/settle-canada/education/school-life.html', 5),
  ('Eligibility, Enrollment & Preparation', 'student-support', 'Special Education & Student Support', $education$Schools and boards may provide learning, accessibility, gifted, language, counselling and newcomer support to help children succeed and adjust to their new school.

**Language - School Adjustment - Well-being - Social Connection**

Newcomer programs, counsellors, settlement workers, peer activities and school clubs may help children learn the language, adjust to school life and build new friendships.

Canada.ca specifically recognizes learning a new language and making new friends as significant challenges for newcomer youth, and notes that schools may provide cultural liaisons, social workers, guidance counsellors and Settlement Workers in Schools.$education$, 'Canada newcomer youth services', 'https://www.canada.ca/en/immigration-refugees-citizenship/services/settle-canada/youth-services.html', 6),
  ('Eligibility, Enrollment & Preparation', 'prepare-for-school', 'Prepare for School', $education$Families can prepare by gathering school records and required documents, learning about the local school routine, and helping the child understand what to expect before the first day.

**Before Moving**

Gather report cards, transcripts, identification and other important school records.

**After Arrival**

Confirm the school or board, complete enrollment and attend any required assessment or orientation.

**Before the First Day**

Review the school schedule, transportation, supplies, routines and available newcomer supports.$education$, null, null, 7),

  -- School Life & Family Decisions
  ('School Life & Family Decisions', 'description', 'School Life & Family Decisions', $education$Help families evaluate the overall student experience - academics, activities, future opportunities, safety, school culture and well-being - before choosing a school or neighbourhood.$education$, null, null, 1),
  ('School Life & Family Decisions', 'academics-specialized-programs', 'Academics & Specialized Programs', $education$Explore the school's curriculum and learning opportunities, including STEM, gifted education, French immersion, International Baccalaureate (IB), Advanced Placement (AP), arts, technology and other specialized programs. Availability and admission requirements vary by province, school board and individual school.$education$, 'Canada school life guidance', 'https://www.canada.ca/en/immigration-refugees-citizenship/services/settle-canada/education/school-life.html', 2),
  ('School Life & Family Decisions', 'cancode-program', 'CanCode Program', $education$CanCode Program 2026-2028.$education$, 'CanCode program', 'https://ised-isde.canada.ca/site/ised/en/programs-and-initiatives/cancode/cancode-program-2026-2028-applicant-guide', 3),
  ('School Life & Family Decisions', 'extracurricular-student-life', 'Extracurricular Activities & Student Life', $education$Look beyond academics to understand opportunities for sports, arts, music, clubs, robotics/coding, debate, volunteering and student leadership. These programs can play an important role in a child's social development, interests, friendships and overall school experience.$education$, 'Canada newcomer youth services', 'https://www.canada.ca/en/immigration-refugees-citizenship/services/settle-canada/youth-services.html', 4),
  ('School Life & Family Decisions', 'future-pathways', 'Future Pathways & Career Exploration', $education$Understand how secondary-school course choices can prepare students for university, college, skilled trades, apprenticeships, co-operative education (co-op) or the workplace. Families should also explore guidance counselling, career-planning resources and experiential-learning opportunities available through the school or board.$education$, 'Ontario education and career planning', 'https://www.ontario.ca/page/education-and-career-planning', 5),
  ('School Life & Family Decisions', 'cooperative-education', 'Co-operative Education', $education$Co-operative education and co-op courses.$education$, 'Ontario cooperative education', 'https://www.ontario.ca/page/cooperative-education-co-op-courses', 6),
  ('School Life & Family Decisions', 'safe-accepting-schools', 'Safety, Well-being & Family Notifications', $education$Review how the school supports student safety, attendance monitoring, bullying prevention, emergency preparedness and student well-being. Families should also understand how schools communicate urgent information through absence notifications, emergency alerts, school-board notices and parent communication channels.$education$, 'Ontario safe and accepting schools', 'https://www.ontario.ca/page/creating-safe-and-accepting-schools', 7),
  ('School Life & Family Decisions', 'family-notifications', 'Safe Arrival Program', $education$Attendance and family notifications.$education$, 'TDSB Safe Arrival Program', 'https://www.tdsb.on.ca/High-School/Caring-Safe-Schools/Safe-Arrival-Program', 8),
  ('School Life & Family Decisions', 'school-culture-belonging', 'School Culture, Belonging & Inclusion', $education$Consider the overall school climate, including respect, diversity, inclusion, student belonging, relationships between students and staff, parent engagement and support for different learning needs. A positive school culture can significantly influence a child's comfort, confidence and ability to thrive.

Families may review school profiles, board policies, parent resources and school-community information to better understand whether the environment aligns with their child's and family's needs.$education$, 'Canada healthy settings for young people', 'https://www.canada.ca/en/public-health/services/publications/science-research-data/healthy-settings-young-people-canada.html', 9)
) as v(
  subcategory,
  section_key,
  title,
  body_markdown,
  source_name,
  source_url,
  display_order
)
on conflict (category, subcategory, section_key) do update set
  title = excluded.title,
  body_markdown = excluded.body_markdown,
  source_id = excluded.source_id,
  display_order = excluded.display_order,
  updated_at = now();

