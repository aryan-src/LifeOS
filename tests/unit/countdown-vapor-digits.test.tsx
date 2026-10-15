import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { VaporCountdownDigits } from '@/components/ui/countdown-vapor-digits';

describe('VaporCountdownDigits Component', () => {
  it('renders standard 25:00 Pomodoro interval with proper screen-reader and dateTime attributes', () => {
    const html = renderToString(
      <VaporCountdownDigits minutes={25} seconds={0} isRunning={false} />
    );

    // Screen-reader text & aria-label
    expect(html).toContain('25:00');
    expect(html).toContain('dateTime="PT25M00S"');
    expect(html).toContain('aria-label="25 minutes and 0 seconds remaining"');

    // Canvas overlay exists
    expect(html).toContain('<canvas');
    expect(html).toContain('pointer-events-none');
  });

  it('formats short break 05:00 interval correctly', () => {
    const html = renderToString(
      <VaporCountdownDigits minutes={5} seconds={0} isRunning={true} />
    );

    expect(html).toContain('05:00');
    expect(html).toContain('dateTime="PT05M00S"');
    expect(html).toContain('aria-label="5 minutes and 0 seconds remaining"');
  });

  it('clamps bounds and formats edge case 00:00 correctly', () => {
    const html = renderToString(
      <VaporCountdownDigits minutes={0} seconds={0} isRunning={false} />
    );

    expect(html).toContain('00:00');
    expect(html).toContain('dateTime="PT00M00S"');
    expect(html).toContain('aria-label="0 minutes and 0 seconds remaining"');
  });
});
