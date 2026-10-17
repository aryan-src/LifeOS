import { cache } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

export class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized: user is not authenticated') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

/**
 * Strict User Resolution:
 * Retrieves the currently authenticated user ID via supabase.auth.getUser().
 * Throws an UnauthorizedError if no authenticated session exists.
 */
export const requireUserId = cache(
  async (supabase: SupabaseClient<Database>): Promise<string> => {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user?.id) {
      throw new UnauthorizedError(error?.message || 'Unauthorized');
    }

    return user.id;
  }
);

/**
 * Optional User Resolution:
 * Retrieves the authenticated user ID if present, or null if unauthenticated.
 */
export const getOptionalUserId = cache(
  async (supabase: SupabaseClient<Database>): Promise<string | null> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return user?.id ?? null;
  }
);
