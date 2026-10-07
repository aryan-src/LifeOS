import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { Calendar } from '@/components/ui/calendar';

describe('OriginUI Calendar Component', () => {
  it('renders successfully without crashing', () => {
    const testDate = new Date(2026, 9, 7); // Oct 7, 2026
    const html = renderToString(
      <Calendar mode="single" selected={testDate} />
    );
    expect(html).toContain('rdp');
    expect(html).toContain('October');
  });
});
