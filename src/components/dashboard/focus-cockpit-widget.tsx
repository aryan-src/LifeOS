'use client';

import React, { useState, useEffect, useRef, useTransition } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { logFocusSession } from '@/lib/actions/focus-session';
import { getTodayDate } from '@/lib/utils/date';

interface FocusCockpitWidgetProps {
  className?: string;
}

export function FocusCockpitWidget({ className = '' }: FocusCockpitWidgetProps) {
  const [durationMinutes, setDurationMinutes] = useState<number>(25);
  const [totalSeconds, setTotalSeconds] = useState<number>(25 * 60);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [focusedMinutesToday, setFocusedMinutesToday] = useState<number>(0);
  const [, startTransition] = useTransition();

  const endTimeRef = useRef<number | null>(null);
  const todayStr = getTodayDate();

  // Load focused minutes today from local storage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const savedDate = localStorage.getItem('lifeos_focus_date');
      if (savedDate === todayStr) {
        const savedSec = parseInt(localStorage.getItem('lifeos_focus_seconds_today') || '0', 10);
        if (!isNaN(savedSec)) {
          setFocusedMinutesToday(Math.round(savedSec / 60));
        }
      } else {
        localStorage.setItem('lifeos_focus_date', todayStr);
        localStorage.setItem('lifeos_focus_seconds_today', '0');
      }
    } catch {}
  }, [todayStr]);

  // Timer interval loop
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning) {
      if (!endTimeRef.current) {
        endTimeRef.current = Date.now() + remainingSeconds * 1000;
      }

      interval = setInterval(() => {
        if (!endTimeRef.current) return;
        const diff = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
        setRemainingSeconds(diff);

        if (diff <= 0) {
          setIsRunning(false);
          endTimeRef.current = null;
          handleSessionFinished();
        }
      }, 250);
    } else {
      endTimeRef.current = null;
      if (interval) clearInterval(interval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, remainingSeconds]);

  const handleSessionFinished = () => {
    const elapsedMinutes = durationMinutes;
    const additionalSeconds = elapsedMinutes * 60;

    try {
      const currentSavedSec = parseInt(localStorage.getItem('lifeos_focus_seconds_today') || '0', 10);
      const newTotal = (isNaN(currentSavedSec) ? 0 : currentSavedSec) + additionalSeconds;
      localStorage.setItem('lifeos_focus_seconds_today', newTotal.toString());
      setFocusedMinutesToday(Math.round(newTotal / 60));
    } catch {}

    // Call logFocusSession server action
    startTransition(async () => {
      try {
        await logFocusSession({
          durationMinutes: elapsedMinutes,
          mode: 'focus',
        });
      } catch (err) {
        console.error('Failed to log focus session:', err);
      }
    });

    // Reset timer
    setRemainingSeconds(durationMinutes * 60);
  };

  const handlePresetSelect = (mins: number) => {
    setIsRunning(false);
    endTimeRef.current = null;
    setDurationMinutes(mins);
    setTotalSeconds(mins * 60);
    setRemainingSeconds(mins * 60);
  };

  const toggleRunning = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    endTimeRef.current = null;
    setRemainingSeconds(totalSeconds);
  };

  // Format MM:SS
  const mins = Math.floor(remainingSeconds / 60);
  const secs = remainingSeconds % 60;
  const timeFormatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  return (
    <div
      className={`flex flex-col gap-3.5 p-5 sm:p-6 rounded-3xl bg-stone-50/80 dark:bg-zinc-900/60 border border-stone-200/60 dark:border-zinc-800/60 shrink-0 transition-colors ${className}`}
      data-purpose="focus-timer-card"
    >
      {/* Header Row */}
      <div className="flex items-center justify-between text-xs font-mono text-stone-500 dark:text-zinc-400 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-stone-400 dark:bg-zinc-600'
            }`}
          />
          <span className="font-semibold uppercase tracking-wider text-[10px] text-stone-700 dark:text-zinc-300 truncate">
            Focus Timer
          </span>
        </div>
        <span className="text-[10px] shrink-0 font-mono">
          Focused today: {focusedMinutesToday} min
        </span>
      </div>

      {/* Clock, Play Button, and Preset Controls Row */}
      <div className="flex items-center justify-between gap-3 shrink-0 min-w-0">
        {/* Clock & Play Button Row */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="font-mono text-2xl font-bold tracking-tight text-stone-900 dark:text-zinc-100 tabular-nums leading-none">
            {timeFormatted}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={toggleRunning}
              className="w-8 h-8 rounded-full bg-stone-900 hover:bg-stone-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-stone-50 dark:text-zinc-900 flex items-center justify-center transition-colors cursor-pointer shrink-0"
              title={isRunning ? 'Pause Session' : 'Start Session'}
              aria-label={isRunning ? 'Pause Pomodoro' : 'Start Pomodoro'}
            >
              {isRunning ? (
                <Pause className="w-3.5 h-3.5 fill-current" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
              )}
            </button>
            {remainingSeconds !== totalSeconds && (
              <button
                type="button"
                onClick={resetTimer}
                className="w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-stone-500 dark:text-zinc-400 border border-stone-200/60 dark:border-zinc-700/60 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                title="Reset Timer"
                aria-label="Reset Timer"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Preset Selector Row */}
        <div className="flex items-center gap-1.5 shrink-0">
          {[15, 25, 50].map((minsOption) => {
            const isSelected = durationMinutes === minsOption;
            return (
              <button
                key={minsOption}
                type="button"
                onClick={() => handlePresetSelect(minsOption)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold transition-colors cursor-pointer shrink-0 ${
                  isSelected
                    ? 'bg-stone-900 text-stone-50 dark:bg-zinc-100 dark:text-zinc-900'
                    : 'bg-stone-100 dark:bg-zinc-800 hover:bg-stone-200 dark:hover:bg-zinc-700 text-stone-600 dark:text-zinc-300 border border-stone-200/60 dark:border-zinc-700/60'
                }`}
              >
                {minsOption}m
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
