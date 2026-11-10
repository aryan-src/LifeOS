import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { CalendarPopover } from '@/components/projects/calendar-popover';
import { CreateProjectModal } from '@/components/projects/create-project-modal';

// Mock server actions
vi.mock('@/lib/actions/projects', () => ({
  createProject: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('@/lib/actions/tasks', () => ({
  createTask: vi.fn().mockResolvedValue({ success: true }),
}));

describe('LifeOS Calendar Popover Component', () => {
  it('renders the isolated calendar card with exact data-purpose and styling', () => {
    const html = renderToString(
      <CalendarPopover
        selectedIsoDate="2026-11-10"
        onSelectDate={vi.fn()}
        onClear={vi.fn()}
      />
    );

    // Card Container
    expect(html).toContain('data-purpose="calendar-popover"');
    expect(html).toContain('w-[336px]');
    expect(html).toContain('bg-[#FAF9F5]');
    expect(html).toContain('rounded-2xl');
    expect(html).toContain('shadow-card');

    // Header Month Selector & Navigation Controls
    expect(html).toContain('November 2026');
    expect(html).toContain('aria-label="Previous month"');
    expect(html).toContain('aria-label="Next month"');

    // Day of Week Labels
    expect(html).toContain('>S</span>');
    expect(html).toContain('>M</span>');
    expect(html).toContain('>T</span>');
    expect(html).toContain('>W</span>');
    expect(html).toContain('>F</span>');

    // Calendar Date Grid
    expect(html).toContain('id="calendar-grid"');

    // Selected Day (10) Indicator with Emerald Dot
    expect(html).toContain('bg-stone-900');
    expect(html).toContain('scale-105');
    expect(html).toContain('ring-emerald-500/50');
    expect(html).toContain('bg-emerald-400');
    expect(html).toContain('>10</span>');

    // Popover Footer: Clear and Today Buttons
    expect(html).toContain('Clear');
    expect(html).toContain('Today');
    expect(html).toContain('text-emerald-700');
  });

  it('renders unselected days with default tactile styling', () => {
    const html = renderToString(
      <CalendarPopover
        selectedIsoDate="2026-11-10"
        onSelectDate={vi.fn()}
        onClear={vi.fn()}
      />
    );

    // Day 15 should be rendered as a regular button
    expect(html).toContain('>15</button>');
    expect(html).toContain('hover:bg-stone-200/60');
  });

  it('integrates CalendarPopover directly into CreateProjectModal target deadline section', () => {
    const html = renderToString(
      <CreateProjectModal
        isOpen={true}
        onClose={vi.fn()}
        defaultCalendarOpen={true}
      />
    );

    // Target Deadline Field
    expect(html).toContain('id="target-deadline"');
    expect(html).toContain('placeholder="dd/mm/yyyy"');

    // Calendar Popover rendered inside deadline container
    expect(html).toContain('data-purpose="calendar-popover"');
    expect(html).toContain('id="calendar-grid"');
    expect(html).toContain('Clear');
    expect(html).toContain('Today');
  });
});
