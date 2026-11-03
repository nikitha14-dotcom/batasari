-- Housing copy polish for the approved Figma frames.
--
-- Three things, all of them content rather than presentation:
--
-- 1. FH-07 ("Rooms & shared housing") sets the lead phrase of each callout
--    paragraph in the accent purple. The first paragraph already carries the
--    emphasis; the second does not, so the styling had nothing to attach to.
--    The markup belongs here, next to the sentence it emphasises, rather than
--    in a CSS rule that matches the phrase by its text.
--
-- 2. Two of the "Tips on evaluating housing options" rows run the inline
--    citation straight onto the previous sentence ("...written notice.[Ontario
--    Landlord and Tenant Board](...)"), which renders as "notice.Ontario".
--    Now that the duplicate source footer is gone, that seam is visible.
--
-- 3. Three inline citations still carry `?utm_source=chatgpt.com` from
--    drafting. It is a tracking parameter we do not want in shipped copy, and
--    it makes the inline href differ from the same authority's URL in
--    trusted_sources for no reason.

update public.static_content
set body_markdown = $housing$**Your rights in shared housing depend heavily on the arrangement.** If you're required to share a kitchen or bathroom with the owner (or certain immediate family members of the owner who live in the building), the Residential Tenancies Act (RTA) generally does not apply. If you're moving into an existing tenant's home without becoming a tenant yourself, you may be an occupant/roommate rather than an RTA tenant.

**Before paying a deposit, confirm** who you're renting from, whether the owner lives there, what facilities you share, and whether you'll be named on the lease.$housing$,
    updated_at = now()
where category = 'Housing'
  and subcategory = 'Find Housing'
  and section_key = 'rooms-shared-intro';

update public.static_content
set body_markdown = $housing$Check the entire route for bike lanes or multi-use trails. In Toronto, people aged 14 and older cannot cycle on sidewalks. [City of Toronto](https://www.toronto.ca/services-payments/streets-parking-transportation/cycling-in-toronto/cycling-and-the-law/)$housing$,
    updated_at = now()
where category = 'Housing'
  and subcategory = 'Compare Housing Options'
  and section_key = 'cycling';

update public.static_content
set body_markdown = $housing$Verify when the unit was first occupied for residential use. Units first occupied after November 15, 2018 are generally exempt from Ontario’s rent-increase guideline, so annual increases are not capped. Landlords must still generally wait 12 months between increases and provide at least 90 days’ written notice. [Ontario Landlord and Tenant Board](https://tribunalsontario.ca/documents/ltb/Brochures/Guide%20to%20RTA%20%28English%29.html)$housing$,
    updated_at = now()
where category = 'Housing'
  and subcategory = 'Compare Housing Options'
  and section_key = 'rent-control';

update public.static_content
set body_markdown = $housing$If you lack Canadian credit or employment history, provide proof of income or savings, bank statements, references, or a guarantor/co-signer. You may voluntarily offer prepaid rent, but verify the landlord and unit and sign the lease before paying. A landlord cannot require more than one month’s rent as a deposit. [Ontario Landlord and Tenant Board](https://tribunalsontario.ca/documents/ltb/Brochures/Guide%20to%20RTA%20%28English%29.html)$housing$,
    updated_at = now()
where category = 'Housing'
  and subcategory = 'Compare Housing Options'
  and section_key = 'credit-employment-alternatives';

