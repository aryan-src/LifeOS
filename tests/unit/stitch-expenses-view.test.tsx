import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { ExpensesSummaryRow } from '../../src/components/finances/expenses-summary-row';
import { ExpensesPaceChart } from '../../src/components/finances/expenses-pace-chart';
import { computeExpensesSummary } from '../../src/lib/finances/derived';

describe('Stitch Expenses Summary & Pace Chart', () => {
  const weeklyDays = [
    { dayLabel: 'Thu', spent: 35 },
    { dayLabel: 'Fri', spent: 62 },
    { dayLabel: 'Sat', spent: 42 },
    { dayLabel: 'Sun', spent: 28 },
    { dayLabel: 'Mon', spent: 45 },
    { dayLabel: 'Tue', spent: 30 },
    { dayLabel: 'Wed', spent: 40, isToday: true },
  ];

  const summary = computeExpensesSummary({
    totalSpent: 1840,
    monthlyLimit: 2500,
    currentDate: '2026-11-17',
    weeklyDays,
  });

  it('renders ExpensesSummaryRow with utilization %, remaining balance, safe daily pace, and 75% limit notch', () => {
    const html = renderToString(
      <ExpensesSummaryRow summary={summary} currencySymbol="₹" />
    );

    expect(html).toContain('Spent');
    expect(html).toContain('73.6% utilized');
    expect(html).toContain('Left');
    expect(html).toContain('14 days left');
    expect(html).toContain('Safe pace');
    expect(html).toContain('47');
    expect(html).toContain('75% Limit');
    expect(html).not.toContain('#f59e0b');
    expect(html).not.toContain('italic');
  });

  it('renders ExpensesPaceChart with derived X of 7 days below pace badge and calm empty state', () => {
    const html = renderToString(
      <ExpensesPaceChart
        weeklyDays={weeklyDays}
        safeDailyPace={summary.safeDailyPace}
        paceStatusText={summary.paceStatusText}
        currencySymbol="₹"
      />
    ).replace(/<!--.*?-->/g, '');

    expect(html).toContain('Daily spending');
    expect(html).toContain('6 of 7 days below pace');
    expect(html).toContain('47 safe pace');
    expect(html).toContain('Today');

    const emptyHtml = renderToString(
      <ExpensesPaceChart
        weeklyDays={[]}
        safeDailyPace={0}
        paceStatusText="0 of 7 days below pace"
        currencySymbol="₹"
      />
    );
    expect(emptyHtml).toContain('No 7-day spending history yet');
  });
});
