import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import LoginPage from '@/app/login/page';

// Mock next/navigation
const mockSearchParamsGet = vi.fn();
vi.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: mockSearchParamsGet,
  }),
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

// Mock @/lib/supabase/client
const mockSignInWithOAuth = vi.fn();
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signInWithOAuth: mockSignInWithOAuth,
    },
  }),
}));

describe('Notion-Style Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParamsGet.mockReturnValue(null);
  });

  it('renders the Notion-style canvas with "Continue with Google" button', () => {
    const html = renderToString(<LoginPage />);

    expect(html).toContain('LifeOS');
    expect(html).toContain('Continue with Google');
    expect(html).toContain('Secured by Supabase Row-Level Security');
    expect(html).toContain('Return to home');
  });

  it('strictly contains zero email or password input forms', () => {
    const html = renderToString(<LoginPage />);

    expect(html).not.toContain('type="password"');
    expect(html).not.toContain('name="password"');
    expect(html).not.toContain('Forgot password');
    expect(html).not.toContain('Sign up with email');
    expect(html).not.toContain('Magic link');
  });

  it('renders an error alert banner when error query parameter is provided', () => {
    mockSearchParamsGet.mockImplementation((param: string) => {
      if (param === 'error') return 'auth_callback_failed';
      return null;
    });

    const html = renderToString(<LoginPage />);
    expect(html).toContain('role="alert"');
    expect(html).toContain('Authentication session expired or failed. Please try again.');
  });
});
