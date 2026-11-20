import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { ThemePullCord } from '@/components/settings/theme-pull-cord';
import * as useThemeModule from '@/lib/theme/use-theme';

describe('ThemePullCord Component', () => {
  it('renders a 288 by 360 placeholder before hydration / during server rendering', () => {
    const html = renderToString(<ThemePullCord />);

    // Must be exactly 288px width and 360px height
    expect(html).toContain('width:288px');
    expect(html).toContain('height:360px');
    expect(html).toContain('aria-hidden="true"');
  });

  it('exports ThemePullCord as both named and default export', () => {
    expect(ThemePullCord).toBeDefined();
  });
});

