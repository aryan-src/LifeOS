'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ParallaxHeroWrapper } from './parallax-hero-wrapper';
import { MotionFooterClient } from './motion-footer-client';
import { useUIStore } from '@/lib/store/use-ui-store';

export function HeroLandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const openQuickCapture = useUIStore((s) => s.openQuickCapture);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="w-full min-h-screen bg-[#fff8f5] dark:bg-[#121110] text-[#1e1b18] dark:text-[#f5f5f0] font-sans antialiased selection:bg-[#2f5c3a] selection:text-white transition-colors">
      {/* FLOATING NOTION-STYLE NAVIGATION */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
          isScrolled
            ? 'bg-[#fff8f5]/90 dark:bg-[#121110]/90 backdrop-blur-md border-b border-stone-200/60 dark:border-stone-800/80 shadow-xs'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-6 h-6 rounded bg-stone-900 dark:bg-stone-100 text-stone-100 dark:text-stone-900 flex items-center justify-center text-[12px] font-mono font-medium shadow-xs">
                <span>●</span>
              </div>
              <span className="font-medium tracking-tight text-[15px] text-stone-900 dark:text-stone-100">
                LifeOS
              </span>
              <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-stone-200/60 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-300/40 dark:border-stone-700/40">
                v3.8
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1 text-[13px] text-stone-600 dark:text-stone-400 font-normal">
              <a
                href="#craft"
                className="px-2.5 py-1 rounded-md hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/40 dark:hover:bg-stone-800/40 transition-colors"
              >
                Philosophy
              </a>
              <a
                href="#workspaces"
                className="px-2.5 py-1 rounded-md hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/40 dark:hover:bg-stone-800/40 transition-colors"
              >
                Five Workspaces
              </a>
              <a
                href="#contrast"
                className="px-2.5 py-1 rounded-md hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/40 dark:hover:bg-stone-800/40 transition-colors"
              >
                The Contrast
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => openQuickCapture()}
              className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-[12px] font-mono text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 shadow-xs transition-all"
            >
              <span className="text-[13px] material-symbols-outlined text-stone-400">terminal</span>
              <span>Quick Find</span>
              <kbd className="text-[10px] text-stone-500 bg-stone-100 dark:bg-stone-800 px-1 py-0.5 rounded">⌘K</kbd>
            </button>
            <Link
              href="/login"
              className="px-3.5 py-1.5 rounded-md bg-stone-900 dark:bg-stone-100 text-stone-50 dark:text-stone-900 text-[13px] font-medium hover:opacity-90 transition-opacity shadow-xs"
            >
              Launch Workspace
            </Link>
          </div>
        </div>
      </header>

      {/* MAIN BODY CANVAS */}
      <main className="w-full relative pt-28 md:pt-36">
        {/* HERO TEXT STACK */}
        <section className="max-w-4xl mx-auto px-6 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs text-[12px] font-mono text-stone-600 dark:text-stone-400">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2f5c3a] dark:bg-emerald-400 animate-pulse" />
            <span>Local-first architecture for cognitive calm</span>
            <span className="text-stone-300 dark:text-stone-700">•</span>
            <span className="text-[#2f5c3a] dark:text-emerald-400 font-medium">Sub-15ms Latency</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-[68px] md:leading-[1.12] tracking-[-0.035em] font-normal text-stone-900 dark:text-stone-100 max-w-3xl mx-auto">
            A quiet operating system for students, builders, and{' '}
            <span className="font-serif italic font-normal text-[#2f5c3a] dark:text-emerald-400">thinkers</span>.
          </h1>

          <p className="text-base sm:text-lg text-stone-600 dark:text-stone-400 max-w-2xl mx-auto font-normal leading-relaxed">
            Discard bloated SaaS suites, fragmented notes, and anxious spreadsheets. LifeOS brings tactile physical clarity to your everyday computing with an offline-first personal command center.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/login"
              className="px-5 py-2.5 rounded-lg bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 text-[14px] font-medium hover:opacity-90 transition-all shadow-xs flex items-center gap-2"
            >
              <span>Launch Your Vault</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
            <button
              type="button"
              onClick={() => openQuickCapture()}
              className="px-4 py-2.5 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-800 dark:text-stone-200 text-[14px] font-medium hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors shadow-xs flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px] text-stone-400">play_circle</span>
              <span>2-Minute Walkthrough</span>
              <kbd className="text-[11px] font-mono text-stone-400 bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded ml-1">⌘K</kbd>
            </button>
          </div>

          {/* Live metrics micro-ticker */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-6 text-[12px] font-mono text-stone-500">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px] text-[#2f5c3a] dark:text-emerald-400">database</span>
              <span>Zero cloud lock-in</span>
            </div>
            <span className="hidden sm:inline text-stone-300 dark:text-stone-700">•</span>
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px] text-[#2f5c3a] dark:text-emerald-400">currency_rupee</span>
              <span>Native Student Safe-Pace</span>
            </div>
            <span className="hidden sm:inline text-stone-300 dark:text-stone-700">•</span>
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px] text-[#2f5c3a] dark:text-emerald-400">description</span>
              <span>Raw Markdown &amp; Obsidian</span>
            </div>
          </div>
        </section>

        {/* PARALLAX SCROLLING DESKTOP STAGE */}
        <ParallaxHeroWrapper />

        {/* TACTILE ARCHIVAL CRAFTSMANSHIP MOSAIC */}
        <section className="max-w-6xl mx-auto px-6 py-20 space-y-12" id="craft">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-center">
            <div className="md:col-span-5 space-y-4">
              <div className="text-[11px] font-mono uppercase tracking-widest text-[#2f5c3a] dark:text-emerald-400 font-semibold">
                Archival Materiality
              </div>
              <h2 className="text-3xl sm:text-4xl font-normal tracking-tight text-stone-900 dark:text-stone-100">
                Physical serenity meets local-first computation.
              </h2>
              <p className="text-base text-stone-600 dark:text-stone-400 leading-relaxed">
                Inspired by mid-century bookbinders, Dieter Rams’ functionalism, and Japanese drafting stationery, LifeOS brings the warm tactile reassurance of physical tools back to personal computing.
              </p>
              <div className="space-y-2.5 pt-2 text-[13px] text-stone-800 dark:text-stone-200 font-sans">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[#2f5c3a] dark:text-emerald-400 text-[18px]">check_circle</span>
                  <span>Zero telemetry, trackers, or unsolicited notification badges.</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[#2f5c3a] dark:text-emerald-400 text-[18px]">check_circle</span>
                  <span>Completely offline-first with immediate local storage writes.</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[#2f5c3a] dark:text-emerald-400 text-[18px]">check_circle</span>
                  <span>Native INR (₹) daily burn velocity calculator for students.</span>
                </div>
              </div>
            </div>

            <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="rounded-xl overflow-hidden border border-stone-200/80 dark:border-stone-800 shadow-sm bg-white dark:bg-stone-900 group">
                <img
                  alt="Minimalist calm desk with analog paper notebook and quiet lighting"
                  className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500"
                  src="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80"
                />
                <div className="p-4 bg-white dark:bg-stone-900">
                  <div className="text-[11px] font-mono text-[#2f5c3a] dark:text-emerald-400 font-medium">WORKSPACE STILLNESS</div>
                  <div className="text-[14px] font-medium text-stone-900 dark:text-stone-100 mt-1">Calm, non-distracting visual peace.</div>
                </div>
              </div>

              <div className="rounded-xl overflow-hidden border border-stone-200/80 dark:border-stone-800 shadow-sm bg-white dark:bg-stone-900 sm:translate-y-6 group">
                <img
                  alt="Archival drafting tools, mechanical pencil and brass ruler on oak wood"
                  className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500"
                  src="https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=800&q=80"
                />
                <div className="p-4 bg-white dark:bg-stone-900">
                  <div className="text-[11px] font-mono text-[#2f5c3a] dark:text-emerald-400 font-medium">TACTILE PRECISION</div>
                  <div className="text-[14px] font-medium text-stone-900 dark:text-stone-100 mt-1">Tools built to endure decades, not sprint cycles.</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* THE FIVE WORKSPACES BENTO */}
        <section className="max-w-6xl mx-auto px-6 py-20 space-y-12" id="workspaces">
          <div className="max-w-2xl space-y-3">
            <div className="text-[11px] font-mono uppercase tracking-widest text-[#2f5c3a] dark:text-emerald-400 font-semibold">
              The Five Workspaces
            </div>
            <h2 className="text-3xl sm:text-4xl font-normal tracking-tight text-stone-900 dark:text-stone-100">
              Five calibrated modules. One cohesive mind.
            </h2>
            <p className="text-base text-stone-600 dark:text-stone-400 leading-relaxed">
              Open canvas architecture without artificial restrictions. Interconnected via raw Markdown files and relational database models.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Card 1: Command Center (Span 7) */}
            <div className="md:col-span-7 p-6 rounded-2xl bg-white dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4 flex flex-col justify-between hover:border-stone-400/50 transition-colors">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-800 dark:text-stone-200">
                    <span className="material-symbols-outlined text-[18px]">dashboard</span>
                  </div>
                  <span className="text-[11px] font-mono text-[#2f5c3a] dark:text-emerald-400 font-semibold">MODULE 01</span>
                </div>
                <h3 className="text-xl font-medium text-stone-900 dark:text-stone-100">Global Command Center</h3>
                <p className="text-[14px] text-stone-600 dark:text-stone-400 leading-relaxed">
                  Real-time unified telemetry across courses, personal projects, and financial burn. Replaces dozens of bloated browser tabs with a clean HUD.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200/60 dark:border-stone-800/80 space-y-2 font-mono text-[12px]">
                <div className="flex items-center justify-between">
                  <span>Cognitive Load Index</span>
                  <span className="text-[#2f5c3a] dark:text-emerald-400 font-medium">Optimal (24%)</span>
                </div>
                <div className="w-full bg-stone-200 dark:bg-stone-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#2f5c3a] h-full rounded-full" style={{ width: '24%' }} />
                </div>
                <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1">
                  <span>3 active projects</span>
                  <span>4 deep blocks planned</span>
                  <span>Safe pace active</span>
                </div>
              </div>
            </div>

            {/* Card 2: 2-Second Pocket Ledger (Span 5) */}
            <div className="md:col-span-5 p-6 rounded-2xl bg-white dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4 flex flex-col justify-between hover:border-stone-400/50 transition-colors">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-800 dark:text-stone-200">
                    <span className="material-symbols-outlined text-[18px]">currency_rupee</span>
                  </div>
                  <span className="text-[11px] font-mono text-[#2f5c3a] dark:text-emerald-400 font-semibold">MODULE 02</span>
                </div>
                <h3 className="text-xl font-medium text-stone-900 dark:text-stone-100">2-Second Pocket Ledger</h3>
                <p className="text-[14px] text-stone-600 dark:text-stone-400 leading-relaxed">
                  Frictionless student micro-allowance logging. Dynamic daily safe spending calculations in INR (₹) prevent end-of-month financial crises.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200/60 dark:border-stone-800/80 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-mono text-stone-500">Today&apos;s Remaining Cap</div>
                  <div className="text-xl font-mono font-semibold text-stone-900 dark:text-stone-100">₹380.00</div>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-[#2f5c3a] dark:text-emerald-400 font-mono text-[11px] font-medium">Safe Pace</span>
              </div>
            </div>

            {/* Card 3: Deep Work & Daily Task Matrix (Span 4) */}
            <div className="md:col-span-4 p-6 rounded-2xl bg-white dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4 flex flex-col justify-between hover:border-stone-400/50 transition-colors">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-800 dark:text-stone-200">
                    <span className="material-symbols-outlined text-[18px]">timelapse</span>
                  </div>
                  <span className="text-[11px] font-mono text-[#2f5c3a] dark:text-emerald-400 font-semibold">MODULE 03</span>
                </div>
                <h3 className="text-xl font-medium text-stone-900 dark:text-stone-100">Deep Work Engine</h3>
                <p className="text-[14px] text-stone-600 dark:text-stone-400 leading-relaxed">
                  Sprint cadence timer, weighted P1/P2/P3 priorities, and real velocity curves. No guilt-inducing backlog piles.
                </p>
              </div>
              <div className="pt-2 text-[12px] font-mono text-stone-500 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-[#2f5c3a] dark:text-emerald-400">tune</span>
                <span>Energy-based task routing</span>
              </div>
            </div>

            {/* Card 4: Kanban Roadmap (Span 4) */}
            <div className="md:col-span-4 p-6 rounded-2xl bg-white dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4 flex flex-col justify-between hover:border-stone-400/50 transition-colors">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-800 dark:text-stone-200">
                    <span className="material-symbols-outlined text-[18px]">view_kanban</span>
                  </div>
                  <span className="text-[11px] font-mono text-[#2f5c3a] dark:text-emerald-400 font-semibold">MODULE 04</span>
                </div>
                <h3 className="text-xl font-medium text-stone-900 dark:text-stone-100">Roadmap Kanban</h3>
                <p className="text-[14px] text-stone-600 dark:text-stone-400 leading-relaxed">
                  Term milestone tracking and recursive subtasks. Inspect your entire horizon at a single glance with zero clutter.
                </p>
              </div>
              <div className="pt-2 text-[12px] font-mono text-stone-500 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-[#2f5c3a] dark:text-emerald-400">view_column</span>
                <span>3-state execution pipeline</span>
              </div>
            </div>

            {/* Card 5: Obsidian & Markdown Sync (Span 4) */}
            <div className="md:col-span-4 p-6 rounded-2xl bg-white dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4 flex flex-col justify-between hover:border-stone-400/50 transition-colors">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-800 dark:text-stone-200">
                    <span className="material-symbols-outlined text-[18px]">sync_alt</span>
                  </div>
                  <span className="text-[11px] font-mono text-[#2f5c3a] dark:text-emerald-400 font-semibold">MODULE 05</span>
                </div>
                <h3 className="text-xl font-medium text-stone-900 dark:text-stone-100">Vault &amp; Notes</h3>
                <p className="text-[14px] text-stone-600 dark:text-stone-400 leading-relaxed">
                  Instant spark capture with tags. 1-click promotion directly into active project pipelines and task trees.
                </p>
              </div>
              <div className="pt-2 text-[12px] font-mono text-stone-500 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-[#2f5c3a] dark:text-emerald-400">lock_open</span>
                <span>Raw text files forever</span>
              </div>
            </div>
          </div>
        </section>

        {/* THE CONTRAST: QUIET VS LOUD SOFTWARE */}
        <section className="max-w-6xl mx-auto px-6 py-20 space-y-12" id="contrast">
          <div className="p-8 sm:p-10 rounded-2xl bg-stone-100/60 dark:bg-stone-900/40 border border-stone-200/70 dark:border-stone-800 space-y-10">
            <div className="max-w-2xl space-y-2">
              <div className="text-[11px] font-mono uppercase tracking-widest text-[#2f5c3a] dark:text-emerald-400 font-semibold">
                The Philosophy
              </div>
              <h2 className="text-3xl sm:text-4xl font-normal tracking-tight text-stone-900 dark:text-stone-100">
                The contrast is palpable.
              </h2>
              <p className="text-base text-stone-600 dark:text-stone-400 leading-relaxed">
                Modern productivity tools have become noisy and addictive. LifeOS reverses the paradigm: quiet software that respects human dignity.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/70 dark:border-stone-800 space-y-4 flex flex-col justify-between shadow-xs">
                <div className="space-y-2">
                  <div className="text-[12px] font-mono text-rose-600 dark:text-rose-400 flex items-center gap-1.5 font-medium">
                    <span className="material-symbols-outlined text-[15px]">close</span>
                    <span>Loud Tools</span>
                  </div>
                  <h4 className="text-base font-medium text-stone-900 dark:text-stone-100">Constant Attention Theft</h4>
                  <p className="text-[13px] text-stone-500 leading-relaxed">
                    Red badges, artificial streaks, unsolicited email digests, and gamified dopamine loops designed to maximize screen time.
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-stone-50 dark:bg-stone-950 text-[12px] space-y-1 font-mono border border-stone-200/50 dark:border-stone-800">
                  <div className="text-[#2f5c3a] dark:text-emerald-400 font-medium flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">check</span>
                    <span>LifeOS</span>
                  </div>
                  <p className="text-stone-800 dark:text-stone-200 font-sans">Zero badges. Zero streaks. Opens in 15ms, executes deliberately, and gets out of your way.</p>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/70 dark:border-stone-800 space-y-4 flex flex-col justify-between shadow-xs">
                <div className="space-y-2">
                  <div className="text-[12px] font-mono text-rose-600 dark:text-rose-400 flex items-center gap-1.5 font-medium">
                    <span className="material-symbols-outlined text-[15px]">close</span>
                    <span>Loud Tools</span>
                  </div>
                  <h4 className="text-base font-medium text-stone-900 dark:text-stone-100">Proprietary Cloud Lock-in</h4>
                  <p className="text-[13px] text-stone-500 leading-relaxed">
                    Walled gardens, complex JSON schemas, export restrictions, and subscription hostage traps when plans change.
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-stone-50 dark:bg-stone-950 text-[12px] space-y-1 font-mono border border-stone-200/50 dark:border-stone-800">
                  <div className="text-[#2f5c3a] dark:text-emerald-400 font-medium flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">check</span>
                    <span>LifeOS</span>
                  </div>
                  <p className="text-stone-800 dark:text-stone-200 font-sans">Local relational database and raw Markdown sitting right on your disk. You own your words forever.</p>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/70 dark:border-stone-800 space-y-4 flex flex-col justify-between shadow-xs">
                <div className="space-y-2">
                  <div className="text-[12px] font-mono text-rose-600 dark:text-rose-400 flex items-center gap-1.5 font-medium">
                    <span className="material-symbols-outlined text-[15px]">close</span>
                    <span>Loud Tools</span>
                  </div>
                  <h4 className="text-base font-medium text-stone-900 dark:text-stone-100">Bloated Nested Hierarchies</h4>
                  <p className="text-[13px] text-stone-500 leading-relaxed">
                    Endless recursive folder trees, slow 400ms web page transitions, and friction just to log a simple ₹40 chai.
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-stone-50 dark:bg-stone-950 text-[12px] space-y-1 font-mono border border-stone-200/50 dark:border-stone-800">
                  <div className="text-[#2f5c3a] dark:text-emerald-400 font-medium flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">check</span>
                    <span>LifeOS</span>
                  </div>
                  <p className="text-stone-800 dark:text-stone-200 font-sans">Keyboard-first command palette. Instant sub-15ms modal capture anywhere via ⌘K or custom shortcut.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CALL TO ACTION BANNER */}
        <section className="max-w-6xl mx-auto px-6 py-12" id="launch">
          <div className="p-8 sm:p-12 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-md flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-2 max-w-xl text-center md:text-left">
              <div className="text-[11px] font-mono uppercase tracking-widest text-[#2f5c3a] dark:text-emerald-400 font-semibold">
                Immediate Clarity
              </div>
              <h2 className="text-3xl sm:text-4xl font-normal tracking-tight text-stone-900 dark:text-stone-100">
                Reclaim your cognitive bandwidth today.
              </h2>
              <p className="text-base text-stone-600 dark:text-stone-400">
                Personal computing without the distraction. Local-first, private, and built for life.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <Link
                href="/login"
                className="w-full sm:w-auto px-6 py-3 rounded-lg bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 font-medium hover:opacity-90 transition-opacity shadow-xs text-center flex items-center justify-center gap-2"
              >
                <span>Launch Free Vault</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </Link>
              <div className="flex items-center gap-1.5 font-mono text-[12px] text-stone-500 bg-stone-100 dark:bg-stone-800 px-3 py-3 rounded-lg border border-stone-200 dark:border-stone-700">
                <span>Press</span>
                <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 font-medium">⌘</kbd>
                <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 font-medium">K</kbd>
                <span>anywhere</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* MOTION FOOTER */}
      <MotionFooterClient />
    </div>
  );
}
