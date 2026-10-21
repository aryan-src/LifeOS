'use client';

import React, { useState } from 'react';

export interface HoverTraceBarItem {
  day: string; // "Thu", "Fri", "Sat", "Sun", "Mon", "Tue", "Wed"
  date: string; // "YYYY-MM-DD"
  amount: number;
  isToday?: boolean;
}

export interface HoverTraceBarChartProps {
  data?: HoverTraceBarItem[];
  currencySymbol?: string;
  safeDailyBudget?: number;
  className?: string;
  barColor?: string; // Default terracotta: "#C2634C"
  headerTitle?: string;
  headerSubtitle?: string;
  legendLabel?: string;
  showBenchmarkBanner?: boolean;
  benchmarkText?: string;
  dateRangeText?: string;
}

const DEFAULT_DAYS: HoverTraceBarItem[] = [
  { day: 'Thu', date: '2026-10-15', amount: 327, isToday: false },
  { day: 'Fri', date: '2026-10-16', amount: 45, isToday: false },
  { day: 'Sat', date: '2026-10-17', amount: 0, isToday: false },
  { day: 'Sun', date: '2026-10-18', amount: 170, isToday: false },
  { day: 'Mon', date: '2026-10-19', amount: 217, isToday: false },
  { day: 'Tue', date: '2026-10-20', amount: 0, isToday: true },
  { day: 'Wed', date: '2026-10-21', amount: 0, isToday: false },
];

export function HoverTraceBarChart({
  data,
  currencySymbol = '₹',
  safeDailyBudget,
  className = '',
  barColor = '#c25e43',
  headerTitle = '7-Day Spending Pattern',
  headerSubtitle = 'Daily disbursements vs safe ceiling',
  legendLabel = 'Recorded Expense',
  showBenchmarkBanner = true,
  benchmarkText = 'Staying strictly within daily pace',
  dateRangeText = 'Oct 15 – Oct 21',
}: HoverTraceBarChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const hasCustomData = Boolean(data && data.length > 0 && data.some((d) => d.amount > 0));
  const displayData: HoverTraceBarItem[] = hasCustomData && data ? data : DEFAULT_DAYS;

  const effectiveSafeBudget =
    typeof safeDailyBudget === 'number' && safeDailyBudget > 0
      ? safeDailyBudget
      : 110.18;

  const maxAmount = Math.max(...displayData.map((d) => d.amount), 50);

  // Identify peak spend index
  let peakIdx = -1;
  let peakVal = 0;
  displayData.forEach((d, idx) => {
    if (d.amount > peakVal) {
      peakVal = d.amount;
      peakIdx = idx;
    }
  });

  return (
    <article
      data-purpose="spending-pattern-card"
      className={`h-full flex flex-col justify-between rounded-2xl border border-stone-200/80 bg-white/90 p-6 shadow-xs dark:bg-zinc-900/60 dark:border-zinc-800/80 transition-all duration-200 overflow-visible ${className}`}
    >
      {/* Inner Main Content Area: flex-1 flex flex-col justify-between */}
      <div className="flex-1 flex flex-col justify-between overflow-visible">
        {/* Top Header Area */}
        <header className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2.5 mb-1 flex-wrap">
              <h2 className="text-lg font-bold tracking-tight text-stone-900 dark:text-zinc-100 font-sans">
                {headerTitle}
              </h2>
              {/* Date Range Pill */}
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-[#f5ebe6] text-[#c25e43] border border-[#eddcd4] dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50">
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <rect height="18" rx="2" ry="2" width="18" x="3" y="4" />
                  <line x1="16" x2="16" y1="2" y2="6" />
                  <line x1="8" x2="8" y1="2" y2="6" />
                  <line x1="3" x2="21" y1="10" y2="10" />
                </svg>
                {dateRangeText}
              </span>
            </div>
            <p className="text-xs font-mono text-stone-400 dark:text-stone-400">
              {headerSubtitle}
            </p>
          </div>

          {/* Top-Right Legend */}
          <div className="flex items-center space-x-1.5 text-xs text-stone-500 dark:text-stone-400 font-mono select-none self-start sm:self-auto pt-1 sm:pt-0">
            <span
              aria-hidden="true"
              className="inline-block w-2.5 h-2.5 rounded-[2px]"
              style={{ backgroundColor: barColor }}
            />
            <span>{legendLabel}</span>
          </div>
        </header>

        {/* Visual Chart Area */}
        <div
          className="relative w-full pt-8 pb-2 flex-1 flex flex-col justify-end overflow-visible min-h-[190px]"
          data-purpose="bar-chart-container"
        >
          {/* Safe Ceiling Dotted Benchmark Line */}
          <div
            className="absolute left-0 right-0 flex items-center z-0 pointer-events-none"
            style={{ top: '38%' }}
          >
            <div className="w-full border-b border-dashed border-[#c25e43]/60 dark:border-amber-600/60" />
            <div className="flex items-center shrink-0 -mr-1.5 gap-1.5 bg-white/90 dark:bg-zinc-900/90 pl-1.5">
              <span className="text-[10px] font-mono font-medium text-stone-400 uppercase tracking-wider hidden sm:inline">
                Safe Ceiling
              </span>
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: barColor }}
                title="Ceiling dot"
              />
            </div>
          </div>

          {/* Bar Chart Columns (7 Days Grid) */}
          <div className="grid grid-cols-7 gap-2 sm:gap-4 items-end relative z-10 w-full h-44 overflow-visible px-1 sm:px-2">
            {displayData.map((item, idx) => {
              const isPeak = idx === peakIdx && item.amount > 0;
              const isZero = item.amount <= 0;
              const isToday = Boolean(item.isToday || item.day === 'Tue');
              const isHovered = hoveredIdx === idx;

              // Proportional height
              const heightPercent = isZero
                ? 0
                : Math.min(Math.max((item.amount / maxAmount) * 100, 15), 100);
              const barHeightPx = isZero ? 0 : Math.round((heightPercent / 100) * 112);

              // Tooltip text calculation
              let tooltipText = `${currencySymbol}${item.amount.toFixed(2)} • Zero debits logged`;
              if (item.amount > effectiveSafeBudget) {
                const diff = (item.amount - effectiveSafeBudget).toFixed(2);
                tooltipText = `${currencySymbol}${item.amount.toFixed(2)} • Over daily budget (+${currencySymbol}${diff})`;
              } else if (item.amount > 0) {
                const diff = (effectiveSafeBudget - item.amount).toFixed(2);
                tooltipText = `${currencySymbol}${item.amount.toFixed(2)} • Within daily pace (-${currencySymbol}${diff})`;
              }

              return (
                <div
                  key={`day-col-${idx}-${item.day}`}
                  className="group relative cursor-pointer flex flex-col items-center justify-end h-full"
                  data-day={item.day}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                >
                  {/* Floating Tooltip */}
                  <div
                    className={`pointer-events-none transition-all duration-200 absolute -top-12 z-30 bg-stone-900/95 dark:bg-zinc-800/95 backdrop-blur text-white text-xs py-1.5 px-3 rounded-lg shadow-xl whitespace-nowrap font-sans flex flex-col items-center border border-stone-700/50 ${
                      isHovered
                        ? 'opacity-100 -translate-y-1'
                        : 'opacity-0 translate-y-0'
                    }`}
                  >
                    <span>{tooltipText}</span>
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-stone-900 dark:border-t-zinc-800" />
                  </div>

                  {/* Daily Amount Label Aligned Horizontally Over Each Bar */}
                  <span
                    className={`text-[11px] font-mono font-medium mb-1.5 transition-transform duration-200 tabular-nums ${
                      isZero
                        ? 'text-stone-400 dark:text-zinc-500'
                        : 'text-[#c25e43] dark:text-amber-500'
                    } ${isHovered ? '-translate-y-0.5' : ''}`}
                  >
                    {currencySymbol}
                    {Math.round(item.amount)}
                  </span>

                  {/* Vertical Bar Column or Zero Indicator Pill */}
                  <div className="relative w-full max-w-[44px] flex flex-col items-center">
                    {isPeak && (
                      <div className="absolute -top-3.5 z-20 bg-[#c25e43] dark:bg-amber-600 text-white font-mono text-[10px] font-medium px-1.5 py-0.5 rounded-[4px] shadow-xs whitespace-nowrap group-hover:brightness-105 group-hover:-translate-y-0.5 transition-all duration-200">
                        {currencySymbol}
                        {Math.round(item.amount)}
                      </div>
                    )}

                    {isZero ? (
                      <div className="w-8 h-1.5 bg-stone-200 dark:bg-zinc-700 rounded-full mb-0.5 transition-all duration-200 group-hover:bg-stone-300 dark:group-hover:bg-zinc-600 group-hover:scale-110" />
                    ) : (
                      <div
                        className="w-full rounded-t-lg transition-all duration-200 group-hover:bg-[#b05238] dark:group-hover:bg-amber-500 group-hover:-translate-y-0.5"
                        style={{
                          height: `${barHeightPx}px`,
                          backgroundColor: barColor,
                        }}
                      />
                    )}
                  </div>

                  {/* X-axis Day Label: Highlighted Current Day in muted terracotta/amber */}
                  <span
                    className={`text-xs font-mono mt-3 transition-colors ${
                      isToday
                        ? 'font-bold text-amber-700 dark:text-amber-400 tracking-wide'
                        : 'font-medium text-stone-500 dark:text-stone-400'
                    }`}
                  >
                    {item.day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Anchored Bottom Banner */}
        {showBenchmarkBanner && (
          <footer
            data-purpose="left-card-footer"
            className="mt-auto bg-amber-50/60 border border-amber-200/50 rounded-xl p-3 text-xs font-medium text-stone-700 flex justify-between items-center dark:bg-amber-950/20 dark:border-amber-900/30 dark:text-amber-300"
          >
            <div className="flex items-center space-x-2">
              <svg
                aria-hidden="true"
                className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  d="M12 19V6m0 0C10 4 7 4 4 5c0 5 3 8 8 9m0-8c2-2 5-2 8-1 0 5-3 8-8 9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="font-normal text-stone-700 dark:text-amber-200/90">
                {benchmarkText}
              </span>
            </div>
            <div className="font-mono font-medium text-stone-800 dark:text-amber-300 tracking-tight">
              ~{currencySymbol}
              {effectiveSafeBudget.toFixed(2)} safe daily budget
            </div>
          </footer>
        )}
      </div>
    </article>
  );
}

export default HoverTraceBarChart;
