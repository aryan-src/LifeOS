import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

// Mock @supabase/ssr
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(),
}));

import { createServerClient } from '@supabase/ssr';

describe('Middleware Route Guards (updateSession)', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock-anon-key';
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  const PROTECTED_ROUTES = [
    '/dashboard',
    '/tasks',
    '/projects',
    '/finances',
    '/notes',
    '/assignments',
    '/habits',
    '/settings',
  ];

  const PUBLIC_ROUTES = [
    '/',
    '/login',
    '/privacy',
    '/license',
    '/changelog',
    '/robots.txt',
    '/sitemap.xml',
  ];

  describe('Unauthenticated User', () => {
    beforeEach(() => {
      vi.mocked(createServerClient).mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: new Error('Auth session missing'),
          }),
        },
      });
    });

    for (const route of PROTECTED_ROUTES) {
      it(`redirects unauthenticated visit from "${route}" to /login?redirectTo=${encodeURIComponent(route)}`, async () => {
        const req = new NextRequest(new URL(`http://localhost:3000${route}`));
        const res = await updateSession(req);

        expect(res.status).toBe(307); // NextResponse.redirect default
        const location = res.headers.get('location');
        expect(location).toBe(`http://localhost:3000/login?redirectTo=${encodeURIComponent(route)}`);
      });
    }

    for (const route of PUBLIC_ROUTES) {
      it(`allows unauthenticated access to public route "${route}"`, async () => {
        const req = new NextRequest(new URL(`http://localhost:3000${route}`));
        const res = await updateSession(req);

        // Should NOT redirect to /login
        const location = res.headers.get('location');
        expect(location).toBeNull();
      });
    }
  });

  describe('Authenticated User', () => {
    beforeEach(() => {
      vi.mocked(createServerClient).mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'usr-123', email: 'test@lifeos.dev' } },
            error: null,
          }),
        },
      });
    });

    it('redirects authenticated user from / to /dashboard', async () => {
      const req = new NextRequest(new URL('http://localhost:3000/'));
      const res = await updateSession(req);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/dashboard');
    });

    it('redirects authenticated user from /login to /dashboard', async () => {
      const req = new NextRequest(new URL('http://localhost:3000/login'));
      const res = await updateSession(req);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/dashboard');
    });

    for (const route of PROTECTED_ROUTES) {
      it(`allows authenticated access to "${route}"`, async () => {
        const req = new NextRequest(new URL(`http://localhost:3000${route}`));
        const res = await updateSession(req);

        const location = res.headers.get('location');
        expect(location).toBeNull();
      });
    }
  });
});
