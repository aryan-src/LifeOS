"use client";

import React, { useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import NumberFlow from "@number-flow/react";
import { getTodayDate, formatDateIST, getTrailingDays } from "@/lib/utils/date";

export interface BarData {
  label: string;
  value: number;
  subLabel?: string;
  date?: string;
  isToday?: boolean;
}

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
  data?: (BarData | HoverTraceBarItem)[];
  transactions?: TransactionMinimal[];
  currencySymbol?: string;
  height?: number;
  className?: string;
  safeDailyBudget?: number;
  barColor?: string; // Default warm terracotta: "#c25e43"
  headerTitle?: string;
  headerSubtitle?: string;
  legendLabel?: string;
  showBenchmarkBanner?: boolean;
  benchmarkText?: string;
  dateRangeText?: string;
  showHeader?: boolean;
}

const DEFAULT_DAYS: HoverTraceBarItem[] = [
  { day: "Thu", date: "2026-10-15", amount: 327, isToday: false },
  { day: "Fri", date: "2026-10-16", amount: 45, isToday: false },
  { day: "Sat", date: "2026-10-17", amount: 0, isToday: false },
  { day: "Sun", date: "2026-10-18", amount: 170, isToday: false },
  { day: "Mon", date: "2026-10-19", amount: 217, isToday: false },
  { day: "Tue", date: "2026-10-20", amount: 0, isToday: true },
  { day: "Wed", date: "2026-10-21", amount: 0, isToday: false },
];

export function HoverTraceBarChart({
  data,
  transactions,
  currencySymbol = "₹",
  height = 200,
  className = "",
  safeDailyBudget,
  barColor = "#c25e43",
  headerTitle = "7-Day Spending Pattern",
  headerSubtitle = "Daily disbursements vs safe ceiling",
  legendLabel = "Recorded Expense",
  showBenchmarkBanner = true,
  benchmarkText = "Staying strictly within daily pace",
  dateRangeText,
  showHeader = true,
}: HoverTraceBarChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const todayStr = useMemo(() => getTodayDate(), []);

  // 1. Dynamic 7-Day Aggregation: calculate trailing 7-day daily expenses
  const displayData = useMemo(() => {
    if (transactions && transactions.length > 0) {
      const trailing = getTrailingDays(7);
      const daySpendMap = new Map<string, number>();

      for (const t of transactions) {
        if (!t) continue;
        const rawAmt = typeof t.amount === "number" ? t.amount : parseFloat(String(t.amount));
        const amt = Math.abs(isNaN(rawAmt) ? 0 : rawAmt);
        const isExpense =
          t.type === "expense" ||
          (typeof t.amount === "number" && t.amount < 0) ||
          (t.type !== "income" && amt > 0);

        if (isExpense && t.date) {
          daySpendMap.set(t.date, (daySpendMap.get(t.date) || 0) + amt);
        }
      }

      const calculated = trailing.map((d) => ({
        label: d.dayLabel,
        day: d.dayLabel,
        value: Number((daySpendMap.get(d.date) || 0).toFixed(2)),
        amount: Number((daySpendMap.get(d.date) || 0).toFixed(2)),
        date: d.date,
        subLabel: d.date,
        isToday: d.isToday,
      }));

      if (calculated.some((d) => d.value > 0)) {
        return calculated;
      }
    }

    if (data && data.length > 0) {
      const normalized = data.map((item) => {
        const label =
          "label" in item && typeof item.label === "string"
            ? item.label
            : "day" in item && typeof item.day === "string"
            ? item.day
            : "";
        const value =
          "value" in item && typeof item.value === "number"
            ? item.value
            : "amount" in item && typeof item.amount === "number"
            ? item.amount
            : 0;
        const date =
          "date" in item && typeof item.date === "string"
            ? item.date
            : "subLabel" in item && typeof item.subLabel === "string"
            ? item.subLabel
            : "";
        const isToday = Boolean(item.isToday);
        return {
          label,
          day: label,
          value,
          amount: value,
          date,
          subLabel: date,
          isToday,
        };
      });

      if (normalized.some((d) => d.value > 0) || !transactions) {
        return normalized;
      }
    }

    return DEFAULT_DAYS.map((d) => ({
      label: d.day,
      day: d.day,
      value: d.amount,
      amount: d.amount,
      date: d.date,
      subLabel: d.date,
      isToday: d.isToday,
    }));
  }, [transactions, data]);

  // 2. Dynamic Date Range Header
  const computedDateRange = useMemo(() => {
    if (dateRangeText) return dateRangeText;
    if (displayData && displayData.length > 0) {
      const firstDate = displayData[0]?.date;
      const lastDate = displayData[displayData.length - 1]?.date;
      if (firstDate && lastDate) {
        try {
          const startStr = formatDateIST(firstDate, { month: "short", day: "numeric" });
          const endStr = formatDateIST(lastDate, { month: "short", day: "numeric" });
          return `${startStr} \u2013 ${endStr}`;
        } catch {
          // Fallback if formatting fails
        }
      }
    }
    return "Oct 15 \u2013 Oct 21";
  }, [dateRangeText, displayData]);

  const effectiveSafeBudget =
    typeof safeDailyBudget === "number" && safeDailyBudget > 0
      ? safeDailyBudget
      : 110.18;

  // Maximum value for proportional bar scaling
  const maxValue = useMemo(() => {
    return Math.max(...displayData.map((d) => d.value), 1);
  }, [displayData]);

  // Identify highest expenditure index for default focus
  const maxIndex = useMemo(() => {
    let bestIdx = 0;
    let maxVal = -1;
    displayData.forEach((d, i) => {
      if (d.value > maxVal) {
        maxVal = d.value;
        bestIdx = i;
      }
    });
    return bestIdx;
  }, [displayData]);

  const currentDayIndex = useMemo(() => {
    const idx = displayData.findIndex(
      (d) => d.isToday || (d.date && d.date === todayStr) || d.label === "Tue"
    );
    return idx >= 0 ? idx : 0;
  }, [displayData, todayStr]);

  const targetIndex = hoveredIndex !== null ? hoveredIndex : maxIndex;
  const targetValue = displayData[targetIndex]?.value ?? displayData[currentDayIndex]?.value ?? 0;
  const activeDayItem = displayData[targetIndex] || displayData[0];

  if (!showHeader) {
    return (
      <div
        ref={containerRef}
        className={cn("relative w-full flex flex-col justify-end gap-2 p-4", className)}
        style={{ height }}
      >
        <div className="flex items-end justify-between gap-2 h-full w-full">
          {displayData.map((item, index) => {
            const heightPercent = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
            const isHovered = hoveredIndex === index;

            return (
              <div
                key={index}
                className="relative flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Tooltip on Hover */}
                <AnimatePresence>
                  {isHovered && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute -top-10 z-20 px-2.5 py-1 rounded-md bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 text-xs font-mono font-medium shadow-md whitespace-nowrap pointer-events-none"
                    >
                      {currencySymbol}{item.value.toLocaleString()}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Bar Outer Track */}
                <div className="relative w-full h-full flex items-end rounded-lg bg-stone-100 dark:bg-stone-800/50 overflow-hidden">
                  {/* Active Hover Background Trace */}
                  {isHovered && (
                    <motion.div
                      layoutId="barTrace"
                      className="absolute inset-0 bg-amber-500/10 dark:bg-amber-400/10 rounded-lg"
                      transition={{ type: "spring", stiffness: 350, damping: 25 }}
                    />
                  )}

                  {/* Animated Fill Bar */}
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(heightPercent, 4)}%` }}
                    transition={{ type: "spring", stiffness: 120, damping: 15, delay: index * 0.04 }}
                    className={cn(
                      "w-full rounded-t-md transition-colors duration-200",
                      isHovered
                        ? "bg-amber-600 dark:bg-amber-500"
                        : "bg-[#c25e43] dark:bg-[#d97757]"
                    )}
                  />
                </div>

                {/* X-Axis Label */}
                <span className="mt-2 text-xs font-medium text-stone-500 dark:text-stone-400 group-hover:text-stone-900 dark:group-hover:text-stone-100 transition-colors">
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <article
      data-purpose="spending-pattern-card"
      className={cn(
        "h-full flex flex-col justify-between rounded-2xl border border-stone-200/70 bg-white/90 p-6 shadow-xs dark:bg-zinc-900/60 dark:border-zinc-800/60 transition-all duration-200 overflow-visible",
        className
      )}
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

        {/* Header Telemetry with Currency Readout */}
        <div className="mb-2 flex items-end justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-stone-400 dark:text-zinc-500 font-mono text-xs">
                [expense] Recorded
              </span>
              {/* Dynamic Sliding Date Range Pill */}
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-[#f5ebe6] text-[#c25e43] border border-[#eddcd4] dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50">
                <Calendar className="w-3 h-3" />
                {computedDateRange}
              </span>
            </div>
            {/* Dynamic Currency Readout */}
            <p className="text-stone-900 dark:text-zinc-100 font-mono text-2xl sm:text-3xl font-bold tracking-tight">
              <NumberFlow
                value={targetValue}
                format={{
                  style: "currency",
                  currency: currencySymbol === "₹" ? "INR" : currencySymbol === "$" ? "USD" : "EUR",
                  currencyDisplay: "narrowSymbol",
                }}
              />
            </p>
          </div>

          <div className="space-y-1 text-right">
            <p className="text-stone-400 dark:text-zinc-500 font-mono text-[10px] uppercase tracking-wider">
              [day]
            </p>
            <p className="text-stone-900 dark:text-zinc-100 font-mono text-xs font-semibold">
              {activeDayItem?.label}
              {activeDayItem?.date
                ? ` (${formatDateIST(activeDayItem.date, { month: "short", day: "numeric" })})`
                : ""}
            </p>
          </div>
        </div>

        {/* Chart Container Area */}
        <div className="relative w-full my-3">
          {/* Static Clean Amount Indicators above each bar */}
          <div className="w-full grid grid-cols-7 mb-2">
            {displayData.map((item, idx) => {
              const isSelected = targetIndex === idx;
              return (
                <div key={`val-${idx}`} className="flex justify-center text-center">
                  <span
                    className={cn(
                      "text-xs font-mono font-medium mb-1.5 transition-transform duration-200 tabular-nums z-10",
                      item.value <= 0
                        ? "text-stone-400 dark:text-zinc-500"
                        : isSelected
                        ? "text-amber-800 dark:text-amber-300 font-bold scale-105"
                        : "text-amber-800 dark:text-amber-300"
                    )}
                  >
                    {currencySymbol}
                    {Math.round(item.value)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Interactive Bars Container */}
          <div
            ref={containerRef}
            className="relative w-full h-44 flex flex-col justify-end"
          >
            {/* Reference Line tracking active bar height */}
            <div
              className="recharts-reference-line absolute left-0 right-0 pointer-events-none transition-all duration-200 z-10"
              style={{
                bottom: `${Math.min(Math.max((targetValue / maxValue) * 100, 6), 94)}%`,
              }}
            >
              <div className="w-full border-b border-dashed border-stone-400/50 dark:border-zinc-600/50 relative">
                <span className="absolute -top-3.5 left-0 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 shadow-xs">
                  {currencySymbol}{Math.round(targetValue)}
                </span>
                <span className="absolute -top-1 right-0 w-2 h-2 rounded-full bg-stone-800 dark:bg-stone-200" />
              </div>
            </div>

            <div className="flex items-end justify-between gap-3 h-full w-full">
              {displayData.map((item, index) => {
                const heightPercent = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
                const isHovered = hoveredIndex === index;
                const isSelected = targetIndex === index;

                return (
                  <div
                    key={index}
                    className="relative flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    {/* Tooltip on Hover */}
                    <AnimatePresence>
                      {isHovered && (
                        <motion.div
                          initial={{ opacity: 0, y: 6, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 4, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="absolute -top-10 z-20 px-2.5 py-1 rounded-md bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 text-xs font-mono font-medium shadow-md whitespace-nowrap pointer-events-none"
                        >
                          {currencySymbol}{item.value.toLocaleString()}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Bar Outer Track */}
                    <div className="relative w-full h-full flex items-end rounded-lg bg-stone-100/80 dark:bg-stone-800/40 overflow-hidden">
                      {/* Active Hover Background Trace */}
                      {isHovered && (
                        <motion.div
                          layoutId="barTrace"
                          className="absolute inset-0 bg-amber-500/10 dark:bg-amber-400/10 rounded-lg"
                          transition={{ type: "spring", stiffness: 350, damping: 25 }}
                        />
                      )}

                      {/* Animated Fill Bar */}
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${item.value > 0 ? Math.max(heightPercent, 8) : 4}%` }}
                        transition={{ type: "spring", stiffness: 120, damping: 15, delay: index * 0.04 }}
                        className={cn(
                          "w-full rounded-t-md transition-colors duration-200",
                          item.value <= 0
                            ? "bg-stone-200 dark:bg-zinc-700/60"
                            : isHovered || isSelected
                            ? "bg-amber-600 dark:bg-amber-500"
                            : "bg-[#c25e43] dark:bg-[#d97757]"
                        )}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* X-Axis Day Labels below chart */}
          <div className="w-full grid grid-cols-7 mt-2">
            {displayData.map((item, idx) => {
              const isSelected = targetIndex === idx;
              return (
                <div key={`day-label-${idx}`} className="flex justify-center text-center">
                  <span
                    className={cn(
                      "text-xs font-mono select-none transition-colors duration-200",
                      isSelected
                        ? "font-bold text-[#c25e43]"
                        : item.isToday
                        ? "text-amber-700 font-bold dark:text-amber-400 tracking-wide"
                        : "font-medium text-stone-500 dark:text-stone-400 group-hover:text-stone-900 dark:group-hover:text-stone-100"
                    )}
                  >
                    {item.label}
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
              <ShieldCheck
                aria-hidden="true"
                className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0"
              />
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

// Aliases for compatibility
export const EvilHoverTraceBarChart = HoverTraceBarChart;

export default HoverTraceBarChart;
