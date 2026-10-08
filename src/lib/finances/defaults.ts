import { getTodayDate, getTrailingDays } from '@/lib/utils/date';
import type { FinancialAnalytics } from '@/lib/actions/finances';

/**
 * Safe fallback financial analytics payload used when database is unseeded or temporarily unreachable.
 */
export function getFallbackFinancialAnalytics(): FinancialAnalytics {
  const todayStr = getTodayDate();
  return {
    currentDate: todayStr,
    currencySymbol: '₹',
    monthlyAllowance: 15000.0,
    monthlySpent: 0,
    remainingAllowance: 15000.0,
    allowanceUsagePercent: 0,
    todaySpent: 0,
    safeDailyBudget: 500.0,
    daysLeftInMonth: 30,
    weekSpent: 0,
    weeklyDays: getTrailingDays(7).map((d) => ({ ...d, spent: 0 })),
    categoryBreakdown: [],
    projectSpendTotal: 0,
    totalInflow: 0,
    totalOutflow: 0,
    netCashflow: 0,
    cashflowComparison: [
      { name: 'Pocket Money (In)', amount: 15000, fill: '#10b981' },
      { name: 'Spent (Out)', amount: 0, fill: '#f43f5e' },
    ],
  };
}
