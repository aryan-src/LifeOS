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

  it('maps 7-day data with active amounts and container rounded-2xl styling', () => {
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
    expect(cleanHtml).toContain('rounded-2xl');
  });

  it('renders single cleanly styled price indicator without duplicate overlay badges', () => {
    const rawHtml = renderToString(
      <HoverTraceBarChart
        currencySymbol="₹"
      />
    );

    const cleanHtml = rawHtml.replace(/<!--.*?-->/g, '');
    // Check for single clean amber amount badge styling
    expect(cleanHtml).toContain('text-xs font-mono font-medium mb-1.5 transition-transform duration-200 tabular-nums z-10 text-amber-800 dark:text-amber-300');
    expect(cleanHtml).toContain('₹327');
    // Ensure no secondary peak overlay duplicate badges exist in markup
    expect(cleanHtml).not.toContain('shadow-xs whitespace-nowrap group-hover:brightness-105');
  });

  it('renders dynamic reference line tracking active bar height with floating value label', () => {
    const rawHtml = renderToString(
      <HoverTraceBarChart
        data={mockWeeklyData}
        currencySymbol="₹"
      />
    );

    const cleanHtml = rawHtml.replace(/<!--.*?-->/g, '');
    expect(cleanHtml).toContain('recharts-reference-line');
  });

  it('calculates dynamic date range telemetry from date context', () => {
    const rawHtml = renderToString(
      <HoverTraceBarChart
        data={mockWeeklyData}
        currencySymbol="₹"
      />
    );

    const cleanHtml = rawHtml.replace(/<!--.*?-->/g, '');
    expect(cleanHtml).toContain('Oct 2 – Oct 8');
  });

  it('dynamically highlights the active day label', () => {
    const rawHtml = renderToString(
      <HoverTraceBarChart
        data={mockWeeklyData}
        currencySymbol="₹"
      />
    );

    const cleanHtml = rawHtml.replace(/<!--.*?-->/g, '');
    expect(cleanHtml).toContain('text-amber-700 font-bold dark:text-amber-400 tracking-wide');
    expect(cleanHtml).toContain('Thu');
  });

  it('dynamically aggregates expenses when transactions are provided', () => {
    const mockTx = [
      { date: '2026-10-21', amount: 250, type: 'expense' },
      { date: '2026-10-20', amount: 80, type: 'expense' },
    ];

    const rawHtml = renderToString(
      <HoverTraceBarChart
        transactions={mockTx}
        currencySymbol="₹"
      />
    );

    const cleanHtml = rawHtml.replace(/<!--.*?-->/g, '');
    expect(cleanHtml).toContain('₹250');
    expect(cleanHtml).toContain('₹80');
  });

  it('supports raw BarData array format and standalone mode without header', () => {
    const rawData = [
      { label: 'Mon', value: 120 },
      { label: 'Tue', value: 340 },
      { label: 'Wed', value: 200 },
    ];

    const rawHtml = renderToString(
      <HoverTraceBarChart
        data={rawData}
        showHeader={false}
        currencySymbol="₹"
      />
    );

    const cleanHtml = rawHtml.replace(/<!--.*?-->/g, '');
    expect(cleanHtml).toContain('Mon');
    expect(cleanHtml).toContain('Tue');
    expect(cleanHtml).toContain('Wed');
    expect(cleanHtml).not.toContain('7-Day Spending Pattern');
  });
});
