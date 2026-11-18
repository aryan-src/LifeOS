'use client';

import React, { useState, useEffect } from 'react';
import { Check, Moon } from 'lucide-react';
import type { DailyCheckIn, MoodRating, StreakState } from '@/lib/daily-loop/types';
import { upsertDailyCheckIn } from '@/lib/actions/daily-loop';
import { EmptyState } from '@/components/ui/empty-state';

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
    <div className="flex-1 flex flex-col justify-between gap-4">
      <div className="flex flex-col gap-3.5">
        {/* Heading Prompt */}
        <div className="flex flex-col gap-0.5">
          <h3 className="font-sans text-headline-md font-semibold tracking-tight text-on-surface">
            How was today?
          </h3>
          <p className="font-sans text-body-sm text-on-surface-variant">
            Take a mindful pause to log your reflection
          </p>
        </div>

        {/* 5-Mood Selector */}
        <div
          className="flex items-center justify-between rounded-xl border border-outline-variant/40 bg-surface-container-low px-2.5 py-2"
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
                className={`flex h-11 w-11 items-center justify-center rounded-xl text-2xl transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/50 ${
                  isSelected
                    ? 'scale-105 border border-secondary/40 bg-surface-container-lowest shadow-xs ring-2 ring-secondary/20'
                    : 'opacity-80 hover:bg-surface-container hover:opacity-100'
                }`}
              >
                {option.emoji}
              </button>
            );
          })}
        </div>

        {/* What You Finished Today */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="font-mono text-label-sm uppercase tracking-[0.08em] text-on-surface-variant">
              What you finished today
            </span>
            <span
              className="font-mono text-label-sm font-medium text-secondary"
              style={LINING_NUMS_STYLE}
            >
              {finishedItems.length} done
            </span>
          </div>

          {visibleFinished.length === 0 ? (
            <EmptyState compact={true} title="No completed items logged yet today." />
          ) : (
            <div className="space-y-1.5">
              {visibleFinished.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-low/70 p-2.5"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary/15 text-secondary">
                      <Check className="h-3 w-3" strokeWidth={2.5} aria-hidden="true" />
                    </span>
                    <p className="truncate font-sans text-body-sm font-medium text-on-surface-variant line-through">
                      {item.title}
                    </p>
                  </div>
                  <span
                    className="shrink-0 font-mono text-label-sm text-outline"
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
            className="w-full rounded-xl border border-outline-variant/50 bg-surface-container-low px-3 py-2 pr-10 font-sans text-body-sm text-on-surface placeholder:text-outline transition-colors focus:border-secondary focus:outline-none"
          />
          <kbd className="pointer-events-none absolute right-2.5 rounded border border-outline-variant/50 bg-surface-container-lowest px-1 font-mono text-[10px] text-outline">
            ↵
          </kbd>
        </div>

        {statusMessage && (
          <p
            className={`font-sans text-label-sm ${
              statusMessage.type === 'success' ? 'text-secondary' : 'text-error'
            }`}
          >
            {statusMessage.text}
          </p>
        )}
      </div>

      {/* Footer CTA & Streak Preview */}
      <div className="flex shrink-0 flex-col gap-2 border-t border-outline-variant/30 pt-3">
        <button
          type="button"
          onClick={() => void handleSaveCheckIn()}
          disabled={isSaving}
          className={`flex h-9 w-full items-center justify-center gap-2 rounded-xl font-sans text-body-sm font-medium shadow-xs transition-colors cursor-pointer disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/50 ${
            savedCheckIn && !hasUnsavedChanges
              ? 'border border-secondary/30 bg-secondary/12 text-secondary hover:bg-secondary/18'
              : 'bg-primary text-on-primary hover:opacity-90'
          }`}
        >
          <Moon className="h-4 w-4" aria-hidden="true" />
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

        <div className="flex items-center justify-center gap-1.5 font-mono text-label-sm text-on-surface-variant">
          <span>Streak:</span>
          <span className="font-semibold text-on-surface" style={LINING_NUMS_STYLE}>
            {isTodayQualified
              ? `${currentStreak} ${currentStreak === 1 ? 'day' : 'days'}`
              : `${streakPreview.current} → ${streakPreview.next}`}
          </span>
        </div>
      </div>
    </div>
  );
}
