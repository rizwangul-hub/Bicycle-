/**
 * Application screen route names.
 * Used by Expo Router — these correspond to file paths in src/app/.
 *
 * Phase 1: Only existing boilerplate screens (index, explore) are active.
 * Phase 2+: Login, Dashboard, Declaration screens will be built.
 */
export const SCREENS = {
  // Phase 1 (existing boilerplate — to be replaced in Phase 2)
  HOME:    '/',
  EXPLORE: '/explore',

  // Phase 2+ (file-based routes to be created)
  LOGIN:               '/login',
  DASHBOARD:           '/dashboard',
  NEW_DECLARATION:     '/declarations/new',
  MY_DECLARATIONS:     '/declarations',
  DECLARATION_DETAIL:  (id: string) => `/declarations/${id}` as const,
  PROFILE:             '/profile',
} as const;

export default SCREENS;
