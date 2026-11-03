/**
 * Navigation for the DB-driven category pages.
 *
 * This file holds names only, never content. Every heading, paragraph, tip
 * and link on these pages comes from GET /content. The names are here because
 * GET /content needs an exact category AND subcategory, and no endpoint lists
 * a category's subcategories.
 *
 * `category` and each `subcategories` entry are the lookup keys GET /content
 * uses. Postgres `eq` is case-sensitive, so they must match the seed
 * migrations character for character (including "&" vs "and" and the
 * apostrophe style). A mismatch does not error: the page shows that section as
 * "coming soon". If a seed uses a different name, change it here.
 */

import type { IconName } from "@/components/navigation/icons";

export interface CategoryConfig {
  /** URL path segment, e.g. "daily-needs" -> /daily-needs */
  readonly slug: string;
  /** Exact `static_content.category` value. Also the page heading. */
  readonly category: string;
  /** Exact `static_content.subcategory` values, in display order. */
  readonly subcategories: readonly string[];
  /** Optional presentation groups for related DB-backed subcategories. */
  readonly subcategoryGroups?: readonly {
    readonly title: string;
    readonly subcategories: readonly string[];
  }[];
  /** Shows the fixed "official sources only" notice above the content. */
  readonly officialSourcesNotice?: boolean;
}

export const STATIC_CATEGORIES: readonly CategoryConfig[] = [
  {
    slug: "finance",
    category: "Finance",
    subcategories: [
      "Banking & Moving Money",
      "Credit & Borrowing",
      "Taxes, Benefits & Pay",
    ],
  },
  {
    slug: "daily-needs",
    category: "Daily Needs",
    subcategories: [
      "Home Utilities",
      "Groceries",
      "Food banks",
      "Transportation — public transit, driver's licence, and car",
      "Mobile phone and internet",
      "Major malls",
    ],
  },
  {
    slug: "health",
    category: "Health",
    subcategories: [
      "Healthcare in Ontario",
      "Additional healthcare insurance",
      "Finding a family doctor or nurse practitioner",
      "Medical services and mental health support",
    ],
  },
  {
    slug: "immigration",
    category: "Immigration",
    officialSourcesNotice: true,
    subcategories: [
      "Social Insurance Number (SIN)",
      "Immigration, Refugees and Citizenship Canada (IRCC)",
      "Government Programs Serving Immigrants",
    ],
  },
  {
    slug: "education-family",
    category: "Education & Family",
    subcategories: [
      "Understand Childcare in Canada",
      "Find and Compare Childcare",
      "Costs and Financial Support",
      "Apply and Prepare",
      "Understand Schools in Canada",
      "Understand My School Choices",
      "Eligibility, Enrollment & Preparation",
      "School Life & Family Decisions",
      "Colleges & Universities",
      "ESL Classes",
      "Trade Schools & Certifications",
    ],
    subcategoryGroups: [
      {
        title: "Child Care",
        subcategories: [
          "Understand Childcare in Canada",
          "Find and Compare Childcare",
          "Costs and Financial Support",
          "Apply and Prepare",
        ],
      },
      {
        title: "Schools in Canada",
        subcategories: [
          "Understand Schools in Canada",
          "Understand My School Choices",
          "Eligibility, Enrollment & Preparation",
          "School Life & Family Decisions",
        ],
      },
      { title: "Colleges & Universities", subcategories: ["Colleges & Universities"] },
      { title: "ESL Classes", subcategories: ["ESL Classes"] },
      {
        title: "Trade Schools & Certifications",
        subcategories: ["Trade Schools & Certifications"],
      },
    ],
  },
  {
    slug: "the-city",
    category: "The City",
    subcategories: [
      "The City: Toronto at a Glance",
      "People and Communities",
      "Understanding Toronto’s Neighbourhoods",
      "Climate and Seasonal Planning",
      "Attractions & Recreation",
      "Cost & Lifestyle Comparison for Different Cities",
    ],
  },
  {
    slug: "moving-shipping",
    category: "Moving & Shipping",
    subcategories: [
      "Official guidance",
      "Moving and shipping options",
    ],
  },
];

/**
 * Accordion icon per subcategory (presentation only). Keyed by the exact
 * subcategory name; anything missing falls back to a document icon.
 */
export const SUBCATEGORY_ICONS: Readonly<Record<string, IconName>> = {
  "Banking & Moving Money": "landmark",
  "Credit & Borrowing": "wallet-cards",
  "Taxes, Benefits & Pay": "file-text",
  "Home Utilities": "zap",
  Groceries: "shopping-cart",
  "Food banks": "hand-heart",
  "Transportation — public transit, driver's licence, and car": "bus",
  "Mobile phone and internet": "smartphone",
  "Major malls": "store",
  "Healthcare in Ontario": "heart-pulse",
  "Additional healthcare insurance": "shield-plus",
  "Finding a family doctor or nurse practitioner": "stethoscope",
  "Medical services and mental health support": "brain",
  "Social Insurance Number (SIN)": "id-card",
  "Immigration, Refugees and Citizenship Canada (IRCC)": "landmark",
  "Government Programs Serving Immigrants": "users",
  "Understand Schools in Canada": "graduation-cap",
  "Understand My School Choices": "building",
  "Eligibility, Enrollment & Preparation": "file-text",
  "School Life & Family Decisions": "users",
  "Colleges & Universities": "building-2",
  "ESL Classes": "book-open-check",
  "Trade Schools & Certifications": "briefcase-business",
  "Understand Childcare in Canada": "book-open-check",
  "Find and Compare Childcare": "map-pinned",
  "Costs and Financial Support": "wallet-cards",
  "Apply and Prepare": "file-text",
  "The City: Toronto at a Glance": "map-pinned",
  "People and Communities": "users",
  "Understanding Toronto’s Neighbourhoods": "building",
  "Climate and Seasonal Planning": "thermometer-sun",
  "Attractions & Recreation": "ferris-wheel",
  "Cost & Lifestyle Comparison for Different Cities": "scale",
  "Official guidance": "book-open-check",
  "Moving and shipping options": "truck",
};

export function subcategoryIcon(subcategory: string): IconName {
  return SUBCATEGORY_ICONS[subcategory] ?? "file-text";
}

export function getCategoryBySlug(slug: string): CategoryConfig | undefined {
  return STATIC_CATEGORIES.find((c) => c.slug === slug);
}

