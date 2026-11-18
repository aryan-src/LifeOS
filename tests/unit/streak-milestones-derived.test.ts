import { describe, it, expect } from 'vitest';
import { deriveStreakMilestones } from '../../src/lib/daily-loop/streak-milestones';

describe('Streak Milestones Derived Helper', () => {
  it('marks all milestones locked with exact days remaining when streak is 0', () => {
    const res = deriveStreakMilestones({
      currentStreak: 0,
      bestStreak: 0,
      freezesLeft: 0,
    });

    expect(res.defaultKey).toBe('7d');
    expect(res.milestones.every((m) => !m.isUnlocked)).toBe(true);
    expect(res.milestones[0].daysRemaining).toBe(7);
    expect(res.milestones[0].progressPercent).toBe(0);
  });

  it('unlocks 7d and 30d milestones when bestStreak is 34 and selects 30d as default', () => {
    const res = deriveStreakMilestones({
      currentStreak: 12,
      bestStreak: 34,
      freezesLeft: 2,
    });

    expect(res.defaultKey).toBe('30d');
    expect(res.milestones[0].isUnlocked).toBe(true);
    expect(res.milestones[1].isUnlocked).toBe(true);
    expect(res.milestones[2].isUnlocked).toBe(false);
    expect(res.milestones[2].daysRemaining).toBe(66);
    expect(res.milestones[2].progressPercent).toBe(34);
  });
});
