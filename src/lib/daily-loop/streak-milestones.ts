import type { StreakState } from './types';

export type MilestoneKey = '7d' | '30d' | '100d';

export interface StreakMilestoneItem {
  key: MilestoneKey;
  tabLabel: string;
  title: string;
  description: string;
  targetDays: number;
  unitLabel: string;
  barSegments: number;
  filledSegments: number;
  isUnlocked: boolean;
  progressPercent: number;
  daysRemaining: number;
}

const MILESTONE_DEFINITIONS: Array<{
  key: MilestoneKey;
  tabLabel: string;
  title: string;
  description: string;
  targetDays: number;
  unitLabel: string;
  barSegments: number;
}> = [
  {
    key: '7d',
    tabLabel: '7-Day Flow',
    title: '7 Days in Flow',
    description: 'One full week of continuous momentum across study, habits, and focus.',
    targetDays: 7,
    unitLabel: 'day streak',
    barSegments: 7,
  },
  {
    key: '30d',
    tabLabel: '30-Day Shield',
    title: '30-Day Shield',
    description: 'A full month of steady daily execution and resilient rhythm.',
    targetDays: 30,
    unitLabel: 'day shield',
    barSegments: 6,
  },
  {
    key: '100d',
    tabLabel: '100-Day Century',
    title: '100-Day Century',
    description: 'One hundred days aligned in calm, deliberate focus and consistency.',
    targetDays: 100,
    unitLabel: 'day century',
    barSegments: 10,
  },
];

/**
 * Pure derived helper computing real unlock status and progress for each Streak Milestone.
 */
export function deriveStreakMilestones(
  streakState: Pick<StreakState, 'currentStreak' | 'bestStreak' | 'freezesLeft'>
): {
  milestones: StreakMilestoneItem[];
  defaultKey: MilestoneKey;
  highestAchievedDays: number;
} {
  const highestAchievedDays = Math.max(
    0,
    streakState.currentStreak || 0,
    streakState.bestStreak || 0
  );

  const milestones: StreakMilestoneItem[] = MILESTONE_DEFINITIONS.map((def) => {
    const isUnlocked = highestAchievedDays >= def.targetDays;
    const progressPercent = Math.min(
      100,
      Math.round((highestAchievedDays / def.targetDays) * 100)
    );
    const daysRemaining = Math.max(0, def.targetDays - highestAchievedDays);
    const filledSegments = Math.min(
      def.barSegments,
      Math.round((progressPercent / 100) * def.barSegments)
    );

    return {
      ...def,
      filledSegments,
      isUnlocked,
      progressPercent,
      daysRemaining,
    };
  });

  // Focus on the highest unlocked milestone, or the first upcoming milestone if none unlocked yet
  const unlocked = milestones.filter((m) => m.isUnlocked);
  const defaultKey: MilestoneKey =
    unlocked.length > 0 ? unlocked[unlocked.length - 1].key : '7d';

  return {
    milestones,
    defaultKey,
    highestAchievedDays,
  };
}
