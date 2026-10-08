'use client';

import React from 'react';
import { RotateCcw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-stone-50 text-stone-900 antialiased font-sans flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-xs flex flex-col gap-4 text-center items-center">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
            !
          </div>
          <h2 className="text-lg font-semibold text-stone-900">Application Interruption</h2>
          <p className="text-xs text-stone-500 leading-relaxed">
            A root-level system interruption occurred. You can safely retry or refresh your session.
          </p>
          {error.digest && (
            <div className="text-[11px] font-mono text-stone-600 bg-stone-100 px-2.5 py-1 rounded">
              Digest: {error.digest}
            </div>
          )}
          <button
            type="button"
            onClick={() => reset()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-900 text-stone-50 hover:bg-stone-800 text-xs font-medium cursor-pointer"
          >
            <RotateCcw size={14} />
            <span>Try Again</span>
          </button>
        </div>
      </body>
    </html>
  );
}
