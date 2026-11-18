import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { ProgressBar, clampPercent } from '@/components/ui/progress-bar';

describe('Shared ProgressBar Primitive', () => {
  it('clamps percentage values cleanly between 0 and 100', () => {
    expect(clampPercent(-15)).toBe(0);
    expect(clampPercent(42.6)).toBe(43);
    expect(clampPercent(180)).toBe(100);
    expect(clampPercent(Number.NaN)).toBe(0);
  });

  it('renders accessible progressbar ARIA attributes and secondary green fill by default', () => {
    const html = renderToString(<ProgressBar value={68} label="Daily focus goal" />);
    expect(html).toContain('role="progressbar"');
    expect(html).toContain('aria-label="Daily focus goal"');
    expect(html).toContain('aria-valuenow="68"');
    expect(html).toContain('bg-secondary');
    expect(html).toContain('width:68%');
  });
});
