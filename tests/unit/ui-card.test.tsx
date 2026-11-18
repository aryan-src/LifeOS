import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { Card } from '@/components/ui/card';

describe('Shared Card Primitive', () => {
  it('renders lowest surface container and hairline border by default', () => {
    const html = renderToString(<Card>Hello Card</Card>);
    expect(html).toContain('bg-surface-container-lowest');
    expect(html).toContain('border-outline-variant/40');
    expect(html).toContain('Hello Card');
  });

  it('supports semantic section tag, low surface, and interactive styling', () => {
    const html = renderToString(
      <Card as="section" surface="low" padding="sm" interactive aria-label="Summary">
        Body
      </Card>
    );
    expect(html).toContain('<section');
    expect(html).toContain('bg-surface-container-low');
    expect(html).toContain('p-4');
    expect(html).toContain('cursor-pointer');
    expect(html).toContain('aria-label="Summary"');
  });
});
