-- Update Childcare "Apply and Prepare" content without modifying
-- the already-applied 20260925130000 migration.

update public.static_content
set
  body_markdown = $childcare$
## **Apply and Prepare**

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

* **Licensing & Compliance** — The provider’s operating status and oversight.
* **Financial Obligations** — Total fees and confirmed financial support.
* **Legal Documentation** — Enrollment documents and contract terms.
* **Placement Specifics** — A place for your child’s age, schedule and start date.
* **Individualized Care** — Support for your child’s needs.
* **Contingency Protocols** — Closure, illness, pickup and backup arrangements.

### **Helpful Links**

* [**Toronto — City-Operated Childcare Waitlist Registration**](https://www.toronto.ca/community-people/children-parenting/children-programs-activities/licensed-child-care/toronto-early-learning-and-child-care-services/registration/)
  Find registration routes for Toronto Early Learning and Child Care Services. Other providers may use different processes.
* [**Quebec — Enrolling Your Child in Childcare**](https://www.quebec.ca/en/family-and-support-for-individuals/childhood/childcare-centres/registration-portal/parents)
  Understand the provincial registration and admission process.
* [**Quebec — Prepare Your Registration**](https://www.quebec.ca/en/family-and-support-for-individuals/childhood/childcare-centres/registration-portal/parents/prepare-registration)
  Check preparation requirements and assistance options.
* [**Ontario — EarlyON Child and Family Centres**](https://www.ontario.ca/page/find-earlyon-child-and-family-centre)
  Find family programs that can help you connect with your community.
$childcare$,
  updated_at = now()
where category = 'Education & Family'
  and subcategory = 'Apply and Prepare'
  and section_key = 'document-copy';

