import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { WhereDidMoneyGoCard } from '@/components/finances/where-did-money-go-card';

describe('WhereDidMoneyGoCard Component', () => {
  it('renders a calm empty state without fabricated amounts when no breakdown is provided', () => {
    const rawHtml = renderToString(
      <WhereDidMoneyGoCard
        currencySymbol="₹"
        subtitle="Categorical outflow breakdown"
      />
    );
    const cleanHtml = rawHtml.replace(/<!--.*?-->/g, '');

    expect(cleanHtml).toContain('Where Did Money Go?');
    expect(cleanHtml).toContain('No categorical outflows yet');
    expect(cleanHtml).not.toContain('3,788.00');
    expect(cleanHtml).not.toContain('Discipline Index');
    expect(cleanHtml).not.toContain('#f59e0b');
    expect(cleanHtml).not.toContain('italic');
  });

  it('correctly maps real category breakdown and replaces banned hex colors with semantic tokens', () => {
    const customBreakdown = [
      { name: 'Books & Supplies', value: 1200, percentage: 60, color: '#0f4c42' },
      { name: 'Meals', value: 800, percentage: 40, color: '#f59e0b' },
    ];

    const rawHtml = renderToString(
      <WhereDidMoneyGoCard
        currencySymbol="₹"
        totalSpent={2000}
        categoryBreakdown={customBreakdown}
      />
    );
    const cleanHtml = rawHtml.replace(/<!--.*?-->/g, '');

    expect(cleanHtml).toContain('100% Accounted');
    expect(cleanHtml).toContain('₹2,000.00 spent');
    expect(cleanHtml).toContain('2 Categories active');
    expect(cleanHtml).toContain('Books &amp; Supplies');
    expect(cleanHtml).toContain('60%');
    expect(cleanHtml).toContain('₹1,200.00');
    expect(cleanHtml).toContain('Meals');
    expect(cleanHtml).toContain('40%');
    expect(cleanHtml).toContain('₹800.00');
    expect(cleanHtml).not.toContain('#f59e0b');
    expect(cleanHtml).not.toContain('#0f4c42');
    expect(cleanHtml).toContain('var(--color-');
  });
});
