import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Compass, CheckSquare, Wallet, Kanban, FileText } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page Not Found',
  description: 'The requested page could not be found.',
};

export default function NotFound() {
  return (
    <main className="min-h-[75vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16 bg-stone-50/50 dark:bg-zinc-950/50">
      <div className="w-full max-w-lg mx-auto flex flex-col items-center text-center">
        {/* Subtle Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-100 dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 text-xs font-mono font-medium text-stone-600 dark:text-zinc-400 mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-stone-400 dark:bg-zinc-500 animate-pulse" />
          <span>404</span>
          <span className="text-stone-300 dark:text-zinc-700">•</span>
          <span>NOT FOUND</span>
        </div>

        {/* Minimalist Zen Glyph */}
        <div className="w-16 h-16 rounded-2xl bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800/80 shadow-2xs flex items-center justify-center text-stone-700 dark:text-zinc-300 mb-6">
          <Compass className="w-7 h-7 stroke-[1.5]" />
        </div>

        {/* Calm Editorial Typography */}
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-100 mb-2.5">
          This page doesn&apos;t exist.
        </h1>
        <p className="text-sm sm:text-base text-stone-500 dark:text-stone-400 max-w-md mb-8 leading-relaxed">
          The link you followed may be broken, or the workspace was moved to a different location.
        </p>

        {/* Primary CTA */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full justify-center mb-10">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-stone-50 dark:text-stone-900 text-sm font-medium shadow-xs transition-colors tracking-tight"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Command Center</span>
          </Link>
        </div>

        {/* Quick Nav Shortcuts */}
        <div className="w-full pt-8 border-t border-stone-200/70 dark:border-zinc-800/70">
          <span className="text-xs uppercase tracking-wider font-mono text-stone-400 dark:text-zinc-500 mb-4 block">
            Quick Navigation
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Link
              href="/tasks"
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium text-stone-600 dark:text-zinc-400 bg-white/70 dark:bg-zinc-900/60 border border-stone-200/60 dark:border-zinc-800/60 hover:bg-stone-100 dark:hover:bg-zinc-800 hover:text-stone-900 dark:hover:text-zinc-200 transition-colors"
            >
              <CheckSquare className="w-3.5 h-3.5 text-stone-400" />
              <span>Tasks</span>
            </Link>
            <Link
              href="/finances"
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium text-stone-600 dark:text-zinc-400 bg-white/70 dark:bg-zinc-900/60 border border-stone-200/60 dark:border-zinc-800/60 hover:bg-stone-100 dark:hover:bg-zinc-800 hover:text-stone-900 dark:hover:text-zinc-200 transition-colors"
            >
              <Wallet className="w-3.5 h-3.5 text-stone-400" />
              <span>Finances</span>
            </Link>
            <Link
              href="/projects"
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium text-stone-600 dark:text-zinc-400 bg-white/70 dark:bg-zinc-900/60 border border-stone-200/60 dark:border-zinc-800/60 hover:bg-stone-100 dark:hover:bg-zinc-800 hover:text-stone-900 dark:hover:text-zinc-200 transition-colors"
            >
              <Kanban className="w-3.5 h-3.5 text-stone-400" />
              <span>Projects</span>
            </Link>
            <Link
              href="/notes"
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium text-stone-600 dark:text-zinc-400 bg-white/70 dark:bg-zinc-900/60 border border-stone-200/60 dark:border-zinc-800/60 hover:bg-stone-100 dark:hover:bg-zinc-800 hover:text-stone-900 dark:hover:text-zinc-200 transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-stone-400" />
              <span>Notes</span>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
