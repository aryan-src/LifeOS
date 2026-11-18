import { describe, it, expect } from 'vitest';
import {
  computeExpensesSummary,
  formatMonthHeading,
  getSemanticCategoryColor,
} from '../../src/lib/finances/derived';

describe('Expenses Derived Helpers', () => {
  it('computes safe daily pace, % utilized, days left, and X of 7 days below pace', () => {
    const summary = computeExpensesSummary({
      totalSpent: 1840,
      monthlyLimit: 2500,
      currentDate: '2026-11-17', // 14 days left in Nov (17..30 inclusive)
      weeklyDays: [
        { dayLabel: 'Thu', spent: 35 },
        { dayLabel: 'Fri', spent: 62 },
        { dayLabel: 'Sat', spent: 42 },
        { dayLabel: 'Sun', spent: 28 },
        { dayLabel: 'Mon', spent: 45 },
        { dayLabel: 'Tue', spent: 30 },
        { dayLabel: 'Wed', spent: 40, isToday: true },
      ],
    });

    expect(summary.remainingBalance).toBe(660);
    expect(summary.percentUtilized).toBe(73.6);
    expect(summary.daysLeft).toBe(14);
    expect(summary.safeDailyPace).toBe(47); // floor(660 / 14)
    expect(summary.daysBelowPaceCount).toBe(6);
    expect(summary.paceStatusText).toBe('6 of 7 days below pace');
    expect(summary.barTone).toBe('secondary');
  });

  it('uses semantic CSS variable colors with no hardcoded #f59e0b', () => {
    for (let i = 0; i < 6; i++) {
      const color = getSemanticCategoryColor(i);
      expect(color).toContain('var(--color-');
      expect(color.toLowerCase()).not.toContain('f59e0b');
    }
  });

  it('formats dynamic month heading from ISO date string', () => {
    expect(formatMonthHeading('2026-11-18')).toBe('November 2026');
  });
});
