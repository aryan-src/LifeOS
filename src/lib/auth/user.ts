import { cache } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

export const SEED_USER_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

/**
 * Public Mode: Returns the default seed user UUID for all database queries and mutations.
 * Bypasses Supabase auth checks entirely without network latency.
 */
export const getEffectiveUserId = cache(
  async (_supabase?: SupabaseClient<Database>): Promise<string> => {
    return SEED_USER_ID;
  }
);
