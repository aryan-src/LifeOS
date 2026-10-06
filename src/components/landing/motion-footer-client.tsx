'use client';

import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';

export function MotionFooterClient() {
  const footerRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: footerRef,
    offset: ['start end', 'end end'],
  });

  // Kinetic typography scroll-linked character scale & letter spacing
  const letterSpacing = useTransform(scrollYProgress, [0, 1], ['-0.06em', '0.02em']);
  const opacity = useTransform(scrollYProgress, [0, 0.4, 1], [0.15, 0.35, 0.7]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.95, 1]);

  return (
    <footer
      ref={footerRef}
      className="w-full bg-[#181615] text-[#eae2db] pt-20 pb-12 relative overflow-hidden transition-colors border-t border-stone-800"
    >
      {/* Ambient micro-grid background */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      <div className="max-w-6xl mx-auto px-6 space-y-16 relative z-10">
        {/* TOP DOCK: SYSTEM TELEMETRY & SHORTCUT KEY DOCK */}
        <div className="flex flex-wrap items-center justify-between gap-6 pb-8 border-b border-stone-800 text-[12px] font-mono">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-stone-300">Vault Engine: Operational (Local SQLite)</span>
            <span className="text-stone-600">•</span>
            <span className="text-stone-400">Zero Cloud Telemetry</span>
          </div>
          <div className="flex items-center gap-2 text-stone-400">
            <span>Shortcuts:</span>
            <kbd className="px-1.5 py-0.5 rounded bg-stone-900 border border-stone-800 text-stone-200">⌘K Search</kbd>
            <kbd className="px-1.5 py-0.5 rounded bg-stone-900 border border-stone-800 text-stone-200">⌥Space Capture</kbd>
            <kbd className="px-1.5 py-0.5 rounded bg-stone-900 border border-stone-800 text-stone-200">? Keys</kbd>
          </div>
        </div>

        {/* EDITORIAL DIRECTORY COLUMNS */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded bg-white text-stone-900 flex items-center justify-center font-mono text-[11px] font-bold">
                ●
              </div>
              <span className="font-medium tracking-tight text-lg text-white">LifeOS</span>
            </div>
            <p className="text-stone-400 text-[14px] leading-relaxed max-w-sm">
              Archival-grade personal computing. Conceived for students, researchers, and craftspeople who seek deliberate cognitive quiet.
            </p>
            <div className="font-mono text-[11px] text-stone-500 pt-2">
              © 2026 LifeOS Lab • Distributed under Archival Open Source License
            </div>
          </div>

          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8 text-[13px]">
            <div className="space-y-3">
              <div className="font-mono text-[11px] uppercase tracking-wider text-stone-500">Architecture</div>
              <ul className="space-y-2 text-stone-400">
                <li><span className="hover:text-white transition-colors cursor-pointer">Local SQLite Engine</span></li>
                <li><span className="hover:text-white transition-colors cursor-pointer">Obsidian Bi-directional</span></li>
                <li><span className="hover:text-white transition-colors cursor-pointer">Student Safe-Pace</span></li>
                <li><span className="hover:text-white transition-colors cursor-pointer">Rust WebAssembly Core</span></li>
              </ul>
            </div>
            <div className="space-y-3">
              <div className="font-mono text-[11px] uppercase tracking-wider text-stone-500">Modules</div>
              <ul className="space-y-2 text-stone-400">
                <li><span className="hover:text-white transition-colors cursor-pointer">Global HUD</span></li>
                <li><span className="hover:text-white transition-colors cursor-pointer">Pocket Ledger (INR)</span></li>
                <li><span className="hover:text-white transition-colors cursor-pointer">Deep Work Sprint</span></li>
                <li><span className="hover:text-white transition-colors cursor-pointer">Kanban Horizon</span></li>
              </ul>
            </div>
            <div className="space-y-3">
              <div className="font-mono text-[11px] uppercase tracking-wider text-stone-500">Manifesto</div>
              <ul className="space-y-2 text-stone-400">
                <li><span className="hover:text-white transition-colors cursor-pointer">Quiet Computing</span></li>
                <li><span className="hover:text-white transition-colors cursor-pointer">Dieter Rams&apos; 10th Law</span></li>
                <li><span className="hover:text-white transition-colors cursor-pointer">50-Year Plain Text</span></li>
                <li><span className="hover:text-white transition-colors cursor-pointer">Release Notes (v3.8)</span></li>
              </ul>
            </div>
          </div>
        </div>

        {/* KINETIC MOTION EXPANSIVE TYPOGRAPHY (Scroll-Triggered Character Scale) */}
        <div className="pt-8 overflow-hidden select-none">
          <motion.div
            style={{
              letterSpacing,
              opacity,
              scale,
            }}
            className="text-[72px] sm:text-[120px] md:text-[170px] leading-[0.85] font-semibold text-stone-400/30 flex justify-between uppercase transition-all duration-150"
          >
            <span>L</span>
            <span>I</span>
            <span>F</span>
            <span>E</span>
            <span>O</span>
            <span>S</span>
          </motion.div>
        </div>

        {/* BOTTOM SUB-BAR */}
        <div className="pt-6 border-t border-stone-800/80 flex flex-wrap items-center justify-between gap-4 text-[12px] font-mono text-stone-500">
          <div className="flex items-center gap-2">
            <span>Crafted with Inter, Newsreader &amp; JetBrains Mono</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hover:text-stone-300 transition-colors">Launch Workspace</Link>
            <span className="text-stone-700">•</span>
            <span className="hover:text-stone-300 transition-colors cursor-pointer">Privacy by Architecture</span>
            <span className="text-stone-700">•</span>
            <span className="hover:text-stone-300 transition-colors cursor-pointer">Security Verified</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
