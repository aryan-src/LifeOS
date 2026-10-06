import { cache } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

/**
 * Deduplicate Supabase auth.getUser() calls within a single React Server Component request.
 * Without this cache, parallel queries (e.g. 4 on /finances) trigger 4 roundtrip HTTPS
 * network calls to Supabase Auth, adding 1-2 seconds of latency on Vercel.
 */
export const getEffectiveUserId = cache(
  async (supabase: SupabaseClient<Database>): Promise<string> => {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (user && !error) {
        return user.id;
      }

      return 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    } catch {
      return 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    }
  }
);
