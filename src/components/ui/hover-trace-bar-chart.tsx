'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { motion, useSpring, useMotionValueEvent } from 'framer-motion';
import NumberFlow from '@number-flow/react';

export interface HoverTraceBarItem {
  day: string; // "Fri", "Sat", "Sun", "Mon", "Tue", "Wed", "Thu"
  date: string; // "YYYY-MM-DD"
  amount: number; // e.g. 135
  isToday?: boolean;
}

export interface HoverTraceBarChartProps {
  data: HoverTraceBarItem[];
  currencySymbol?: string;
  safeDailyBudget?: number;
  className?: string;
  barColor?: string; // Default terracotta: "#C2634C"
  headerTitle?: string;
  headerSubtitle?: string;
  legendLabel?: string;
  showBenchmarkBanner?: boolean;
  benchmarkText?: string;
}

export function HoverTraceBarChart({
  data,
  currencySymbol = '₹',
  safeDailyBudget = 175.58,
  className = '',
  barColor = '#C2634C',
  headerTitle = '7-Day Spending Pattern',
  headerSubtitle = 'Daily disbursements vs safe ceiling',
  legendLabel = 'Recorded Expense',
  showBenchmarkBanner = true,
  benchmarkText = 'Staying strictly within daily pace',
}: HoverTraceBarChartProps) {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Determine initial selected item (highest non-zero spend or today)
  const initialItem = useMemo(() => {
    if (!data || data.length === 0) {
      return { index: 0, day: '', date: '', amount: 0, isToday: false };
    }
    let maxIdx = -1;
    let maxVal = -1;
    data.forEach((item, idx) => {
      if (item.amount > maxVal && item.amount > 0) {
        maxVal = item.amount;
        maxIdx = idx;
      }
    });
    if (maxIdx >= 0) {
      return { index: maxIdx, ...data[maxIdx] };
    }
    const todayIdx = data.findIndex((d) => d.isToday);
    if (todayIdx >= 0) {
      return { index: todayIdx, ...data[todayIdx] };
    }
    return { index: data.length - 1, ...data[data.length - 1] };
  }, [data]);

  const [activeTooltipIndex, setActiveTooltipIndex] = useState<number | null>(null);

  const activeItem = useMemo(() => {
    if (activeTooltipIndex !== null && data[activeTooltipIndex]) {
      return { index: activeTooltipIndex, ...data[activeTooltipIndex] };
    }
    return initialItem;
  }, [activeTooltipIndex, data, initialItem]);

  // Spring physics for smooth reference line glide
  const springValue = useSpring(activeItem.amount, {
    stiffness: 120,
    damping: 20,
  });

  const [springDisplayValue, setSpringDisplayValue] = useState<number>(activeItem.amount);

  useEffect(() => {
    springValue.set(activeItem.amount);
  }, [activeItem.amount, springValue]);

  useMotionValueEvent(springValue, 'change', (latest) => {
    setSpringDisplayValue(Math.round(latest));
  });

  const handleMouseLeaveChart = useCallback(() => {
    setActiveTooltipIndex(null);
  }, []);

  // Calculate Y-axis domain with 25% headroom so trace line and badges never clip
  const maxAmount = useMemo(() => {
    const rawMax = Math.max(...(data.map((d) => d.amount) || [0]), 50);
    return Math.ceil(rawMax * 1.25);
  }, [data]);

  // Custom Bar Shape supporting terracotta active bars & zero-spend baseline pills
  const renderBarShape = (props: any) => {
    const { x, y, width, height, index, payload } = props;
    const isInactive = !payload || payload.amount <= 0;
    const isHovered = activeItem.index === index;
    const isAnyHovered = activeTooltipIndex !== null;

    const actualWidth = Math.min(Math.max(width * 0.52, 24), 38);
    const offsetX = x + (width - actualWidth) / 2;

    if (isInactive) {
      const pillHeight = 6;
      const pillY = y - pillHeight;
      const inactiveOpacity = isHovered ? 1 : isAnyHovered ? 0.35 : 0.65;

      return (
        <g key={`bar-inactive-${index}`} className="cursor-pointer transition-all duration-200">
          {/* Full height transparent hit target */}
          <rect
            x={x}
            y={0}
            width={width}
            height={200}
            fill="transparent"
            pointerEvents="all"
          />
          {/* Neutral baseline placeholder pill */}
          <rect
            x={offsetX}
            y={pillY}
            width={actualWidth}
            height={pillHeight}
            rx={3}
            ry={3}
            fill="#E7E1D8"
            fillOpacity={inactiveOpacity}
            className="dark:fill-stone-700 transition-opacity duration-200"
          />
        </g>
      );
    }

    const barOpacity = isHovered ? 1 : isAnyHovered ? 0.35 : 0.95;
    const barHeight = Math.max(height, 8);

    return (
      <g key={`bar-active-${index}`} className="cursor-pointer transition-all duration-200">
        {/* Full height transparent hit target */}
        <rect
          x={x}
          y={0}
          width={width}
          height={200}
          fill="transparent"
          pointerEvents="all"
        />
        {/* Terracotta active spend bar */}
        <rect
          x={offsetX}
          y={y}
          width={actualWidth}
          height={barHeight}
          rx={5}
          ry={5}
          fill={barColor}
          fillOpacity={barOpacity}
          stroke={isHovered ? '#983E2A' : 'none'}
          strokeWidth={isHovered ? 1 : 0}
          className="transition-all duration-200"
        />
      </g>
    );
  };

  // Custom XAxis tick with today and hover highlights
  const renderCustomTick = ({ x, y, payload }: any) => {
    const item = data[payload.index];
    const isToday = item?.isToday;
    const isHovered = activeItem.index === payload.index;

    return (
      <g transform={`translate(${x},${y + 12})`}>
        <text
          x={0}
          y={0}
          textAnchor="middle"
          className={`font-mono text-xs select-none transition-colors duration-200 ${
            isHovered
              ? 'fill-[#C2634C] font-bold'
              : isToday
              ? 'fill-neutral-950 dark:fill-neutral-100 font-bold'
              : 'fill-neutral-500 dark:fill-neutral-400 font-medium'
          }`}
        >
          {payload.value}
        </text>
      </g>
    );
  };

  // Custom reference line label badge
  const renderTraceLabel = ({ viewBox }: any) => {
    const x = viewBox?.x ?? 0;
    const y = viewBox?.y ?? 0;
    const text = `${currencySymbol}${Math.round(activeItem.amount)}`;
    const pillWidth = Math.max(text.length * 7.5 + 16, 46);

    return (
      <g className="pointer-events-none select-none">
        <rect
          x={x + 2}
          y={y - 9}
          width={pillWidth}
          height={18}
          fill={barColor}
          rx={4}
          className="shadow-xs"
        />
        <text
          className="font-mono text-[10px] font-bold"
          x={x + 2 + pillWidth / 2}
          y={y + 3.5}
          textAnchor="middle"
          fill="#ffffff"
        >
          {text}
        </text>
        <circle cx="99.5%" cy={y} r={3} fill={barColor} />
      </g>
    );
  };

  return (
    <div
      className={`bg-white dark:bg-stone-900/90 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-sm p-6 sm:p-7 flex flex-col justify-between gap-6 min-h-[380px] ${className}`}
    >
      {/* Header Area */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col">
          <h2 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight font-sans">
            {headerTitle}
          </h2>
          <span className="font-mono text-xs text-neutral-500 dark:text-neutral-400">
            {headerSubtitle}
          </span>
        </div>

        {/* Legend Indicator */}
        <div className="flex items-center gap-2 font-mono text-xs text-neutral-500 dark:text-neutral-400 shrink-0">
          <span
            className="w-2.5 h-2.5 rounded-xs inline-block"
            style={{ backgroundColor: barColor }}
          />
          <span>{legendLabel}</span>
        </div>
      </div>

      {/* Interactive Chart Container */}
      <div className="w-full flex-1 flex flex-col justify-end pt-2 pb-1 relative min-h-[220px]">
        {/* Floating animated NumberFlow readout smoothly tracking the active bar */}
        {isMounted && data.length > 0 && (
          <motion.div
            initial={false}
            animate={{
              left: `${((activeItem.index + 0.5) / data.length) * 100}%`,
              opacity: 1,
            }}
            transition={{
              type: 'spring',
              stiffness: 280,
              damping: 26,
            }}
            className="absolute top-0 -translate-x-1/2 pointer-events-none z-20 flex flex-col items-center"
          >
            <div className="font-mono text-xs font-bold text-[#C2634C] dark:text-[#E07A63] flex items-center">
              <NumberFlow
                value={activeItem.amount}
                prefix={currencySymbol}
                format={{ maximumFractionDigits: 0 }}
              />
            </div>
          </motion.div>
        )}

        {/* Static Value Labels above non-hovered active bars (Matching original aesthetic at rest) */}
        <div className="w-full grid grid-cols-7 absolute top-0 left-0 right-0 pointer-events-none z-10">
          {data.map((item, idx) => {
            const isHovered = activeItem.index === idx;
            const hasSpend = item.amount > 0;
            return (
              <div
                key={`static-label-${idx}`}
                className="flex justify-center items-center text-center"
              >
                {hasSpend && (
                  <span
                    className={`font-mono text-xs font-medium text-[#C2634C] dark:text-[#E07A63] transition-opacity duration-200 ${
                      isHovered ? 'opacity-0' : 'opacity-100'
                    }`}
                  >
                    {currencySymbol}
                    {Math.round(item.amount)}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Recharts Bar Chart with Trace ReferenceLine */}
        <div className="w-full h-48 sm:h-52">
          {isMounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 24, right: 12, left: 12, bottom: 0 }}
                onMouseMove={(e: any) => {
                  if (e?.activeTooltipIndex != null) {
                    setActiveTooltipIndex(Number(e.activeTooltipIndex));
                  }
                }}
                onMouseLeave={handleMouseLeaveChart}
              >
                <XAxis
                  dataKey="day"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tick={renderCustomTick}
                  interval={0}
                />
                <YAxis hide={true} domain={[0, maxAmount]} />
                <Tooltip cursor={false} content={() => null} />
                <Bar
                  dataKey="amount"
                  shape={renderBarShape}
                  activeBar={renderBarShape}
                  isAnimationActive={false}
                />
                {activeItem.amount > 0 && (
                  <ReferenceLine
                    y={springDisplayValue}
                    stroke={barColor}
                    strokeDasharray="3 3"
                    strokeWidth={1.5}
                    strokeOpacity={0.65}
                    label={renderTraceLabel}
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex items-end justify-between px-4 pb-4">
              {data.map((_, i) => (
                <div
                  key={i}
                  className="w-8 h-2 rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse"
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Benchmark Alert Banner */}
      {showBenchmarkBanner && (
        <div className="bg-[#FAF4EE] dark:bg-stone-800/60 border border-[#FAF4EE] dark:border-stone-800 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
            <svg
              className="w-4 h-4 text-[#3C6847] shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
            <span>{benchmarkText}</span>
          </div>
          <span className="font-semibold text-neutral-900 dark:text-neutral-100">
            ~{currencySymbol}
            {safeDailyBudget ? safeDailyBudget.toFixed(2) : '175.58'} safe daily budget
          </span>
        </div>
      )}
    </div>
  );
}

export default HoverTraceBarChart;
