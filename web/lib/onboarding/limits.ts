/**
 * Input limits for the onboarding flow.
 *
 * MUST stay in step with two other places:
 *   api/app/routers/profile.py                                    (the enforced limits)
 *   supabase/migrations/20260917090000_profile_household_other.sql (check constraints)
 *
 * Three copies is two too many, and nothing mechanically keeps them equal —
 * treat a change here as a change to all three. The API is the boundary that
 * actually enforces them; these values exist so the UI stops the user before
 * a round trip, not instead of the server.
 *
 * The numbers are small for a reason. Every one of these values is read into
 * the assistant's system prompt on every Copilot answer, so an unbounded
 * field here is unbounded user-controlled text in that prompt.
 */

/** "Please specify" on the visa and pets questions — one short label. */
export const MAX_OTHER_TEXT = 50;

/** ONB-07 "Other": a list of people, so it needs more room than a label. */
export const MAX_HOUSEHOLD_OTHER = 200;

export const MAX_CITY_COUNTRY = 120;
export const MAX_POSTAL_CODE = 12;

export const MAX_CHILDREN = 10;

/**
 * A child's age in whole years. Zero is a newborn and is valid — a family
 * with an infant still has to be able to finish onboarding.
 */
export const MIN_CHILD_AGE = 0;
export const MAX_CHILD_AGE = 25;

/**
 * `<input type="date">` accepts years up to 275760, which Python's `date`
 * cannot represent — the PATCH comes back 422 and the user has no idea which
 * field is wrong. Bounding the control is cheaper than explaining the error.
 */
export const MIN_MOVE_DATE = "1900-01-01";
export const MAX_MOVE_DATE = "2099-12-31";

