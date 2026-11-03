-- Help & FAQ and Privacy Statement content, served by GET /content like the
-- category pages. category and subcategory are the page titles.
--
-- Copied from the ClickUp pages "Help and FAQ" and "Privacy Statement content"
-- on 2026-09-27. Jia is still filling in the bracketed placeholders (support
-- email, links, judge model) before Beta; those revisions replace these rows.

delete from public.static_content
where category in ('Help & FAQ', 'Privacy Statement');

insert into public.static_content (
  category, subcategory, section_key, title, body_markdown, display_order
)
values
  ('Help & FAQ', 'Help & FAQ', 'description', $content$Help & FAQ$content$, $content$Moving Assistant is currently in Beta. Features, AI models and policies may change as we learn from users and improve the product.$content$, 0),
  ('Help & FAQ', 'Help & FAQ', 'what-is-moving-assistant', $content$What is Moving Assistant?$content$, $content$The Moving Assistant is a new educational and personalized experience to learn a city. It combines the best from the structure of a textbook, the diversity of search engines, and the personalization of a chatbot. We picked Toronto as our pilot city, and it covers key moving-related areas: housing, work, finances, education & family, health, immigration, daily needs, moving & shipping, the city, and the checklist.$content$, 1),
  ('Help & FAQ', 'Help & FAQ', 'how-does-the-beta-work', $content$How does the beta work?$content$, $content$Beta participants receive:

- Access to the app for three days
- A limited amount of free AI usage

Because this is an early-stage product, some features may be incomplete or change during the Beta. We invite users in small groups so Beta participants can experience our product early and help shape it through their feedback. Between each release, we review what we learn, address important issues, and improve the experience for the next group. We only have resources to support 500 Beta participants.

You can view your remaining Beta time and AI usage in your profile.$content$, 2),
  ('Help & FAQ', 'Help & FAQ', 'how-are-answers-generated', $content$How are answers generated?$content$, $content$Our AI assistant uses structured instructions, relevant user context and web search to produce answers. When helpful, it may use your onboarding answers and saved insights to personalize its response.

Depending on your question, the assistant may:

- Ask a clarification or follow-up question
- State assumptions before answering
- Prioritize information from curated, authoritative websites
- Check that cited links are valid
- Provide a full or partial answer
- Decline or redirect a question when it cannot respond safely or reliably.

We also apply safety and privacy rules that limit certain topics and prevent selected sensitive details from being saved as user insights. See our **[Privacy Statement]** for information about personalization, data storage and deletion.

These measures are intended to improve reliability, but they cannot guarantee that every answer will be accurate or complete. Please verify information using sources and consult a qualified professional when appropriate.$content$, 3),
  ('Help & FAQ', 'Help & FAQ', 'will-i-be-charged', $content$Will I be charged?$content$, $content$No. We are not collecting payments during the Beta. We are considering a future monthly subscription with included AI credits. You may join our waitlist if you would like to hear from us when pricing and payment become available. Joining the waitlist does not require you to purchase anything.$content$, 4),
  ('Help & FAQ', 'Help & FAQ', 'what-happens-if-i-use-all-my-ai-credit', $content$What happens if I use all my AI credit?$content$, $content$You will no longer be able to submit new AI questions, but you can continue using the non-AI features until your three-day beta period ends.$content$, 5),
  ('Help & FAQ', 'Help & FAQ', 'do-you-save-my-questions', $content$Do you save my questions?$content$, $content$We save conversations so you can revisit them and receive more personalized answers. We may also extract and save useful details from your inputs—such as preferences, constraints, budget, household needs and timeline—as derived insights for future answers.

During the Beta, we do not use your conversations or derived insights to train or fine-tune models, build evaluation datasets, or improve prompts.

Relevant portions of your questions and context may be processed by third-party AI and web-search providers. Please review our **[Privacy Statement link]** for details.$content$, 6),
  ('Help & FAQ', 'Help & FAQ', 'can-i-delete-my-information', $content$Can I delete my information?$content$, $content$Yes. You can delete saved conversations and/or derived insights.

You may also contact **[support email]** for deletion assistance. Deleted content will be removed from active systems right away, unless subject to the exceptions described in our Privacy Statement.$content$, 7),
  ('Help & FAQ', 'Help & FAQ', 'what-information-should-i-avoid-entering', $content$What information should I avoid entering?$content$, $content$Please do not enter sensitive info such as passwords, SINs, passport or permit numbers, banking, immigration, or medical documents.

We use reasonable safeguards to protect your information, but no online service can guarantee absolute security.$content$, 8),
  ('Help & FAQ', 'Help & FAQ', 'how-can-i-provide-feedback', $content$How can I provide feedback?$content$, $content$Use **[Feedback page link]** to report a problem, suggest an improvement, or tell us about your experience.

Feedback is especially valuable during the Beta and will help us decide what to improve and whether to continue developing the product.$content$, 9),
  ('Help & FAQ', 'Help & FAQ', 'who-built-moving-assistant', $content$Who built Moving Assistant?$content$, $content$Moving Assistant is built by a volunteer-led team working across six countries, guided by product leads who have firsthand long-distance moving experience. We bring different perspectives that shape the product we are building. Our contributors include students, early-career professionals, and experienced technical leads.$content$, 10),
  ('Help & FAQ', 'Help & FAQ', 'need-help', $content$Need help?$content$, $content$Email us at **[support email]**.

We aim to respond within 3 business days during the Beta. Please do not include sensitive information in your message.

When reporting a problem, it helps to include:

- What you were trying to do
- What happened instead
- The page or feature involved
- Your browser and device
- A screenshot, if it does not contain sensitive information$content$, 11),
  ('Privacy Statement', 'Privacy Statement', 'description', $content$Beta Privacy Statement$content$, $content$**Last updated: Oct 6 2026**

Your privacy matters to us. We collect and use only the information reasonably needed to operate and personalize our Moving Assistant Beta.$content$, 0),
  ('Privacy Statement', 'Privacy Statement', 'what-we-collect-and-why', $content$What we collect and why$content$, $content$We may store your account information, onboarding answers, questions, feedback, and conversation history. We may also derive and save useful insights from your inputs—such as preferences, constraints, budget, household needs, topics, and timeline—to personalize future answers.

We also collect limited technical information needed to operate, secure, and troubleshoot the service. We do not include raw conversations, onboarding answers, or saved insight values in routine observability logs.$content$, 1),
  ('Privacy Statement', 'Privacy Statement', 'how-we-use-your-information', $content$How we use your information$content$, $content$During the Beta, we do not use your conversations or derived insights to train or fine-tune models, create evaluation datasets, or improve prompts.

Human access to conversation content is limited to authorized team members when reasonably necessary for support or safety purposes.$content$, 2),
  ('Privacy Statement', 'Privacy Statement', 'third-party-services', $content$Third-party services$content$, $content$To generate answers, relevant portions of your question and context may be processed by third-party AI and web-search providers. Processing occurs in the US. We are currently using Claude Sonnet 4.6 to do inference (data retention policy: [https://support.claude.com/en/articles/15425996-data-retention-practices-for-covered-models](https://support.claude.com/en/articles/15425996-data-retention-practices-for-covered-models)). We'll use ___ as a judge model [insert provider, hosing platform, and data retention policy].$content$, 3),
  ('Privacy Statement', 'Privacy Statement', 'your-choices-and-deletion', $content$Your choices and deletion$content$, $content$You can delete saved conversation history and/or derived insights. If you stop using our app or we discontinue our Beta, we will delete your data from our systems within seven days and, where practical, notify registered users.$content$, 4),
  ('Privacy Statement', 'Privacy Statement', 'please-avoid-highly-sensitive-information', $content$Please avoid highly sensitive information$content$, $content$Please do not enter sensitive info such as passwords, SINs, passport or permit numbers, banking, immigration, or medical documents.

We use reasonable safeguards to protect your information, but no online service can guarantee absolute security.$content$, 5),
  ('Privacy Statement', 'Privacy Statement', 'about-this-statement', $content$About this statement$content$, $content$This is an early-stage Beta privacy statement, which may change as the product evolves. We will update the date above and, where practical, notify users before material changes or new uses of their information take effect.

For privacy questions, access requests, corrections, or deletion help, contact: **[email]**.$content$, 6);

