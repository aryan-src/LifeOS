import type { User } from '@supabase/supabase-js';

export const DEV_BYPASS_MUTATION_ERROR =
  'Connect Supabase to persist changes in dev mode';

export interface SupabaseAuthLike {
  auth: {
    getUser: () => Promise<{
      data: { user: User | null };
      error: unknown;
    }>;
  };
}

export type AuthenticatedUserResult =
  | { user: User; isBypass: false }
  | { user: null; isBypass: true };

/**
 * Returns true ONLY during local development when DEV_BYPASS_AUTH=true is explicitly set.
 * Hard-disabled in production builds and production runtime (always returns false when NODE_ENV === 'production').
 */
export function isDevAuthBypassEnabled(): boolean {
  if (process.env.NODE_ENV === 'production') {
    return false;
  }
  return (
    process.env.NODE_ENV === 'development' &&
    process.env.DEV_BYPASS_AUTH === 'true'
  );
}

/**
 * Resolves the authenticated Supabase user for Server Actions.
 * - If a real authenticated user exists, returns `{ user, isBypass: false }`.
 * - If unauthenticated and `isDevAuthBypassEnabled()` is true, returns `{ user: null, isBypass: true }`
 *   so local UI previews render cleanly without crashing.
 * - Otherwise throws `new Error('Unauthorized')`, keeping production security strict.
 */
export async function getAuthenticatedUser(
  supabase: SupabaseAuthLike
): Promise<AuthenticatedUserResult> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (!error && user) {
    return { user, isBypass: false };
  }

  if (isDevAuthBypassEnabled()) {
    return { user: null, isBypass: true };
  }

  throw new Error('Unauthorized');
}
