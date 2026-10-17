import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Lock, Database, EyeOff } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy & Architecture',
  description: 'LifeOS privacy policy and architecture guarantees: zero tracking, row-level database security, and account isolation.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#fff8f5] dark:bg-[#121110] text-[#1e1b18] dark:text-[#f5f5f0] font-sans antialiased selection:bg-[#2f5c3a] selection:text-white transition-colors py-12 px-6 sm:px-8">
      <div className="max-w-3xl mx-auto space-y-10">
        {/* Navigation */}
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors font-mono"
          >
            <ArrowLeft size={16} />
            <span>Return to Overview</span>
          </Link>
          <span className="text-xs font-mono text-stone-500">Document Revision: 2026.10</span>
        </div>

        {/* Header */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-100/70 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[#2f5c3a] dark:text-emerald-400 text-xs font-mono">
            <ShieldCheck size={14} />
            <span>Architectural Privacy Commitment</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">
            Privacy by Architecture
          </h1>
          <p className="text-base text-stone-600 dark:text-stone-400 leading-relaxed">
            LifeOS is built for cognitive quiet. That means no tracking pixels, no behavioral analytics, no ad engines, and no third-party telemetry.
          </p>
        </div>

        {/* Core Principles */}
        <div className="space-y-6">
          <section className="p-6 rounded-2xl bg-white dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800 space-y-3 shadow-xs">
            <div className="flex items-center gap-2.5 text-stone-900 dark:text-stone-100 font-medium">
              <Lock size={18} className="text-[#2f5c3a] dark:text-emerald-400" />
              <h2 className="text-lg">1. PostgreSQL Row-Level Security (RLS)</h2>
            </div>
            <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
              Every table in your LifeOS database (<code className="font-mono text-xs px-1 py-0.5 rounded bg-stone-100 dark:bg-stone-800">projects</code>, <code className="font-mono text-xs px-1 py-0.5 rounded bg-stone-100 dark:bg-stone-800">tasks</code>, <code className="font-mono text-xs px-1 py-0.5 rounded bg-stone-100 dark:bg-stone-800">notes</code>, <code className="font-mono text-xs px-1 py-0.5 rounded bg-stone-100 dark:bg-stone-800">transactions</code>, <code className="font-mono text-xs px-1 py-0.5 rounded bg-stone-100 dark:bg-stone-800">assignments</code>, <code className="font-mono text-xs px-1 py-0.5 rounded bg-stone-100 dark:bg-stone-800">habits</code>) strictly enforces database policies scoped to <code className="font-mono text-xs px-1 py-0.5 rounded bg-stone-100 dark:bg-stone-800">auth.uid()</code>. Unauthenticated requests are rejected at the database level with immediate access denial.
            </p>
          </section>

          <section className="p-6 rounded-2xl bg-white dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800 space-y-3 shadow-xs">
            <div className="flex items-center gap-2.5 text-stone-900 dark:text-stone-100 font-medium">
              <EyeOff size={18} className="text-[#2f5c3a] dark:text-emerald-400" />
              <h2 className="text-lg">2. Zero Third-Party Trackers &amp; Telemetry</h2>
            </div>
            <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
              We do not embed Google Analytics, Meta Pixel, PostHog, or session replay scripts. Fonts and icons are self-hosted directly from the application bundle to prevent external network profiling.
            </p>
          </section>

          <section className="p-6 rounded-2xl bg-white dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800 space-y-3 shadow-xs">
            <div className="flex items-center gap-2.5 text-stone-900 dark:text-stone-100 font-medium">
              <Database size={18} className="text-[#2f5c3a] dark:text-emerald-400" />
              <h2 className="text-lg">3. Local Interface Preferences</h2>
            </div>
            <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
              Visual themes (Crimson Dark, Crimson Light, Default Stone) and collapsed sidebar states are stored locally in your browser (<code className="font-mono text-xs px-1 py-0.5 rounded bg-stone-100 dark:bg-stone-800">localStorage</code>) and synced to your profile only when you explicitly save settings.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="pt-8 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between text-xs font-mono text-stone-500">
          <span>LifeOS Personal Computing</span>
          <Link href="/license" className="hover:text-stone-900 dark:hover:text-stone-200 transition-colors">
            MIT License
          </Link>
        </div>
      </div>
    </div>
  );
}
