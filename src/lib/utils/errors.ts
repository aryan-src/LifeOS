/**
 * Utility to format database and network error messages into user-friendly notifications.
 */
export function formatErrorMessage(error: unknown): string {
  if (!error) return 'An unexpected error occurred.';
  const msg =
    typeof error === 'string'
      ? error
      : (error as { message?: string }).message || String(error);

  if (
    msg.includes('fetch failed') ||
    msg.includes('ECONNREFUSED') ||
    msg.includes('EPERM') ||
    msg.includes('Failed to fetch')
  ) {
    return 'Database connection failed. Please ensure your local Supabase instance is running (run `supabase start`) or check your .env.local configuration.';
  }

  if (msg.includes('Expected 3 parts in JWT')) {
    return 'Invalid Supabase API Key format. A valid 3-part JWT is required. Check NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.';
  }

  if (
    msg.includes('schema cache') ||
    msg.includes('does not exist') ||
    msg.includes('relation "public.')
  ) {
    return 'Database tables not found in schema. Please apply migrations by running `supabase db reset` in your terminal or executing supabase/full_schema_and_seed.sql in the Supabase SQL Editor.';
  }

  return msg;
}
