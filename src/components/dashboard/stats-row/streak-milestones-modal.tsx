'use client';

import React, { useState, useMemo } from 'react';
import { Check, Flame, Lock, Share2, ShieldCheck, Snowflake } from 'lucide-react';
import type { StreakState } from '@/lib/daily-loop/types';
import {
  deriveStreakMilestones,
  type MilestoneKey,
} from '@/lib/daily-loop/streak-milestones';
import { Modal } from '@/components/ui/modal';
import { Pill } from '@/components/ui/pill';
import { ProgressBar } from '@/components/ui/progress-bar';

export interface StreakMilestonesModalProps {
  open: boolean;
  onClose: () => void;
  streakState: StreakState;
}

const LINING_NUMS_STYLE: React.CSSProperties = {
  fontVariantNumeric: 'lining-nums tabular-nums',
};

/**
 * Stitch Streak Milestones modal.
 * Uses Playfair Display strictly for its designated modal hero heading.
 */
export function StreakMilestonesModal({
  open,
  onClose,
  streakState,
}: StreakMilestonesModalProps) {
  const { milestones, defaultKey, highestAchievedDays } = useMemo(
    () => deriveStreakMilestones(streakState),
    [streakState]
  );

  const [selectedKey, setSelectedKey] = useState<MilestoneKey>(defaultKey);
  const [copied, setCopied] = useState(false);

  const active =
    milestones.find((m) => m.key === selectedKey) ?? milestones[0];

  const handleShareKeepsake = async () => {
    const shareText = active.isUnlocked
      ? `Unlocked the ${active.title} milestone in LifeOS (${highestAchievedDays}-day best streak).`
      : `Working toward ${active.title} in LifeOS (${highestAchievedDays}/${active.targetDays} days).`;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // Clipboard unavailable
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      maxWidth="md"
      showCloseButton={true}
      className="p-6 sm:p-8 text-center"
    >
      <div
        className="flex flex-col items-center gap-5"
        data-purpose="streak-milestones-modal"
      >
        {/* Milestone Switcher Tabs */}
        <div
          role="tablist"
          aria-label="Streak Milestones"
          className="flex w-full items-center gap-1 rounded-xl bg-surface-container-low p-1"
        >
          {milestones.map((item) => {
            const isSelected = item.key === active.key;
            return (
              <button
                key={item.key}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => {
                  setSelectedKey(item.key);
                  setCopied(false);
                }}
                className={`flex-1 rounded-lg px-2 py-1.5 font-mono text-label-sm transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-surface-container-lowest font-medium text-on-surface shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {item.tabLabel}
              </button>
            );
          })}
        </div>

        {/* Playfair Display Hero Heading (second designated modal hero heading) */}
        <div className="flex flex-col items-center gap-2">
          <Pill tone={active.isUnlocked ? 'secondary' : 'neutral'} uppercase={true}>
            <span className="inline-flex items-center gap-1">
              {active.isUnlocked ? (
                <Flame className="h-3 w-3 text-secondary" aria-hidden="true" />
              ) : (
                <Lock className="h-3 w-3" aria-hidden="true" />
              )}
              <span>
                {active.isUnlocked
                  ? 'Milestone Unlocked'
                  : `${active.daysRemaining} ${active.daysRemaining === 1 ? 'day' : 'days'} to unlock`}
              </span>
            </span>
          </Pill>

          <h2 className="font-serif text-modal-hero font-normal tracking-tight text-on-surface">
            {active.title}
          </h2>

          <p className="max-w-xs font-sans text-body-sm text-on-surface-variant leading-relaxed">
            {active.description}
          </p>
        </div>

        {/* Square Keepsake Badge */}
        <div className="flex h-48 w-48 flex-col items-center justify-between rounded-2xl border border-outline-variant/40 bg-surface-bright p-5 shadow-xs">
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-1">
              <span className="font-sans text-body-sm font-semibold tracking-tight text-on-surface">
                LifeOS
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-secondary" aria-hidden="true" />
            </div>
            {active.isUnlocked ? (
              <ShieldCheck className="h-4 w-4 text-secondary" aria-hidden="true" />
            ) : (
              <Lock className="h-3.5 w-3.5 text-outline" aria-hidden="true" />
            )}
          </div>

          <div className="flex flex-col items-center justify-center">
            <div className="flex items-start justify-center gap-1">
              <span
                className="font-mono text-numeric-timer font-semibold tracking-tight text-on-surface"
                style={LINING_NUMS_STYLE}
              >
                {active.targetDays}
              </span>
              <Flame
                className={`mt-1 h-4 w-4 ${
                  active.isUnlocked ? 'text-on-tertiary-container' : 'text-outline/50'
                }`}
                aria-hidden="true"
              />
            </div>
            <span className="mt-1 font-mono text-label-sm uppercase tracking-wider text-on-surface-variant">
              {active.unitLabel}
            </span>
          </div>

          {/* Tactile Segmented Progress Bars */}
          <div className="flex w-full items-center gap-1" aria-hidden="true">
            {Array.from({ length: active.barSegments }).map((_, idx) => (
              <span
                key={idx}
                className={`h-1 flex-1 rounded-full ${
                  idx < active.filledSegments
                    ? 'bg-secondary'
                    : 'bg-surface-container-highest'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Real Progress & Freeze Shields Summary */}
        <div className="w-full space-y-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-low p-4 text-left">
          <div className="flex items-center justify-between font-mono text-label-sm">
            <span className="text-on-surface-variant">Best streak progress</span>
            <span className="font-semibold text-on-surface" style={LINING_NUMS_STYLE}>
              {Math.min(highestAchievedDays, active.targetDays)} / {active.targetDays} days ({active.progressPercent}%)
            </span>
          </div>
          <ProgressBar
            value={active.progressPercent}
            tone="secondary"
            size="xs"
            label={`${active.title} progress`}
          />
          <div className="flex items-center justify-between pt-1 font-mono text-[11px] text-on-surface-variant">
            <span className="inline-flex items-center gap-1">
              <Snowflake className="h-3.5 w-3.5 text-secondary" aria-hidden="true" />
              {streakState.freezesLeft} / 2 freeze shields held
            </span>
            <span style={LINING_NUMS_STYLE}>Current: {streakState.currentStreak}d</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex w-full flex-col gap-2.5 sm:flex-row">
          <button
            type="button"
            onClick={() => void handleShareKeepsake()}
            className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-secondary px-4 font-sans text-body-sm font-medium text-on-secondary shadow-xs transition-opacity hover:opacity-95 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" aria-hidden="true" />
                <span>Badge copied</span>
              </>
            ) : (
              <>
                <Share2 className="h-4 w-4" aria-hidden="true" />
                <span>Share badge</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-xl border border-outline-variant/60 bg-surface-container-low px-5 font-sans text-body-sm font-medium text-on-surface transition-colors hover:bg-surface-container cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      </div>
    </Modal>
  );
}
