import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import ErrorBoundary from '@/app/error';
import { getFallbackFinancialAnalytics } from '@/lib/finances/defaults';

describe('LifeOS Error Boundary and Fallbacks', () => {
  it('renders Notion-style fallback UI with error digest', () => {
    const mockError = new Error('Database connection terminated');
    (mockError as any).digest = '1450126534';
    const mockReset = vi.fn();

    const html = renderToString(<ErrorBoundary error={mockError} reset={mockReset} />);

    expect(html).toContain('Unable to render workspace view');
    expect(html).toContain('1450126534');
    expect(html).toContain('Try Again');
    expect(html).toContain('Reload Page');
    expect(html).toContain('Dashboard');
  });

  it('provides safe fallback financial analytics structure', () => {
    const fallback = getFallbackFinancialAnalytics();
    expect(fallback.currencySymbol).toBe('₹');
    expect(fallback.monthlyAllowance).toBeGreaterThan(0);
    expect(fallback.safeDailyBudget).toBeGreaterThanOrEqual(0);
    expect(fallback.remainingAllowance).toBeGreaterThan(0);
    expect(Array.isArray(fallback.weeklyDays)).toBe(true);
    expect(Array.isArray(fallback.categoryBreakdown)).toBe(true);
  });
});
