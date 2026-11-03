"use client";

import type { ReactNode } from "react";

import { ChildAgeFields } from "../../components/onboarding/ChildAgeFields";
import { DateField } from "../../components/onboarding/DateField";
import { InlineField, OptionList, type Option } from "../../components/onboarding/OptionList";
import { SearchSelect } from "../../components/onboarding/SearchSelect";
import {
  MAX_CITY_COUNTRY,
  MAX_HOUSEHOLD_OTHER,
  MAX_OTHER_TEXT,
  MAX_POSTAL_CODE,
} from "./limits";
import { suggestPlaces } from "./places";
import type { Draft, HouseholdType, IndiaVisaType, MoveType, Pet, PetChoice, ProfilePatch, VisaType } from "./profile";

/**
 * One object per onboarding screen — the Strategy pattern, with the page as
 * the context that runs whichever strategy the current index selects.
 *
 * The page previously held three parallel six-branch switches: one deciding
 * whether Continue could enable, one building the PATCH body, and a JSX
 * ladder rendering the editor. Adding ONB-07's "Other" option meant editing
 * all three and remembering to. Here a screen is one entry in STEPS, and the
 * page no longer knows what a step contains.
 */

export type StepEditor = {
  draft: Draft;
  update: (partial: Partial<Draft>) => void;
  disabled: boolean;
};

export interface OnboardingStep {
  /** Matches the profile field group this step owns; used in test names too. */
  readonly id: string;
  readonly question: string;

  /** Whether Continue may enable. Every frame shows it grey until this is true. */
  isComplete(draft: Draft): boolean;

  /** What Continue persists. */
  toPatch(draft: Draft): ProfilePatch;

  /** What Skip persists — clearing this step's fields rather than leaving them stale. */
  readonly skipPatch: ProfilePatch;

  /** ONB-09 and ONB-10 offer "Start from scratch"; the earlier screens do not. */
  readonly offersRestart?: boolean;

  render(editor: StepEditor): ReactNode;
}

const VISA_LABELS: Record<IndiaVisaType, string> = {
  indian_citizen: "Indian citizen",
  oci_card_holder: "OCI card holder",
  employment_visa: "Employment visa",
  student_visa: "Student visa",
  business_visa: "Business visa",
  visitor_visa: "Visitor visa / e-Visa",
  other: "Other",
};
const INDIA_VISA_TYPES = Object.keys(VISA_LABELS) as IndiaVisaType[];

const MOVE_LABELS: Record<MoveType, string> = {
  within_india: "Moving between Indian cities",
  returning_to_india: "Returning to India",
  relocating_to_india: "Moving to India from abroad",
};

const HOUSEHOLD_LABELS: Record<HouseholdType, string> = {
  solo: "Just me",
  partner: "With my partner",
  family: "Family with kids",
  other: "Other",
};

const PET_LABELS: Record<PetChoice, string> = {
  dog: "Dog",
  cat: "Cat",
  no_pets: "No pets",
  other: "Other",
};

/** Clicking the chosen option again clears it, so a step can be un-answered. */
function toggle<T>(current: T | null, value: T): T | null {
  return current === value ? null : value;
}

/** "No pets" is exclusive in both directions. */
export function togglePet(current: PetChoice[] | null, value: PetChoice): PetChoice[] {
  const chosen = current ?? [];

  if (value === "no_pets") {
    return chosen.includes("no_pets") ? [] : ["no_pets"];
  }

  const withoutNone = chosen.filter((pet) => pet !== "no_pets");
  return withoutNone.includes(value)
    ? withoutNone.filter((pet) => pet !== value)
    : [...withoutNone, value];
}

/** Grows or shrinks the age list to match the stepper, keeping what was typed. */
function resizeAges(ages: string[], count: number): string[] {
  const next = ages.slice(0, count);
  while (next.length < count) next.push("");
  return next;
}

export const STEPS: readonly OnboardingStep[] = [
  {
    id: "move_type",
    question: "Which kind of move are you planning?",
    isComplete: (draft) => draft.moveType !== null,
    toPatch: (draft) => ({ move_type: draft.moveType }),
    skipPatch: { move_type: null },
    render: ({ draft, update, disabled }) => (
      <OptionList
        name="Move type"
        disabled={disabled}
        selected={draft.moveType ? [draft.moveType] : []}
        onSelect={(value) => update({ moveType: toggle(draft.moveType, value) })}
        options={(Object.keys(MOVE_LABELS) as MoveType[]).map<Option<MoveType>>((value) => ({
          value,
          label: MOVE_LABELS[value],
        }))}
      />
    ),
  },
  // ------------------------------------------------------------------ ONB-05
  {
    id: "move_date",
    question: "When are you planning to move?",
    isComplete: (draft) => draft.moveDate !== "",
    toPatch: (draft) => ({ move_date: draft.moveDate }),
    skipPatch: { move_date: null },
    render: ({ draft, update, disabled }) => (
      <DateField
        value={draft.moveDate}
        onChange={(moveDate) => update({ moveDate })}
        disabled={disabled}
      />
    ),
  },

  // ------------------------------------------------------------------ ONB-06
  {
    id: "visa",
    question: "What status best describes your planned stay in India? Skip this if you’re moving within India.",
    isComplete: (draft) =>
      draft.visaType !== null &&
      (draft.visaType !== "other" || draft.visaOther.trim().length > 0),
    toPatch: (draft) => ({
      visa_type: draft.visaType,
      visa_other: draft.visaType === "other" ? draft.visaOther.trim() : null,
    }),
    skipPatch: { visa_type: null, visa_other: null },
    render: ({ draft, update, disabled }) => (
      <OptionList
        name="Visa type"
        disabled={disabled}
        selected={draft.visaType ? [draft.visaType] : []}
        onSelect={(value) => update({ visaType: toggle(draft.visaType, value) })}
        options={INDIA_VISA_TYPES.map<Option<VisaType>>((value) => ({
          value,
          label: VISA_LABELS[value],
          expansion:
            value === "other" ? (
              <InlineField
                value={draft.visaOther}
                onChange={(visaOther) => update({ visaOther })}
                placeholder="Share what you know, or enter ‘not sure yet’"
                maxLength={MAX_OTHER_TEXT}
                label="Your India stay status"
                disabled={disabled}
                autoFocus
              />
            ) : undefined,
        }))}
      />
    ),
  },

  // ------------------------------------------------------------------ ONB-07
  {
    id: "household",
    question: "Who is moving with you?",
    isComplete: (draft) => {
      if (draft.household === null) return false;
      if (draft.household === "family") {
        return (
          draft.childCount > 0 &&
          draft.childAges.slice(0, draft.childCount).every((age) => age.trim() !== "")
        );
      }
      if (draft.household === "other") return draft.householdOther.trim().length > 0;
      return true;
    },
    toPatch: (draft) => ({
      household_type: draft.household,
      children_ages:
        draft.household === "family"
          ? draft.childAges.slice(0, draft.childCount).map(Number)
          : null,
      household_other: draft.household === "other" ? draft.householdOther.trim() : null,
    }),
    skipPatch: { household_type: null, children_ages: null, household_other: null },
    render: ({ draft, update, disabled }) => (
      <OptionList
        name="Who is moving with you"
        disabled={disabled}
        selected={draft.household ? [draft.household] : []}
        onSelect={(value) => update({ household: toggle(draft.household, value) })}
        options={(Object.keys(HOUSEHOLD_LABELS) as HouseholdType[]).map<Option<HouseholdType>>(
          (value) => ({
            value,
            label: HOUSEHOLD_LABELS[value],
            expansion:
              value === "family" ? (
                <ChildAgeFields
                  count={draft.childCount}
                  ages={draft.childAges}
                  disabled={disabled}
                  onCountChange={(childCount) =>
                    update({ childCount, childAges: resizeAges(draft.childAges, childCount) })
                  }
                  onAgeChange={(index, age) =>
                    update({
                      childAges: draft.childAges.map((existing, i) =>
                        i === index ? age : existing,
                      ),
                    })
                  }
                />
              ) : value === "other" ? (
                <InlineField
                  value={draft.householdOther}
                  onChange={(householdOther) => update({ householdOther })}
                  placeholder="Brother, sister, father, mother…"
                  maxLength={MAX_HOUSEHOLD_OTHER}
                  label="Who else is moving with you"
                  disabled={disabled}
                  autoFocus
                />
              ) : undefined,
          }),
        )}
      />
    ),
  },

  // ------------------------------------------------------------------ ONB-08
  {
    id: "pets",
    question: "Will you be moving with any pets? Check current travel and import requirements before making arrangements.",
    isComplete: (draft) => {
      if (draft.pets === null || draft.pets.length === 0) return false;
      if (draft.pets.includes("no_pets")) return true;
      return !draft.pets.includes("other") || draft.petsOther.trim().length > 0;
    },
    toPatch: (draft) => {
      const chosen = draft.pets ?? [];
      const saysNone = chosen.includes("no_pets");

      return {
        pets: saysNone ? [] : (chosen.filter((pet) => pet !== "no_pets") as Pet[]),
        pets_other: !saysNone && chosen.includes("other") ? draft.petsOther.trim() : null,
      };
    },
    skipPatch: { pets: null, pets_other: null },
    render: ({ draft, update, disabled }) => (
      <OptionList
        multiple
        name="Pets"
        disabled={disabled}
        selected={draft.pets ?? []}
        onSelect={(value) => update({ pets: togglePet(draft.pets, value) })}
        options={(Object.keys(PET_LABELS) as PetChoice[]).map<Option<PetChoice>>((value) => ({
          value,
          label: PET_LABELS[value],
          expansion:
            value === "other" ? (
              <InlineField
                value={draft.petsOther}
                onChange={(petsOther) => update({ petsOther })}
                placeholder="Please specify"
                maxLength={MAX_OTHER_TEXT}
                label="Please specify your pet type"
                disabled={disabled}
                autoFocus
              />
            ) : undefined,
        }))}
      />
    ),
  },

  // ------------------------------------------------------------------ ONB-09
  {
    id: "city_country",
    question: "Which city and country are you moving from?",
    offersRestart: true,
    isComplete: (draft) => draft.place.trim().length > 0,
    toPatch: (draft) => ({ city_country: draft.place.trim() }),
    skipPatch: { city_country: null },
    render: ({ draft, update, disabled }) => (
      <SearchSelect
        value={draft.place}
        // Both paths clamp. Typing was clamped and picking a suggestion was
        // not, which is invisible against the demo list and a 422 the moment
        // a real geocoder returns something long.
        onChange={(place) => update({ place: place.slice(0, MAX_CITY_COUNTRY) })}
        onSelect={(place) => update({ place: place.slice(0, MAX_CITY_COUNTRY) })}
        suggestions={suggestPlaces(draft.place)}
        placeholder="Search for a city or country"
        label="City and country you are moving from"
        disabled={disabled}
      />
    ),
  },

  {
    id: "destination_city",
    question: "Which Indian city are you moving to?",
    isComplete: (draft) => draft.destinationCity.trim().length > 0,
    toPatch: (draft) => ({ destination_city: draft.destinationCity.trim() }),
    skipPatch: { destination_city: null },
    render: ({ draft, update, disabled }) => (
      <SearchSelect
        value={draft.destinationCity}
        onChange={(destinationCity) => update({ destinationCity: destinationCity.slice(0, MAX_CITY_COUNTRY) })}
        onSelect={(destinationCity) => update({ destinationCity: destinationCity.slice(0, MAX_CITY_COUNTRY) })}
        suggestions={suggestPlaces(draft.destinationCity).filter((place) => /, India$/i.test(place))}
        placeholder="Search an Indian city"
        label="Destination city in India"
        disabled={disabled}
      />
    ),
  },

  // ------------------------------------------------------------------ ONB-10
  {
    id: "accommodation",
    question: "Have you arranged a place to stay at your destination?",
    offersRestart: true,
    isComplete: (draft) => {
      if (draft.hasAccommodation === null) return false;
      return !draft.hasAccommodation || draft.postalCode.trim().length > 0;
    },
    toPatch: (draft) => ({
      has_accommodation: draft.hasAccommodation,
      accommodation_zip: draft.hasAccommodation ? draft.postalCode.trim() : null,
    }),
    skipPatch: { has_accommodation: null, accommodation_zip: null },
    render: ({ draft, update, disabled }) => (
      <OptionList
        name="Long-term accommodation"
        disabled={disabled}
        selected={draft.hasAccommodation === null ? [] : [draft.hasAccommodation ? "yes" : "no"]}
        onSelect={(value) => update({ hasAccommodation: value === "yes" })}
        options={[
          {
            value: "yes",
            label: "Yes",
            expansion: (
              <InlineField
                value={draft.postalCode}
                onChange={(postalCode) => update({ postalCode })}
                placeholder="Enter the destination PIN code"
                maxLength={MAX_POSTAL_CODE}
                label="Destination PIN code"
                disabled={disabled}
                autoFocus
              />
            ),
          },
          { value: "no", label: "No" },
        ]}
      />
    ),
  },
];

/**
 * Everything every step would clear, in one body.
 *
 * "Start from scratch" used to reset local state only. By the time the button
 * is rendered the first four steps have already been PATCHed, so the
 * discarded answers came back on reload — and kept feeding the assistant's
 * prompt in the meantime.
 */
export const CLEAR_ALL_PATCH: ProfilePatch = STEPS.reduce<ProfilePatch>(
  (all, step) => ({ ...all, ...step.skipPatch }),
  {},
);

