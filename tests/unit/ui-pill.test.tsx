import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { Pill } from '@/components/ui/pill';

describe('Shared Pill Primitive', () => {
  it('renders mono tabular pill with secondary tone and indicator dot', () => {
    const html = renderToString(
      <Pill tone="secondary" dot uppercase>
        12D Streak
      </Pill>
    );
    expect(html).toContain('text-secondary');
    expect(html).toContain('bg-secondary');
    expect(html).toContain('uppercase');
    expect(html).toContain('font-mono');
    expect(html).toContain('12D Streak');
  });

  it('defaults to neutral surface-container-high styling without italics', () => {
    const html = renderToString(<Pill>Active</Pill>);
    expect(html).toContain('bg-surface-container-high');
    expect(html).not.toContain('italic');
  });
});
