import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { AttentionalDistributionCard } from '@/components/focus/focus-history/attentional-distribution-card';
import type { FocusHistorySummary } from '@/lib/daily-loop/focus-history-derived';

function makeMockSummary(goalMinutes: number, todayMinutes: number | null = 60): FocusHistorySummary {
  return {
    goalMinutes,
    todayFormatted: '1h 0m',
    todayGoalFormatted: `${Math.round(goalMinutes / 60)}h goal`,
    todayPercent: Math.round(((todayMinutes ?? 0) / goalMinutes) * 100),
    totalMinutesLogged: 300,
    totalFormatted: '5h',
    totalSessions: 5,
    averageSessionMinutes: 60,
    qualifiedDaysThisWeek: 3,
    calibration: { daysTracked: 10, targetDays: 14, percent: 71, isCalibrated: false },
    peakWindowText: 'Peak focus window around 10:00 AM',
    weekLabel: 'Week 47 · 2026',
    weeklyBars: [
      { date: '2026-11-16', dayLabel: 'M', minutes: null, percentOfGoal: 60, isToday: false, isQualified: true, isFuture: false },
      { date: '2026-11-17', dayLabel: 'T', minutes: null, percentOfGoal: 60, isToday: false, isQualified: true, isFuture: false },
      { date: '2026-11-18', dayLabel: 'W', minutes: todayMinutes, percentOfGoal: 50, isToday: true, isQualified: true, isFuture: false },
      { date: '2026-11-19', dayLabel: 'T', minutes: null, percentOfGoal: 0, isToday: false, isQualified: false, isFuture: true },
      { date: '2026-11-20', dayLabel: 'F', minutes: null, percentOfGoal: 0, isToday: false, isQualified: false, isFuture: true },
      { date: '2026-11-21', dayLabel: 'S', minutes: null, percentOfGoal: 0, isToday: false, isQualified: false, isFuture: true },
      { date: '2026-11-22', dayLabel: 'S', minutes: null, percentOfGoal: 0, isToday: false, isQualified: false, isFuture: true },
    ],
  };
}

describe('Focus History Chart Adaptive Scaling', () => {
  it('correctly adapts scale for a 2h goal (120m) so goal line is at 80% (120 / 150)', () => {
    const summary = makeMockSummary(120, 60);
    const html = renderToString(<AttentionalDistributionCard summary={summary} />).replace(
      /<!--.*?-->/g,
      ''
    );

    expect(html).toContain('Daily goal (120m)');
    expect(html).toContain('Goal: 120m');
    expect(html).toContain('60m'); // Mid-marker line
    expect(html).toContain('style="bottom:80%"'); // 120 / 150 = 80%
    expect(html).toContain('style="bottom:40%"'); // 60 / 150 = 40%
  });

  it('correctly adapts scale for a 4h goal (240m) so goal line is at 80% (240 / 300)', () => {
    const summary = makeMockSummary(240, 180);
    const html = renderToString(<AttentionalDistributionCard summary={summary} />).replace(
      /<!--.*?-->/g,
      ''
    );

    expect(html).toContain('Daily goal (240m)');
    expect(html).toContain('Goal: 240m');
    expect(html).toContain('120m'); // Mid-marker line
    expect(html).toContain('style="bottom:80%"'); // 240 / 300 = 80%
    expect(html).toContain('style="bottom:40%"'); // 120 / 300 = 40%
  });

  it('correctly adapts scale for a 6h goal (360m) so goal line is at 80% (360 / 450)', () => {
    const summary = makeMockSummary(360, 240);
    const html = renderToString(<AttentionalDistributionCard summary={summary} />).replace(
      /<!--.*?-->/g,
      ''
    );

    expect(html).toContain('Daily goal (360m)');
    expect(html).toContain('Goal: 360m');
    expect(html).toContain('180m'); // Mid-marker line
    expect(html).toContain('style="bottom:80%"'); // 360 / 450 = 80%
    expect(html).toContain('style="bottom:40%"'); // 180 / 450 = 40%
  });

  it('adapts scale when tallest day exceeds goal x 1.25, keeping goal line inside chart', () => {
    // 2h goal (120m), but user focused 400m today!
    const summary = makeMockSummary(120, 400);
    const html = renderToString(<AttentionalDistributionCard summary={summary} />).replace(
      /<!--.*?-->/g,
      ''
    );

    expect(html).toContain('Daily goal (120m)');
    expect(html).toContain('Goal: 120m');
    // maxScale = Math.max(120 * 1.25, 400) = 400
    // goal line = (120 / 400) * 100 = 30%
    expect(html).toContain('style="bottom:30%"');
    // mid marker = 60m at (60 / 400) * 100 = 15%
    expect(html).toContain('style="bottom:15%"');
    // 400m bar height = (400 / 400) * 100 = 100%
    expect(html).toContain('style="height:100%"');
  });
});
