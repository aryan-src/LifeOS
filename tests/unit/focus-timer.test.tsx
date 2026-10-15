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

  it('renders progress bar with custom Notion cream track and deep forest sage fill', () => {
    const html = renderToString(<FocusTimer />);
    expect(html).toContain('bg-[#F4ECE3]');
    expect(html).toContain('bg-[#2D6A4F]');
  });

  it('renders muted sage green status badge for Focus Mode', () => {
    const html = renderToString(<FocusTimer />);
    expect(html).toContain('bg-[#CBEBD6]');
    expect(html).toContain('text-[#2A6041]');
  });

  it('renders squircle main action button with accessible title', () => {
    const html = renderToString(<FocusTimer />);
    expect(html).toContain('rounded-2xl');
    expect(html).toContain('Start Focus Timer (Space)');
  });
});
