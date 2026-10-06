'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

function LoginContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    searchParams.get('error') ? 'Unable to authenticate with Google. Please try again.' : null
  );

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();
      const origin = window.location.origin;
      const next = searchParams.get('next') || '/';

      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
      }
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[440px] mx-auto flex flex-col items-center">
      {/* Notion-Style Card: High internal padding, zero drop-shadow, warm border */}
      <div className="w-full p-8 sm:p-12 rounded-3xl border border-stone-200/90 bg-white shadow-none flex flex-col items-center text-center">
        {/* Brand Icon Badge */}
        <div className="w-12 h-12 rounded-2xl bg-stone-900 flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-white text-[22px]">splitscreen</span>
        </div>

        {/* Headings */}
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900 font-sans">
          Welcome to LifeOS
        </h1>
        <p className="mt-2 text-sm text-stone-500 max-w-[280px] leading-relaxed">
          A quiet operating system for academics, daily focus, and student finances.
        </p>

        {/* Error Notification */}
        {error && (
          <div className="mt-6 w-full p-3 rounded-xl border border-amber-200 bg-amber-50/70 text-amber-800 text-xs font-medium text-left flex items-start gap-2 animate-in fade-in duration-150">
            <span className="material-symbols-outlined text-[16px] text-amber-700 shrink-0 mt-0.5">warning</span>
            <span>{error}</span>
          </div>
        )}

        {/* Single Frictionless Google OAuth Action Button */}
        <div className="mt-8 w-full flex flex-col gap-3">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            type="button"
            className="w-full py-3 px-4 rounded-xl border border-stone-300 hover:border-stone-400 bg-white hover:bg-stone-50/80 active:bg-stone-100 text-stone-800 text-sm font-medium transition-all flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed group"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-stone-400 border-t-stone-800 rounded-full animate-spin shrink-0" />
            ) : (
              /* Official Google SVG Icon */
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  fill="#EA4335"
                />
              </svg>
            )}
            <span>{loading ? 'Connecting to Google...' : 'Continue with Google'}</span>
          </button>
        </div>

        {/* Minimalist Trust & Student Microcopy */}
        <div className="mt-8 pt-6 border-t border-stone-100 w-full text-center">
          <p className="text-[12px] text-stone-400 font-sans leading-relaxed">
            Free student edition • Single sign-on with your university or personal Google account
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-[440px] mx-auto p-12 rounded-3xl border border-stone-200/90 bg-white flex flex-col items-center justify-center min-h-[360px] animate-pulse">
          <div className="w-12 h-12 rounded-2xl bg-stone-100 mb-6" />
          <div className="w-36 h-6 bg-stone-100 rounded-md mb-2" />
          <div className="w-48 h-4 bg-stone-100 rounded-md mb-8" />
          <div className="w-full h-11 bg-stone-100 rounded-xl" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
