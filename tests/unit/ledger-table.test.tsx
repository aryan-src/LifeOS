import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { LedgerTable, getCategoryBadge, getPaginationPages } from '@/components/finances/ledger-table';
import { FinancesClientView } from '@/components/finances/finances-client-view';
import type { TransactionWithRelations, FinancialAnalytics } from '@/lib/actions/finances';

describe('LifeOSLedgerTable Component & Helpers', () => {
  const mockTransactions: TransactionWithRelations[] = [
    {
      id: 'tx-1',
      user_id: 'user-1',
      project_id: 'proj-1',
      category_id: 'cat-1',
      amount: -167,
      type: 'expense',
      description: 'Noodles',
      date: '2026-10-19',
      payee_or_source: 'Canteen',
      created_at: '2026-10-19T10:00:00Z',
      category: { id: 'cat-1', name: 'Junk Food', color: '#f97316' },
      project: { id: 'proj-1', title: 'College Outing', slug: 'college-outing' },
    },
    {
      id: 'tx-2',
      user_id: 'user-1',
      project_id: null,
      category_id: 'cat-2',
      amount: -40,
      type: 'expense',
      description: 'Cold Coffee',
      date: '2026-10-19',
      payee_or_source: null,
      created_at: '2026-10-19T11:00:00Z',
      category: { id: 'cat-2', name: 'Juice', color: '#eab308' },
      project: null,
    },
  ];

  it('correctly maps category styles and dots for Notion theme', () => {
    const junkBadge = getCategoryBadge('Junk Food');
    expect(junkBadge.pill).toContain('bg-rose-50');
    expect(junkBadge.dot).toContain('bg-rose-500');

    const juiceBadge = getCategoryBadge('Juice');
    expect(juiceBadge.pill).toContain('bg-amber-50');
    expect(juiceBadge.dot).toContain('bg-amber-500');

    const vegBadge = getCategoryBadge('Vegetable');
    expect(vegBadge.pill).toContain('bg-emerald-50');
    expect(vegBadge.dot).toContain('bg-emerald-500');

    const grocBadge = getCategoryBadge('Grocery');
    expect(grocBadge.pill).toContain('bg-teal-50');
    expect(grocBadge.dot).toContain('bg-teal-500');

    const commuteBadge = getCategoryBadge('Commute');
    expect(commuteBadge.pill).toContain('bg-sky-50');
    expect(commuteBadge.dot).toContain('bg-sky-500');
  });

  it('renders table headers and row items with decimal precision and tabular-nums', () => {
    const html = renderToString(
      <LedgerTable
        transactions={mockTransactions}
        onDelete={vi.fn().mockResolvedValue({ success: true })}
        onRecordExpense={vi.fn()}
      />
    );

    // Table headers
    expect(html).toContain('Date');
    expect(html).toContain('Description');
    expect(html).toContain('Category');
    expect(html).toContain('Project');
    expect(html).toContain('Amount');
    expect(html).toContain('Actions');

    // Content & Decimal Precision
    expect(html).toContain('Noodles');
    expect(html).toContain('Junk Food');
    expect(html).toContain('-₹167.00');

    expect(html).toContain('Cold Coffee');
    expect(html).toContain('Juice');
    expect(html).toContain('-₹40.00');

    // Tabular nums & font styling
    expect(html).toContain('tabular-nums');
  });

  it('renders the 4-card KPI strip with metrics when showKpiStrip is true', () => {
    const html = renderToString(
      <LedgerTable
        transactions={mockTransactions}
        onDelete={vi.fn().mockResolvedValue({ success: true })}
        showKpiStrip={true}
      />
    );

    expect(html).toContain('Total Spent');
    expect(html).toContain('Daily Average');
    expect(html).toContain('Top Outlay Category');
    expect(html).toContain('Monthly Budget Cap');

    // Sum of 167 + 40 = 207
    expect(html).toContain('-₹207.00');
    expect(html).toContain('Noodles');
  });

  it('hides the KPI strip when showKpiStrip is false', () => {
    const html = renderToString(
      <LedgerTable
        transactions={mockTransactions}
        onDelete={vi.fn().mockResolvedValue({ success: true })}
        showKpiStrip={false}
      />
    );

    expect(html).not.toContain('data-purpose="quick-metrics"');
    expect(html).not.toContain('Total Spent');
  });

  it('renders the search input and keyboard shortcut hint', () => {
    const html = renderToString(
      <LedgerTable
        transactions={mockTransactions}
        onDelete={vi.fn().mockResolvedValue({ success: true })}
      />
    );

    expect(html).toContain('table-search-input');
    expect(html).toContain('Filter description, category...');
    expect(html).toContain('⌘ + N');
    expect(html).toContain('Auto-synced');
  });

  it('renders the GlassPagination component with navigation controls', () => {
    const html = renderToString(
      <LedgerTable
        transactions={mockTransactions}
        onDelete={vi.fn().mockResolvedValue({ success: true })}
      />
    );

    expect(html).toContain('role="navigation"');
    expect(html).toContain('aria-label="pagination"');
    expect(html).toContain('aria-label="Go to previous page"');
    expect(html).toContain('aria-label="Go to next page"');
    expect(html).toContain('aria-current="page"');
  });

  describe('getPaginationPages Logic', () => {
    it('returns all pages when totalPages <= 5', () => {
      expect(getPaginationPages(1, 3)).toEqual([1, 2, 3]);
      expect(getPaginationPages(1, 5)).toEqual([1, 2, 3, 4, 5]);
      expect(getPaginationPages(3, 5)).toEqual([1, 2, 3, 4, 5]);
    });

    it('returns ellipsis at the end when on early pages and totalPages > 5', () => {
      expect(getPaginationPages(1, 8)).toEqual([1, 2, 3, 4, 'ellipsis-end', 8]);
      expect(getPaginationPages(2, 8)).toEqual([1, 2, 3, 4, 'ellipsis-end', 8]);
      expect(getPaginationPages(3, 8)).toEqual([1, 2, 3, 4, 'ellipsis-end', 8]);
    });

    it('returns ellipsis at the start when on late pages and totalPages > 5', () => {
      expect(getPaginationPages(8, 8)).toEqual([1, 'ellipsis-start', 5, 6, 7, 8]);
      expect(getPaginationPages(7, 8)).toEqual([1, 'ellipsis-start', 5, 6, 7, 8]);
      expect(getPaginationPages(6, 8)).toEqual([1, 'ellipsis-start', 5, 6, 7, 8]);
    });

    it('returns double ellipsis when in the middle of a large list', () => {
      expect(getPaginationPages(5, 10)).toEqual([1, 'ellipsis-start', 4, 5, 6, 'ellipsis-end', 10]);
    });
  });

  describe('Finances Toolbar & Chart Toggle Controls', () => {
    const mockAnalytics: FinancialAnalytics = {
      currentDate: '2026-10-19',
      currencySymbol: '₹',
      monthlyAllowance: 5000,
      monthlySpent: 207,
      remainingAllowance: 4793,
      allowanceUsagePercent: 4.14,
      todaySpent: 207,
      safeDailyBudget: 150,
      daysLeftInMonth: 12,
      weekSpent: 207,
      weeklyDays: [],
      categoryBreakdown: [
        { name: 'Junk Food', value: 167, count: 1, percentage: 80.7, color: '#f97316' },
        { name: 'Juice', value: 40, count: 1, percentage: 19.3, color: '#eab308' },
      ],
      projectSpendTotal: 0,
      totalInflow: 5000,
      totalOutflow: 207,
      netCashflow: 4793,
      cashflowComparison: [],
    };

    it('renders the cleaned header without Next.js Code or currency toggle', () => {
      const html = renderToString(
        <FinancesClientView
          initialTransactions={mockTransactions}
          analytics={mockAnalytics}
          categories={[]}
          projects={[]}
        />
      );

      // Verify removed header controls
      expect(html).not.toContain('Next.js Code');
      expect(html).not.toContain('INR (₹)');
      expect(html).not.toContain('INR');

      // Verify retained elements
      expect(html).toContain('LifeOS');
      expect(html).toContain('Personal Vault');
      expect(html).toContain('Ledger');
      expect(html).toContain('Hide Charts');

      // Verify main ledger table is rendered unconditionally
      expect(html).toContain('table-search-input');
      expect(html).toContain('Noodles');
    });
  });
});


