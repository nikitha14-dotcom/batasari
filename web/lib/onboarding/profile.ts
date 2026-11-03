/**
 * The onboarding profile: what the API stores, what the screens edit, and the
 * mapping between them.
 *
 * The screens hold a Draft rather than a Profile because the two shapes differ
 * in ways that matter: ages are strings while they are being typed, and
 * "No pets" is a choice in the UI but an empty array in the API.
 */

export type IndiaVisaType =
  | "indian_citizen"
  | "oci_card_holder"
  | "employment_visa"
  | "student_visa"
  | "business_visa"
  | "visitor_visa"
  | "other";

/** Legacy Toronto values stay readable for existing profile rows in the copied schema. */
export type VisaType = IndiaVisaType
  | "open_work_permit"
  | "employer_specific_work_permit"
  | "study_permit"
  | "permanent_resident"
  | "visitor";

export type MoveType = "within_india" | "returning_to_india" | "relocating_to_india";

export type HouseholdType = "solo" | "partner" | "family" | "other";

export type Pet = "dog" | "cat" | "other";

/** The UI's pet choices. "No pets" is a fifth option the API spells as []. */
export type PetChoice = Pet | "no_pets";

export type Profile = {
  move_type: MoveType | null;
  destination_city: string | null;
  household_type: HouseholdType | null;
  children_ages: number[] | null;
  household_other: string | null;
  pets: Pet[] | null;
  pets_other: string | null;
  visa_type: VisaType | null;
  visa_other: string | null;
  city_country: string | null;
  has_accommodation: boolean | null;
  accommodation_zip: string | null;
  move_date: string | null;
};

export type ProfilePatch = Partial<Profile>;

export const EMPTY_PROFILE: Profile = {
  move_type: null,
  destination_city: null,
  household_type: null,
  children_ages: null,
  household_other: null,
  pets: null,
  pets_other: null,
  visa_type: null,
  visa_other: null,
  city_country: null,
  has_accommodation: null,
  accommodation_zip: null,
  move_date: null,
};

export type Draft = {
  moveType: MoveType | null;
  destinationCity: string;
  moveDate: string;
  visaType: VisaType | null;
  visaOther: string;
  household: HouseholdType | null;
  householdOther: string;
  childCount: number;
  childAges: string[];
  pets: PetChoice[] | null;
  petsOther: string;
  place: string;
  hasAccommodation: boolean | null;
  postalCode: string;
};

export const EMPTY_DRAFT: Draft = {
  moveType: null,
  destinationCity: "",
  moveDate: "",
  visaType: null,
  visaOther: "",
  household: null,
  householdOther: "",
  childCount: 0,
  childAges: [],
  pets: null,
  petsOther: "",
  place: "",
  hasAccommodation: null,
  postalCode: "",
};

/**
 * Map a saved profile back onto the editable draft.
 *
 * This is the path hand-testing never reaches: answers live in the draft, so
 * anything this drops looks to the user like their answer vanished.
 */
export function toDraft(profile: Profile): Draft {
  const ages = profile.children_ages ?? [];

  return {
    moveType: profile.move_type,
    destinationCity: profile.destination_city ?? "",
    moveDate: profile.move_date ?? "",
    visaType: profile.visa_type,
    visaOther: profile.visa_other ?? "",
    household: profile.household_type,
    householdOther: profile.household_other ?? "",
    childCount: ages.length,
    childAges: ages.map(String),
    // null means the question was skipped; [] means the user said "No pets".
    // Collapsing the two would turn a real answer into an unanswered question.
    pets: profile.pets === null ? null : profile.pets.length === 0 ? ["no_pets"] : profile.pets,
    petsOther: profile.pets_other ?? "",
    place: profile.city_country ?? "",
    hasAccommodation: profile.has_accommodation,
    postalCode: profile.accommodation_zip ?? "",
  };
}

