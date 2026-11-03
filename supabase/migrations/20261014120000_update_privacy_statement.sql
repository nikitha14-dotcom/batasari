-- Privacy Statement revision, Oct 14 2026.
--
-- Replaces the rows seeded by 20260927140000_help_and_privacy_content.sql, whose
-- own header said: "Jia is still filling in the bracketed placeholders (support
-- email, links, judge model) before Beta; those revisions replace these rows."
-- This is that revision.
--
-- Scoped to category = 'Privacy Statement'. Help & FAQ rows from that migration
-- are untouched -- they still say "Moving Assistant" and are handled separately.
--
-- Four of the seven sections change:
--   description                -- date, and the brand name is now KnewSooner in
--                                 the stored text rather than patched at render
--                                 time by withKnewSoonerBrand()
--   third-party-services       -- real model lineup replaces the
--                                 "[insert provider, hosing platform, and data
--                                 retention policy]" placeholder
--   your-choices-and-deletion  -- adds the waitlist condition; "all your data"
--   about-this-statement       -- real contact address replaces the [email]
--                                 placeholder the renderer rewrote to /contact-us
--
-- The other three (what-we-collect-and-why, how-we-use-your-information,
-- please-avoid-highly-sensitive-information) are reproduced byte-for-byte so a
-- rebuild from main gives the same page. Re-inserted rather than left alone
-- because the delete below clears the whole category.
--
-- NOTE ON THE PRIMARY MODEL. This statement names Gemini 3.6 Flash. At the time
-- of writing main still has DEFAULT_MODEL = "claude-sonnet-4-6" and the Gemini
-- client lives on the unmerged feat/gemini-client branch. Publishing ahead of
-- the switch is a deliberate call by Jia: signups are closed, so no new users
-- can read it, and Gemini merges before they reopen. If that order changes, this
-- row has to be corrected before signups are re-enabled -- it tells users which
-- third party receives their questions.

delete from public.static_content
where category = 'Privacy Statement';

insert into public.static_content (
  category, subcategory, section_key, title, body_markdown, display_order
)
values
  ('Privacy Statement', 'Privacy Statement', 'description', $content$Beta Privacy Statement$content$, $content$**Last updated: Oct 14 2026**

Your privacy matters to us. We collect and use only the information reasonably needed to operate and personalize our KnewSooner Beta.$content$, 0),

  ('Privacy Statement', 'Privacy Statement', 'what-we-collect-and-why', $content$What we collect and why$content$, $content$We may store your account information, onboarding answers, questions, feedback, and conversation history. We may also derive and save useful insights from your inputs—such as preferences, constraints, budget, household needs, topics, and timeline—to personalize future answers.

We also collect limited technical information needed to operate, secure, and troubleshoot the service. We do not include raw conversations, onboarding answers, or saved insight values in routine observability logs.$content$, 1),

  ('Privacy Statement', 'Privacy Statement', 'how-we-use-your-information', $content$How we use your information$content$, $content$During the Beta, we do not use your conversations or derived insights to train or fine-tune models, create evaluation datasets, or improve prompts.

Human access to conversation content is limited to authorized team members when reasonably necessary for support or safety purposes.$content$, 2),

  ('Privacy Statement', 'Privacy Statement', 'third-party-services', $content$Third-party services$content$, $content$To generate answers, relevant portions of your question and context may be processed by third-party AI and web-search providers. Processing occurs in the US. We are currently using Gemini 3.6 Flash to do inference. We use DeepSeek V4 Flash as fall-back, and GLM-5.3 Flash as a judge model [providers deepseek-ai and Zhipu AI ([Z.ai](http://Z.ai)) , hosted on DeepInfra].$content$, 3),

  ('Privacy Statement', 'Privacy Statement', 'your-choices-and-deletion', $content$Your choices and deletion$content$, $content$You can delete saved conversation history and/or derived insights. If you stop using our app or we discontinue our Beta or you didn't indicate interest in joining our waitlist, we will delete all your data from our systems within seven days and, where practical, notify registered users.$content$, 4),

  ('Privacy Statement', 'Privacy Statement', 'please-avoid-highly-sensitive-information', $content$Please avoid highly sensitive information$content$, $content$Please do not enter sensitive info such as passwords, SINs, passport or permit numbers, banking, immigration, or medical documents.

We use reasonable safeguards to protect your information, but no online service can guarantee absolute security.$content$, 5),

  ('Privacy Statement', 'Privacy Statement', 'about-this-statement', $content$About this statement$content$, $content$This is an early-stage Beta privacy statement, which may change as the product evolves. We will update the date above and, where practical, notify users before material changes or new uses of their information take effect.

For privacy questions, access requests, corrections, or deletion help, contact: [info@knewsooner.com](mailto:info@knewsooner.com)$content$, 6);

