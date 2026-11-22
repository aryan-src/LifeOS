import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { computeExpensesSummary } from '@/lib/finances/derived';
import { computeBudgetUtilization } from '@/lib/daily-loop/dashboard-derived';
import { computeFinancialAnalytics } from '@/lib/finances/compute';
import { getFallbackFinancialAnalytics } from '@/lib/finances/defaults';
import { PocketLedgerCard } from '@/components/dashboard/stats-row/pocket-ledger-card';
import { ExpensesSummaryRow } from '@/components/finances/expenses-summary-row';
import { ExpensesPaceChart } from '@/components/finances/expenses-pace-chart';
import { DashboardExpensesCard } from '@/components/dashboard/dashboard-expenses-card';

describe('Zero-Limit State & Math Guards (Clean New User)', () => {
  describe('computeExpensesSummary math safety', () => {
    it('returns zero and calm status when monthlyLimit is 0', () => {
      const summary = computeExpensesSummary({
        totalSpent: 0,
        monthlyLimit: 0,
        currentDate: '2026-11-22',
        weeklyDays: [],
      });

      expect(Number.isFinite(summary.percentUtilized)).toBe(true);
      expect(Number.isNaN(summary.percentUtilized)).toBe(false);
      expect(summary.percentUtilized).toBe(0);

      expect(Number.isFinite(summary.safeDailyPace)).toBe(true);
      expect(Number.isNaN(summary.safeDailyPace)).toBe(false);
      expect(summary.safeDailyPace).toBe(0);

      expect(summary.remainingBalance).toBe(0);
      expect(summary.paceStatusText).toBe('No monthly limit set');
      expect(summary.barTone).toBe('secondary');
    });

    it('handles spend without limit without division by zero', () => {
      const summary = computeExpensesSummary({
        totalSpent: 250,
        monthlyLimit: 0,
        currentDate: '2026-11-22',
        weeklyDays: [{ date: '2026-11-22', dayLabel: 'Sun', spent: 250, isToday: true }],
      });

      expect(Number.isFinite(summary.percentUtilized)).toBe(true);
      expect(summary.percentUtilized).toBe(0);
      expect(summary.safeDailyPace).toBe(0);
      expect(summary.paceStatusText).toBe('No monthly limit set');
    });
  });

  describe('computeBudgetUtilization math safety', () => {
    it('returns 0% and 0 pace without NaN or Infinity when monthlyAllowance is 0', () => {
      const derived = computeBudgetUtilization(0, 0, '2026-11-22');

      expect(Number.isFinite(derived.percentUtilized)).toBe(true);
      expect(derived.percentUtilized).toBe(0);

      expect(Number.isFinite(derived.safeDailyPace)).toBe(true);
      expect(derived.safeDailyPace).toBe(0);

      expect(derived.remainingAmount).toBe(0);
      expect(derived.tone).toBe('secondary');
    });
  });

  describe('computeFinancialAnalytics with zero profile allowance', () => {
    it('does not default to 15000 and computes safe zero analytics', () => {
      const analytics = computeFinancialAnalytics([], 0, '₹');

      expect(analytics.monthlyAllowance).toBe(0);
      expect(analytics.remainingAllowance).toBe(0);
      expect(analytics.allowanceUsagePercent).toBe(0);
      expect(analytics.safeDailyBudget).toBe(0);
      expect(analytics.monthlySpent).toBe(0);
      expect(analytics.todaySpent).toBe(0);
      expect(analytics.categoryBreakdown).toEqual([]);

      expect(Number.isFinite(analytics.safeDailyBudget)).toBe(true);
      expect(Number.isNaN(analytics.safeDailyBudget)).toBe(false);
    });
  });

  describe('getFallbackFinancialAnalytics', () => {
    it('returns clean zero state without hardcoded 15000', () => {
      const fallback = getFallbackFinancialAnalytics();

      expect(fallback.monthlyAllowance).toBe(0);
      expect(fallback.remainingAllowance).toBe(0);
      expect(fallback.safeDailyBudget).toBe(0);
      expect(fallback.allowanceUsagePercent).toBe(0);
      expect(fallback.cashflowComparison[0].amount).toBe(0);
    });
  });

  describe('Component rendering for zero-limit empty states', () => {
    it('renders PocketLedgerCard calm prompt when monthlyAllowance is 0', () => {
      const html = renderToString(
        <PocketLedgerCard
          pocketLedger={{
            spentAmount: 0,
            monthlyAllowance: 0,
            remainingAllowance: 0,
            allowancePercent: 0,
            currentMonth: 'Nov',
          }}
          todayDateStr="2026-11-22"
        />
      );

      expect(html).toContain('Set your monthly limit');
      expect(html).toContain('Pace untracked');
      expect(html).not.toContain('NaN');
      expect(html).not.toContain('Infinity');
      expect(html).not.toContain('/day safe pace');
    });

    it('renders ExpensesSummaryRow empty card when monthlyLimit is 0 and hides 75% notch', () => {
      const summary = computeExpensesSummary({
        totalSpent: 0,
        monthlyLimit: 0,
        currentDate: '2026-11-22',
        weeklyDays: [],
      });

      const html = renderToString(
        <ExpensesSummaryRow summary={summary} currencySymbol="₹" />
      );

      expect(html).toContain('No monthly limit set');
      expect(html).toContain('Set your monthly limit');
      expect(html).not.toContain('75% Limit');
      expect(html).not.toContain('NaN');
      expect(html).not.toContain('Infinity');
    });

    it('renders ExpensesPaceChart with Pace untracked pill when safeDailyPace is 0', () => {
      const html = renderToString(
        <ExpensesPaceChart
          weeklyDays={[]}
          safeDailyPace={0}
          paceStatusText="No monthly limit set"
          currencySymbol="₹"
        />
      );

      expect(html).toContain('Pace untracked');
      expect(html).not.toContain('7 of 7 days below pace');
      expect(html).not.toContain('NaN');
      expect(html).not.toContain('Infinity');
    });

    it('renders DashboardExpensesCard clean empty state when no expenses or categories exist', () => {
      const html = renderToString(
        <DashboardExpensesCard
          financialAnalytics={getFallbackFinancialAnalytics()}
          currentMonth="Nov"
          onOpenQuickCapture={() => {}}
        />
      );

      expect(html).toContain('No expenses recorded this month');
      expect(html).toContain('Log first expense');
      expect(html).not.toContain('Books');
      expect(html).not.toContain('Cafe');
      expect(html).not.toContain('Transit');
    });
  });
});
