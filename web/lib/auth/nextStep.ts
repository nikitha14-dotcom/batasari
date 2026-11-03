/**
 * Where a signed-in user goes next, so every entry point (email link, password
 * sign-in, each onboarding screen) sends people through the same steps:
 *
 *   ONB-03 set a password  ->  ONB-04 names  ->  ONB-05.. profile questions
 *
 * A returning user who has saved or skipped an onboarding question goes
 * straight to the app; remaining answers are available from Profile.
 */

export type AuthUserLike = {
  user_metadata?: Record<string, unknown> | null;
} | null | undefined;

export const ROUTES = {
  setPassword: "/set-password",
  createAccount: "/create-account",
  onboarding: "/onboarding",
  app: "/categories",
} as const;

export function hasPassword(user: AuthUserLike): boolean {
  return user?.user_metadata?.has_password === true;
}

export function hasAccountDetails(user: AuthUserLike): boolean {
  const first = user?.user_metadata?.first_name;
  return typeof first === "string" && first.trim().length > 0;
}

export function hasCompletedOnboarding(user: AuthUserLike): boolean {
  return user?.user_metadata?.onboarding_completed === true;
}

export function nextStepFor(user: AuthUserLike): string {
  if (!hasPassword(user)) return ROUTES.setPassword;
  if (!hasAccountDetails(user)) return ROUTES.createAccount;
  if (hasCompletedOnboarding(user)) return ROUTES.app;
  return ROUTES.onboarding;
}

