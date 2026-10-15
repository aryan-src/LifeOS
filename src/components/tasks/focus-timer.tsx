'use client';

import React, { useState, useEffect, useRef } from 'react';
import { VaporCountdownDigits } from '@/components/ui/countdown-vapor-digits';

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
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const now = ctx.currentTime;
    const notes = [587.33, 739.99, 880]; // D5 -> F#5 -> A5

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);

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
  const [timerState, setTimerState] = useState<'idle' | 'running' | 'paused'>('idle');
  const [completedSprints, setCompletedSprints] = useState<number>(0);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  // Background tab throttling protection: track exact target completion timestamp
  const endTimeRef = useRef<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

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
    setTimerState('idle');
    setMode(newMode);
    setRemainingSeconds(MODE_CONFIG[newMode].duration);
    endTimeRef.current = null;
    setIsMenuOpen(false);
  };

  // Toggle seamlessly between Play, Pause, and Reset states
  const handleTogglePlayPause = () => {
    if (timerState === 'running') {
      // Pause
      setTimerState('paused');
      endTimeRef.current = null;
    } else if (timerState === 'paused') {
      // Resume
      endTimeRef.current = Date.now() + remainingSeconds * 1000;
      setTimerState('running');
    } else {
      // Start fresh
      const targetSeconds = remainingSeconds === 0 ? totalDuration : remainingSeconds;
      setRemainingSeconds(targetSeconds);
      endTimeRef.current = Date.now() + targetSeconds * 1000;
      setTimerState('running');
    }
  };

  // Reset to initial mode duration
  const handleReset = () => {
    setTimerState('idle');
    setRemainingSeconds(totalDuration);
    endTimeRef.current = null;
  };

  // Handle double-click or quick action to reset
  const handleMainButtonDoubleClick = () => {
    handleReset();
  };

  // Close interval menu on outside click or Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
    }
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isMenuOpen]);

  // Timer countdown engine with background tab drift protection
  useEffect(() => {
    if (timerState !== 'running') return;

    if (!endTimeRef.current) {
      endTimeRef.current = Date.now() + remainingSeconds * 1000;
    }

    const interval = setInterval(() => {
      if (!endTimeRef.current) return;
      const secondsLeft = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
      setRemainingSeconds(secondsLeft);

      if (secondsLeft === 0) {
        clearInterval(interval);
        setTimerState('idle');
        endTimeRef.current = null;
        playChime();

        // Automatic phase transition (automatically paused to prevent runaway sessions)
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
  }, [timerState, mode, completedSprints, remainingSeconds, onSessionComplete]);

  // Keyboard shortcut: Space toggles Play/Pause when not typing in an input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        handleTogglePlayPause();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [timerState, remainingSeconds, totalDuration]);

  const isBreakMode = mode !== 'focus';
  const isRunning = timerState === 'running';
  const isPaused = timerState === 'paused';

  return (
    <div
      className={`relative bg-surface-container-lowest dark:bg-zinc-900/50 border border-outline-variant/30 dark:border-zinc-800/60 p-6 sm:p-7 rounded-3xl shadow-xs flex flex-col gap-5 ${className}`}
      role="region"
      aria-label="Pomodoro Focus Timer"
    >
      {/* Top Header Row: Phase Title & Dynamic Status Badge */}
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs font-semibold text-outline dark:text-zinc-400 uppercase tracking-widest select-none">
          {currentConfig.header}
        </span>

        {/* Dynamic Mode Badge with Interval Selector Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md font-mono text-xs font-medium transition-all cursor-pointer select-none ${
              isBreakMode
                ? 'text-[#92400E] bg-[#FEF3C7] dark:bg-amber-950/60 dark:text-amber-300 border border-[#FDE68A]/60 dark:border-amber-800/50'
                : 'text-[#2A6041] bg-[#CBEBD6] dark:bg-emerald-950/60 dark:text-emerald-300 border border-[#A7D9B7]/60 dark:border-emerald-800/50'
            }`}
            title="Click to switch interval (25m Focus / 5m Break / 15m Rest)"
            aria-label={`Current phase: ${currentConfig.badgeText}. Click to change interval.`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isBreakMode
                  ? 'bg-[#D97706] dark:bg-amber-400'
                  : 'bg-[#2A6041] dark:bg-emerald-400'
              } ${isRunning ? 'animate-pulse' : ''}`}
            />
            <span>{currentConfig.badgeText}</span>
          </button>

          {/* Clean Notion-Style Interval Popover */}
          {isMenuOpen && (
            <div
              className="absolute right-0 mt-2 w-48 rounded-2xl bg-surface-container-lowest dark:bg-zinc-900 border border-outline-variant/40 dark:border-zinc-800 shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 flex flex-col gap-1 font-mono text-xs"
              role="menu"
            >
              <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-outline dark:text-zinc-500 font-semibold">
                Select Interval
              </div>
              <button
                type="button"
                onClick={() => handleModeChange('focus')}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer text-left ${
                  mode === 'focus'
                    ? 'bg-[#CBEBD6]/50 dark:bg-emerald-950/50 text-[#2A6041] dark:text-emerald-300 font-semibold'
                    : 'text-on-surface dark:text-zinc-300 hover:bg-surface-container dark:hover:bg-zinc-800'
                }`}
              >
                <span>Deep Work</span>
                <span className="text-[11px] text-outline dark:text-zinc-500 font-normal">25m</span>
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('shortBreak')}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer text-left ${
                  mode === 'shortBreak'
                    ? 'bg-[#FEF3C7]/60 dark:bg-amber-950/50 text-[#92400E] dark:text-amber-300 font-semibold'
                    : 'text-on-surface dark:text-zinc-300 hover:bg-surface-container dark:hover:bg-zinc-800'
                }`}
              >
                <span>Short Break</span>
                <span className="text-[11px] text-outline dark:text-zinc-500 font-normal">5m</span>
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('longBreak')}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer text-left ${
                  mode === 'longBreak'
                    ? 'bg-[#FEF3C7]/60 dark:bg-amber-950/50 text-[#92400E] dark:text-amber-300 font-semibold'
                    : 'text-on-surface dark:text-zinc-300 hover:bg-surface-container dark:hover:bg-zinc-800'
                }`}
              >
                <span>Long Rest</span>
                <span className="text-[11px] text-outline dark:text-zinc-500 font-normal">15m</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Middle Row: Large Time Display & Main Squircle Clock Button */}
      <div className="flex items-center justify-between py-1">
        <div className="flex items-center">
          <VaporCountdownDigits
            minutes={minutes}
            seconds={seconds}
            isRunning={isRunning}
            digitClassName="text-5xl sm:text-6xl"
          />
        </div>

        {/* Main Action Control (Play / Pause / Reset) */}
        <div className="flex items-center gap-2">
          {/* Dedicated Reset button when paused or timer has elapsed */}
          {(isPaused || remainingSeconds !== totalDuration) && (
            <button
              type="button"
              onClick={handleReset}
              className="w-9 h-9 rounded-xl text-outline dark:text-zinc-400 hover:text-on-surface dark:hover:text-zinc-100 hover:bg-surface-container dark:hover:bg-zinc-800 flex items-center justify-center transition-colors cursor-pointer"
              title="Reset Timer"
              aria-label="Reset Timer"
            >
              <span className="material-symbols-outlined text-[20px]">restart_alt</span>
            </button>
          )}

          {/* Main Squircle Action Button (Matches Screenshot Exactly) */}
          <button
            type="button"
            onClick={handleTogglePlayPause}
            onDoubleClick={handleMainButtonDoubleClick}
            className="w-14 h-14 rounded-2xl bg-black text-white hover:bg-neutral-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 flex items-center justify-center transition-all cursor-pointer shadow-md active:scale-95 shrink-0"
            title={
              isRunning
                ? 'Pause Timer (Space)'
                : isPaused
                ? 'Resume Timer (Space) • Double click to Reset'
                : remainingSeconds === 0
                ? 'Reset Session'
                : 'Start Focus Timer (Space)'
            }
            aria-label={
              isRunning
                ? 'Pause Timer'
                : isPaused
                ? 'Resume Timer'
                : remainingSeconds === 0
                ? 'Reset Session'
                : 'Start Timer'
            }
          >
            <span className="material-symbols-outlined text-[28px]">
              {isRunning ? 'pause' : isPaused ? 'play_arrow' : remainingSeconds === 0 ? 'replay' : 'timer'}
            </span>
          </button>
        </div>
      </div>

      {/* Bottom Row: Flat Progress Bar Bound to Exact Completion Percentage */}
      <div className="w-full bg-[#F4ECE3] dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ease-linear ${
            isBreakMode
              ? 'bg-amber-600 dark:bg-amber-400'
              : 'bg-[#2D6A4F] dark:bg-emerald-500'
          }`}
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
    </div>
  );
}
