import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';
import { getValidSiteUrl, safeUrl } from '@/lib/utils/url';
import {
  DEFAULT_LOCAL_SUPABASE_URL,
  DEFAULT_LOCAL_ANON_KEY,
} from '@/lib/supabase/constants';

export async function GET(request: NextRequest | Request) {
  const fallbackSiteUrl = getValidSiteUrl().toString();
  const urlObj = safeUrl(request.url, fallbackSiteUrl);
  const searchParams = urlObj.searchParams;
  const origin = urlObj.origin || fallbackSiteUrl;

  const code = searchParams.get('code');
  const rawNext = searchParams.get('next') ?? searchParams.get('redirectTo');
  // Ensure default destination is internal workspace dashboard
  const next = !rawNext || rawNext === '/' ? '/dashboard' : rawNext;

  if (code) {
    const rawSupabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_LOCAL_SUPABASE_URL;
    const supabaseUrl =
      rawSupabaseUrl.startsWith('http://') || rawSupabaseUrl.startsWith('https://')
        ? rawSupabaseUrl
        : `https://${rawSupabaseUrl}`;
    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      DEFAULT_LOCAL_ANON_KEY;

    const cookieStore = await cookies();
    const cookiesToSetQueue: Array<{
      name: string;
      value: string;
      options: CookieOptions;
    }> = [];

    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
              cookiesToSetQueue.push({ name, value, options });
            });
          } catch {
            // Guard against read-only headers
          }
        },
      },
    });

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || origin).replace(/\/+$/, '');
      const targetPath = next.startsWith('/') ? next : `/${next}`;
      const response = NextResponse.redirect(`${siteUrl}${targetPath}`);

      // Forward session cookies to response headers so redirect retains session across custom domains
      cookiesToSetQueue.forEach(({ name, value, options }) => {
        response.cookies.set(name, value, options);
      });

      return response;
    }
    console.error('Error exchanging code for session:', error);
  }

  return NextResponse.redirect(`${origin}/login?error=auth-failed`);
}
