import { getTodayDate, getTrailingDays } from '@/lib/utils/date';
import type {
  FinancialAnalytics,
  CategoryBreakdownItem,
  WeeklyDayData,
  TransactionWithRelations,
} from '@/lib/actions/finances';

/**
 * Pure calculation function for financial analytics KPIs.
 * Kept outside of 'use server' modules to avoid Next.js RPC compilation overhead.
 */
export function computeFinancialAnalytics(
  transactions: TransactionWithRelations[],
  profileTarget: number = 0,
  currencySymbol: string = '₹'
): FinancialAnalytics {
  const todayStr = getTodayDate();
  const [currentYear, currentMonthNum, currentDayNum] = todayStr.split('-').map(Number);
  const currentYearMonth = todayStr.substring(0, 7);

  const totalDaysInMonth = new Date(currentYear, currentMonthNum, 0).getDate();
  const rawDaysLeft = totalDaysInMonth - currentDayNum + 1;
  const daysLeftInMonth = isNaN(rawDaysLeft) || rawDaysLeft < 1 ? 1 : rawDaysLeft;

  const rawWeeklyDays = getTrailingDays(7);
  const weeklyDays: WeeklyDayData[] = rawWeeklyDays.map((d) => ({
    ...d,
    spent: 0,
  }));
  const weeklyDayMap = new Map<string, WeeklyDayData>();
  for (const item of weeklyDays) {
    weeklyDayMap.set(item.date, item);
  }

  let totalInflow = 0;
  let totalOutflow = 0;
  let monthlyAllowance = 0;
  let monthlySpent = 0;
  let todaySpent = 0;
  let weekSpent = 0;
  let projectSpendTotal = 0;

  const categoryMap = new Map<string, { value: number; color: string; count: number }>();

  for (const t of (transactions || [])) {
    if (!t) continue;
    const rawAmt = typeof t.amount === 'number' ? t.amount : parseFloat(String(t.amount));
    const amt = Math.abs(isNaN(rawAmt) ? 0 : rawAmt);
    const isIncome = t.type === 'income' || (typeof t.amount === 'number' && t.amount > 0);
    const txDate = typeof t.date === 'string' ? t.date : todayStr;
    const isCurrentMonth = txDate.startsWith(currentYearMonth);

    if (isIncome) {
      totalInflow += amt;
      if (isCurrentMonth) {
        monthlyAllowance += amt;
      }
    } else {
      totalOutflow += amt;
      if (isCurrentMonth) {
        monthlySpent += amt;
      }

      if (txDate === todayStr) {
        todaySpent += amt;
      }

      const weekDay = weeklyDayMap.get(txDate);
      if (weekDay) {
        weekDay.spent = Number((weekDay.spent + amt).toFixed(2));
        weekSpent += amt;
      }

      if (t.project_id) {
        projectSpendTotal += amt;
      }

      const catName = t.category?.name || 'Personal & Misc';
      const catColor = t.category?.color || '#a855f7';
      const existing = categoryMap.get(catName);
      if (existing) {
        existing.value += amt;
        existing.count += 1;
      } else {
        categoryMap.set(catName, { value: amt, color: catColor, count: 1 });
      }
    }
  }

  if (monthlyAllowance === 0) {
    if (profileTarget > 0) {
      monthlyAllowance = profileTarget;
    } else if (totalInflow > 0) {
      monthlyAllowance = totalInflow;
    } else {
      monthlyAllowance = 15000.00;
    }
  }

  if (monthlySpent === 0 && totalOutflow > 0) {
    monthlySpent = totalOutflow;
  }

  const remainingAllowance = Number((monthlyAllowance - monthlySpent).toFixed(2));
  const allowanceUsagePercent =
    monthlyAllowance > 0
      ? Math.min(100, Math.round((monthlySpent / monthlyAllowance) * 100))
      : monthlySpent > 0
      ? 100
      : 0;

  const safeDaysLeft = Math.max(1, daysLeftInMonth);
  const safeDailyBudget =
    remainingAllowance > 0
      ? Number((remainingAllowance / safeDaysLeft).toFixed(2))
      : 0;

  const categoryBreakdown: CategoryBreakdownItem[] = Array.from(categoryMap.entries())
    .map(([name, data]) => ({
      name,
      value: Number(data.value.toFixed(2)),
      color: data.color,
      count: data.count,
      percentage: monthlySpent > 0 ? Math.round((data.value / monthlySpent) * 100) : 0,
    }))
    .sort((a, b) => b.value - a.value);

  const netCashflow = Number((totalInflow - totalOutflow).toFixed(2));

  const cashflowComparison = [
    { name: 'Pocket Money (In)', amount: Number(monthlyAllowance.toFixed(2)), fill: '#10b981' },
    { name: 'Spent (Out)', amount: Number(monthlySpent.toFixed(2)), fill: '#f43f5e' },
  ];

  return {
    currentDate: todayStr,
    currencySymbol,
    monthlyAllowance: Number(monthlyAllowance.toFixed(2)),
    monthlySpent: Number(monthlySpent.toFixed(2)),
    remainingAllowance,
    allowanceUsagePercent,
    todaySpent: Number(todaySpent.toFixed(2)),
    safeDailyBudget,
    daysLeftInMonth: safeDaysLeft,
    weekSpent: Number(weekSpent.toFixed(2)),
    weeklyDays,
    categoryBreakdown,
    projectSpendTotal: Number(projectSpendTotal.toFixed(2)),
    totalInflow: Number(totalInflow.toFixed(2)),
    totalOutflow: Number(totalOutflow.toFixed(2)),
    netCashflow,
    cashflowComparison,
  };
}
