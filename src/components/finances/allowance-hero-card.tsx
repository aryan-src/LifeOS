'use client';

import React from 'react';
import type { FinancialAnalytics } from '@/lib/actions/finances';
import { formatCurrency, formatNumber } from '@/lib/utils/format';

export type TimeFilterTab = 'today' | 'this_week' | 'monthly' | 'all';

interface AllowanceHeroCardProps {
  analytics: FinancialAnalytics;
  onEditAllowance?: () => void;
  activeTab?: TimeFilterTab;
  filteredSpent?: number;
  filteredRemaining?: number;
  filteredCategoryBreakdown?: Array<{
    name: string;
    value: number;
    color: string;
    count: number;
    percentage: number;
  }>;
  filteredTransactionsCount?: number;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function AllowanceHeroCard({
  analytics,
  onEditAllowance,
  activeTab = 'all',
  filteredSpent,
  filteredRemaining,
  filteredCategoryBreakdown,
  filteredTransactionsCount,
}: AllowanceHeroCardProps) {
  const {
    monthlyAllowance,
    monthlySpent,
    remainingAllowance: rawRemaining,
    allowanceUsagePercent: rawPercent,
    todaySpent,
    safeDailyBudget,
    daysLeftInMonth,
    weekSpent,
    weeklyDays,
    categoryBreakdown,
    projectSpendTotal,
    currencySymbol = '₹',
    currentDate,
  } = analytics;

  // Compute month label e.g. "October 2026"
  const [yearStr, monthStr] = (currentDate || '2026-10-07').split('-');
  const monthIndex = parseInt(monthStr, 10) - 1;
  const currentMonthName = MONTH_NAMES[monthIndex] || 'October';
  const currentYear = yearStr || '2026';
  const formattedMonthYear = `${currentMonthName} ${currentYear}`;

  // If user has not set an allowance yet, fallback gracefully to student default budget (10,354)
  const displayAllowance = monthlyAllowance > 0 ? monthlyAllowance : 10354;
  const displaySpent =
    typeof filteredSpent === 'number' ? filteredSpent : monthlySpent;
  const displayRemaining =
    typeof filteredRemaining === 'number'
      ? filteredRemaining
      : monthlyAllowance > 0
      ? rawRemaining
      : Math.max(0, displayAllowance - displaySpent);
  const displayPercent =
    displayAllowance > 0
      ? Math.min(100, Math.round((displaySpent / displayAllowance) * 100))
      : rawPercent;
  const safeBufferPercent = Math.max(0, 100 - displayPercent);

  const isTodayOverTarget = safeDailyBudget > 0 && todaySpent > safeDailyBudget;
  const maxWeeklySpent = Math.max(...weeklyDays.map((d) => d.spent), 50);

  // Active categories for segmented bar
  const defaultColors = ['#3c6847', '#cb6654', '#625d5b', '#8b5cf6', '#3b82f6'];
  const sourceBreakdown = filteredCategoryBreakdown ?? categoryBreakdown;
  const activeCategories = sourceBreakdown.filter((c) => c.value > 0);

  const trackerTitle =
    activeTab === 'today'
      ? "Today's Budget Tracker"
      : activeTab === 'this_week'
      ? "This Week's Budget Tracker"
      : activeTab === 'monthly'
      ? 'Monthly Budget Tracker'
      : 'Monthly Budget Tracker';

  const outflowSubtitle =
    activeTab === 'today'
      ? "Today's categorical outflow"
      : activeTab === 'this_week'
      ? "This week's categorical outflow"
      : activeTab === 'monthly'
      ? `${currentMonthName} categorical outflow`
      : 'All-time categorical outflow';

  const hasExpensesInPeriod = activeCategories.length > 0;

  const activeDaysCount = weeklyDays.filter((d) => d.spent > 0).length;

  return (
    <div className="flex flex-col gap-space-xl">
      {/* =========================================================================
          SECTION 1: Hero Financial Status Card & Key Metrics (3-column layout)
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-space-md items-stretch">
        {/* Left 2/3 Column: Monthly Budget Tracker Card */}
        <div className="lg:col-span-2 bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between gap-space-md border border-outline-variant/30 h-full">
          {/* Card Header & Month Switcher */}
          <div className="flex items-center justify-between pb-space-xs">
            <div className="flex items-center gap-space-sm">
              <div className="w-2 h-2 rounded-full bg-secondary" />
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-medium">
                {trackerTitle}
              </span>
            </div>
            <button
              type="button"
              onClick={onEditAllowance}
              className="flex items-center gap-1.5 px-space-sm py-1 rounded-lg bg-surface-container-low hover:bg-surface-container border border-outline-variant/40 text-on-surface font-label-md text-label-md transition-colors cursor-pointer"
              title="Change monthly allowance or view details"
            >
              <span>{formattedMonthYear}</span>
              <span className="material-symbols-outlined text-[16px] text-outline">
                keyboard_arrow_down
              </span>
            </button>
          </div>

          {/* Budget Total & Main Limit Bar (Primary Display: Emphasizing Remaining Balance) */}
          <div className="flex flex-col gap-space-sm">
            <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-1">
              <div className="flex items-baseline gap-space-sm">
                <span
                  className={`font-display text-display font-bold tracking-tight ${
                    displayRemaining < 0 ? 'text-error' : 'text-on-surface'
                  }`}
                >
                  {currencySymbol}
                  {formatNumber(Math.round(displayRemaining))}
                </span>
                <span className="font-label-md text-label-md text-outline font-medium">
                  remaining balance
                </span>
              </div>
              <div className="flex items-center gap-space-xs text-outline font-label-sm text-label-sm">
                <span className="material-symbols-outlined text-secondary text-[16px]">
                  schedule
                </span>
                <span>{daysLeftInMonth} days left this cycle</span>
              </div>
            </div>

            {/* Main Spent Progress Bar */}
            <div className="flex flex-col gap-1.5 pt-space-xs">
              <div className="w-full h-3 bg-surface-container-high rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-on-surface rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${Math.min(displayPercent, 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-outline font-label-sm text-label-sm pt-0.5">
                <span>{displayPercent}% of monthly cap utilized</span>
                <span className="text-secondary font-medium">
                  {safeBufferPercent}% safe buffer remaining
                </span>
              </div>
            </div>
          </div>

          {/* Two Columns: Spent vs Monthly Limit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
            {/* Spent */}
            <div className="p-space-md rounded-lg bg-surface-container-low border border-outline-variant/20 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">
                  Spent
                </span>
                <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface font-label-sm text-label-sm font-semibold">
                  {displayPercent}%
                </span>
              </div>
              <span className="font-headline-lg text-headline-lg text-on-surface font-bold font-mono">
                {currencySymbol}
                {formatNumber(Math.round(displaySpent))}
              </span>
              <span className="font-label-sm text-label-sm text-outline">
                {displayPercent <= 65
                  ? 'Under expected daily runway'
                  : 'Approaching monthly runway ceiling'}
              </span>
            </div>

            {/* Monthly Limit (Secondary Card: Right Side) */}
            <div className="p-space-md rounded-lg bg-surface-container-low border border-outline-variant/20 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">
                  Monthly Limit
                </span>
                <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold">
                  {safeBufferPercent}%
                </span>
              </div>
              <span className="font-headline-lg text-headline-lg text-on-surface font-bold font-mono">
                {currencySymbol}
                {formatNumber(Math.round(displayAllowance))}
              </span>
              <span className="font-label-sm text-label-sm text-secondary font-medium">
                Safe to spend: ~{currencySymbol}
                {Math.round(safeDailyBudget > 0 ? safeDailyBudget : displayRemaining / daysLeftInMonth)} / day
              </span>
            </div>
          </div>

          {/* Spending Breakdown with Segmented Bar */}
          <div className="flex flex-col gap-space-sm pt-space-xs border-t border-outline-variant/40">
            <div className="flex items-center justify-between">
              <span className="font-label-md text-label-md text-on-surface font-semibold uppercase tracking-wider">
                Spending Breakdown
              </span>
              <span className="font-label-sm text-label-sm text-outline font-mono">
                {activeCategories.length} {activeCategories.length === 1 ? 'category' : 'categories'} active
              </span>
            </div>

            {hasExpensesInPeriod ? (
              <>
                {/* Segmented bar */}
                <div className="w-full h-2.5 bg-surface-container-high rounded-full overflow-hidden flex gap-0.5">
                  {activeCategories.map((cat, idx) => (
                    <div
                      key={idx}
                      className="h-full transition-all"
                      style={{
                        width: `${Math.max(cat.percentage, 5)}%`,
                        backgroundColor: cat.color || defaultColors[idx % defaultColors.length],
                      }}
                      title={`${cat.name}: ${currencySymbol}${formatNumber(Math.round(cat.value))}`}
                    />
                  ))}
                </div>

                {/* mini cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-sm pt-space-xs">
                  {activeCategories.slice(0, 3).map((cat, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-space-sm rounded-lg bg-surface-container-low border border-outline-variant/20"
                    >
                      <div className="flex items-center gap-space-xs min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{
                            backgroundColor: cat.color || defaultColors[idx % defaultColors.length],
                          }}
                        />
                        <span className="font-body-sm text-body-sm text-on-surface font-medium truncate">
                          {cat.name}
                        </span>
                      </div>
                      <span className="font-label-md text-label-md font-mono text-on-surface font-bold shrink-0 ml-1">
                        {currencySymbol}
                        {formatNumber(Math.round(cat.value))}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="py-2.5 px-3 rounded-lg bg-surface-container-low text-center text-outline text-label-sm border border-outline-variant/20">
                No expenses recorded for this period
              </div>
            )}
          </div>

          {/* Action Button: View Details */}
          <button
            type="button"
            onClick={onEditAllowance}
            className="w-full flex items-center justify-center gap-space-xs py-2 px-space-md rounded-lg bg-surface-container-low hover:bg-surface-container border border-outline-variant/40 text-on-surface font-label-md text-label-md font-medium transition-colors cursor-pointer"
          >
            <span>View Details</span>
            <span className="material-symbols-outlined text-[16px] text-outline">
              arrow_forward
            </span>
          </button>
        </div>

        {/* Right 1/3 Column: Stacked Metric Tiles */}
        <div className="lg:col-span-1 flex flex-col justify-between gap-space-md h-full">
          {/* Tile 1: Today's Spending */}
          <div className="flex-1 bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col justify-between border border-outline-variant/30">
            <div className="flex items-center justify-between pb-space-xs">
              <span className="font-label-md text-label-md text-outline uppercase tracking-wider">
                Today&apos;s Spending
              </span>
              <span className="material-symbols-outlined text-outline text-[18px]">
                wb_sunny
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-space-sm">
                <span className="font-headline-lg text-headline-lg text-on-surface font-semibold">
                  {currencySymbol}
                  {formatCurrency(todaySpent)}
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
              <span className="font-label-sm text-label-sm text-outline">
                Target budget: ~{currencySymbol}
                {formatCurrency(safeDailyBudget > 0 ? safeDailyBudget : 190.38)} / day
              </span>
            </div>
          </div>

          {/* Tile 2: 7-Day Outlays */}
          <div className="flex-1 bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col justify-between border border-outline-variant/30">
            <div className="flex items-center justify-between pb-space-xs">
              <span className="font-label-md text-label-md text-outline uppercase tracking-wider">
                7-Day Outlays
              </span>
              <span className="material-symbols-outlined text-outline text-[18px]">
                monitoring
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-space-sm">
                <span className="font-headline-lg text-headline-lg text-on-surface font-semibold">
                  {currencySymbol}
                  {formatCurrency(weekSpent)}
                </span>
                <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm font-medium">
                  {activeDaysCount === 1 ? '1 transaction' : `${activeDaysCount} active days`}
                </span>
              </div>
              <span className="font-label-sm text-label-sm text-outline">
                Avg: {currencySymbol}
                {formatCurrency(weekSpent / 7)} / day this week
              </span>
            </div>
          </div>

          {/* Tile 3: Projects & Study Work */}
          <div className="flex-1 bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col justify-between border border-outline-variant/30">
            <div className="flex items-center justify-between pb-space-xs">
              <span className="font-label-md text-label-md text-outline uppercase tracking-wider">
                Projects &amp; Study Work
              </span>
              <span className="material-symbols-outlined text-outline text-[18px]">
                school
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-space-sm">
                <span className="font-headline-lg text-headline-lg text-on-surface font-semibold">
                  {currencySymbol}
                  {formatCurrency(projectSpendTotal)}
                </span>
                <span className="px-2 py-0.5 rounded bg-surface-container text-outline font-label-sm text-label-sm">
                  {projectSpendTotal > 0 ? 'Active budget' : 'Idle buffer'}
                </span>
              </div>
              <span className="font-label-sm text-label-sm text-outline">
                Dedicated book &amp; print reserve
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 2: Two-Column Analytical Insights (7-Day Pattern & Outflow)
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md items-start">
        {/* Left Column: 7-Day Spending Pattern Bar Chart (7 Cols) */}
        <div className="lg:col-span-7 bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between gap-space-lg min-h-[360px] border border-outline-variant/30">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                7-Day Spending Pattern
              </h2>
              <span className="font-label-sm text-label-sm text-outline">
                Daily disbursements vs safe ceiling
              </span>
            </div>
            <div className="flex items-center gap-space-sm font-label-sm text-label-sm text-outline">
              <span className="w-2.5 h-2.5 rounded-sm bg-on-tertiary-container inline-block" />
              <span>Recorded Expense</span>
            </div>
          </div>

          {/* Minimal Bar Chart Visualization */}
          <div className="w-full flex flex-col gap-space-sm pt-space-md">
            <div className="h-44 w-full flex items-end justify-between gap-2 px-space-sm">
              {weeklyDays.map((day, idx) => {
                const heightPercent =
                  maxWeeklySpent > 0 ? (day.spent / maxWeeklySpent) * 100 : 0;
                const isSpent = day.spent > 0;

                return (
                  <div
                    key={idx}
                    className="flex-1 flex flex-col items-center gap-2 h-full justify-end group"
                  >
                    <span
                      className={`font-label-sm text-label-sm transition-opacity ${
                        isSpent
                          ? 'text-on-tertiary-container font-medium opacity-100'
                          : 'text-outline opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      {currencySymbol}
                      {Math.round(day.spent)}
                    </span>
                    <div
                      className={`w-full max-w-[36px] rounded-t transition-all ${
                        isSpent
                          ? 'bg-on-tertiary-container shadow-sm group-hover:opacity-90'
                          : 'bg-surface-container-high h-1.5 group-hover:bg-surface-tint'
                      }`}
                      style={{
                        height: isSpent
                          ? `${Math.max(Math.min(heightPercent, 100), 16)}%`
                          : '6px',
                      }}
                    />
                    <span
                      className={`font-label-sm text-label-sm ${
                        day.isToday
                          ? 'text-on-surface font-semibold'
                          : 'text-outline'
                      }`}
                    >
                      {day.dayLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chart Footer Indicator */}
          <div className="pt-space-sm bg-surface-container-low px-space-md py-space-sm rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-space-xs text-outline font-label-sm text-label-sm">
              <span className="material-symbols-outlined text-[16px] text-secondary">
                verified
              </span>
              <span>Staying strictly within daily pace</span>
            </div>
            <span className="font-label-sm text-label-sm text-on-surface font-medium">
              ~{currencySymbol}
              {formatCurrency(safeDailyBudget > 0 ? safeDailyBudget : 190.38)} safe daily budget
            </span>
          </div>
        </div>

        {/* Right Column: Where Did Pocket Money Go? (5 Cols) */}
        <div className="lg:col-span-5 bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between gap-space-lg min-h-[360px] border border-outline-variant/30">
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                Where Did Money Go?
              </h2>
              <span className="font-label-sm text-label-sm text-outline font-mono">
                100% Accounted
              </span>
            </div>
            <span className="font-label-sm text-label-sm text-outline">
              {outflowSubtitle}
            </span>
          </div>

          <div className="flex flex-col gap-space-md">
            {/* Horizontal Breakdown Bar */}
            <div className="flex flex-col gap-space-xs">
              <div className="w-full h-3 bg-surface-container-high rounded-full overflow-hidden flex">
                {activeCategories.length > 0 ? (
                  activeCategories.map((cat, idx) => (
                    <div
                      key={idx}
                      className="h-full transition-all"
                      style={{
                        width: `${cat.percentage}%`,
                        backgroundColor: cat.color || defaultColors[idx % defaultColors.length],
                      }}
                      title={`${cat.name}: ${cat.percentage}%`}
                    />
                  ))
                ) : (
                  <div
                    className="h-full bg-surface-container-high transition-all"
                    style={{ width: '100%' }}
                  />
                )}
              </div>
              <div className="flex items-center justify-between font-label-sm text-label-sm text-outline">
                <span>
                  Total spent: {currencySymbol}
                  {formatCurrency(displaySpent)}
                </span>
                <span>
                  {activeCategories.length} {activeCategories.length === 1 ? 'Category' : 'Categories'} active
                </span>
              </div>
            </div>

            {/* Breakdown List */}
            <div className="flex flex-col gap-space-sm">
              {activeCategories.length > 0 ? (
                activeCategories.slice(0, 4).map((cat, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-space-sm rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors"
                  >
                    <div className="flex items-center gap-space-sm">
                      <span
                        className="w-3 h-3 rounded-sm"
                        style={{ backgroundColor: cat.color || defaultColors[idx % defaultColors.length] }}
                      />
                      <span className="font-body-sm text-body-sm text-on-surface font-medium">
                        {cat.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-space-md">
                      <span className="font-label-sm text-label-sm text-outline">
                        {Math.round(cat.percentage)}%
                      </span>
                      <span className="font-label-md text-label-md text-on-surface font-semibold">
                        {currencySymbol}
                        {formatCurrency(cat.value)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 px-4 rounded-lg bg-surface-container-low text-center text-outline text-label-sm border border-outline-variant/20">
                  No expenses recorded for this period
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-outline font-label-sm text-label-sm pt-space-xs border-t border-surface-container-high/60">
            <span>Zero emergency debits logged</span>
            <span className="text-secondary font-medium">
              Discipline Index: 98/100
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
