import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { StreakMilestonesModal } from '../../src/components/dashboard/stats-row/streak-milestones-modal';
import type { StreakState } from '../../src/lib/daily-loop/types';

const unlockedStreak: StreakState = {
  currentStreak: 12,
  bestStreak: 14,
  freezesEarnedTotal: 2,
  freezesUsedTotal: 0,
  freezesLeft: 2,
  isTodayQualified: true,
  nextMilestone: 30,
  streakPreview: { current: 12, next: 13, isPreviewActive: true },
  checklist: {
    hasFocusSession: true,
    hasHabitCompleted: true,
    hasExpenseLogged: false,
    completedCount: 2,
    totalRequired: 2,
    isQualified: true,
  },
  history: [],
};

describe('Stitch StreakMilestonesModal', () => {
  it('renders Playfair Display modal-hero heading, tabs, keepsake card, and real freeze count', () => {
    const html = renderToString(
      <StreakMilestonesModal
        open={true}
        onClose={() => undefined}
        streakState={unlockedStreak}
      />
    ).replace(/<!--.*?-->/g, '');

    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('font-serif text-modal-hero');
    expect(html).toContain('7 Days in Flow');
    expect(html).toContain('Milestone Unlocked');
    expect(html).toContain('7-Day Flow');
    expect(html).toContain('30-Day Shield');
    expect(html).toContain('100-Day Century');
    expect(html).toContain('2 / 2 freeze shields held');
    expect(html).toContain('Share keepsake');
    expect(html).not.toContain('italic');
  });

  it('renders locked state cleanly when streak is 0', () => {
    const html = renderToString(
      <StreakMilestonesModal
        open={true}
        onClose={() => undefined}
        streakState={{ ...unlockedStreak, currentStreak: 0, bestStreak: 0, freezesLeft: 0 }}
      />
    ).replace(/<!--.*?-->/g, '');

    expect(html).toContain('7 days to unlock');
    expect(html).toContain('0 / 2 freeze shields held');
  });
});
