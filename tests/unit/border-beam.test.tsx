import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { BorderBeam } from '@/components/ui/border-beam';

describe('BorderBeam Component', () => {
  it('renders during SSR without hydration mismatch or exceptions', () => {
    const html = renderToString(<BorderBeam />);
    expect(html).toContain('pointer-events-none');
    expect(html).toContain('rounded-[inherit]');
    expect(html).toContain('-inset-px');
  });

  it('correctly sets custom sizes, colors, and border widths in CSS variables', () => {
    const html = renderToString(
      <BorderBeam
        size={200}
        borderWidth={2}
        colorFrom="rgba(16, 185, 129, 0.4)"
        colorTo="transparent"
      />
    );

    expect(html).toContain('--size:200px');
    expect(html).toContain('--border-width:2px');
    expect(html).toContain('--color-from:rgba(16, 185, 129, 0.4)');
    expect(html).toContain('--color-to:transparent');
  });

  it('includes cross-browser CSS mask properties for perimeter border clipping', () => {
    const html = renderToString(<BorderBeam />);
    expect(html).toContain('mask-composite:exclude');
    expect(html).toContain('-webkit-mask-composite:xor');
  });
});
