import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { SessionDoneView } from '../../src/components/focus/session-done-view';
import { FloatingTimerPill } from '../../src/components/focus/floating-timer-pill';
import { createInitialFocusTimerState } from '../../src/lib/daily-loop/focus-timer-engine';

describe('Stitch Session Complete Modal & Floating Timer HUD', () => {
  it('renders SessionDoneView with Playfair Display modal-hero heading, ARIA modal attributes, and secondary accent', () => {
    const html = renderToString(
      <SessionDoneView
        minutesAdded={25}
        taskTitle="Linear Algebra Problem Set"
        endedWhileAway={false}
        finishedAtMs={null}
        userTimezone="UTC"
        hasUnsavedRetry={false}
        lastSaveStatus="saved"
        isSaving={false}
        onTakeBreak={() => {}}
        onStartAnother={() => {}}
        onDismiss={() => {}}
        onRetrySave={() => {}}
      />
    );

    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('font-serif text-modal-hero');
    expect(html).toContain('Session done');
    expect(html).toContain('bg-secondary');
    expect(html).toContain('aria-label="Close session summary"');
    expect(html).not.toContain('#0F4C42');
    expect(html).not.toContain('#F59E0B');
  });

  it('positions FloatingTimerPill 32px above the dock when visible and drops to bottom-5 when dock is hidden', () => {
    const base = createInitialFocusTimerState();

    const withDock = renderToString(
      <FloatingTimerPill
        timer={{ ...base, status: 'running', taskTitle: 'Deep Work' }}
        remainingSeconds={1200}
        isDockHidden={false}
        isSaving={false}
        onOpenFullscreen={() => {}}
        onPause={() => {}}
        onResume={() => {}}
        onDiscard={() => {}}
        onSkipBreak={() => {}}
        onRetrySave={() => {}}
      />
    );
    expect(withDock).toContain('data-dock-clearance="32px"');
    expect(withDock).toContain('bottom-[108px]');
    expect(withDock).toContain('data-purpose="timer-hud-controls"');
    expect(withDock).toContain('sm:group-hover:opacity-100');

    const withoutDock = renderToString(
      <FloatingTimerPill
        timer={{ ...base, status: 'running', taskTitle: 'Deep Work' }}
        remainingSeconds={1200}
        isDockHidden={true}
        isSaving={false}
        onOpenFullscreen={() => {}}
        onPause={() => {}}
        onResume={() => {}}
        onDiscard={() => {}}
        onSkipBreak={() => {}}
        onRetrySave={() => {}}
      />
    );
    expect(withoutDock).toContain('bottom-5');
    expect(withoutDock).not.toContain('bottom-[108px]');
  });
});
