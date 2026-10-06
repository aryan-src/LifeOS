'use client';

import React, { useState } from 'react';
import type { FinancialAnalytics } from '@/lib/actions/finances';
import { formatCurrency } from '@/lib/utils/format';
import {
  Wallet,
  Sparkles,
  Calendar,
  Clock,
  TrendingDown,
  ArrowUpRight,
  AlertCircle,
  CheckCircle2,
  PieChart as PieIcon,
  Layers,
  Pencil,
} from 'lucide-react';

interface AllowanceHeroCardProps {
  analytics: FinancialAnalytics;
  activeTimeframe: 'all' | 'daily' | 'weekly' | 'monthly';
  onTimeframeChange: (tf: 'all' | 'daily' | 'weekly' | 'monthly') => void;
  onEditAllowance?: () => void;
}

const CATEGORY_EMOJIS: Record<string, string> = {
  'Stationary': '📚',
  'Junk Food': '🍕',
  'Vegetable': '🥦',
  'Fruits': '🍎',
  'Juice': '🧃',
  'Personal & Misc': '☕',
  'Allowance': '💵',
  'Commute': '🚌',
  'Subscription': '🎧',
};

export function AllowanceHeroCard({
  analytics,
  activeTimeframe,
  onTimeframeChange,
  onEditAllowance,
}: AllowanceHeroCardProps) {
  const {
    monthlyAllowance,
    monthlySpent,
    remainingAllowance,
    allowanceUsagePercent,
    todaySpent,
    safeDailyBudget,
    daysLeftInMonth,
    weekSpent,
    weeklyDays,
    categoryBreakdown,
    projectSpendTotal,
  } = analytics;

  // Determine budget status
  const isOverBudget = remainingAllowance < 0;
  const isBudgetTight = allowanceUsagePercent > 85;
  const isTodayOverTarget = safeDailyBudget > 0 && todaySpent > safeDailyBudget;

  const maxWeeklySpent = Math.max(...weeklyDays.map((d) => d.spent), 1);

  return (
    <div className="flex flex-col gap-space-lg">
      {/* Main Balance Banner */}
      <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
          <div className="flex flex-col gap-1">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-medium">
              Available Pocket Allowance
            </span>
            <div className="flex items-baseline gap-space-md flex-wrap">
              <span
                suppressHydrationWarning
                className={`font-display text-display font-bold tracking-tight ${
                  isOverBudget ? 'text-error' : 'text-on-surface'
                }`}
              >
                ₹{formatCurrency(remainingAllowance)}
              </span>
              <span suppressHydrationWarning className="font-body-md text-body-md text-on-surface-variant font-label-md">
                remaining of ₹{formatCurrency(monthlyAllowance)}
              </span>
              {onEditAllowance && (
                <button
                  type="button"
                  onClick={onEditAllowance}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm text-label-sm transition-colors shadow-sm ml-2"
                  title="Adjust monthly pocket money"
                >
                  <Pencil size={11} className="text-secondary" />
                  <span>Edit Allowance</span>
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-space-sm self-start lg:self-center bg-surface-container px-space-md py-1.5 rounded-full">
            <span className="material-symbols-outlined text-secondary text-[18px]">calendar_today</span>
            <span className="font-label-md text-label-md text-on-surface font-medium">
              {daysLeftInMonth} days left this month
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
            <span className="font-label-sm text-label-sm text-secondary font-semibold">
              {isOverBudget ? 'Tight' : 'Healthy'}
            </span>
          </div>
        </div>
        {/* Sleek Allowance Track Bar */}
        <div className="flex flex-col gap-space-xs">
          <div className="w-full h-2.5 bg-surface-container-high rounded-full overflow-hidden flex">
            <div
              className={`h-full transition-all duration-700 ease-out ${
                isOverBudget ? 'bg-error' : isBudgetTight ? 'bg-on-tertiary-container' : 'bg-secondary'
              }`}
              style={{ width: `${Math.min(allowanceUsagePercent, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-outline font-label-sm text-label-sm">
            <span suppressHydrationWarning>
              {allowanceUsagePercent}% used (₹{formatCurrency(monthlySpent)} spent)
            </span>
            <span suppressHydrationWarning>
              {Math.max(0, 100 - allowanceUsagePercent)}% preserved (₹{formatCurrency(remainingAllowance)} safe)
            </span>
          </div>
        </div>
      </div>

      {/* Metric Grid (3 Calm Tiles) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
        {/* Tile 1 */}
        <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col justify-between gap-space-md">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md text-outline uppercase tracking-wider">Today&apos;s Spending</span>
            <span className="material-symbols-outlined text-outline text-[18px]">wb_sunny</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-space-sm">
              <span suppressHydrationWarning className="font-headline-lg text-headline-lg text-on-surface font-semibold">
                ₹{formatCurrency(todaySpent)}
              </span>
              <span
                className={`px-2 py-0.5 rounded font-label-sm text-label-sm font-medium ${
                  isTodayOverTarget
                    ? 'bg-error-container text-on-error-container'
                    : 'bg-secondary-container text-on-secondary-container'
                }`}
              >
                {isTodayOverTarget ? 'Limit reached' : 'Safe pace'}
              </span>
            </div>
            <span suppressHydrationWarning className="font-label-sm text-label-sm text-outline">
              Target budget: ~₹{formatCurrency(safeDailyBudget)} / day
            </span>
          </div>
        </div>

        {/* Tile 2 */}
        <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col justify-between gap-space-md">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md text-outline uppercase tracking-wider">7-Day Outlays</span>
            <span className="material-symbols-outlined text-outline text-[18px]">monitoring</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-space-sm">
              <span suppressHydrationWarning className="font-headline-lg text-headline-lg text-on-surface font-semibold">
                ₹{formatCurrency(weekSpent)}
              </span>
              <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm font-medium">
                {weeklyDays.filter((d) => d.spent > 0).length} active days
              </span>
            </div>
            <span suppressHydrationWarning className="font-label-sm text-label-sm text-outline">
              Avg: ₹{formatCurrency(weekSpent / 7)} / day this week
            </span>
          </div>
        </div>

        {/* Tile 3 */}
        <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col justify-between gap-space-md">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md text-outline uppercase tracking-wider">Projects &amp; Study Work</span>
            <span className="material-symbols-outlined text-outline text-[18px]">school</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-space-sm">
              <span suppressHydrationWarning className="font-headline-lg text-headline-lg text-on-surface font-semibold">
                ₹{formatCurrency(projectSpendTotal)}
              </span>
              <span className="px-2 py-0.5 rounded bg-surface-container text-outline font-label-sm text-label-sm">
                Dedicated buffer
              </span>
            </div>
            <span className="font-label-sm text-label-sm text-outline">Coursework &amp; project reserve</span>
          </div>
        </div>
      </div>

      {/* Two-Column Analytical Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md items-start">
        {/* Left Column: 7-Day Spending Pattern Bar Chart (7 Cols) */}
        <div className="lg:col-span-7 bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between gap-space-lg min-h-[360px]">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">7-Day Spending Pattern</h2>
              <span className="font-label-sm text-label-sm text-outline">Daily disbursements vs safe ceiling</span>
            </div>
            <div className="flex items-center gap-space-sm font-label-sm text-label-sm text-outline">
              <span className="w-2.5 h-2.5 rounded-sm bg-on-tertiary-container inline-block"></span>
              <span>Recorded Expense</span>
            </div>
          </div>

          {/* Minimal Bar Chart */}
          <div className="w-full flex flex-col gap-space-sm pt-space-md">
            <div className="h-44 w-full flex items-end justify-between gap-2 px-space-sm">
              {weeklyDays.map((day, idx) => {
                const heightPercent = maxWeeklySpent > 0 ? (day.spent / maxWeeklySpent) * 100 : 0;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                    <span
                      suppressHydrationWarning
                      className={`font-label-sm text-label-sm transition-opacity ${
                        day.spent > 0
                          ? 'text-on-tertiary-container font-medium'
                          : 'text-outline opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      {day.spent > 0 ? `₹${Math.round(day.spent)}` : '₹0'}
                    </span>
                    <div
                      className={`w-full max-w-[36px] rounded-t transition-all ${
                        day.spent > 0
                          ? 'bg-on-tertiary-container shadow-sm group-hover:opacity-90'
                          : 'bg-surface-container-high h-1.5 group-hover:bg-surface-tint'
                      }`}
                      style={{
                        height: day.spent > 0 ? `${Math.max(heightPercent, 12)}%` : '6px',
                      }}
                    />
                    <span
                      className={`font-label-sm text-label-sm ${
                        day.isToday ? 'text-on-surface font-semibold' : 'text-outline'
                      }`}
                    >
                      {day.dayLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-space-sm bg-surface-container-low px-space-md py-space-sm rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-space-xs text-outline font-label-sm text-label-sm">
              <span className="material-symbols-outlined text-[16px] text-secondary">verified</span>
              <span>Staying strictly within daily pace</span>
            </div>
            <span suppressHydrationWarning className="font-label-sm text-label-sm text-on-surface font-medium">
              ~₹{formatCurrency(safeDailyBudget)} safe daily budget
            </span>
          </div>
        </div>

        {/* Right Column: Where Did Pocket Money Go? (5 Cols) */}
        <div className="lg:col-span-5 bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between gap-space-lg min-h-[360px]">
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Where Did Money Go?</h2>
              <span className="font-label-sm text-label-sm text-outline font-mono">
                {categoryBreakdown.length} Active Categories
              </span>
            </div>
            <span className="font-label-sm text-label-sm text-outline">Categorical student outflow</span>
          </div>

          <div className="flex flex-col gap-space-md">
            {/* Horizontal Breakdown Bar */}
            <div className="flex flex-col gap-space-xs">
              <div className="w-full h-3 bg-surface-container-high rounded-full overflow-hidden flex">
                {categoryBreakdown.map((cat, idx) => (
                  <div
                    key={idx}
                    className="h-full"
                    style={{
                      width: `${cat.percentage}%`,
                      backgroundColor: cat.color || '#cb6654',
                    }}
                    title={`${cat.name}: ${Math.round(cat.percentage)}%`}
                  />
                ))}
              </div>
              <div className="flex items-center justify-between font-label-sm text-label-sm text-outline">
                <span suppressHydrationWarning>Total spent: ₹{formatCurrency(monthlySpent)}</span>
                <span>{categoryBreakdown.length} Categories active</span>
              </div>
            </div>

            {/* Breakdown List */}
            <div className="flex flex-col gap-space-sm">
              {categoryBreakdown.length === 0 ? (
                <div className="p-space-sm text-center font-body-sm text-body-sm text-outline">
                  No categorical expenses logged yet.
                </div>
              ) : (
                categoryBreakdown.slice(0, 4).map((cat, idx) => {
                  const emoji = CATEGORY_EMOJIS[cat.name] || '🏷️';
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-space-sm rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors"
                    >
                      <div className="flex items-center gap-space-sm">
                        <span className="text-[14px]">{emoji}</span>
                        <span className="font-body-sm text-body-sm text-on-surface font-medium truncate">
                          {cat.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-space-md">
                        <span className="font-label-sm text-label-sm text-outline">
                          {Math.round(cat.percentage)}%
                        </span>
                        <span suppressHydrationWarning className="font-label-md text-label-md text-on-surface font-semibold">
                          ₹{formatCurrency(cat.value)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-outline font-label-sm text-label-sm pt-space-xs border-t border-surface-container-high/60">
            <span>Zero emergency debits logged</span>
            <span className="text-secondary font-medium">Discipline Index: 98/100</span>
          </div>
        </div>
      </div>
    </div>
  );
}
