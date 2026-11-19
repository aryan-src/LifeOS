import React from 'react';
import type { FocusHistorySummary } from '@/lib/daily-loop/focus-history-derived';

interface AttentionalDistributionCardProps {
  summary: FocusHistorySummary;
}

const LINING_NUMS_STYLE: React.CSSProperties = {
  fontVariantNumeric: 'lining-nums tabular-nums',
};

export function AttentionalDistributionCard({ summary }: AttentionalDistributionCardProps) {
  const goalMinutes = Math.max(1, summary.goalMinutes || 240);
  const tallestDayMinutes = Math.max(
    0,
    ...summary.weeklyBars.map((b) => (b.minutes !== null ? b.minutes : b.isQualified ? goalMinutes * 0.6 : 0))
  );
  const maxScale = Math.ceil(Math.max(goalMinutes * 1.25, tallestDayMinutes));
  const goalBottomPct = Math.min(95, Math.max(5, Math.round((goalMinutes / maxScale) * 100)));
  const midGoalMinutes = Math.round(goalMinutes / 2);
  const midBottomPct = Math.round((midGoalMinutes / maxScale) * 100);

  return (
    <div
      className="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant/30 shadow-xs flex flex-col gap-6"
      data-purpose="focus-weekly-bars"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-outline-variant/20">
        <h2 className="text-xl font-normal font-serif text-on-surface">
          Focus this week
        </h2>
        <div className="flex items-center gap-4 text-xs font-mono text-label-sm text-on-surface-variant">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-secondary" aria-hidden="true" />
            <span>Focused</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 border-b border-dashed border-outline" aria-hidden="true" />
            <span>Daily goal ({goalMinutes}m)</span>
          </div>
        </div>
      </div>

      {/* Vector / CSS Hybrid Bar Chart Area */}
      <div className="relative w-full h-64 pt-6 flex flex-col justify-end">
        {/* Goal Guideline Line dynamically placed based on daily focus goal */}
        <div
          className="absolute inset-x-0 flex items-center pointer-events-none z-10"
          style={{ bottom: `${goalBottomPct}%` }}
        >
          <div className="w-full border-b border-dashed border-outline/40" />
          <span className="absolute right-0 -top-4 font-mono text-label-sm text-on-surface-variant bg-surface-container-lowest px-1.5 tabular-nums">
            Goal: {goalMinutes}m
          </span>
        </div>

        {/* Mid-marker line dynamically placed */}
        <div
          className="absolute inset-x-0 flex items-center pointer-events-none opacity-40"
          style={{ bottom: `${midBottomPct}%` }}
        >
          <div className="w-full border-b border-dashed border-outline-variant/40" />
          <span className="absolute right-0 -top-4 font-mono text-label-sm text-on-surface-variant/70 bg-surface-container-lowest px-1.5 tabular-nums">
            {midGoalMinutes}m
          </span>
        </div>

        {/* Bars Container: 7 Columns */}
        <div className="grid grid-cols-7 h-full items-end gap-2 sm:gap-6 z-20">
          {summary.weeklyBars.map((bar) => {
            const effectiveMinutes =
              bar.minutes !== null
                ? bar.minutes
                : bar.isQualified
                ? goalMinutes * 0.6
                : 0;
            const barHeight =
              effectiveMinutes > 0
                ? Math.min(100, Math.max(3, Math.round((effectiveMinutes / maxScale) * 100)))
                : 2;
            const isGoalMet =
              (bar.minutes !== null && bar.minutes >= goalMinutes) ||
              bar.percentOfGoal >= 100;
            const barClass = bar.isToday
              ? 'bg-secondary ring-2 ring-secondary/25'
              : bar.isQualified || (bar.minutes !== null && bar.minutes > 0)
              ? 'bg-secondary/85 hover:bg-secondary'
              : bar.isFuture
              ? 'bg-surface-container'
              : 'bg-surface-container-highest';

            return (
              <div
                key={bar.date}
                className="flex flex-col items-center h-full justify-end group"
              >
                <div
                  className={`w-full max-w-[48px] transition-all rounded-t relative flex justify-center ${barClass}`}
                  style={{ height: `${barHeight}%` }}
                >
                  <span className="opacity-0 group-hover:opacity-100 absolute -top-7 font-mono text-[11px] text-on-surface bg-surface-container px-1.5 py-0.5 rounded shadow-xs transition-opacity tabular-nums whitespace-nowrap pointer-events-none z-30">
                    {bar.minutes !== null ? `${bar.minutes} min` : bar.isQualified ? 'Qualified' : '0 min'}
                    {isGoalMet ? ' ★' : ''}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* X-Axis Labels & Numeric Telemetry */}
      <div className="grid grid-cols-7 gap-2 sm:gap-6 pt-3 bg-surface-container-low/60 rounded-xl p-2.5">
        {summary.weeklyBars.map((bar) => {
          const displayMinutes =
            bar.minutes !== null ? `${bar.minutes}m` : bar.isQualified ? '✓' : '0m';
          const isHighlighted = bar.isToday || (bar.percentOfGoal >= 100);

          return (
            <div key={`label-${bar.date}`} className="text-center">
              <div
                className={`font-mono text-label-md font-semibold ${
                  bar.isToday
                    ? 'text-secondary'
                    : isHighlighted
                    ? 'text-on-surface'
                    : 'text-on-surface-variant'
                }`}
              >
                {bar.dayLabel}
              </div>
              <div
                className={`font-mono text-label-sm tabular-nums mt-0.5 ${
                  bar.isToday
                    ? 'text-secondary font-medium'
                    : 'text-on-surface-variant'
                }`}
                style={LINING_NUMS_STYLE}
              >
                {displayMinutes}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
