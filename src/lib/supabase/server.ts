import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database.types';
import {
  DEFAULT_LOCAL_SUPABASE_URL,
  DEFAULT_LOCAL_ANON_KEY,
} from '@/lib/supabase/constants';

/**
 * Validates and normalizes Supabase server client configuration.
 * Falls back gracefully to local constants during build-time page collection or development if env vars are unset.
 */
function resolveSupabaseConfig(): { url: string; key: string } {
  const rawUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    (process.env.NODE_ENV !== 'production' || process.env.NEXT_PHASE === 'phase-production-build'
      ? DEFAULT_LOCAL_SUPABASE_URL
      : '');

  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    (process.env.NODE_ENV !== 'production' || process.env.NEXT_PHASE === 'phase-production-build'
      ? DEFAULT_LOCAL_ANON_KEY
      : '');

  if (!rawUrl || !supabaseKey) {
    throw new Error(
      'Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) must be defined.'
    );
  }

  const trimmed = rawUrl.trim();
  const withProto =
    trimmed.startsWith('http://') || trimmed.startsWith('https://')
      ? trimmed
      : `https://${trimmed}`;

  try {
    const parsed = new URL(withProto);
    return {
      url: parsed.toString().replace(/\/+$/, ''),
      key: supabaseKey,
    };
  } catch {
    if (process.env.NODE_ENV !== 'production' || process.env.NEXT_PHASE === 'phase-production-build') {
      return {
        url: DEFAULT_LOCAL_SUPABASE_URL,
        key: supabaseKey,
      };
    }
    throw new Error(
      `Invalid NEXT_PUBLIC_SUPABASE_URL: "${rawUrl}" is not a valid URL.`
    );
  }
}

export async function createClient() {
  const { url, key } = resolveSupabaseConfig();
  const cookieStore = await cookies();

  return createServerClient<Database>(
    url,
    key,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // Handled by middleware refreshing user sessions.
          }
        },
      },
    }
  );
}
