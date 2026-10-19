import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { LedgerTable, getCategoryBadge } from '@/components/finances/ledger-table';
import type { TransactionWithRelations } from '@/lib/actions/finances';

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
    console.log('HTML CONTENT:', html); expect(html).toContain('Noodles');
    expect(html).toContain('Junk Food');
    expect(html).toContain('-₹167.00');

    expect(html).toContain('Cold Coffee');
    expect(html).toContain('Juice');
    expect(html).toContain('-₹40.00');

    // Tabular nums & font styling
    expect(html).toContain('tabular-nums');
  });

  it('renders the 4-card KPI strip with metrics', () => {
    const html = renderToString(
      <LedgerTable
        transactions={mockTransactions}
        onDelete={vi.fn().mockResolvedValue({ success: true })}
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
});
