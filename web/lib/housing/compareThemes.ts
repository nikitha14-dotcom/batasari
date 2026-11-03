/**
 * Groups for "Tips on evaluating housing options" (Figma HO-01 / HO-02).
 *
 * The eight headings are not invented: the seeded `evaluate-options` row
 * lists them, one per line, and the frames show exactly that list as the
 * section headings above the cards. So the page renders the headings from
 * the database and uses the map below only to decide which of the 21 topic
 * rows sits under each one.
 *
 * A row not listed here still renders, under "Other considerations", so
 * seeding a new topic can never make it silently vanish.
 */

/** Heading text (as seeded) -> the section_keys shown under it, in order. */
export const COMPARE_GROUPS: Array<{ heading: string; keys: string[] }> = [
  {
    heading: "Housing Basics",
    keys: [
      "living-alone-vs-sharing",
      "maintenance-responsibilities",
      "total-housing-costs",
    ],
  },
  {
    heading: "Commute & Transportation",
    keys: [
      "public-transit-or-driving",
      "winter-and-ttc-delays",
      "rideshare",
      "cycling",
    ],
  },
  {
    heading: "Location & Daily Life",
    keys: [
      "work",
      "schools",
      "childcare",
      "daily-needs",
      "neighborhood-fit",
      "safety",
    ],
  },
  {
    heading: "Condition & Building Quality",
    keys: ["condition-building-quality"],
  },
  {
    heading: "Lease Terms & Rent Control",
    keys: ["lease-strategy", "rent-control", "credit-employment-alternatives"],
  },
  {
    heading: "Required Documents",
    keys: ["required-documents"],
  },
  {
    heading: "Negotiation Opportunities",
    keys: ["property-market-conditions", "landlord-type"],
  },
  {
    heading: "Application & Communication",
    keys: ["application-communication"],
  },
];

/** The row that lists the headings; rendered as headings, not as body text. */
export const COMPARE_INTRO_KEY = "evaluate-options";

export const GROUPED_KEYS = new Set(COMPARE_GROUPS.flatMap((g) => g.keys));

