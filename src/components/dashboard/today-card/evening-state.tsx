'use client';

import React, { useState, useEffect } from 'react';
import type { DailyCheckIn, MoodRating, StreakState } from '@/lib/daily-loop/types';
import { upsertDailyCheckIn } from '@/lib/actions/daily-loop';

export interface FinishedTodayItem {
  id: string;
  title: string;
  meta: string;
}

export interface EveningStateProps {
  initialCheckIn: DailyCheckIn | null;
  finishedItems: FinishedTodayItem[];
  streakState: StreakState;
  isDevMockActive?: boolean;
  onCheckInSaved?: (saved: DailyCheckIn) => void;
}

interface MoodOption {
  value: MoodRating;
  label: string;
  emoji: string;
}

const MOOD_OPTIONS: MoodOption[] = [
  { value: 'exhausted', label: 'Exhausted', emoji: '😫' },
  { value: 'tough', label: 'Tough', emoji: '😕' },
  { value: 'neutral', label: 'Neutral', emoji: '😐' },
  { value: 'good', label: 'Good', emoji: '🙂' },
  { value: 'great', label: 'Great', emoji: '🤩' },
];

const LINING_NUMS_STYLE: React.CSSProperties = {
  fontVariantNumeric: 'lining-nums tabular-nums',
};

export function EveningState({
  initialCheckIn,
  finishedItems,
  streakState,
  isDevMockActive = false,
  onCheckInSaved,
}: EveningStateProps) {
  const [savedCheckIn, setSavedCheckIn] = useState<DailyCheckIn | null>(initialCheckIn);
  const [selectedMood, setSelectedMood] = useState<MoodRating>(initialCheckIn?.mood ?? 'good');
  const [reflectionText, setReflectionText] = useState<string>(
    initialCheckIn?.reflection_text ?? ''
  );
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    setSavedCheckIn(initialCheckIn);
    if (initialCheckIn) {
      setSelectedMood(initialCheckIn.mood);
      setReflectionText(initialCheckIn.reflection_text ?? '');
    }
  }, [initialCheckIn]);

  const hasUnsavedChanges =
    !savedCheckIn ||
    savedCheckIn.mood !== selectedMood ||
    (savedCheckIn.reflection_text ?? '') !== reflectionText.trim();

  const handleSaveCheckIn = async () => {
    if (isSaving) return;

    const trimmedReflection = reflectionText.trim();
    const finishedTitles = finishedItems.map((item) => item.title);

    // Never insert fake rows into Supabase while dev-only mock mode is enabled
    if (isDevMockActive) {
      const mockSaved: DailyCheckIn = {
        id: savedCheckIn?.id || 'dev-mock-check-in',
        user_id: 'dev-mock',
        check_in_date: new Date().toISOString().slice(0, 10),
        mood: selectedMood,
        reflection_text: trimmedReflection || null,
        finished_task_titles: finishedTitles,
      };
      setSavedCheckIn(mockSaved);
      setStatusMessage({
        type: 'success',
        text: 'Preview saved locally (Dev Mock ON — no DB write).',
      });
      onCheckInSaved?.(mockSaved);
      return;
    }

    setIsSaving(true);
    setStatusMessage(null);

    try {
      const res = await upsertDailyCheckIn({
        mood: selectedMood,
        reflectionText: trimmedReflection || null,
        finishedTaskTitles: finishedTitles,
      });

      if (!res.success || !res.data) {
        setStatusMessage({
          type: 'error',
          text: res.error || 'Could not save check-in. Please try again.',
        });
        return;
      }

      setSavedCheckIn(res.data);
      setStatusMessage({
        type: 'success',
        text: savedCheckIn
          ? 'Evening check-in updated for today.'
          : 'Day closed and reflection saved.',
      });
      onCheckInSaved?.(res.data);
    } catch {
      setStatusMessage({
        type: 'error',
        text: 'Network error saving check-in.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void handleSaveCheckIn();
    }
  };

  const visibleFinished = finishedItems.slice(0, 3);
  const { currentStreak, isTodayQualified, streakPreview } = streakState;

  return (
    <div className="flex-1 flex flex-col justify-between gap-3.5">
      <div className="flex flex-col gap-3.5">
        {/* Heading Prompt */}
        <div className="flex flex-col gap-0.5">
          <h4
            className="text-xl font-medium text-stone-900 dark:text-zinc-100 tracking-tight"
            style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
          >
            How was today?
          </h4>
          <p className="text-[11px] font-sans text-stone-500 dark:text-zinc-400">
            Take a mindful pause to log your reflection
          </p>
        </div>

        {/* 5-Mood Selector */}
        <div
          className="flex items-center justify-between px-2.5 py-2 rounded-xl bg-stone-50/90 dark:bg-zinc-800/60 border border-stone-200/70 dark:border-zinc-700/70"
          role="radiogroup"
          aria-label="Today's mood rating"
        >
          {MOOD_OPTIONS.map((option) => {
            const isSelected = selectedMood === option.value;
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={isSelected}
                aria-label={option.label}
                title={option.label}
                onClick={() => {
                  setSelectedMood(option.value);
                  setStatusMessage(null);
                }}
                className={`w-11 h-11 rounded-xl flex items-center justify-center text-2xl transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white dark:bg-zinc-900 border border-stone-300 dark:border-zinc-600 shadow-xs ring-2 ring-stone-200 dark:ring-zinc-700 scale-105'
                    : 'hover:bg-stone-200/70 dark:hover:bg-zinc-700/70 opacity-80 hover:opacity-100'
                }`}
              >
                {option.emoji}
              </button>
            );
          })}
        </div>

        {/* What You Finished Today */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-sans font-semibold uppercase tracking-wider text-stone-500 dark:text-zinc-400">
              What you finished today
            </span>
            <span
              className="text-[11px] font-sans font-medium text-[#006c49] dark:text-emerald-400 tabular-nums lining-nums"
              style={LINING_NUMS_STYLE}
            >
              {finishedItems.length} done
            </span>
          </div>

          {visibleFinished.length === 0 ? (
            <div className="p-3 rounded-xl bg-stone-50/70 dark:bg-zinc-800/40 border border-dashed border-stone-300 dark:border-zinc-700 text-center">
              <p className="text-xs font-sans text-stone-500 dark:text-zinc-400">
                No completed items logged yet today.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {visibleFinished.map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 rounded-xl bg-stone-50/80 dark:bg-zinc-800/50 border border-stone-200/60 dark:border-zinc-700/60 flex items-center justify-between gap-2.5"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-[#006c49]/15 text-[#006c49] dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                    <p className="text-[13px] font-sans font-medium text-stone-600 dark:text-zinc-300 line-through truncate">
                      {item.title}
                    </p>
                  </div>
                  <span
                    className="text-[11px] font-mono text-stone-400 dark:text-zinc-500 shrink-0 tabular-nums lining-nums"
                    style={LINING_NUMS_STYLE}
                  >
                    {item.meta}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reflection Input */}
        <div className="relative flex items-center">
          <input
            type="text"
            value={reflectionText}
            onChange={(e) => {
              setReflectionText(e.target.value);
              setStatusMessage(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Anything to remember?"
            aria-label="Daily reflection note"
            maxLength={1000}
            className="w-full px-3 py-2 pr-10 text-[13px] font-sans rounded-xl bg-stone-50/70 dark:bg-zinc-800/60 border border-stone-200 dark:border-zinc-700 focus:border-stone-400 dark:focus:border-zinc-500 focus:outline-none transition-colors text-stone-900 dark:text-zinc-100 placeholder:text-stone-400 dark:placeholder:text-zinc-500"
          />
          <kbd className="absolute right-2.5 text-[10px] text-stone-400 dark:text-zinc-500 font-sans border border-stone-200 dark:border-zinc-700 px-1 rounded bg-white dark:bg-zinc-900 pointer-events-none">
            ↵
          </kbd>
        </div>

        {statusMessage && (
          <p
            className={`text-[11px] font-sans ${
              statusMessage.type === 'success'
                ? 'text-[#006c49] dark:text-emerald-400'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            {statusMessage.text}
          </p>
        )}
      </div>

      {/* Footer CTA & Streak Preview */}
      <div className="pt-3 border-t border-stone-100 dark:border-zinc-800 flex flex-col gap-2 shrink-0">
        <button
          type="button"
          onClick={() => void handleSaveCheckIn()}
          disabled={isSaving}
          className={`w-full h-9 rounded-xl transition-colors flex items-center justify-center gap-2 font-sans text-[13px] font-medium shadow-xs cursor-pointer disabled:opacity-60 ${
            savedCheckIn && !hasUnsavedChanges
              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-[#006c49] dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/70 hover:bg-emerald-100/70 dark:hover:bg-emerald-900/50'
              : 'bg-stone-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-stone-800 dark:hover:bg-zinc-200'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>
            {isSaving
              ? 'Saving...'
              : !savedCheckIn
              ? 'Close the day'
              : hasUnsavedChanges
              ? 'Update check-in'
              : 'Day closed ✓'}
          </span>
        </button>

        <div className="flex items-center justify-center gap-1.5 text-stone-500 dark:text-zinc-400 font-sans text-[11px]">
          <span>Streak:</span>
          <span
            className="font-semibold text-stone-700 dark:text-zinc-200 tabular-nums lining-nums"
            style={LINING_NUMS_STYLE}
          >
            {isTodayQualified
              ? `${currentStreak} ${currentStreak === 1 ? 'day' : 'days'}`
              : `${streakPreview.current} → ${streakPreview.next}`}
          </span>
          <span className="text-xs">🔥</span>
        </div>
      </div>
    </div>
  );
}
