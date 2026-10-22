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

  // SVG Progress Ring (Radius = 41 -> Circumference ≈ 257.6)
  const circumference = 257.6;
  const progressRatio = totalSeconds > 0 ? remainingSeconds / totalSeconds : 1;
  const dashOffset = circumference * (1 - progressRatio);

  return (
    <div className={`pt-2 border-t border-[#07343C]/10 dark:border-zinc-800/60 ${className}`}>
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-serif text-[15px] xl:text-[16px] font-bold text-[#07343C] dark:text-zinc-100">
          Focus Timer
        </h3>
        <span className="text-[10px] text-[#07343C]/70 dark:text-zinc-400 font-medium font-mono">
          Focused today: {focusedMinutesToday} min
        </span>
      </div>

      <div className="flex items-center justify-between gap-3">
        {/* Timer ring with digits */}
        <div className="relative w-[100px] h-[100px] xl:w-[108px] xl:h-[108px] shrink-0 flex items-center justify-center">
          <svg className="absolute inset-0 w-full h-full -rotate-90 p-0.5" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              fill="none"
              r="41"
              stroke="currentColor"
              className="text-[#F3F0EA] dark:text-zinc-800"
              strokeWidth="7"
            />
            <circle
              cx="50"
              cy="50"
              fill="none"
              r="41"
              stroke="#10B981"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              strokeWidth="7"
              className="transition-[stroke-dashoffset] duration-300"
            />
          </svg>
          <span className="font-serif text-[22px] xl:text-[24px] font-bold text-[#07343C] dark:text-zinc-100 tracking-tight select-none font-mono tabular-nums">
            {timeFormatted}
          </span>
        </div>

        {/* Controls & duration chips */}
        <div className="flex-1 min-w-0 flex flex-col items-center justify-center gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleRunning}
              className="w-[38px] h-[38px] xl:w-[40px] xl:h-[40px] rounded-full bg-[#10B981] hover:bg-emerald-600 text-white flex items-center justify-center shadow-2xs hover:opacity-95 transition-all cursor-pointer"
              title={isRunning ? 'Pause Session' : 'Start Session'}
              aria-label={isRunning ? 'Pause Pomodoro' : 'Start Pomodoro'}
            >
              {isRunning ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-0.5" />
              )}
            </button>
            {remainingSeconds !== totalSeconds && (
              <button
                type="button"
                onClick={resetTimer}
                className="w-7 h-7 rounded-full bg-[#F3F0EA] dark:bg-zinc-800 text-[#07343C] dark:text-zinc-300 flex items-center justify-center hover:bg-stone-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                title="Reset Timer"
                aria-label="Reset Timer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 w-full justify-center">
            {[15, 25, 50].map((minsOption) => {
              const isSelected = durationMinutes === minsOption;
              return (
                <button
                  key={minsOption}
                  type="button"
                  onClick={() => handlePresetSelect(minsOption)}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all cursor-pointer font-mono ${
                    isSelected
                      ? 'bg-[#0B5563] text-white shadow-2xs'
                      : 'bg-[#F3F0EA] dark:bg-zinc-800 hover:bg-white dark:hover:bg-zinc-700 text-[#07343C] dark:text-zinc-300 border border-[#07343C]/5 dark:border-zinc-700'
                  }`}
                >
                  {minsOption}m
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
