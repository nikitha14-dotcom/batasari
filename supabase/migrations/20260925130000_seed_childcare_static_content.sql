-- Childcare copy transcribed verbatim from the approved content document.
-- Inline Markdown links remain attached to the supplied labels.

insert into public.trusted_sources (name, url, authority_tier, jurisdiction)
select v.name, v.url, v.authority_tier, v.jurisdiction
from (values
  ('Choosing Quality Childcare — Parent Guide', 'https://findingqualitychildcare.ca/', 'B', 'Canada'),
  ('Alberta — Find Childcare', 'https://www.alberta.ca/find-childcare', 'A', 'Alberta'),
  ('Canada — Early Learning and Child Care agreements', 'https://www.canada.ca/en/early-learning-child-care-agreement/agreements-provinces-territories.html', 'A', 'Canada'),
  ('Canada Child Benefit overview', 'https://www.canada.ca/en/revenue-agency/services/child-family-benefits/canada-child-benefit.html', 'A', 'Canada'),
  ('Canada Child Benefit — Who can apply', 'https://www.canada.ca/en/revenue-agency/services/child-family-benefits/canada-child-benefit/who-apply.html', 'A', 'Canada'),
  ('CRA — Childcare Expense Deduction', 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/deductions-credits-expenses/line-21400-child-care-expenses.html', 'A', 'Canada'),
  ('Government of Canada Benefits Finder', 'https://www.canada.ca/en/services/benefits/finder/tool.html', 'A', 'Canada'),
  ('Ontario waiting-list guidance', 'https://www.ontario.ca/document/child-care-centre-licensing-manual/part-11-administrative-matters', 'A', 'Ontario'),
  ('Ontario — Before- and After-School Programs', 'https://www.ontario.ca/page/before-and-after-school-programs-what-parents-and-providers-need-know', 'A', 'Ontario'),
  ('Ontario — Childcare Rules', 'https://www.ontario.ca/page/child-care-rules-ontario', 'A', 'Ontario'),
  ('Ontario — Find childcare and check safety information', 'https://www.ontario.ca/page/find-and-pay-child-care', 'A', 'Ontario'),
  ('Ontario — EarlyON Child and Family Centres', 'https://www.ontario.ca/page/find-earlyon-child-and-family-centre', 'A', 'Ontario'),
  ('Ontario Child Benefit', 'https://www.ontario.ca/page/ontario-child-benefit', 'A', 'Ontario'),
  ('Quebec — Childcare services and registration', 'https://www.quebec.ca/en/family-and-support-for-individuals/childhood/childcare-centres', 'A', 'Quebec'),
  ('Quebec childcare registration', 'https://www.quebec.ca/en/family-and-support-for-individuals/childhood/childcare-centres/registration-portal/parents', 'A', 'Quebec'),
  ('Quebec — Prepare Your Registration', 'https://www.quebec.ca/en/family-and-support-for-individuals/childhood/childcare-centres/registration-portal/parents/prepare-registration', 'A', 'Quebec'),
  ('Toronto — Childcare Locator', 'https://www.toronto.ca/community-people/children-parenting/children-programs-activities/licensed-child-care/child-care-locator/', 'A', 'Toronto'),
  ('Toronto — City-Operated Childcare Waitlist Registration', 'https://www.toronto.ca/community-people/children-parenting/children-programs-activities/licensed-child-care/toronto-early-learning-and-child-care-services/registration/', 'A', 'Toronto'),
  ('Toronto — Child Care Fee Subsidy', 'https://www.toronto.ca/community-people/employment-social-support/child-family-support/child-care-support/', 'A', 'Toronto'),
  ('British Columbia — Types of Childcare', 'https://www2.gov.bc.ca/gov/content/family-social-supports/caring-for-young-children/family-information/licensed-unlicensed-child-care', 'A', 'British Columbia')
) as v(name, url, authority_tier, jurisdiction)
where not exists (
  select 1
  from public.trusted_sources t
  where t.name = v.name and t.url = v.url
);

delete from public.static_content
where category = 'Education & Family'
  and subcategory in (
    'Understand Childcare in Canada',
    'Find and Compare Childcare',
    'Costs and Financial Support',
    'Apply and Prepare'
  );

insert into public.static_content (
  category,
  subcategory,
  section_key,
  title,
  body_markdown,
  source_id,
  display_order
)
values
  ('Education & Family', 'Understand Childcare in Canada', 'document-copy', 'Understand Childcare in Canada', $childcare$# **Childcare in Canada**

Explore childcare options, find suitable providers, understand costs and support, and prepare your child for care.

Childcare rules, age groups, fees and application processes vary by province or territory. Start with your destination, then confirm the requirements of the specific provider.

## **Understand Childcare in Canada**

### **Childcare Centres**

Childcare centres provide care in group settings. They may operate in standalone buildings, schools, workplaces, community centres or other facilities.

Programs may serve infants, toddlers, preschoolers or school-age children. Confirm the ages accepted, operating hours and available schedules with each centre.

**Ontario example:** Licensed childcare centres are licensed by the Ministry of Education.

[Ontario childcare rules](https://www.ontario.ca/page/child-care-rules-ontario)

### **Home-Based Childcare**

Home-based childcare takes place in a caregiver’s home, often with a smaller group of children. Licensing and oversight arrangements differ across Canada.

**Ontario example:** The Ministry of Education licenses home childcare agencies. Individual home providers working with these agencies are screened, approved and monitored by the agency; they do not hold an individual Ministry licence.

Ask which agency supervises the provider, verify the agency’s licence, and confirm the provider’s current affiliation directly with the agency.

[Ontario childcare rules](https://www.ontario.ca/page/child-care-rules-ontario) · [Childcare types in British Columbia](https://www2.gov.bc.ca/gov/content/family-social-supports/caring-for-young-children/family-information/licensed-unlicensed-child-care)

### **Unlicensed or Licence-Not-Required Care**

Some home-based arrangements may legally operate without a childcare licence. The permitted arrangements, child-number limits and other requirements depend on the province or territory.

Unlicensed does not mean exempt from applicable laws. Check the local rules and understand what government oversight is—and is not—provided.

**Ontario example:** Unlicensed providers must follow applicable childcare rules and disclose their unlicensed status to parents in writing.

[Ontario childcare rules](https://www.ontario.ca/page/child-care-rules-ontario)

### **Before- and After-School Care**

These programs provide care outside regular school hours. They may operate at a school or another location and may have a separate registration process from school enrollment.

Ask about morning and afternoon hours, transportation or pickup arrangements, and coverage during school holidays and professional-development days.

**Ontario example:** School boards must ensure programming for Kindergarten to Grade 6 where there is sufficient demand and the program is viable. This does not guarantee an available place for every child.

[Ontario before- and after-school programs](https://www.ontario.ca/page/before-and-after-school-programs-what-parents-and-providers-need-know)

### **Age Groups and Care Schedules**

Providers may use labels such as infant, toddler, preschool and school-age care. Exact age boundaries and transition rules vary.

When comparing programs, confirm:

* Your child’s age when care would begin.  
* Full-time, part-time or occasional-care options.  
* Whether your preferred days and hours are available.  
* How moving into another age group affects fees and placement.

[Finding Quality Child Care — Canadian parent guide](https://findingqualitychildcare.ca/)

### **Family Programs and Playgroups**

Parent-and-child programs can help families meet others, explore activities and become familiar with community services. Check whether a parent or caregiver must remain throughout the session.

**Ontario example:** EarlyON centres offer free programs for children from birth to six years old and their families. These family programs should not be treated as a replacement for childcare while a parent works or studies.

[Find an EarlyON child and family centre](https://www.ontario.ca/page/find-earlyon-child-and-family-centre)

### **Helpful Links**

* [**Childcare Across Canada — Parent Guide**](https://findingqualitychildcare.ca/)  
  Explore childcare options and provincial or territorial differences. Published by the Childcare Resource and Research Unit; use official authorities to verify legal requirements.  
* [**Ontario — Childcare Rules**](https://www.ontario.ca/page/child-care-rules-ontario)  
  Understand licensed centres, agency-supervised home care and rules for unlicensed providers.  
* [**British Columbia — Types of Childcare**](https://www2.gov.bc.ca/gov/content/family-social-supports/caring-for-young-children/family-information/licensed-unlicensed-child-care)  
  Compare licensed and licence-not-required arrangements in B.C.  
* [**Ontario — Before- and After-School Programs**](https://www.ontario.ca/page/before-and-after-school-programs-what-parents-and-providers-need-know)  
  Learn how school-age programs operate and where to check requirements.$childcare$, null, 1),

  ('Education & Family', 'Find and Compare Childcare', 'document-copy', 'Find and Compare Childcare', $childcare$## **Find and Compare Childcare**

### **Start with Official Directories**

Use your provincial, territorial or local government’s childcare directory to identify options and find available licensing information.

Search by location, age group and care type where filters are available. Contact providers directly to confirm current openings; a directory listing does not establish availability.

**Useful starting points:**

* [Ontario — Find and pay for childcare](https://www.ontario.ca/page/find-and-pay-child-care)  
* [Toronto — Childcare locator](https://www.toronto.ca/community-people/children-parenting/children-programs-activities/licensed-child-care/child-care-locator/)  
* [Alberta — Find childcare](https://www.alberta.ca/find-childcare)  
* [Quebec — Childcare services and registration](https://www.quebec.ca/en/family-and-support-for-individuals/childhood/childcare-centres)  
* [Canada-wide parent guide — provincial and territorial information](https://findingqualitychildcare.ca/)

### **Check Licensing and Oversight**

Match the provider’s name and address to the official record. Review licence status, conditions, inspection information or enforcement notices where these are published.

For agency-supervised home childcare, verify both the agency’s status and its relationship with the particular home provider.

A provider’s advertisement, directory entry or use of words such as “registered” is not a substitute for verification with the responsible authority.

[Ontario — Find childcare and check safety information](https://www.ontario.ca/page/find-and-pay-child-care) · [Alberta — Lookup and inspection resources](https://www.alberta.ca/find-childcare)

### **Compare Location and Hours**

Consider the full journey between home, childcare and work or school.

Ask about opening and closing times, pickup deadlines, holiday closures and what happens when the usual caregiver is unavailable. Confirm that the schedule works on the days you actually need care.

### **Visit and Ask About Daily Care**

A visit can help you understand how the program operates and how caregivers interact with children.

Useful questions include:

* How do you comfort children who are upset or settling in?  
* What does a typical day include?  
* How are meals, naps, outdoor play and toileting handled?  
* How do you communicate with parents?  
* What are your illness, medication, emergency and pickup procedures?

[Finding Quality Child Care — parent guidance](https://findingqualitychildcare.ca/)

### **Discuss Your Child’s Needs**

Tell the provider about relevant allergies, accessibility needs, communication preferences and daily routines.

Ask what support is available, whether arrangements need to be made before the start date, and how staff will work with your family. Confirm any additional costs or external support requirements.

### **Compare More Than Price**

Use a simple checklist to compare the options that meet your needs:

| Consideration | What to confirm |
| ----- | ----- |
| Oversight | Licence or applicable legal operating arrangement |
| Availability | Space for the child’s age and intended start date |
| Schedule | Required days, hours and closure coverage |
| Daily care | Activities, routines and caregiver interactions |
| Inclusion | Support for the child’s individual needs |
| Communication | Updates, concerns and emergency contact procedures |
| Cost | Written fees, inclusions and financial-support participation  |

### **Helpful Links**

* [**Ontario — Find and Pay for Childcare**](https://www.ontario.ca/page/find-and-pay-child-care)  
  Find childcare options and access information about safety records and financial support.

* [**Toronto — Childcare Locator**](https://www.toronto.ca/community-people/children-parenting/children-programs-activities/licensed-child-care/child-care-locator/)  
  Search local licensed childcare options.

* [**Alberta — Find Childcare**](https://www.alberta.ca/find-childcare)  
  Access childcare lookup tools and inspection resources.

* [**Quebec — Childcare Services**](https://www.quebec.ca/en/family-and-support-for-individuals/childhood/childcare-centres)  
  Explore childcare services and the official registration portal.

* [**Choosing Quality Childcare — Parent Guide**](https://findingqualitychildcare.ca/)  
  Find practical guidance for comparing environments and asking providers questions.

##$childcare$, null, 1),

  ('Education & Family', 'Costs and Financial Support', 'document-copy', 'Costs and Financial Support', $childcare$## **Costs and Financial Support**

### **Understand the Full Cost**

Request a written fee schedule before accepting a place.

Confirm regular fees, what is included, and any applicable charges for meals, supplies, late pickup or additional services. Ask how absences, holidays, closures, deposits and withdrawal notice affect what you pay.

Compare the total expected cost for your required schedule.

### **Fee-Reduction Programs**

Government-funded fee reductions can lower the amount families pay at participating programs. Arrangements differ by province or territory, provider and child eligibility.

**Ontario example:** The Canada-wide Early Learning and Child Care system—CWELCC—supports reduced fees at participating licensed programs for eligible children, generally under six.

Ask whether the specific program participates and request its current fees. Do not assume that every licensed provider participates or that a national affordability target is the fee every family will pay.

[Canada — Early Learning and Child Care agreements](https://www.canada.ca/en/early-learning-child-care-agreement/agreements-provinces-territories.html) · [Ontario childcare rules and CWELCC](https://www.ontario.ca/page/child-care-rules-ontario)

### **Childcare Fee Subsidies**

A fee subsidy may help eligible families pay for childcare. Application routes, income assessments, other eligibility conditions and participating providers vary by location.

**Ontario example:** Families generally apply through their local childcare service-system manager. In Toronto, applications are handled by the City.

Confirm whether a separate subsidy application is needed, what documents are required, whether your chosen provider accepts subsidized placements, and whether there is a funding waitlist.

[Ontario — Find and pay for childcare](https://www.ontario.ca/page/find-and-pay-child-care) · [Toronto Child Care Fee Subsidy](https://www.toronto.ca/community-people/employment-social-support/child-family-support/child-care-support/)

### **Canada Child Benefit**

The Canada Child Benefit is a tax-free monthly payment for eligible families raising children under 18\. It supports general child-raising costs and is separate from childcare fee reductions or subsidies.

Eligibility depends on CRA requirements, including residence and relevant immigration-status conditions. Newcomers should check when they can apply rather than assume eligibility begins immediately on arrival.

[Canada Child Benefit overview](https://www.canada.ca/en/revenue-agency/services/child-family-benefits/canada-child-benefit.html) · [Who can apply](https://www.canada.ca/en/revenue-agency/services/child-family-benefits/canada-child-benefit/who-apply.html)

### **Provincial and Territorial Family Benefits**

Additional child or family benefits may be available where you live. These support broader family expenses and may have their own eligibility rules.

**Ontario example:** The Ontario Child Benefit supports eligible low- and moderate-income families. Applying for the Canada Child Benefit also triggers assessment for the Ontario Child Benefit; there is no separate OCB application. Annual tax filing is required, even with no income to report.

[Ontario Child Benefit](https://www.ontario.ca/page/ontario-child-benefit) · [Government of Canada Benefits Finder](https://www.canada.ca/en/services/benefits/finder/tool.html)

### **Childcare Expenses and Tax Returns**

Eligible childcare expenses may qualify for a deduction on an income tax return. Rules determine which expenses qualify and which person can claim them.

Keep receipts and payment records, and check CRA guidance before assuming an expense is deductible. A tax deduction is different from an upfront fee reduction or monthly benefit.

[CRA — Childcare expense deduction](https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/deductions-credits-expenses/line-21400-child-care-expenses.html)

### **Helpful Links**

* [**Canada — Benefits Finder**](https://www.canada.ca/en/services/benefits/finder/tool.html)  
  Explore potential benefits based on your circumstances and location.

* [**Canada Child Benefit**](https://www.canada.ca/en/revenue-agency/services/child-family-benefits/canada-child-benefit.html)  
  Check eligibility, application steps and payment information.

* [**Ontario — Childcare Costs and Assistance**](https://www.ontario.ca/page/find-and-pay-child-care)  
  Find information about fee reductions and childcare subsidies.

* [**Toronto — Child Care Fee Subsidy**](https://www.toronto.ca/community-people/employment-social-support/child-family-support/child-care-support/)  
  Review the City’s subsidy information and application route.

* [**Ontario Child Benefit**](https://www.ontario.ca/page/ontario-child-benefit)  
  Learn about additional support for eligible Ontario families.

* [**CRA — Childcare Expense Deduction**](https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/deductions-credits-expenses/line-21400-child-care-expenses.html)  
  Check which childcare expenses may be deductible and who can claim them.

##$childcare$, null, 1),

  ('Education & Family', 'Apply and Prepare', 'document-copy', 'Apply and Prepare', $childcare$## **Apply and Prepare**

### **Start Your Search Before You Need Care**

Begin researching once you know your likely destination and preferred start date.

If you are moving from abroad or another community, ask whether providers accept pre-arrival applications and what address information they require. Use accurate information and update it when your plans change.

An initial inquiry, waitlist registration and confirmed childcare place are different stages.

### **Understand the Waitlist Process**

Applications may go through individual providers, agencies or a centralized system.

Ask how the waitlist works, whether priority categories apply, how often to update your details and how quickly you must respond to an offer. Waiting times vary; joining a list does not guarantee a place by your requested date.

**Ontario example:** Licensed childcare centres and home childcare agencies cannot charge a fee or deposit simply to place a child on a waiting list. This is distinct from charges associated with accepting a place.

[Ontario waiting-list guidance](https://www.ontario.ca/document/child-care-centre-licensing-manual/part-11-administrative-matters) · [Quebec childcare registration](https://www.quebec.ca/en/family-and-support-for-individuals/childhood/childcare-centres/registration-portal/parents)

### **Prepare the Required Information**

Request the provider’s enrollment checklist. Depending on the program and applicable rules, it may ask for:

* The child’s name, date of birth and relevant identification.  
* Parent or guardian contact information.  
* Emergency contacts and authorized pickup details.  
* Relevant health, allergy, medication or immunization information.  
* Documents supporting a subsidy or other program application.

These are preparation categories, not a universal Canadian document requirement. If something is unavailable, ask what alternatives the provider accepts.

### **Review the Offer Before Accepting**

Confirm the exact location, start date, age group, schedule and written fees.

Read the parent handbook or agreement, including payment terms, deposits, cancellations, withdrawal notice, illness policies, closures and pickup arrangements.

If financial assistance is essential, confirm its status and what you would owe while an application is pending.

### **Help Your Child Settle In**

Ask whether the provider offers orientation visits or a gradual start.

Share your child’s routines, home language, comfort strategies, food needs and relevant health information. Agree on how staff will update you during the first days and what familiar items your child may bring.

### **Plan for Changes and Backup Care**

Discuss what happens during illness, closures, schedule changes or a caregiver’s absence. Consider a backup arrangement where possible.

Keep emergency contacts current and tell the provider when your address, pickup permissions or child’s needs change. Before moving or changing programs, check the required notice and how the change affects any subsidy or reduced-fee arrangement.

## **What to Confirm Before You Decide**

Before accepting a childcare place, verify:

* The provider’s operating status and oversight.  
* A place for your child’s age, schedule and start date.  
* Total fees and confirmed financial support.  
* Support for your child’s needs.  
* Enrollment documents and contract terms.  
* Closure, illness, pickup and backup arrangements.

### **Helpful Links**

* [**Toronto — City-Operated Childcare Waitlist Registration**](https://www.toronto.ca/community-people/children-parenting/children-programs-activities/licensed-child-care/toronto-early-learning-and-child-care-services/registration/)  
  Find registration routes for Toronto Early Learning and Child Care Services. Other providers may use different processes.  
* [**Quebec — Enrolling Your Child in Childcare**](https://www.quebec.ca/en/family-and-support-for-individuals/childhood/childcare-centres/registration-portal/parents)  
  Understand the provincial registration and admission process.  
* [**Quebec — Prepare Your Registration**](https://www.quebec.ca/en/family-and-support-for-individuals/childhood/childcare-centres/registration-portal/parents/prepare-registration)  
  Check preparation requirements and assistance options.  
* [**Ontario — EarlyON Child and Family Centres**](https://www.ontario.ca/page/find-earlyon-child-and-family-centre)  
  Find family programs that can help you connect with your community.$childcare$, null, 1)
on conflict (category, subcategory, section_key) do update set
  title = excluded.title,
  body_markdown = excluded.body_markdown,
  source_id = excluded.source_id,
  display_order = excluded.display_order,
  updated_at = now();

insert into public.static_content (
  category,
  subcategory,
  section_key,
  title,
  body_markdown,
  source_id,
  display_order
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
  ('Understand Childcare in Canada', 'ontario-childcare-rules', 'Ontario — Childcare Rules', 'https://www.ontario.ca/page/child-care-rules-ontario', 2),
  ('Understand Childcare in Canada', 'bc-childcare-types', 'British Columbia — Types of Childcare', 'https://www2.gov.bc.ca/gov/content/family-social-supports/caring-for-young-children/family-information/licensed-unlicensed-child-care', 3),
  ('Understand Childcare in Canada', 'quality-childcare-parent-guide', 'Choosing Quality Childcare — Parent Guide', 'https://findingqualitychildcare.ca/', 4),
  ('Understand Childcare in Canada', 'ontario-earlyon-centres', 'Ontario — EarlyON Child and Family Centres', 'https://www.ontario.ca/page/find-earlyon-child-and-family-centre', 5),
  ('Understand Childcare in Canada', 'ontario-before-after-school', 'Ontario — Before- and After-School Programs', 'https://www.ontario.ca/page/before-and-after-school-programs-what-parents-and-providers-need-know', 6),

  ('Find and Compare Childcare', 'ontario-find-childcare', 'Ontario — Find childcare and check safety information', 'https://www.ontario.ca/page/find-and-pay-child-care', 2),
  ('Find and Compare Childcare', 'toronto-childcare-locator', 'Toronto — Childcare Locator', 'https://www.toronto.ca/community-people/children-parenting/children-programs-activities/licensed-child-care/child-care-locator/', 3),
  ('Find and Compare Childcare', 'alberta-find-childcare', 'Alberta — Find Childcare', 'https://www.alberta.ca/find-childcare', 4),
  ('Find and Compare Childcare', 'quebec-childcare-services', 'Quebec — Childcare services and registration', 'https://www.quebec.ca/en/family-and-support-for-individuals/childhood/childcare-centres', 5),
  ('Find and Compare Childcare', 'quality-childcare-parent-guide', 'Choosing Quality Childcare — Parent Guide', 'https://findingqualitychildcare.ca/', 6),

  ('Costs and Financial Support', 'canada-childcare-agreements', 'Canada — Early Learning and Child Care agreements', 'https://www.canada.ca/en/early-learning-child-care-agreement/agreements-provinces-territories.html', 2),
  ('Costs and Financial Support', 'ontario-childcare-rules', 'Ontario — Childcare Rules', 'https://www.ontario.ca/page/child-care-rules-ontario', 3),
  ('Costs and Financial Support', 'ontario-find-childcare', 'Ontario — Find childcare and check safety information', 'https://www.ontario.ca/page/find-and-pay-child-care', 4),
  ('Costs and Financial Support', 'toronto-childcare-subsidy', 'Toronto — Child Care Fee Subsidy', 'https://www.toronto.ca/community-people/employment-social-support/child-family-support/child-care-support/', 5),
  ('Costs and Financial Support', 'canada-child-benefit', 'Canada Child Benefit overview', 'https://www.canada.ca/en/revenue-agency/services/child-family-benefits/canada-child-benefit.html', 6),
  ('Costs and Financial Support', 'canada-child-benefit-eligibility', 'Canada Child Benefit — Who can apply', 'https://www.canada.ca/en/revenue-agency/services/child-family-benefits/canada-child-benefit/who-apply.html', 7),
  ('Costs and Financial Support', 'ontario-child-benefit', 'Ontario Child Benefit', 'https://www.ontario.ca/page/ontario-child-benefit', 8),
  ('Costs and Financial Support', 'canada-benefits-finder', 'Government of Canada Benefits Finder', 'https://www.canada.ca/en/services/benefits/finder/tool.html', 9),
  ('Costs and Financial Support', 'cra-childcare-expense-deduction', 'CRA — Childcare Expense Deduction', 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/deductions-credits-expenses/line-21400-child-care-expenses.html', 10),

  ('Apply and Prepare', 'ontario-waitlist-guidance', 'Ontario waiting-list guidance', 'https://www.ontario.ca/document/child-care-centre-licensing-manual/part-11-administrative-matters', 2),
  ('Apply and Prepare', 'quebec-childcare-registration', 'Quebec childcare registration', 'https://www.quebec.ca/en/family-and-support-for-individuals/childhood/childcare-centres/registration-portal/parents', 3),
  ('Apply and Prepare', 'toronto-childcare-waitlist', 'Toronto — City-Operated Childcare Waitlist Registration', 'https://www.toronto.ca/community-people/children-parenting/children-programs-activities/licensed-child-care/toronto-early-learning-and-child-care-services/registration/', 4),
  ('Apply and Prepare', 'quebec-prepare-registration', 'Quebec — Prepare Your Registration', 'https://www.quebec.ca/en/family-and-support-for-individuals/childhood/childcare-centres/registration-portal/parents/prepare-registration', 5),
  ('Apply and Prepare', 'ontario-earlyon-centres', 'Ontario — EarlyON Child and Family Centres', 'https://www.ontario.ca/page/find-earlyon-child-and-family-centre', 6)
) as v(subcategory, section_key, title, source_url, display_order)
join public.trusted_sources t
  on t.name = v.title and t.url = v.source_url
on conflict (category, subcategory, section_key) do update set
  title = excluded.title,
  body_markdown = excluded.body_markdown,
  source_id = excluded.source_id,
  display_order = excluded.display_order,
  updated_at = now();

