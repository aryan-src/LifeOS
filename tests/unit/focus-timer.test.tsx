import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { FocusTimer } from '@/components/focus/focus-timer';
import { logFocusSession, startTaskFocus } from '@/lib/actions/tasks';

describe('Scandinavian Minimal Zen Focus Timer Component', () => {
  it('renders initial Zen & Flow State UI matching the prototype', () => {
    const html = renderToString(<FocusTimer />);

    // Header Zen flow status and ambient sound
    expect(html).toContain('Deep Flow');
    expect(html).toContain('Forest Rain');

    // Telemetry metric strip
    expect(html).toContain('Focus Goal');
    expect(html).toContain('Flow Index');
    expect(html).toContain('94%');
    expect(html).toContain('Peak flow');

    // Serene centerpiece circular progress and display
    expect(html).toContain('Stay Present');
    expect(html).toContain('25:00');
    expect(html).toContain('Ready · 0% completed');
    expect(html).toContain('zen-progress-ring');
    expect(html).toContain('stroke-dasharray="653.45"');

    // Action button with Focus label
    expect(html).toContain('Focus');

    // Preset options
    expect(html).toContain('15m');
    expect(html).toContain('25m');
    expect(html).toContain('50m');
    expect(html).toContain('5m Rest');
    expect(html).toContain('15m Long');
    expect(html).toContain('Custom flow duration');

    // Notion-style task callout footer
    expect(html).toContain('Current Page');
    expect(html).toContain('🍅 2/4 Pomos');

    // Keyboard shortcut hints
    expect(html).toContain('Space');
    expect(html).toContain('M');
    expect(html).toContain('R');
  });

  it('contains accessible ARIA role and label', () => {
    const html = renderToString(<FocusTimer />);
    expect(html).toContain('role="region"');
    expect(html).toContain('aria-label="Pomodoro Focus Timer"');
  });

  it('renders completion finish estimate readout', () => {
    const html = renderToString(<FocusTimer />);
    expect(html).toContain('Finishes at');
    expect(html).toContain('0m elapsed');
  });

  it('renders bound task title when tasks and boundTaskId are provided', () => {
    const html = renderToString(
      <FocusTimer
        tasks={[{ id: 't-100', title: 'Scandinavian Minimal Architecture Spec' }]}
        boundTaskId="t-100"
      />
    );
    expect(html).toContain('Scandinavian Minimal Architecture Spec');
  });

  describe('Focus Telemetry & Task Data Access Layer', () => {
    it('provides startTaskFocus helper in tasks action module', () => {
      expect(typeof startTaskFocus).toBe('function');
    });

    it('rejects partial focus sessions under 1 minute without database writes', async () => {
      const res = await logFocusSession({ durationMinutes: 0 });
      expect(res.success).toBe(false);
      expect(res.error).toBe('Session under 1m not logged');
    });
  });
});
