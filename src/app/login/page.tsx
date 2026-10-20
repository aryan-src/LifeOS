'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

function GoogleIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

function LoginContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    searchParams.get('error')
      ? searchParams.get('error') === 'auth_callback_failed'
        ? 'Authentication session expired or failed. Please try again.'
        : 'Unable to authenticate. Please try again.'
      : null
  );

  const redirectTo = searchParams.get('redirectTo') || searchParams.get('next');

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();
      const origin = window.location.origin;

      const callbackUrl = redirectTo
        ? `${origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`
        : `${origin}/auth/callback`;

      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl,
        },
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'An unexpected authentication error occurred. Please try again.';
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      {/* Brand Icon & Heading */}
      <div className="text-center mb-8">
        <Link
          href="/"
          className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 shadow-sm text-stone-800 dark:text-stone-200 mb-5 group hover:border-stone-300 dark:hover:border-zinc-700 transition-all"
        >
          <span className="font-mono text-base font-semibold tracking-tight">✦</span>
        </Link>
        <h1 className="text-2xl font-serif font-medium tracking-tight text-stone-900 dark:text-stone-100">
          LifeOS
        </h1>
        <p className="mt-2 text-xs text-stone-500 dark:text-stone-400 font-sans leading-relaxed">
          Your personal operating system for academics, finances, and deep flow.
        </p>
      </div>

      {/* Login Card */}
      <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border border-stone-200/70 dark:border-zinc-800/80 rounded-2xl p-7 shadow-[0_8px_30px_rgb(0,0,0,0.03)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)]">
        {/* Error Alert Banner */}
        {error && (
          <div
            role="alert"
            className="mb-5 p-3 rounded-xl bg-red-50/80 dark:bg-red-950/40 border border-red-200/80 dark:border-red-900/60 text-xs text-red-700 dark:text-red-300 leading-snug flex items-start gap-2 animate-in fade-in duration-200"
          >
            <span className="text-red-500 mt-0.5">•</span>
            <span>{error}</span>
          </div>
        )}

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-stone-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-800 text-stone-800 dark:text-stone-100 text-sm font-medium hover:bg-stone-50 dark:hover:bg-zinc-700/60 focus:outline-none focus:ring-2 focus:ring-stone-400 dark:focus:ring-zinc-600 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm active:scale-[0.99]"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <svg
                className="animate-spin h-4 w-4 text-stone-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>Connecting to Google...</span>
            </div>
          ) : (
            <>
              <GoogleIcon />
              <span>Continue with Google</span>
            </>
          )}
        </button>

        {/* Security & Multi-Tenant Info */}
        <div className="mt-6 pt-5 border-t border-stone-100 dark:border-zinc-800/80 text-center">
          <p className="text-[11px] text-stone-400 dark:text-stone-500 font-mono">
            Secured by Supabase Row-Level Security
          </p>
        </div>
      </div>

      {/* Notion-Style Quiet Footer */}
      <div className="mt-8 text-center">
        <Link
          href="/"
          className="text-xs text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200 transition-colors font-sans"
        >
          ← Return to home
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-stone-50 text-stone-900 dark:bg-zinc-950 dark:text-stone-100 font-sans selection:bg-stone-200 dark:selection:bg-zinc-800">
      <Suspense
        fallback={
          <div className="w-full max-w-sm p-8 text-center text-xs text-stone-400">
            Loading...
          </div>
        }
      >
        <LoginContent />
      </Suspense>
    </div>
  );
}
