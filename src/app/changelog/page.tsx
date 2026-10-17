import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Sparkles, CheckCircle2, GitCommit } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Changelog & Release Notes',
  description: 'Version history, updates, and releases for LifeOS personal dashboard.',
};

export default function ChangelogPage() {
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
          <span className="text-xs font-mono text-stone-500">Current: v1.0.0</span>
        </div>

        {/* Header */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-100/70 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[#2f5c3a] dark:text-emerald-400 text-xs font-mono">
            <Sparkles size={14} />
            <span>Product Release History</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">
            Changelog &amp; Release Notes
          </h1>
          <p className="text-base text-stone-600 dark:text-stone-400 leading-relaxed">
            Continuous engineering updates, security hardening, and new capabilities across LifeOS.
          </p>
        </div>

        {/* Release v1.0.0 */}
        <div className="space-y-6">
          <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800 space-y-5 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 dark:border-stone-800 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-1 rounded-md bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 font-mono text-xs font-bold">
                  v1.0.0
                </span>
                <span className="font-medium text-stone-900 dark:text-stone-100 text-base">
                  Initial Stable Release
                </span>
              </div>
              <span className="text-xs font-mono text-stone-500">October 2026</span>
            </div>

            <div className="space-y-4 text-sm text-stone-600 dark:text-stone-400">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-stone-900 dark:text-stone-100 font-medium">
                  <CheckCircle2 size={16} className="text-[#2f5c3a] dark:text-emerald-400" />
                  <span>PostgreSQL Row-Level Security Enforced</span>
                </div>
                <p className="pl-6 text-xs sm:text-sm text-stone-600 dark:text-stone-400">
                  All 9 application tables now strictly validate <code className="font-mono text-xs px-1 py-0.5 rounded bg-stone-100 dark:bg-stone-800">user_id = auth.uid()</code> with zero anonymous leakage.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-stone-900 dark:text-stone-100 font-medium">
                  <CheckCircle2 size={16} className="text-[#2f5c3a] dark:text-emerald-400" />
                  <span>Assignments &amp; Coursework Tracker</span>
                </div>
                <p className="pl-6 text-xs sm:text-sm text-stone-600 dark:text-stone-400">
                  Full tracking for academic modules, weighted grades, urgency matrices, and semester timelines.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-stone-900 dark:text-stone-100 font-medium">
                  <CheckCircle2 size={16} className="text-[#2f5c3a] dark:text-emerald-400" />
                  <span>Student Safe-Pace Pocket Ledger</span>
                </div>
                <p className="pl-6 text-xs sm:text-sm text-stone-600 dark:text-stone-400">
                  Automated monthly allowance burn-rate tracking with daily safe-to-spend dynamic calculations.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-stone-900 dark:text-stone-100 font-medium">
                  <CheckCircle2 size={16} className="text-[#2f5c3a] dark:text-emerald-400" />
                  <span>Markdown Checklist-to-Task Promotion</span>
                </div>
                <p className="pl-6 text-xs sm:text-sm text-stone-600 dark:text-stone-400">
                  Promote markdown note checkboxes directly into relational Kanban project tasks via atomic PostgreSQL stored procedures.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-stone-900 dark:text-stone-100 font-medium">
                  <CheckCircle2 size={16} className="text-[#2f5c3a] dark:text-emerald-400" />
                  <span>Crimson Dark &amp; Crimson Light Themes</span>
                </div>
                <p className="pl-6 text-xs sm:text-sm text-stone-600 dark:text-stone-400">
                  Selectable high-contrast color themes alongside the default warm stone aesthetic.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-8 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between text-xs font-mono text-stone-500">
          <span>LifeOS Release Management</span>
          <Link href="/dashboard" className="hover:text-stone-900 dark:hover:text-stone-200 transition-colors">
            Launch Workspace
          </Link>
        </div>
      </div>
    </div>
  );
}
