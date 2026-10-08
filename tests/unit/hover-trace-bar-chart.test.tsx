import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import {
  HoverTraceBarChart,
  type HoverTraceBarItem,
} from '@/components/ui/hover-trace-bar-chart';

describe('HoverTraceBarChart Component', () => {
  const mockWeeklyData: HoverTraceBarItem[] = [
    { day: 'Fri', date: '2026-10-02', amount: 0, isToday: false },
    { day: 'Sat', date: '2026-10-03', amount: 0, isToday: false },
    { day: 'Sun', date: '2026-10-04', amount: 0, isToday: false },
    { day: 'Mon', date: '2026-10-05', amount: 135, isToday: false },
    { day: 'Tue', date: '2026-10-06', amount: 50, isToday: false },
    { day: 'Wed', date: '2026-10-07', amount: 601, isToday: false },
    { day: 'Thu', date: '2026-10-08', amount: 0, isToday: true },
  ];

  it('renders header, subtext, and legend indicator correctly', () => {
    const html = renderToString(
      <HoverTraceBarChart
        data={mockWeeklyData}
        currencySymbol="₹"
        headerTitle="7-Day Spending Pattern"
        headerSubtitle="Daily disbursements vs safe ceiling"
        legendLabel="Recorded Expense"
      />
    );

    expect(html).toContain('7-Day Spending Pattern');
    expect(html).toContain('Daily disbursements vs safe ceiling');
    expect(html).toContain('Recorded Expense');
  });

  it('renders benchmark alert banner with formatted INR safe budget', () => {
    const rawHtml = renderToString(
      <HoverTraceBarChart
        data={mockWeeklyData}
        currencySymbol="₹"
        safeDailyBudget={175.58}
        showBenchmarkBanner={true}
        benchmarkText="Staying strictly within daily pace"
      />
    );

    const cleanHtml = rawHtml.replace(/<!--.*?-->/g, '');
    expect(cleanHtml).toContain('Staying strictly within daily pace');
    expect(cleanHtml).toContain('~₹175.58 safe daily budget');
  });

  it('maps 7-day data with active amounts and container rounded-3xl styling', () => {
    const rawHtml = renderToString(
      <HoverTraceBarChart
        data={mockWeeklyData}
        currencySymbol="₹"
      />
    );

    const cleanHtml = rawHtml.replace(/<!--.*?-->/g, '');
    expect(cleanHtml).toContain('₹135');
    expect(cleanHtml).toContain('₹50');
    expect(cleanHtml).toContain('₹601');
    expect(cleanHtml).toContain('rounded-3xl');
  });
});
