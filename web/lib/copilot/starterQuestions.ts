export interface StarterQuestion {
  id: string;
  icon: string;
  /** What the card shows. Sent as the question when `question` is absent. */
  title: string;
  description: string;
  /** The question actually sent, when it should read differently from the card. */
  question?: string;
}

export const starterQuestions: StarterQuestion[] = [
  {
    id: 'starter-1',
    icon: '✦',
    title: "I don't have a Canadian job offer or credit history, how do I make my rental application competitive?",
    description: 'Learn strategies, documentation, and alternatives to strengthen your application.',
  },
  {
    id: 'starter-2',
    icon: '✦',
    title: 'How does winter affect my commute planning in Toronto?',
    description: 'Transit delays, walking distances, and seasonal considerations when choosing a location.',
  },
];

/**
 * Finance's two pre-seeded questions.
 */
export const financeStarterQuestions: StarterQuestion[] = [
  {
    id: 'finance-bank-account',
    icon: '\u2726',
    title: 'What documentation is required to open a bank account in Toronto?',
    description: 'Learn what documents newcomers may need when opening a bank account.',
  },
  {
    id: 'finance-credit-history',
    icon: '\u2726',
    title: 'What steps can I take to build a Canadian credit history from scratch?',
    description: 'Learn practical steps for starting and building Canadian credit history.',
  },
];

/**
 * Education & Family's two pre-seeded questions.
 */
export const educationFamilyStarterQuestions: StarterQuestion[] = [
  {
    id: 'education-public-school',
    icon: '\u2726',
    title: 'How do I enroll my child in a public school in Ontario after moving from another country?',
    description: 'Learn the main steps and information needed to enroll a child in an Ontario public school.',
  },
  {
    id: 'education-childcare',
    icon: '\u2726',
    title: 'How can I find licensed childcare and learn about childcare subsidies in Toronto?',
    description: 'Learn how to find licensed childcare and understand available subsidy options.',
  },
];

/**
 * Work's two pre-seeded questions (Work spec v4.5, section 4.13): the same two for
 * every user, short on the card, fuller when sent. Both are answered from
 * conventions and linked sources rather than figures or eligibility rulings,
 * and both have cases in the Work eval set (AQ-4.1, WORK_004 / LQ-2.2).
 *
 * The wording is pending Jia's confirmation -- change the strings here only.
 */
export const workStarterQuestions: StarterQuestion[] = [
  {
    id: 'work-degree',
    icon: '✦',
    title: 'Will my degree count here?',
    question: 'Will my degree or qualification be recognised in Ontario?',
    description: 'Credential recognition and the regulator that licenses your profession.',
  },
  {
    id: 'work-fake-offer',
    icon: '✦',
    title: 'How do I spot a fake job offer?',
    question: 'How do I tell whether a job offer or recruiter in Toronto is legitimate?',
    description: 'Warning signs, how to check an employer, and where to report a scam.',
  },
];

/**
 * The opening questions for a category, used when a page does not pass its own.
 * Keeps every page of a category right, so a merge cannot drop them.
 */
export function defaultStarterQuestions(category?: string): StarterQuestion[] {
  switch (category) {
    case "Finance":
      return financeStarterQuestions;
    case "Education & Family":
      return educationFamilyStarterQuestions;
    case "Work":
      return workStarterQuestions;
    default:
      return starterQuestions;
  }
}
export default starterQuestions;

