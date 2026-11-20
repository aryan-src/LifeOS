import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { ThemeModeSelector } from '../../src/components/settings/theme-mode-selector';

describe('Stitch ThemeModeSelector', () => {
  it('renders accessible radiogroup for Light, Dark, Monsoon Garden, and System themes with active selection', () => {
    const html = renderToString(
      <ThemeModeSelector value="dark" onChange={() => undefined} />
    );

    expect(html).toContain('role="radiogroup"');
    expect(html).toContain('Light');
    expect(html).toContain('Dark');
    expect(html).toContain('Monsoon Garden');
    expect(html).toContain('System');
    expect(html).toContain('aria-checked="true"');
    expect(html).toContain('Active');
    expect(html).not.toContain('italic');
  });

  it('normalizes legacy theme ids like tui to Dark', () => {
    const html = renderToString(
      <ThemeModeSelector value="tui" onChange={() => undefined} />
    );
    expect(html).toContain('aria-checked="true"');
  });

  it('renders Monsoon Garden as active when value is monsoon-garden', () => {
    const html = renderToString(
      <ThemeModeSelector value="monsoon-garden" onChange={() => undefined} />
    );
    expect(html).toContain('Monsoon Garden');
    expect(html).toContain('aria-checked="true"');
    expect(html).toContain('Active');
  });
});
