import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';
import { getValidSiteUrl, safeUrl } from '@/lib/utils/url';
import {
  DEFAULT_LOCAL_SUPABASE_URL,
  DEFAULT_LOCAL_ANON_KEY,
} from '@/lib/supabase/constants';

function sanitizeNextPath(rawNext: string | null): string {
  if (!rawNext) return '/dashboard';
  const trimmed = rawNext.trim();
  if (
    !trimmed.startsWith('/') ||
    trimmed.startsWith('//') ||
    trimmed.includes('\\') ||
    trimmed === '/'
  ) {
    return '/dashboard';
  }
  return trimmed;
}

function resolveActiveOrigin(request: NextRequest | Request, fallbackOrigin: string): string {
  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
  if (forwardedHost) {
    const rawProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
    const isLocalHost =
      forwardedHost.startsWith('localhost') || forwardedHost.startsWith('127.0.0.1');
    const proto = rawProto || (isLocalHost ? 'http' : 'https');
    return `${proto}://${forwardedHost}`.replace(/\/+$/, '');
  }
  return fallbackOrigin.replace(/\/+$/, '');
}

export async function GET(request: NextRequest | Request) {
  const fallbackSiteUrl = getValidSiteUrl().toString();
  const urlObj = safeUrl(request.url, fallbackSiteUrl);
  const searchParams = urlObj.searchParams;
  const activeOrigin = resolveActiveOrigin(request, urlObj.origin || fallbackSiteUrl);

  const oauthError = searchParams.get('error');
  const oauthErrorDescription = searchParams.get('error_description');
  if (oauthError) {
    console.error('[AuthCallback] OAuth provider error:', {
      error: oauthError,
      error_description: oauthErrorDescription,
    });
    const loginUrl = new URL('/login', activeOrigin);
    loginUrl.searchParams.set('error', oauthError);
    if (oauthErrorDescription) {
      loginUrl.searchParams.set('error_description', oauthErrorDescription);
    }
    return NextResponse.redirect(loginUrl.toString());
  }

  const code = searchParams.get('code');
  const queryNext = searchParams.get('next') ?? searchParams.get('redirectTo');

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
    const oauthNextCookie = cookieStore
      .getAll()
      .find((c) => c.name === 'lifeos_oauth_next')?.value;
    let decodedCookieNext: string | null = null;
    if (oauthNextCookie) {
      try {
        decodedCookieNext = decodeURIComponent(oauthNextCookie);
      } catch {
        decodedCookieNext = oauthNextCookie;
      }
    }
    const targetPath = sanitizeNextPath(queryNext ?? decodedCookieNext);

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
      const response = NextResponse.redirect(`${activeOrigin}${targetPath}`);

      // Forward session cookies to response headers on the active origin so SSR session is immediate
      cookiesToSetQueue.forEach(({ name, value, options }) => {
        response.cookies.set(name, value, options);
      });

      if (oauthNextCookie) {
        response.cookies.set('lifeos_oauth_next', '', { path: '/', maxAge: 0 });
      }

      return response;
    }

    const errCode =
      typeof (error as { code?: unknown }).code === 'string' &&
      (error as { code: string }).code.trim()
        ? (error as { code: string }).code.trim()
        : null;
    const errName =
      typeof error.name === 'string' && error.name.trim() ? error.name.trim() : null;
    const errReason = errCode || errName || 'exchange_failed';

    console.error('[AuthCallback] exchangeCodeForSession failed:', {
      code: errCode,
      name: errName,
      message: error.message ?? null,
      error: oauthError,
      error_description: oauthErrorDescription,
    });

    const failUrl = new URL('/login', activeOrigin);
    failUrl.searchParams.set('error', 'auth_callback_failed');
    if (process.env.NODE_ENV === 'development') {
      failUrl.searchParams.set('reason', errReason);
    }
    return NextResponse.redirect(failUrl.toString());
  }

  console.error('[AuthCallback] Missing OAuth code parameter:', {
    error: oauthError,
    error_description: oauthErrorDescription,
  });

  const missingUrl = new URL('/login', activeOrigin);
  missingUrl.searchParams.set('error', 'auth_callback_failed');
  if (process.env.NODE_ENV === 'development') {
    missingUrl.searchParams.set('reason', 'missing_code');
  }
  return NextResponse.redirect(missingUrl.toString());
}
