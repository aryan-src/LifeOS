import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { FocusTimer } from '@/components/tasks/focus-timer';

describe('FocusTimer Component', () => {
  it('renders initial state matching the static Notion-style mockup', () => {
    const html = renderToString(<FocusTimer />);
    
    // Header & badge
    expect(html).toContain('DEEP WORK SPRINT');
    expect(html).toContain('Focus Mode');
    
    // Default 25:00 Pomodoro interval
    expect(html).toContain('25:00');
    expect(html).toContain('Session: Pomodoro Standard');
    
    // Flat progress bar track and initial 0% progress
    expect(html).toContain('style="width:0%"');

    // Action button with timer icon
    expect(html).toContain('timer');
  });

  it('includes standard interval mode selectors (25m Focus, 5m Break, 15m Rest)', () => {
    const html = renderToString(<FocusTimer />);
    expect(html).toContain('25m Focus');
    expect(html).toContain('5m Break');
    expect(html).toContain('15m Rest');
  });

  it('contains accessible ARIA role and label', () => {
    const html = renderToString(<FocusTimer />);
    expect(html).toContain('role="region"');
    expect(html).toContain('aria-label="Pomodoro Focus Timer"');
  });
});
