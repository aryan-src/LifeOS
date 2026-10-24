import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/types/database.types';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const rawSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!rawSupabaseUrl || !supabaseKey) {
    return supabaseResponse;
  }

  let supabaseUrl: string;
  try {
    const withProto =
      rawSupabaseUrl.startsWith('http://') || rawSupabaseUrl.startsWith('https://')
        ? rawSupabaseUrl
        : `https://${rawSupabaseUrl}`;
    supabaseUrl = new URL(withProto).toString();
  } catch {
    return supabaseResponse;
  }

  const supabase = createServerClient<Database>(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Do NOT use getSession(). Always use getUser() to validate auth tokens securely.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  const protectedRoutes = [
    '/tasks',
    '/projects',
    '/finances',
    '/notes',
    '/settings',
    '/assignments',
    '/habits',
    '/dashboard',
  ];

  const isProtectedPath = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // Unauthenticated user requesting a protected route
  if (!user && isProtectedPath) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirectTo', pathname + (request.nextUrl.search || ''));
    return NextResponse.redirect(url);
  }

  // Authenticated users attempting to visit /login should be automatically redirected to /
  if (user && (pathname === '/login' || pathname.startsWith('/login/'))) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
