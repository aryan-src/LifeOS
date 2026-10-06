'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import Link from 'next/link';
import { DesktopMockup } from './desktop-mockup';
import { useUIStore } from '@/lib/store/use-ui-store';

export function ParallaxHeroWrapper() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const openQuickCapture = useUIStore((s) => s.openQuickCapture);

  // Subtle mouse inertia tracking
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 16;
      const y = (e.clientY / window.innerHeight - 0.5) * 16;
      setMousePos({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 25,
    restDelta: 0.001,
  });

  // 1. Hero Text Parallax: gently scales, translates upward, and fades on scroll
  const heroTextY = useTransform(smoothProgress, [0, 0.45], [0, -85]);
  const heroTextScale = useTransform(smoothProgress, [0, 0.45], [1, 0.93]);
  const heroTextOpacity = useTransform(smoothProgress, [0, 0.38], [1, 0]);

  // 2. Main Dashboard Preview: reveals itself, scales in, and translates smoothly into view
  const mockupY = useTransform(smoothProgress, [0, 0.5, 1], [35, -30, -75]);
  const mockupScale = useTransform(smoothProgress, [0, 0.4, 1], [0.95, 1, 0.98]);
  const mockupOpacity = useTransform(smoothProgress, [0, 0.15], [0.88, 1]);

  // 3. Multi-layer depth translations
  const bgLeftY = useTransform(smoothProgress, [0, 1], [0, -130]);
  const bgRightY = useTransform(smoothProgress, [0, 1], [0, -150]);
  const fgPillAY = useTransform(smoothProgress, [0, 1], [0, -190]);
  const fgPillBY = useTransform(smoothProgress, [0, 1], [0, -210]);

  return (
    <div ref={containerRef} className="relative w-full max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-24">
      {/* HERO TEXT STACK WITH PARALLAX SCALE & FADE */}
      <motion.div
        style={{
          y: heroTextY,
          scale: heroTextScale,
          opacity: heroTextOpacity,
        }}
        className="text-center space-y-6 max-w-4xl mx-auto pt-6 pb-12 will-change-transform"
      >
        {/* Ambient Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 dark:bg-stone-900/90 border border-stone-200/70 dark:border-stone-800 text-[12px] font-mono text-stone-600 dark:text-stone-400 shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-[#2f5c3a] dark:bg-emerald-400 animate-pulse" />
          <span>Local-first architecture for cognitive calm</span>
          <span className="text-stone-300 dark:text-stone-700">•</span>
          <span className="text-[#2f5c3a] dark:text-emerald-400 font-medium">Sub-15ms Latency</span>
        </div>

        {/* Editorial Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-[68px] md:leading-[1.12] tracking-[-0.035em] font-normal text-stone-900 dark:text-stone-100 max-w-3xl mx-auto">
          A quiet operating system for students, builders, and{' '}
          <span className="font-serif italic font-normal text-[#2f5c3a] dark:text-emerald-400">thinkers</span>.
        </h1>

        {/* Quiet Subtext */}
        <p className="text-base sm:text-lg text-stone-600 dark:text-stone-400 max-w-2xl mx-auto font-normal leading-relaxed">
          Discard bloated SaaS suites, fragmented notes, and anxious spreadsheets. LifeOS brings tactile physical clarity to your everyday computing with an offline-first personal command center.
        </p>

        {/* Action Triggers */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href="/login"
            className="px-5 py-2.5 rounded-lg bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 text-[14px] font-medium hover:opacity-90 active:scale-[0.99] transition-all shadow-xs flex items-center gap-2"
          >
            <span>Launch Your Vault</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </Link>
          <button
            type="button"
            onClick={() => openQuickCapture()}
            className="px-4 py-2.5 rounded-lg bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 text-stone-800 dark:text-stone-200 text-[14px] font-medium hover:bg-stone-50 dark:hover:bg-stone-800/60 transition-colors shadow-xs flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px] text-stone-400">play_circle</span>
            <span>2-Minute Walkthrough</span>
            <kbd className="text-[11px] font-mono text-stone-400 bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded ml-1 border border-stone-200/60 dark:border-stone-700/60">⌘K</kbd>
          </button>
        </div>

        {/* Live Metrics Micro-Ticker */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-6 text-[12px] font-mono text-stone-400 dark:text-stone-500">
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
      </motion.div>

      {/* MULTI-LAYER PARALLAX STAGE (Revealed on Scroll) */}
      <div className="relative w-full pt-4">
        {/* LAYER 3: BACKGROUND GENTLE DRIFT (Tactile Cards) */}

        {/* Left Background Card: Dieter Rams Principle */}
        <motion.div
          style={{ y: bgLeftY }}
          animate={{
            x: mousePos.x * -0.3,
            rotate: -3,
          }}
          transition={{ type: 'spring', damping: 25, stiffness: 120 }}
          className="hidden lg:flex flex-col gap-2.5 absolute top-10 -left-6 w-60 p-4 rounded-xl bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border border-stone-200/70 dark:border-stone-800 shadow-sm text-left z-0 pointer-events-none"
        >
          <div className="flex items-center justify-between text-[11px] font-mono text-stone-400 dark:text-stone-500">
            <span>PRINCIPLE 04</span>
            <span className="material-symbols-outlined text-[14px] text-[#2f5c3a] dark:text-emerald-400">verified</span>
          </div>
          <div className="font-serif italic text-stone-900 dark:text-stone-100 text-[14px] leading-snug">
            &ldquo;Good design is unobtrusive. Products are tools, neither decorative objects nor works of art.&rdquo;
          </div>
          <div className="text-[11px] font-mono text-stone-500 flex items-center justify-between pt-1 border-t border-stone-200/60 dark:border-stone-800">
            <span>Dieter Rams</span>
            <span>1976</span>
          </div>
        </motion.div>

        {/* Right Background Card: Storage Telemetry */}
        <motion.div
          style={{ y: bgRightY }}
          animate={{
            x: mousePos.x * 0.3,
            rotate: 2.5,
          }}
          transition={{ type: 'spring', damping: 25, stiffness: 120 }}
          className="hidden lg:flex flex-col gap-2 absolute top-20 -right-6 w-64 p-4 rounded-xl bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border border-stone-200/70 dark:border-stone-800 shadow-sm text-left z-0 pointer-events-none"
        >
          <div className="flex items-center justify-between text-[11px] font-mono text-stone-400 dark:text-stone-500">
            <span>STORAGE TELEMETRY</span>
            <span className="w-2 h-2 rounded-full bg-[#2f5c3a] dark:bg-emerald-400" />
          </div>
          <div className="font-mono text-[13px] text-stone-900 dark:text-stone-100 font-medium">
            ~/.lifeos/vault/atomic/
          </div>
          <p className="text-[12px] text-stone-600 dark:text-stone-400 font-normal leading-relaxed">
            SQLite indexing 4,281 local notes in 4.2ms. Bi-directional sync with Obsidian enabled.
          </p>
          <div className="flex items-center justify-between pt-1 border-t border-stone-200/60 dark:border-stone-800 text-[11px] font-mono text-[#2f5c3a] dark:text-emerald-400">
            <span>100% Offline Capable</span>
            <span>0 B Sent to Cloud</span>
          </div>
        </motion.div>

        {/* LAYER 2: MID-GROUND MAIN FOCAL UI (The Desktop Mockup Window) */}
        <motion.div
          style={{
            y: mockupY,
            scale: mockupScale,
            opacity: mockupOpacity,
          }}
          animate={{
            x: mousePos.x * 0.18,
          }}
          transition={{ type: 'spring', damping: 30, stiffness: 100 }}
          className="relative z-10 w-full will-change-transform"
        >
          <DesktopMockup />
        </motion.div>

        {/* LAYER 1: FOREGROUND FAST DRIFT (Floating Status Pills) */}

        {/* Floating Pill A: Safe Pace */}
        <motion.div
          style={{ y: fgPillAY }}
          animate={{
            x: mousePos.x * 0.45,
            rotate: 1,
          }}
          transition={{ type: 'spring', damping: 20, stiffness: 140 }}
          className="hidden md:flex items-center gap-3 absolute -bottom-5 left-8 px-4 py-2.5 rounded-full bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm z-20"
        >
          <div className="w-2.5 h-2.5 rounded-full bg-[#2f5c3a] dark:bg-emerald-400 animate-ping" />
          <div className="font-mono text-[12px] text-stone-900 dark:text-stone-100">
            <span className="font-semibold text-[#2f5c3a] dark:text-emerald-400">₹4,950 left</span>
            <span className="text-stone-400"> • </span>
            <span>₹380/day safe pace</span>
          </div>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-500 border border-stone-200/60 dark:border-stone-700/60">
            INR LIVE
          </span>
        </motion.div>

        {/* Floating Pill B: Completed Task Check-off */}
        <motion.div
          style={{ y: fgPillBY }}
          animate={{
            x: mousePos.x * -0.45,
            rotate: -1,
          }}
          transition={{ type: 'spring', damping: 20, stiffness: 140 }}
          className="hidden md:flex items-center gap-2.5 absolute -bottom-7 right-8 px-4 py-2.5 rounded-full bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm z-20"
        >
          <span className="material-symbols-outlined text-[16px] text-[#2f5c3a] dark:text-emerald-400">check_circle</span>
          <span className="font-sans text-[13px] text-stone-900 dark:text-stone-100 font-medium">
            Distributed Systems Proof Synthesized
          </span>
          <span className="font-mono text-[11px] text-stone-400 ml-1">45m</span>
        </motion.div>
      </div>
    </div>
  );
}
