import { describe, it, expect } from 'vitest';
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

  it('contains accessible ARIA role and label', () => {
    const html = renderToString(<FocusTimer />);
    expect(html).toContain('role="region"');
    expect(html).toContain('aria-label="Pomodoro Focus Timer"');
  });

  it('renders progress bar with custom Notion cream track', () => {
    const html = renderToString(<FocusTimer />);
    expect(html).toContain('bg-[#F4ECE3]');
    expect(html).toContain('bg-[#2D6A4F]');
  });
});
