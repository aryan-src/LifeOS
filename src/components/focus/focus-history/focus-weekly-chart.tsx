import React from 'react';
import { Sparkles, CheckCircle2 } from 'lucide-react';
import type { FocusHistorySummary } from '@/lib/daily-loop/focus-history-derived';
import { Card } from '@/components/ui/card';
import { Pill } from '@/components/ui/pill';
import { ProgressBar } from '@/components/ui/progress-bar';

interface FocusWeeklyChartProps {
  summary: FocusHistorySummary;
}

const LINING_NUMS_STYLE: React.CSSProperties = {
  fontVariantNumeric: 'lining-nums tabular-nums',
};

export function FocusWeeklyChart({ summary }: FocusWeeklyChartProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
      {/* Weekly Bars Card */}
      <Card
        padding="lg"
        surface="lowest"
        className="lg:col-span-8 flex flex-col justify-between gap-6"
        data-purpose="focus-weekly-bars"
      >
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-sans text-headline-sm font-semibold text-on-surface">
              Weekly Focus Rhythm
            </h2>
            <p className="mt-0.5 font-sans text-body-sm text-on-surface-variant">
              Today&apos;s progress against goal and weekly qualified days
            </p>
          </div>

          <div className="flex items-center gap-3 font-mono text-label-sm text-on-surface-variant">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-secondary" aria-hidden="true" />
              Active / Qualified
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-surface-container-highest" aria-hidden="true" />
              No log
            </span>
          </div>
        </div>

        <div className="relative flex h-52 w-full flex-col justify-end pt-6">
          <div className="z-10 grid h-full grid-cols-7 items-end gap-2 sm:gap-5">
            {summary.weeklyBars.map((bar) => {
              const barHeight = Math.max(4, bar.percentOfGoal);
              const barClass = bar.isToday
                ? 'bg-secondary ring-2 ring-secondary/25'
                : bar.isQualified
                ? 'bg-secondary/75'
                : bar.isFuture
                ? 'bg-surface-container'
                : 'bg-surface-container-highest';

              return (
                <div
                  key={bar.date}
                  className="flex h-full flex-col items-center justify-end gap-2"
                >
                  <span
                    className={`font-mono text-[11px] ${
                      bar.isToday
                        ? 'font-semibold text-secondary'
                        : 'text-on-surface-variant'
                    }`}
                    style={LINING_NUMS_STYLE}
                  >
                    {bar.minutes !== null
                      ? `${bar.minutes}m`
                      : bar.isQualified
                      ? '✓'
                      : '—'}
                  </span>
                  <div className="flex w-full flex-1 items-end justify-center">
                    <div
                      className={`w-full max-w-[44px] rounded-t-md transition-all duration-300 ${barClass}`}
                      style={{ height: `${barHeight}%` }}
                      title={`${bar.dayLabel} (${bar.date}): ${
                        bar.minutes !== null
                          ? `${bar.minutes}m focused`
                          : bar.isQualified
                          ? 'Qualified day'
                          : bar.isFuture
                          ? 'Upcoming'
                          : 'No logged activity'
                      }`}
                    />
                  </div>
                  <span
                    className={`font-mono text-label-sm ${
                      bar.isToday
                        ? 'font-semibold text-on-surface'
                        : 'text-on-surface-variant'
                    }`}
                  >
                    {bar.dayLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* 14-Day Calibration Baseline Card */}
      <Card
        padding="lg"
        surface="lowest"
        className="lg:col-span-4 flex flex-col justify-between gap-4"
        data-purpose="focus-calibration-card"
      >
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-label-sm uppercase tracking-[0.08em] text-on-surface-variant">
              Peak-Hour Calibration
            </span>
            <Pill tone={summary.calibration.isCalibrated ? 'secondary' : 'neutral'}>
              {summary.calibration.isCalibrated ? 'Ready' : 'Calibrating'}
            </Pill>
          </div>

          <h2 className="font-sans text-headline-sm font-semibold text-on-surface">
            14-Day Focus Baseline
          </h2>
          <p className="font-sans text-body-sm text-on-surface-variant leading-relaxed">
            {summary.peakWindowText}
          </p>
        </div>

        <div className="space-y-3 rounded-xl border border-outline-variant/40 bg-surface-container-low p-4">
          <div className="flex items-baseline justify-between">
            <span
              className="font-mono text-numeric-stat font-semibold text-on-surface"
              style={LINING_NUMS_STYLE}
            >
              {Math.min(summary.calibration.daysTracked, summary.calibration.targetDays)} /{' '}
              {summary.calibration.targetDays} days
            </span>
            <span
              className="font-mono text-label-sm font-semibold text-secondary"
              style={LINING_NUMS_STYLE}
            >
              {summary.calibration.percent}%
            </span>
          </div>

          <ProgressBar
            value={summary.calibration.percent}
            tone="secondary"
            size="sm"
            label="14-day focus calibration baseline"
          />

          <div className="flex items-center gap-1.5 font-mono text-[11px] text-on-surface-variant">
            {summary.calibration.isCalibrated ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-secondary shrink-0" aria-hidden="true" />
            ) : (
              <Sparkles className="h-3.5 w-3.5 text-on-tertiary-container shrink-0" aria-hidden="true" />
            )}
            <span>{summary.calibration.label}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
