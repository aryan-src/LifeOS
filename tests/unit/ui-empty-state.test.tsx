import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { EmptyState } from '../../src/components/ui/empty-state';

describe('Shared EmptyState Primitive', () => {
  it('renders title, description, and optional action cleanly', () => {
    const html = renderToString(
      <EmptyState
        title="No focus sessions logged yet"
        description="Start a calm focus block from the Dashboard to begin building your history."
        action={<button type="button">Start focus</button>}
      />
    );

    expect(html).toContain('No focus sessions logged yet');
    expect(html).toContain('Start a calm focus block');
    expect(html).toContain('Start focus');
    expect(html).toContain('border-dashed');
    expect(html).not.toContain('italic');
  });
});
