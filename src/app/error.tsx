'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { RefreshCw, RotateCcw, Home, AlertCircle, ShieldAlert } from 'lucide-react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the caught runtime error and digest for observability
    console.error('[LifeOS Route Error Boundary caught]:', {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  return (
    <div className="flex min-h-[70vh] w-full items-center justify-center px-4 sm:px-6 py-12">
      <div className="w-full max-w-xl rounded-2xl border border-stone-200/80 bg-white/90 dark:bg-stone-900/90 dark:border-stone-800 p-6 sm:p-8 shadow-xs backdrop-blur-sm flex flex-col gap-6">
        {/* Header Pill & Icon */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  Workspace Telemetry Pause
                </span>
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
              </div>
              <h2 className="text-lg sm:text-xl font-semibold text-stone-900 dark:text-stone-100 mt-0.5">
                Unable to render workspace view
              </h2>
            </div>
          </div>
        </div>

        {/* Descriptive Body */}
        <div className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed flex flex-col gap-2">
          <p>
            An unexpected error interrupted this view while rendering telemetry components.
            Your underlying records (projects, tasks, transactions, and notes) remain completely safe.
          </p>
          {error.digest && (
            <div className="mt-1 flex items-center gap-2 rounded-lg bg-stone-100/80 dark:bg-stone-800/60 px-3 py-1.5 font-mono text-xs text-stone-700 dark:text-stone-300 w-fit">
              <AlertCircle size={13} className="text-stone-500 shrink-0" />
              <span>
                Incident Digest: <span className="font-semibold">{error.digest}</span>
              </span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-stone-100 dark:border-stone-800/60">
          <button
            type="button"
            onClick={() => reset()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-900 text-stone-50 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white text-xs sm:text-sm font-medium transition-colors cursor-pointer shadow-xs"
          >
            <RotateCcw size={14} />
            <span>Try Again</span>
          </button>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 text-xs sm:text-sm font-medium transition-colors cursor-pointer"
          >
            <RefreshCw size={14} />
            <span>Reload Page</span>
          </button>

          <Link
            href="/"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 text-xs sm:text-sm font-medium transition-colors ml-auto"
          >
            <Home size={14} />
            <span>Dashboard</span>
          </Link>
        </div>

        {/* Collapsible Diagnostic Details */}
        <details className="group pt-1 text-xs text-stone-500 dark:text-stone-400">
          <summary className="cursor-pointer select-none font-medium hover:text-stone-800 dark:hover:text-stone-200 transition-colors flex items-center gap-1.5">
            <span>Diagnostic information</span>
            <span className="text-[10px] text-stone-400 group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <div className="mt-2 rounded-lg bg-stone-100 dark:bg-stone-950 p-3 font-mono text-[11px] text-stone-700 dark:text-stone-300 overflow-x-auto border border-stone-200/50 dark:border-stone-800/50">
            <div>Digest: {error.digest || 'None'}</div>
            {error.message && <div>Message: {error.message}</div>}
            <div>Time: {new Date().toISOString()}</div>
          </div>
        </details>
      </div>
    </div>
  );
}
