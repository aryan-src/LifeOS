import { describe, it, expect } from 'vitest';
import {
  formatMinutesCompact,
  computeFocusRemaining,
  computeCalibrationProgress,
  computeDaysLeftInMonth,
  computeBudgetUtilization,
  formatCalendarMetaFromDateString,
} from '../../src/lib/daily-loop/dashboard-derived';

describe('Dashboard Derived-Value Helpers', () => {
  it('formats minutes compactly and computes focus remaining accurately', () => {
    expect(formatMinutesCompact(0)).toBe('0m');
    expect(formatMinutesCompact(45)).toBe('45m');
    expect(formatMinutesCompact(120)).toBe('2h');
    expect(formatMinutesCompact(135)).toBe('2h 15m');

    expect(computeFocusRemaining(165, 240)).toEqual({
      remainingMinutes: 75,
      formattedRemaining: '1h 15m',
      isGoalMet: false,
    });
    expect(computeFocusRemaining(260, 240)).toEqual({
      remainingMinutes: 0,
      formattedRemaining: '0m',
      isGoalMet: true,
    });
  });

  it('computes 14-day focus calibration baseline progress', () => {
    const partial = computeCalibrationProgress(7, 14);
    expect(partial.percent).toBe(50);
    expect(partial.isCalibrated).toBe(false);
    expect(partial.label).toContain('7 of 14');

    const ready = computeCalibrationProgress(18, 14);
    expect(ready.percent).toBe(100);
    expect(ready.isCalibrated).toBe(true);
    expect(ready.label).toContain('18 days');
  });

  it('computes days left in month, safe daily pace, and budget utilization tone', () => {
    expect(computeDaysLeftInMonth('2026-11-21')).toBe(10); // Nov has 30 days, inclusive
    expect(computeDaysLeftInMonth('2026-11-30')).toBe(1);

    const healthy = computeBudgetUtilization(1000, 5000, '2026-11-21');
    expect(healthy.percentUtilized).toBe(20);
    expect(healthy.remainingAmount).toBe(4000);
    expect(healthy.safeDailyPace).toBe(400);
    expect(healthy.tone).toBe('secondary');

    const caution = computeBudgetUtilization(3750, 5000, '2026-11-21');
    expect(caution.tone).toBe('tertiary');

    const critical = computeBudgetUtilization(4800, 5000, '2026-11-21');
    expect(critical.tone).toBe('error');
  });

  it('derives real calendar weekday, date, and ISO week from date string', () => {
    const meta = formatCalendarMetaFromDateString('2026-11-18');
    expect(meta.dayName).toBe('Wednesday');
    expect(meta.dateFormatted).toBe('18 Nov');
    expect(meta.monthShort).toBe('Nov');
    expect(meta.weekNumber).toBe(47);
  });
});
