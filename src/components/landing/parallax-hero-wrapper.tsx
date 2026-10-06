'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { DesktopMockup } from './desktop-mockup';

export function ParallaxHeroWrapper() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Mouse subtle inertia tracking
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 18;
      const y = (e.clientY / window.innerHeight - 0.5) * 18;
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
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  // Layer parallax translations based on scroll
  const focalY = useTransform(smoothProgress, [0, 1], [0, -60]);
  const focalScale = useTransform(smoothProgress, [0, 0.5, 1], [1, 1.02, 0.98]);
  const bgLeftY = useTransform(smoothProgress, [0, 1], [0, -120]);
  const bgRightY = useTransform(smoothProgress, [0, 1], [0, -140]);
  const fgPillAY = useTransform(smoothProgress, [0, 1], [0, -180]);
  const fgPillBY = useTransform(smoothProgress, [0, 1], [0, -200]);

  return (
    <div ref={containerRef} className="relative w-full max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-20 select-none">
      {/* LAYER 3: BACKGROUND GENTLE DRIFT (Tactile Cards) */}
      
      {/* Left Background Card: Dieter Rams Principle */}
      <motion.div
        style={{ y: bgLeftY }}
        animate={{
          x: mousePos.x * -0.3,
          rotate: -3,
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 120 }}
        className="hidden lg:flex flex-col gap-2.5 absolute top-12 -left-4 w-60 p-4 rounded-xl bg-white/90 dark:bg-stone-900/90 backdrop-blur-md border border-stone-200/70 dark:border-stone-800 shadow-md text-left z-0 pointer-events-none"
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
        className="hidden lg:flex flex-col gap-2 absolute top-24 -right-4 w-64 p-4 rounded-xl bg-white/90 dark:bg-stone-900/90 backdrop-blur-md border border-stone-200/70 dark:border-stone-800 shadow-md text-left z-0 pointer-events-none"
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

      {/* LAYER 2: MID-GROUND MAIN FOCAL UI (The Desktop Mockup) */}
      <motion.div
        style={{ y: focalY, scale: focalScale }}
        animate={{
          x: mousePos.x * 0.2,
        }}
        transition={{ type: 'spring', damping: 30, stiffness: 100 }}
        className="relative z-10 w-full"
      >
        <DesktopMockup />
      </motion.div>

      {/* LAYER 1: FOREGROUND FAST DRIFT (Pill Telemetry Widgets) */}

      {/* Floating Pill A: Safe Pace */}
      <motion.div
        style={{ y: fgPillAY }}
        animate={{
          x: mousePos.x * 0.5,
          rotate: 1,
        }}
        transition={{ type: 'spring', damping: 20, stiffness: 140 }}
        className="hidden md:flex items-center gap-3 absolute -bottom-5 left-10 px-4 py-2.5 rounded-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xl z-20"
      >
        <div className="w-2.5 h-2.5 rounded-full bg-[#2f5c3a] dark:bg-emerald-400 animate-ping" />
        <div className="font-mono text-[12px] text-stone-900 dark:text-stone-100">
          <span className="font-semibold text-[#2f5c3a] dark:text-emerald-400">₹4,950 left</span>
          <span className="text-stone-400"> • </span>
          <span>₹380/day safe pace</span>
        </div>
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-500 border border-stone-200 dark:border-stone-700">
          INR LIVE
        </span>
      </motion.div>

      {/* Floating Pill B: Completed Task Check-off */}
      <motion.div
        style={{ y: fgPillBY }}
        animate={{
          x: mousePos.x * -0.5,
          rotate: -1,
        }}
        transition={{ type: 'spring', damping: 20, stiffness: 140 }}
        className="hidden md:flex items-center gap-2.5 absolute -bottom-7 right-10 px-4 py-2.5 rounded-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xl z-20"
      >
        <span className="material-symbols-outlined text-[16px] text-[#2f5c3a] dark:text-emerald-400">check_circle</span>
        <span className="font-sans text-[13px] text-stone-900 dark:text-stone-100 font-medium">
          Distributed Systems Proof Synthesized
        </span>
        <span className="font-mono text-[11px] text-stone-500 ml-1">45m</span>
      </motion.div>
    </div>
  );
}
