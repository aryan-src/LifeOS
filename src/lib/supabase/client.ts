import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database.types';
import { DEFAULT_LOCAL_SUPABASE_URL, DEFAULT_LOCAL_ANON_KEY } from '@/lib/supabase/constants';

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_LOCAL_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_LOCAL_ANON_KEY
  );
}
