'use client';

import React, { useState, useEffect, useRef } from 'react';

export type TimerMode = 'focus' | 'shortBreak' | 'longBreak';

export interface FocusTimerProps {
  className?: string;
  onSessionComplete?: (mode: TimerMode, completedSprints: number) => void;
}

const MODE_CONFIG: Record<
  TimerMode,
  {
    name: string;
    header: string;
    sessionLabel: string;
    badgeText: string;
    duration: number; // in seconds
  }
> = {
  focus: {
    name: 'Focus',
    header: 'DEEP WORK SPRINT',
    sessionLabel: 'Session: Pomodoro Standard',
    badgeText: 'Focus Mode',
    duration: 25 * 60,
  },
  shortBreak: {
    name: 'Short Break',
    header: 'SHORT BREAK',
    sessionLabel: 'Session: 5-Minute Recharge',
    badgeText: 'Break Mode',
    duration: 5 * 60,
  },
  longBreak: {
    name: 'Long Break',
    header: 'LONG REST',
    sessionLabel: 'Session: 15-Minute Extended Rest',
    badgeText: 'Break Mode',
    duration: 15 * 60,
  },
};

/**
 * Synthesizes a gentle, non-intrusive harmonic chime using the browser Web Audio API
 */
function playChime() {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    // Gentle ascending harmonic chime: D5 -> F#5 -> A5
    const now = ctx.currentTime;
    const notes = [587.33, 739.99, 880];

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);

      // Smooth attack and exponential decay
      gain.gain.setValueAtTime(0, now + idx * 0.12);
      gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.12 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.12 + 0.8);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.85);
    });
  } catch (err) {
    console.debug('Chime audio playback suppressed:', err);
  }
}

export function FocusTimer({ className = '', onSessionComplete }: FocusTimerProps) {
  const [mode, setMode] = useState<TimerMode>('focus');
  const [remainingSeconds, setRemainingSeconds] = useState<number>(MODE_CONFIG.focus.duration);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [completedSprints, setCompletedSprints] = useState<number>(0);

  // Background tab throttling protection: track target completion timestamp
  const endTimeRef = useRef<number | null>(null);

  const currentConfig = MODE_CONFIG[mode];
  const totalDuration = currentConfig.duration;

  // Format time strictly as MM:SS
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const timeDisplay = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Calculate exact percentage filled as the timer counts down
  const progressPercentage = Math.min(
    100,
    Math.max(0, ((totalDuration - remainingSeconds) / totalDuration) * 100)
  );

  // Switch interval / mode
  const handleModeChange = (newMode: TimerMode) => {
    setIsRunning(false);
    setMode(newMode);
    setRemainingSeconds(MODE_CONFIG[newMode].duration);
    endTimeRef.current = null;
  };

  // Toggle Play / Pause / Resume
  const handleTogglePlayPause = () => {
    if (isRunning) {
      // Pause
      setIsRunning(false);
      endTimeRef.current = null;
    } else {
      // Start or Resume
      const targetSeconds = remainingSeconds === 0 ? totalDuration : remainingSeconds;
      setRemainingSeconds(targetSeconds);
      endTimeRef.current = Date.now() + targetSeconds * 1000;
      setIsRunning(true);
    }
  };

  // Reset to initial mode duration
  const handleReset = () => {
    setIsRunning(false);
    setRemainingSeconds(totalDuration);
    endTimeRef.current = null;
  };

  // Timer countdown engine with background drift protection
  useEffect(() => {
    if (!isRunning) return;

    if (!endTimeRef.current) {
      endTimeRef.current = Date.now() + remainingSeconds * 1000;
    }

    const interval = setInterval(() => {
      if (!endTimeRef.current) return;
      const secondsLeft = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
      setRemainingSeconds(secondsLeft);

      if (secondsLeft === 0) {
        clearInterval(interval);
        setIsRunning(false);
        endTimeRef.current = null;
        playChime();

        // Automatic phase transition (paused to prevent runaway sessions)
        if (mode === 'focus') {
          const nextCount = completedSprints + 1;
          setCompletedSprints(nextCount);
          onSessionComplete?.('focus', nextCount);

          // Every 4th sprint triggers long break; otherwise short break
          const nextMode: TimerMode = nextCount % 4 === 0 ? 'longBreak' : 'shortBreak';
          setMode(nextMode);
          setRemainingSeconds(MODE_CONFIG[nextMode].duration);
        } else {
          onSessionComplete?.(mode, completedSprints);
          setMode('focus');
          setRemainingSeconds(MODE_CONFIG.focus.duration);
        }
      }
    }, 250);

    return () => clearInterval(interval);
  }, [isRunning, mode, completedSprints, remainingSeconds, onSessionComplete]);

  // Keyboard shortcut: Space toggles timer when not in an input field
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        handleTogglePlayPause();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRunning, remainingSeconds, totalDuration]);

  const isBreakMode = mode !== 'focus';

  return (
    <div
      className={`bg-surface-container-lowest dark:bg-zinc-900/50 border border-outline-variant/30 dark:border-zinc-800/60 p-space-lg rounded-2xl shadow-xs flex flex-col gap-space-md ${className}`}
      role="region"
      aria-label="Pomodoro Focus Timer"
    >
      {/* Top Header: Phase Title & Dynamic Status Badge */}
      <div className="flex items-center justify-between">
        <span className="font-label-sm text-label-sm text-outline dark:text-zinc-400 uppercase tracking-widest font-mono">
          {currentConfig.header}
        </span>

        {/* Dynamic Mode Badge */}
        {isBreakMode ? (
          <span className="inline-flex items-center gap-1.5 text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-2.5 py-0.5 rounded-full font-label-sm text-label-sm font-medium border border-amber-200/50 dark:border-amber-800/40 transition-colors">
            <span
              className={`w-1.5 h-1.5 rounded-full bg-amber-600 dark:bg-amber-400 ${
                isRunning ? 'animate-pulse' : ''
              }`}
            />
            {currentConfig.badgeText}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full font-label-sm text-label-sm font-medium border border-emerald-200/50 dark:border-emerald-800/40 transition-colors">
            <span
              className={`w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 ${
                isRunning ? 'animate-pulse' : ''
              }`}
            />
            {currentConfig.badgeText}
          </span>
        )}
      </div>

      {/* Main Row: Big Time Display & Squircle Action Button */}
      <div className="flex items-baseline justify-between py-space-xs">
        <div>
          <span
            className="font-display text-4xl sm:text-5xl font-semibold tracking-tight text-on-surface dark:text-zinc-100 font-mono select-none"
            aria-live="polite"
          >
            {timeDisplay}
          </span>
          <p className="font-label-sm text-label-sm text-outline dark:text-zinc-400 mt-1 font-mono">
            {currentConfig.sessionLabel}
            {completedSprints > 0 && mode === 'focus' && ` • #${completedSprints + 1}`}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Subtle Reset Button (Visible when paused or elapsed) */}
          {(isRunning || remainingSeconds !== totalDuration) && (
            <button
              type="button"
              onClick={handleReset}
              className="w-8 h-8 rounded-xl text-outline dark:text-zinc-400 hover:text-on-surface dark:hover:text-zinc-100 hover:bg-surface-container dark:hover:bg-zinc-800 flex items-center justify-center transition-colors cursor-pointer"
              title="Reset Timer"
              aria-label="Reset Timer"
            >
              <span className="material-symbols-outlined text-[18px]">restart_alt</span>
            </button>
          )}

          {/* Main Squircle Action Button */}
          <button
            type="button"
            onClick={handleTogglePlayPause}
            className="w-12 h-12 rounded-2xl bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
            title={
              isRunning
                ? 'Pause Timer (Space)'
                : remainingSeconds === 0
                ? 'Reset Session'
                : 'Start Timer (Space)'
            }
            aria-label={isRunning ? 'Pause Timer' : 'Start Timer'}
          >
            <span className="material-symbols-outlined text-[24px]">
              {isRunning
                ? 'pause'
                : remainingSeconds === 0
                ? 'replay'
                : remainingSeconds < totalDuration
                ? 'play_arrow'
                : 'timer'}
            </span>
          </button>
        </div>
      </div>

      {/* Micro Flat Progress Bar (Binds to exact completion percentage) */}
      <div className="w-full bg-[#F4ECE3] dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ease-linear ${
            isBreakMode
              ? 'bg-amber-600 dark:bg-amber-400'
              : 'bg-[#2D6A4F] dark:bg-emerald-400'
          }`}
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Interval Selector Tabs (Notion-Style Pill Controls) */}
      <div className="flex items-center gap-1.5 pt-0.5">
        <button
          type="button"
          onClick={() => handleModeChange('focus')}
          className={`px-2.5 py-1 rounded-lg font-label-sm text-xs font-medium transition-all cursor-pointer ${
            mode === 'focus'
              ? 'bg-surface-container dark:bg-zinc-800 text-on-surface dark:text-zinc-100 shadow-xs'
              : 'text-outline dark:text-zinc-500 hover:text-on-surface dark:hover:text-zinc-300'
          }`}
        >
          25m Focus
        </button>
        <button
          type="button"
          onClick={() => handleModeChange('shortBreak')}
          className={`px-2.5 py-1 rounded-lg font-label-sm text-xs font-medium transition-all cursor-pointer ${
            mode === 'shortBreak'
              ? 'bg-surface-container dark:bg-zinc-800 text-on-surface dark:text-zinc-100 shadow-xs'
              : 'text-outline dark:text-zinc-500 hover:text-on-surface dark:hover:text-zinc-300'
          }`}
        >
          5m Break
        </button>
        <button
          type="button"
          onClick={() => handleModeChange('longBreak')}
          className={`px-2.5 py-1 rounded-lg font-label-sm text-xs font-medium transition-all cursor-pointer ${
            mode === 'longBreak'
              ? 'bg-surface-container dark:bg-zinc-800 text-on-surface dark:text-zinc-100 shadow-xs'
              : 'text-outline dark:text-zinc-500 hover:text-on-surface dark:hover:text-zinc-300'
          }`}
        >
          15m Rest
        </button>
      </div>
    </div>
  );
}
