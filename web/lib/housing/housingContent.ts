"use client";

import { useEffect, useState } from "react";

import type { VisaType } from "@/lib/onboarding/profile";
import {
  ContentRequestError,
  ContentSection,
  fetchSubcategoryContent,
  SubcategoryContent,
} from "@/lib/content/contentApi";

/**
 * Housing content loader.
 *
 * Every string the three Housing pages show as *content* -- resource names,
 * descriptions, source links -- lives in public.static_content and arrives
 * through GET /content. The pages hold no copies of it. Card titles, blurbs
 * and the group headings inside the popups are the exception: those are
 * design labels from the Figma frames, not seeded rows, and there is nothing
 * in the database for them to come from.
 *
 * The seed groups Find Housing's 70 sections by a section_key prefix -- every
 * `managed-*` row belongs to the Managed buildings card, and so on -- which is
 * what lets one popup component serve all seven cards.
 */

export const HOUSING_CATEGORY = "Housing";

export const HOUSING_SUBCATEGORY = {
  find: "Find Housing",
  compare: "Compare Housing Options",
  check: "Check the Place",
} as const;

export type HousingSubcategory =
  (typeof HOUSING_SUBCATEGORY)[keyof typeof HOUSING_SUBCATEGORY];

export interface HousingContentState {
  content: SubcategoryContent | null;
  sections: ContentSection[];
  loading: boolean;
  /** Set only when the request failed. Empty content is not an error. */
  error: string | null;
}

/**
 * Loads one subcategory's sections.
 *
 * Aborts on unmount so a fast route change cannot set state on a gone
 * component, and reports failure rather than rendering a silently empty page
 * -- an empty Housing page reads as "we have nothing for you", which is a
 * worse lie than "we could not load this".
 */
export function useHousingContent(
  subcategory: HousingSubcategory,
): HousingContentState {
  const [state, setState] = useState<HousingContentState>({
    content: null,
    sections: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    setState((s) => ({ ...s, loading: true, error: null }));

    fetchSubcategoryContent(HOUSING_CATEGORY, subcategory, {
      signal: controller.signal,
    })
      .then((content) => {
        if (!active) return;
        setState({
          content,
          sections: sectionsOf(content),
          loading: false,
          error: null,
        });
      })
      .catch((err: unknown) => {
        if (!active || (err as Error)?.name === "AbortError") return;
        const message =
          err instanceof ContentRequestError
            ? err.message
            : "Could not load this content.";
        setState({ content: null, sections: [], loading: false, error: message });
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [subcategory]);

  return state;
}

/** Re-flattens what toSubcategoryContent split apart, keeping display order. */
function sectionsOf(content: SubcategoryContent): ContentSection[] {
  const all: ContentSection[] = [];
  if (content.description) all.push(content.description);
  if (content.tip) all.push(content.tip);
  all.push(...content.items);
  return all;
}

export function sectionsWithPrefix(
  sections: ContentSection[],
  prefix: string,
): ContentSection[] {
  return sections.filter(
    (s) => s.key.startsWith(prefix) && !s.key.endsWith("-intro"),
  );
}

export function sectionByKey(
  sections: ContentSection[],
  key: string,
): ContentSection | null {
  return sections.find((s) => s.key === key) ?? null;
}

/* ------------------------------------------------------------------ */
/* FH-01 cards                                                         */
/* ------------------------------------------------------------------ */

export type HousingIconName =
  | "calendar"
  | "suitcase"
  | "house"
  | "building-check"
  | "key"
  | "people"
  | "school";

/**
 * A white container inside an expanded popup.
 *
 * `bodyKey` makes the container prose -- its heading, text and Website
 * action all come from that row. `title` + `chipSets` makes it a heading
 * over rows of link chips, which is how FH-02 shows the booking sites: the
 * heading ("Hotels and Hostels") is design copy with no row behind it.
 */
/** One block inside a popup: a heading, some rows, chips, a caution line. */
export interface PopupSection {
  id: string;
  /** Design copy from the frame; there is no row behind it. */
  heading?: string;
  /** section_keys rendered as link + description rows. */
  rows?: string[];
  /** section_keys rendered as a wrap of link chips. */
  chips?: string[];
  chipLabel?: string;
  /** Inline label beside the chip row, inside the same box (FH-05). */
  chipHeading?: string;
  /** Caution line with a shield, e.g. on the anonymous-listings section. */
  note?: string;
  /** "linkRight" puts the row title left and its source link right (FH-08). */
  layout?: "rows" | "linkRight";
  /** Rendered as a white callout box inside the section. */
  calloutKey?: string;
  /** Heading on that callout, e.g. "Before signing" on the MLS tab. */
  calloutTitle?: string;
  /** Skip this many leading paragraphs of the callout row's body. */
  calloutFrom?: number;
  /**
   * Arrangement cards (FH-07): each is one row plus its own link chips, and
   * a badge that is design copy -- static_content has no field for it.
   * A card whose row is missing is skipped, so this whole section appears
   * only once those rows are seeded in the environment being used.
   */
  cards?: Array<{
    key: string;
    badge?: string;
    badgeTone?: "out" | "in";
    chips?: string[];
  }>;
}

export interface PopupTab {
  id: string;
  label: string;
  /** Row whose body introduces this tab, if the seed has one. */
  introKey?: string;
  introParagraphs?: number;
  sections: PopupSection[];
}

export interface PopupLayout {
  /** The frames give the popup its own subtitle, not the card's blurb. */
  subtitle?: string;
  introKey?: string;
  /** Show only this many leading paragraphs of the intro row's body. */
  introParagraphs?: number;
  tabs?: PopupTab[];
  sections?: PopupSection[];
}

export interface ModalGroupConfig {
  id: string;
  title?: string;
  bodyKey?: string;
  chipSets?: Array<{ label?: string; keys: string[] }>;
}

export interface HousingTypeCard {
  id: string;
  /** Design label from the Figma frame, not seeded content. */
  title: string;
  blurb: string;
  /** section_key prefixes whose rows fill the popup when no groups are set. */
  prefixes: string[];
  /** Row that introduces the group, shown under the popup header. */
  introKey?: string;
  group: "duration" | "type";
  /** FH-01 gives University housing boards its own wider row. */
  wide?: boolean;
  badge?: string;
  icon: HousingIconName;
  /**
   * Only show this card when the profile's visa_type is one of these.
   * University housing boards is a study-permit resource -- the frame even
   * badges it "Shown because your profile is student" -- so showing it to
   * anyone else is wrong, not merely noisy.
   */
  visaTypes?: VisaType[];
  /**
   * Explicit grouping from that card's frame. Only FH-02 (Temporary) has
   * been read so far; the rest fall back to one container per row, which
   * uses the right visual language but not the frame's own sub-headings.
   */
  groups?: ModalGroupConfig[];
  /** Section layout read from that card's frame. */
  popup?: PopupLayout;
}

export const CHOOSE_HOUSING_CARDS: HousingTypeCard[] = [
  {
    id: "temporary",
    title: "Temporary (days - weeks)",
    blurb: "Best for very short stays. High flexibility. Higher nightly rates.",
    prefixes: ["temporary-"],
    group: "duration",
    icon: "calendar",
    groups: [
      { id: "emergency", bodyKey: "temporary-emergency-accommodation" },
      {
        id: "hotels",
        title: "Hotels and Hostels",
        chipSets: [
          {
            label: "Booking Sites",
            keys: [
              "temporary-hotel-hostelworld",
              "temporary-hotel-expedia",
              "temporary-hotel-booking-com",
              "temporary-hotel-hotels-com",
              "temporary-hotel-trip-com",
              "temporary-hotel-priceline",
            ],
          },
          {
            label: "Hotel price comparison website",
            keys: ["temporary-hotel-trivago"],
          },
        ],
      },
      {
        id: "airbnb",
        title:
          "Short-term residential rentals booked directly with local home hosts",
        chipSets: [{ keys: ["temporary-airbnb"] }],
      },
    ],
  },
  {
    id: "mid-term",
    title: "Mid-term (1-6 months)",
    blurb:
      "Best for extended stays with flexibility. Good for transition periods.",
    prefixes: ["short-term-"],
    group: "duration",
    icon: "suitcase",
    popup: {
      subtitle:
        "Best for extended stays with flexibility. Good for transition periods.",
      sections: [
        {
          id: "verified",
          heading: "Verified & managed platforms",
          rows: [
            "short-term-airbnb-monthly",
            "short-term-blueground",
            "short-term-happipad",
            "short-term-roomies",
            "short-term-zumper",
          ],
        },
        {
          id: "p2p",
          heading: "Peer-to-peer · Higher scam risk",
          rows: [
            "short-term-craigslist-sublets",
            "short-term-facebook-marketplace",
          ],
        },
      ],
    },
  },
  {
    id: "long-term",
    title: "Long-term (6+ months)",
    blurb: "Best for stability and better rates. Ideal for settling down.",
    prefixes: ["long-term-", "agent-listed-"],
    introKey: "long-term-marketplaces-intro",
    group: "duration",
    icon: "house",
    popup: {
      subtitle: "Best for stability and better rates. Ideal for settling down.",
      tabs: [
        {
          id: "marketplaces",
          label: "Marketplaces & Directories",
          introKey: "long-term-marketplaces-intro",
          sections: [
            {
              id: "directories",
              heading: "Rental Marketplaces and Directories",
              rows: [
                "long-term-livrent",
                "long-term-apartments-com",
                "long-term-viewit",
                "long-term-rentseeker",
                "long-term-4rent",
              ],
            },
            {
              id: "syndicated",
              heading: "Mixed & syndicated listings",
              rows: ["long-term-rentals-ca", "long-term-padmapper"],
            },
            {
              id: "anonymous",
              heading: "Anonymous · Higher scam risk",
              rows: ["long-term-kijiji-real-estate"],
              note: "Poster identity isn't verified. Confirm the landlord, unit, and lease before transferring any money.",
            },
          ],
        },
        {
          id: "mls",
          label: "Agent-Listed Rentals (MLS)",
          introKey: "agent-listed-intro",
          introParagraphs: 1,
          sections: [
            {
              id: "mls-before-signing",
              calloutKey: "agent-listed-intro",
              calloutTitle: "Before signing",
              calloutFrom: 1,
            },
            {
              id: "mls-portals",
              rows: [
                "agent-listed-realtor-ca",
                "agent-listed-condos-ca",
                "agent-listed-property-ca",
                "agent-listed-strata-ca",
                "agent-listed-housesigma",
              ],
            },
          ],
        },
      ],
    },
  },
  {
    id: "managed-buildings",
    title: "Managed buildings",
    blurb: "Rent from property management companies.",
    prefixes: ["managed-"],
    introKey: "managed-buildings-intro",
    group: "type",
    icon: "building-check",
    popup: {
      subtitle: "Company-operated rental buildings, not individual condo owners",
      introKey: "managed-buildings-intro",
      sections: [
        {
          id: "portals",
          heading: "Operator-run & managed portals",
          rows: ["managed-rentcafe", "managed-4rent", "managed-rentseeker"],
          chipHeading: "Operator sites",
          chipLabel:
            "Large operators list vacancies on their own sites first — freshest inventory, no third-party middleman.",
          chips: [
            "managed-capreit",
            "managed-bwalk",
            "managed-realstar",
            "managed-minto",
            "managed-greenwin",
          ],
        },
      ],
    },
  },
  {
    id: "private-landlords",
    title: "Private landlords",
    blurb: "Rent directly from landlords or owners.",
    prefixes: ["private-"],
    introKey: "private-landlords-intro",
    group: "type",
    icon: "key",
    popup: {
      subtitle: "Individual owners renting directly, not through a company",
      introKey: "private-landlords-intro",
      sections: [
        {
          id: "verified",
          heading: "Verified platform",
          rows: ["private-livrent"],
        },
        {
          id: "classifieds",
          heading:
            "Classifieds · Independently verify the advertiser's identity and authority to rent before paying",
          rows: [
            "private-facebook-marketplace",
            "private-facebook-groups",
            "private-kijiji",
            "private-craigslist",
          ],
          note: "Independently verify the advertiser's identity and authority to rent before paying.",
        },
      ],
    },
  },
  {
    id: "rooms-shared",
    title: "Rooms & shared housing",
    blurb: "Share space and costs with others.",
    prefixes: ["rooms-shared-"],
    introKey: "rooms-shared-intro",
    group: "type",
    icon: "people",
    popup: {
      subtitle: "Renting a room or joining a household you don't fully control",
      sections: [
        {
          id: "arrangements",
          calloutKey: "rooms-shared-intro",
          cards: [
            {
              key: "rooms-shared-owner",
              badge: "Not covered by RTA",
              badgeTone: "out",
              chips: [
                "rooms-shared-owner-happipad",
                "rooms-shared-owner-homeshare",
                "rooms-shared-owner-kijiji",
              ],
            },
            {
              key: "rooms-shared-roommate",
              chips: ["rooms-shared-roommate-roomies"],
            },
            {
              key: "rooms-shared-multi-tenant",
              badge: "Usually covered by RTA",
              badgeTone: "in",
              chips: [
                "rooms-shared-multi-kijiji",
                "rooms-shared-multi-facebook",
                "rooms-shared-multi-roomies",
              ],
            },
            {
              key: "rooms-shared-student",
              badge: "Varies from RTA",
              badgeTone: "in",
            },
          ],
        },
      ],
    },
  },
  {
    id: "university-boards",
    title: "University housing boards",
    blurb:
      "Off-campus listing boards and housing offices run by a university, generally restricted to students with a current login.",
    prefixes: ["university-board-"],
    introKey: "university-boards",
    group: "type",
    wide: true,
    badge: "Shown because your profile is student",
    visaTypes: ["study_permit"],
    icon: "school",
    popup: {
      subtitle: "Off-campus housing resources by institution",
      sections: [
        {
          id: "institutions",
          layout: "linkRight",
          rows: [
            "university-board-utoronto",
            "university-board-york",
            "university-board-tmu",
            "university-board-george-brown",
            "university-board-humber",
            "university-board-ocad",
          ],
        },
      ],
    },
  },
];

/* ------------------------------------------------------------------ */
/* Popup group resolution                                              */
/* ------------------------------------------------------------------ */

export interface ResolvedChip {
  key: string;
  name: string;
  url: string;
}

export interface ResolvedModalGroup {
  id: string;
  title: string;
  body: string | null;
  action: { name: string; url: string } | null;
  chipSets: Array<{ label?: string; links: ResolvedChip[] }>;
}

/**
 * Turns a card's config plus the loaded rows into what the popup renders.
 *
 * Groups whose rows are all absent are dropped, so a card keeps working when
 * the seed changes underneath it. Without an explicit config the card falls
 * back to one prose container per row under its prefixes, in display order.
 */
export function resolveModalGroups(
  card: HousingTypeCard,
  sections: ContentSection[],
): ResolvedModalGroup[] {
  const byKey = new Map(sections.map((s) => [s.key, s]));

  if (card.groups?.length) {
    const resolved: ResolvedModalGroup[] = [];

    for (const group of card.groups) {
      const source = group.bodyKey ? byKey.get(group.bodyKey) : undefined;

      const chipSets = (group.chipSets ?? [])
        .map((set) => ({
          label: set.label,
          links: set.keys
            .map((key) => {
              const row = byKey.get(key);
              const url = row?.source?.url;
              if (!row || !url) return null;
              return { key, name: row.source?.name ?? row.title, url };
            })
            .filter((l): l is ResolvedChip => l !== null),
        }))
        .filter((set) => set.links.length > 0);

      if (!source && chipSets.length === 0) continue;

      resolved.push({
        id: group.id,
        title: group.title ?? source?.title ?? "",
        body: source?.bodyMarkdown || null,
        action:
          source?.source?.url && source.source.name
            ? { name: source.source.name, url: source.source.url }
            : null,
        chipSets,
      });
    }

    return resolved;
  }

  const seen = new Set<string>();
  const rows: ContentSection[] = [];
  for (const prefix of card.prefixes) {
    for (const section of sectionsWithPrefix(sections, prefix)) {
      if (seen.has(section.key)) continue;
      seen.add(section.key);
      rows.push(section);
    }
  }

  return rows.map((row) => ({
    id: row.key,
    title: row.title,
    body: row.bodyMarkdown || null,
    action:
      row.source?.url && row.source.name
        ? { name: row.source.name, url: row.source.url }
        : null,
    chipSets: [],
  }));
}

/** The scams card at the bottom of FH-01. */
export const SCAMS_INTRO_KEY = "avoiding-rental-scams";
export const SCAMS_PREFIX = "scams-";

/** Cards the current profile should see. Unknown visa hides gated cards. */
export function visibleHousingCards(
  visaType: VisaType | null,
): HousingTypeCard[] {
  return CHOOSE_HOUSING_CARDS.filter(
    (card) => !card.visaTypes || (visaType !== null && card.visaTypes.includes(visaType)),
  );
}

