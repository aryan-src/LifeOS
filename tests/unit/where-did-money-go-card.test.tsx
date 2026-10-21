import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { WhereDidMoneyGoCard } from '@/components/finances/where-did-money-go-card';

describe('WhereDidMoneyGoCard Component', () => {
  it('renders header, subtext, and 100% Accounted badge correctly', () => {
    const html = renderToString(
      <WhereDidMoneyGoCard
        currencySymbol="₹"
        subtitle="October categorical outflow"
      />
    );

    expect(html).toContain('Where Did Money Go?');
    expect(html).toContain('October categorical outflow');
    expect(html).toContain('100% Accounted');
  });

  it('renders default Stitch breakdown, amounts, active categories, and progress bar', () => {
    const rawHtml = renderToString(
      <WhereDidMoneyGoCard
        currencySymbol="₹"
      />
    );

    const cleanHtml = rawHtml.replace(/<!--.*?-->/g, '');
    expect(cleanHtml).toContain('₹3,788.00 spent');
    expect(cleanHtml).toContain('7 Categories active');
    expect(cleanHtml).toContain('Grocery');
    expect(cleanHtml).toContain('56%');
    expect(cleanHtml).toContain('₹2,108.00');
    expect(cleanHtml).toContain('Commute');
    expect(cleanHtml).toContain('15%');
    expect(cleanHtml).toContain('₹577.00');
    expect(cleanHtml).toContain('Juice');
    expect(cleanHtml).toContain('12%');
    expect(cleanHtml).toContain('₹450.00');
    expect(cleanHtml).toContain('Junk Food');
    expect(cleanHtml).toContain('9%');
    expect(cleanHtml).toContain('₹332.00');
  });

  it('renders anchored bottom footer with emergency debits and Discipline Index', () => {
    const rawHtml = renderToString(
      <WhereDidMoneyGoCard
        currencySymbol="₹"
      />
    );

    const cleanHtml = rawHtml.replace(/<!--.*?-->/g, '');
    expect(cleanHtml).toContain('Zero emergency debits logged');
    expect(cleanHtml).toContain('Discipline Index: 98/100');
  });

  it('applies the exact card shell container classes for grid alignment', () => {
    const rawHtml = renderToString(
      <WhereDidMoneyGoCard
        currencySymbol="₹"
      />
    );

    const cleanHtml = rawHtml.replace(/<!--.*?-->/g, '');
    expect(cleanHtml).toContain('h-full flex flex-col justify-between rounded-2xl border border-stone-200/80 bg-white/90 p-6 shadow-xs dark:bg-zinc-900/60 dark:border-zinc-800/80');
    expect(cleanHtml).toContain('flex-1 flex flex-col justify-between');
  });

  it('correctly maps custom category breakdown when provided', () => {
    const customBreakdown = [
      { name: 'Books & Supplies', value: 1200, percentage: 60, color: '#059669' },
      { name: 'Meals', value: 800, percentage: 40, color: '#3b82f6' },
    ];

    const rawHtml = renderToString(
      <WhereDidMoneyGoCard
        currencySymbol="₹"
        totalSpent={2000}
        categoryBreakdown={customBreakdown}
      />
    );

    const cleanHtml = rawHtml.replace(/<!--.*?-->/g, '');
    expect(cleanHtml).toContain('₹2,000.00 spent');
    expect(cleanHtml).toContain('2 Categories active');
    expect(cleanHtml).toContain('Books &amp; Supplies');
    expect(cleanHtml).toContain('60%');
    expect(cleanHtml).toContain('₹1,200.00');
    expect(cleanHtml).toContain('Meals');
    expect(cleanHtml).toContain('40%');
    expect(cleanHtml).toContain('₹800.00');
  });
});
