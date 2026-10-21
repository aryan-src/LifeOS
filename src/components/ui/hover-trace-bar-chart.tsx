'use client';

import * as React from 'react';
import {
  Bar,
  BarChart,
  Rectangle,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
  type BarShapeProps,
  type CartesianViewBox,
} from 'recharts';
import {
  type ChartConfig,
  ChartContainer,
} from '@/components/ui/hover-trace-bar-chart-utils/recharts-chart';
import { useMotionValueEvent, useSpring } from 'motion/react';
import NumberFlow from '@number-flow/react';
import { getTodayDate, formatDateIST, getTrailingDays } from '@/lib/utils/date';

export interface HoverTraceBarItem {
  day: string; // "Thu", "Fri", "Sat", "Sun", "Mon", "Tue", "Wed"
  date?: string; // "YYYY-MM-DD"
  amount: number;
  isToday?: boolean;
}

export interface TransactionMinimal {
  date: string;
  amount: number | string;
  type?: string;
}

export interface HoverTraceBarChartProps {
  data?: HoverTraceBarItem[];
  transactions?: TransactionMinimal[];
  currencySymbol?: string;
  safeDailyBudget?: number;
  className?: string;
  barColor?: string; // Default terracotta: "#C86D51"
  headerTitle?: string;
  headerSubtitle?: string;
  legendLabel?: string;
  showBenchmarkBanner?: boolean;
  benchmarkText?: string;
  dateRangeText?: string;
}

const CHART_MARGIN = 38;

const DEFAULT_DAYS: HoverTraceBarItem[] = [
  { day: 'Thu', date: '2026-10-15', amount: 327, isToday: false },
  { day: 'Fri', date: '2026-10-16', amount: 45, isToday: false },
  { day: 'Sat', date: '2026-10-17', amount: 0, isToday: false },
  { day: 'Sun', date: '2026-10-18', amount: 170, isToday: false },
  { day: 'Mon', date: '2026-10-19', amount: 217, isToday: false },
  { day: 'Tue', date: '2026-10-20', amount: 0, isToday: true },
  { day: 'Wed', date: '2026-10-21', amount: 0, isToday: false },
];

const chartConfig = {
  spend: {
    label: 'Disbursement',
    colors: {
      light: ['#C86D51'],
      dark: ['#d97757'],
    },
  },
} satisfies ChartConfig;

export function HoverTraceBarChart({
  data,
  transactions,
  currencySymbol = '₹',
  safeDailyBudget,
  className = '',
  barColor = '#C86D51',
  headerTitle = '7-Day Spending Pattern',
  headerSubtitle = 'Daily disbursements vs safe ceiling',
  legendLabel = 'Recorded Expense',
  showBenchmarkBanner = true,
  benchmarkText = 'Staying strictly within daily pace',
  dateRangeText,
}: HoverTraceBarChartProps) {
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);

  const todayStr = React.useMemo(() => getTodayDate(), []);

  // 1. 7-Day Dataset Mapping: past 7 days of disbursements
  const displayData: HoverTraceBarItem[] = React.useMemo(() => {
    if (transactions && transactions.length > 0) {
      const trailing = getTrailingDays(7);
      const daySpendMap = new Map<string, number>();

      for (const t of transactions) {
        if (!t) continue;
        const rawAmt = typeof t.amount === 'number' ? t.amount : parseFloat(String(t.amount));
        const amt = Math.abs(isNaN(rawAmt) ? 0 : rawAmt);
        const isExpense =
          t.type === 'expense' ||
          (typeof t.amount === 'number' && t.amount < 0) ||
          (t.type !== 'income' && amt > 0);

        if (isExpense && t.date) {
          daySpendMap.set(t.date, (daySpendMap.get(t.date) || 0) + amt);
        }
      }

      const calculated = trailing.map((d) => ({
        day: d.dayLabel,
        date: d.date,
        amount: Number((daySpendMap.get(d.date) || 0).toFixed(2)),
        isToday: d.isToday,
      }));

      if (calculated.some((d) => d.amount > 0)) {
        return calculated;
      }
    }

    if (data && data.length > 0 && data.some((d) => d.amount > 0)) {
      return data;
    }

    if (data && data.length > 0 && !transactions) {
      return data;
    }

    return DEFAULT_DAYS;
  }, [transactions, data]);

  // 2. Date Range Telemetry Calculation
  const computedDateRange = React.useMemo(() => {
    if (dateRangeText) return dateRangeText;
    if (displayData && displayData.length > 0) {
      const firstDate = displayData[0]?.date;
      const lastDate = displayData[displayData.length - 1]?.date;
      if (firstDate && lastDate) {
        try {
          const startStr = formatDateIST(firstDate, { month: 'short', day: 'numeric' });
          const endStr = formatDateIST(lastDate, { month: 'short', day: 'numeric' });
          return `${startStr} – ${endStr}`;
        } catch {
          // Fallback if not standard dates
        }
      }
    }
    return 'Oct 15 – Oct 21';
  }, [dateRangeText, displayData]);

  const effectiveSafeBudget =
    typeof safeDailyBudget === 'number' && safeDailyBudget > 0
      ? safeDailyBudget
      : 110.18;

  // Identify current day and maximum day indices
  const currentDayIndex = React.useMemo(() => {
    const idx = displayData.findIndex(
      (d) => d.isToday || (d.date && d.date === todayStr) || d.day === 'Tue'
    );
    return idx >= 0 ? idx : 0;
  }, [displayData, todayStr]);

  const currentDayAmount = displayData[currentDayIndex]?.amount ?? 0;

  const maxIndex = React.useMemo(() => {
    let bestIdx = 0;
    let maxVal = -1;
    displayData.forEach((d, i) => {
      if (d.amount > maxVal) {
        maxVal = d.amount;
        bestIdx = i;
      }
    });
    return bestIdx;
  }, [displayData]);

  // Target value: active hovered day's amount or fallback to maximum/current day
  const targetIndex = activeIndex !== null ? activeIndex : maxIndex;
  const targetValue = displayData[targetIndex]?.amount ?? currentDayAmount;

  // Dynamic Hover Tracking & Spring Physics (stiffness: 120, damping: 18)
  const valueSpring = useSpring(targetValue, { stiffness: 120, damping: 18 });
  const [springYValue, setSpringYValue] = React.useState(targetValue);

  React.useEffect(() => {
    valueSpring.set(targetValue);
  }, [targetValue, valueSpring]);

  useMotionValueEvent(valueSpring, 'change', (latest) => {
    setSpringYValue(latest);
  });

  const handleBarHover = React.useCallback(
    (index: number) => {
      setActiveIndex(index);
    },
    []
  );

  const maxSpend = React.useMemo(() => {
    return Math.max(...displayData.map((d) => d.amount), 50);
  }, [displayData]);

  const yDomainMax = React.useMemo(() => {
    return Math.ceil(Math.max(maxSpend, 50) * 1.35);
  }, [maxSpend]);

  const activeDayItem = displayData[targetIndex] || displayData[0];

  return (
    <article
      data-purpose="spending-pattern-card"
      className={`h-full flex flex-col justify-between rounded-2xl border border-stone-200/80 bg-white/90 p-6 shadow-xs dark:bg-zinc-900/60 dark:border-zinc-800/80 transition-all duration-200 overflow-visible ${className}`}
    >
      <div className="flex-1 flex flex-col justify-between overflow-visible">
        {/* Card Title & Subtitle */}
        <div className="flex items-start justify-between pb-3 border-b border-stone-200/60 dark:border-zinc-800/60 mb-3">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-stone-900 dark:text-zinc-100 font-sans">
              {headerTitle}
            </h2>
            <p className="text-xs font-mono text-stone-400 dark:text-stone-400">
              {headerSubtitle}
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400 font-mono select-none pt-0.5">
            <span
              aria-hidden="true"
              className="inline-block w-2.5 h-2.5 rounded-[2px]"
              style={{ backgroundColor: barColor }}
            />
            <span>{legendLabel}</span>
          </div>
        </div>

        {/* Header Telemetry with NumberFlow Currency Readout */}
        <div className="mb-2 flex items-end justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-stone-400 dark:text-zinc-500 font-mono text-xs">
                [expense] Recorded
              </span>
              {/* Date Range Telemetry Pill */}
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
                {computedDateRange}
              </span>
            </div>
            {/* NumberFlow INR Formatted Amount */}
            <p className="text-stone-900 dark:text-zinc-100 font-mono text-2xl sm:text-3xl font-bold tracking-tight">
              <NumberFlow
                value={targetValue}
                format={{
                  style: 'currency',
                  currency: 'INR',
                  currencyDisplay: 'narrowSymbol',
                }}
              />
            </p>
          </div>

          <div className="space-y-1 text-right">
            <p className="text-stone-400 dark:text-zinc-500 font-mono text-[10px] uppercase tracking-wider">
              [day]
            </p>
            <p className="text-stone-900 dark:text-zinc-100 font-mono text-xs font-semibold">
              {activeDayItem?.day}
              {activeDayItem?.date
                ? ` (${formatDateIST(activeDayItem.date, { month: 'short', day: 'numeric' })})`
                : ''}
            </p>
          </div>
        </div>

        {/* Recharts Chart Container with Fixed Height (h-56) to eliminate SSR Hydration Layout Shifts */}
        <div className="relative w-full h-56 my-2">
          {/* Static Clean Amount Indicators above each bar */}
          <div className="w-full grid grid-cols-7 absolute top-0 left-0 right-0 pointer-events-none z-10 pl-9 pr-2">
            {displayData.map((item, idx) => {
              const isSelected = targetIndex === idx;
              return (
                <div key={`val-${idx}`} className="flex justify-center text-center">
                  <span
                    className={`text-xs font-mono font-medium mb-1.5 transition-transform duration-200 tabular-nums z-10 ${
                      item.amount <= 0
                        ? 'text-stone-400 dark:text-zinc-500'
                        : isSelected
                        ? 'text-amber-800 dark:text-amber-300 font-bold scale-105'
                        : 'text-amber-800 dark:text-amber-300'
                    }`}
                  >
                    {currencySymbol}
                    {Math.round(item.amount)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* ChartContainer wrapping BarChart */}
          <ChartContainer config={chartConfig} className="w-full h-44">
            <BarChart
              accessibilityLayer
              data={displayData}
              margin={{ left: CHART_MARGIN, right: 12, top: 22, bottom: 0 }}
              onMouseMove={(state) => {
                const chartEvent = state as { activeTooltipIndex?: number | string | null } | null;
                if (chartEvent?.activeTooltipIndex != null) {
                  handleBarHover(Number(chartEvent.activeTooltipIndex));
                }
              }}
              onMouseLeave={() => {
                setActiveIndex(null);
              }}
            >
              <YAxis hide domain={[0, yDomainMax]} />

              <Tooltip cursor={false} content={() => null} />

              {/* Bar Component with Notion Warm Hue (#C86D51) & Focal Contrast (100% active, 25% non-hovered) */}
              <Bar
                dataKey="amount"
                fill="var(--color-spend-0)"
                radius={4}
                shape={(props: BarShapeProps) => (
                  <HoverTraceBarShape
                    {...props}
                    highlightedIndex={targetIndex}
                    barColor={barColor}
                  />
                )}
                activeBar={(props: BarShapeProps) => (
                  <HoverTraceBarShape
                    {...props}
                    highlightedIndex={targetIndex}
                    barColor={barColor}
                  />
                )}
              />

              {/* Spring Animated Horizontal Reference Line Tracking Active Bar Height */}
              <ReferenceLine
                y={springYValue}
                stroke="var(--foreground)"
                strokeDasharray="3 3"
                strokeOpacity={0.6}
                strokeWidth={1.5}
                label={
                  <HoverTraceLabel
                    value={targetValue}
                    currencySymbol={currencySymbol}
                  />
                }
              />
            </BarChart>
          </ChartContainer>

          {/* X-axis Day Labels below chart */}
          <div className="w-full grid grid-cols-7 mt-1 pl-9 pr-2">
            {displayData.map((item, idx) => {
              const isToday = Boolean(
                item.isToday ||
                (item.date && item.date === todayStr) ||
                item.day === 'Tue' ||
                item.day === 'Thu'
              );
              const isSelected = targetIndex === idx;

              return (
                <div key={`day-label-${idx}`} className="flex justify-center text-center">
                  <span
                    className={`text-xs font-mono select-none transition-colors duration-200 ${
                      isSelected
                        ? 'font-bold text-[#C86D51]'
                        : isToday
                        ? 'text-amber-700 font-bold dark:text-amber-400 tracking-wide'
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

        {/* Anchored Bottom Status Banner */}
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

interface HoverTraceLabelProps {
  viewBox?: CartesianViewBox;
  value: number;
  currencySymbol?: string;
}

const HoverTraceLabel = ({
  viewBox,
  value,
  currencySymbol = '₹',
}: HoverTraceLabelProps) => {
  const x = viewBox?.x ?? 0;
  const y = viewBox?.y ?? 0;
  const formattedValue = `${currencySymbol}${Math.round(value)}`;
  const width = formattedValue.length * 8 + 14;

  return (
    <g className="pointer-events-none select-none">
      <rect
        x={x - CHART_MARGIN}
        y={y - 9}
        width={width}
        height={18}
        fill="var(--foreground)"
        className="fill-stone-900 dark:fill-zinc-100"
        rx={4}
      />
      <text
        className="font-mono text-[11px] font-semibold fill-white dark:fill-zinc-900"
        x={x - CHART_MARGIN + width / 2}
        y={y + 4}
        textAnchor="middle"
      >
        {formattedValue}
      </text>
      <ellipse
        cx={'99.5%'}
        cy={y}
        rx={3}
        ry={3}
        fill="var(--foreground)"
        className="fill-stone-900 dark:fill-zinc-100"
      />
    </g>
  );
};

type HoverTraceBarShapeProps = BarShapeProps & {
  highlightedIndex: number;
  barColor?: string;
};

const HoverTraceBarShape = (props: HoverTraceBarShapeProps) => {
  const {
    x = 0,
    y = 0,
    width = 0,
    height = 0,
    fill,
    index = 0,
    isActive,
    highlightedIndex,
    payload,
    barColor = '#C86D51',
  } = props;

  const isInactive = !payload || (payload as { amount?: number }).amount === 0;
  const isSelected = isActive || index === highlightedIndex;
  // Active bar with 100% opacity, non-hovered bars at opacity 0.25 for smooth focal contrast
  const fillOpacity = isSelected ? 1 : 0.25;

  const actualWidth = Math.min(Math.max(width * 0.52, 22), 42);
  const offsetX = x + (width - actualWidth) / 2;

  if (isInactive) {
    return (
      <g className="cursor-pointer transition-all duration-200">
        <Rectangle {...props} fill="transparent" pointerEvents="all" />
        <rect
          x={offsetX}
          y={y - 6}
          width={actualWidth}
          height={6}
          rx={3}
          ry={3}
          className="fill-stone-200 dark:fill-zinc-700 transition-all duration-200"
          fillOpacity={isSelected ? 1 : 0.4}
        />
      </g>
    );
  }

  return (
    <g className="cursor-pointer transition-all duration-200">
      <Rectangle {...props} fill="transparent" pointerEvents="all" />
      <rect
        x={offsetX}
        y={y}
        width={actualWidth}
        height={Math.max(height, 8)}
        radius={4}
        fill={fill || barColor}
        fillOpacity={fillOpacity}
        stroke={isSelected ? 'var(--foreground)' : undefined}
        strokeOpacity={isSelected ? 0.35 : undefined}
        strokeWidth={isSelected ? 1 : undefined}
        className="transition-all duration-200"
      />
    </g>
  );
};

// Aliases for EvilHoverTraceBarChart compatibility
export const EvilHoverTraceBarChart = HoverTraceBarChart;

export default HoverTraceBarChart;
