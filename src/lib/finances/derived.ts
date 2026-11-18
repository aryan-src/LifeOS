import { computeDaysLeftInMonth } from '@/lib/daily-loop/dashboard-derived';

export interface WeeklySpendDay {
  date?: string;
  dayLabel: string;
  spent: number;
  isToday?: boolean;
}

export interface ExpensesDerivedSummary {
  totalSpent: number;
  monthlyLimit: number;
  remainingBalance: number;
  percentUtilized: number;
  daysLeft: number;
  safeDailyPace: number;
  daysBelowPaceCount: number;
  totalTrackedDays: number;
  paceStatusText: string;
  barTone: 'secondary' | 'tertiary' | 'error';
}

export const SEMANTIC_CATEGORY_COLORS: readonly string[] = [
  'rgb(var(--color-secondary))',
  'rgb(var(--color-on-tertiary-container))',
  'rgb(var(--color-outline))',
  'rgb(var(--color-on-surface-variant))',
  'rgb(var(--color-secondary) / 0.65)',
  'rgb(var(--color-error))',
];

export function getSemanticCategoryColor(index: number): string {
  return SEMANTIC_CATEGORY_COLORS[index % SEMANTIC_CATEGORY_COLORS.length];
}

export function computeExpensesSummary(params: {
  totalSpent: number;
  monthlyLimit: number;
  currentDate?: string;
  daysLeftOverride?: number;
  weeklyDays?: WeeklySpendDay[];
}): ExpensesDerivedSummary {
  const monthlyLimit = Math.max(0, params.monthlyLimit);
  const totalSpent = Math.max(0, params.totalSpent);
  const remainingBalance = Math.max(0, monthlyLimit - totalSpent);
  const percentUtilized =
    monthlyLimit > 0
      ? Math.min(100, Number(((totalSpent / monthlyLimit) * 100).toFixed(1)))
      : 0;

  const daysLeft =
    typeof params.daysLeftOverride === 'number' && params.daysLeftOverride > 0
      ? Math.round(params.daysLeftOverride)
      : computeDaysLeftInMonth(params.currentDate || new Date().toISOString().slice(0, 10));

  const safeDailyPace =
    daysLeft > 0 ? Math.max(0, Math.floor(remainingBalance / daysLeft)) : 0;

  const trailing = (params.weeklyDays || []).slice(-7);
  const totalTrackedDays = trailing.length || 7;
  const daysBelowPaceCount = trailing.filter((day) => day.spent <= safeDailyPace).length;

  let barTone: 'secondary' | 'tertiary' | 'error' = 'secondary';
  if (percentUtilized >= 90) {
    barTone = 'error';
  } else if (percentUtilized >= 75) {
    barTone = 'tertiary';
  }

  return {
    totalSpent,
    monthlyLimit,
    remainingBalance,
    percentUtilized,
    daysLeft,
    safeDailyPace,
    daysBelowPaceCount,
    totalTrackedDays,
    paceStatusText: `${daysBelowPaceCount} of ${totalTrackedDays} days below pace`,
    barTone,
  };
}

export function formatMonthHeading(dateStr: string): string {
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) {
    return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(
      new Date()
    );
  }
  const [y, m] = parts;
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(y, m - 1, 1)));
}
