import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';
import { DEFAULT_LOCAL_SUPABASE_URL, DEFAULT_LOCAL_ANON_KEY } from '@/lib/supabase/constants';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  // Support Vercel reverse proxy / load balancer headers
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') ?? 'https';
  const baseOrigin = forwardedHost
    ? `${forwardedProto}://${forwardedHost}`
    : origin;

  if (code) {
    try {
      const redirectUrl = `${baseOrigin}${next.startsWith('/') ? next : `/${next}`}`;
      const response = NextResponse.redirect(redirectUrl);

      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_LOCAL_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_LOCAL_ANON_KEY,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value, options }) => {
                response.cookies.set(name, value, options);
              });
            },
          },
        }
      );

      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return response;
      }
      console.error('OAuth exchange error:', error.message);
    } catch (err) {
      console.error('Unexpected error in auth callback:', err);
    }
  }

  return NextResponse.redirect(`${baseOrigin}/login?error=auth-code-error`);
}
