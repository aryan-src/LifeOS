import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { StatCard } from '../../src/components/ui/stat-card';

describe('Shared StatCard Primitive', () => {
  it('renders label, tabular numeric value, unit, badge, and progressbar', () => {
    const html = renderToString(
      <StatCard
        label="Focus Today"
        value="2h 15m"
        unit="logged"
        badge={{ text: 'ON TRACK', tone: 'secondary', dot: true }}
        progress={{ value: 75, tone: 'secondary' }}
        sublabel="45m left to daily goal"
      />
    );

    expect(html).toContain('Focus Today');
    expect(html).toContain('2h 15m');
    expect(html).toContain('logged');
    expect(html).toContain('ON TRACK');
    expect(html).toContain('role="progressbar"');
    expect(html).toContain('aria-valuenow="75"');
    expect(html).toContain('tabular-nums');
    expect(html).not.toContain('italic');
  });

  it('wraps card in a semantic button when interactive onClick is provided', () => {
    const html = renderToString(
      <StatCard
        label="Daily Streak"
        value={14}
        unit="days"
        onClick={() => undefined}
      />
    );

    expect(html).toContain('<button');
    expect(html).toContain('type="button"');
    expect(html).toContain('14');
  });
});
