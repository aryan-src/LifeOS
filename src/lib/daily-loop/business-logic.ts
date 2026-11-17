/**
 * LifeOS Daily Loop Pure Business Logic Module
 * Strict TypeScript, zero external UI dependencies, 100% testable in Node/Vitest.
 */

import type {
  TodayMode,
  FocusSession,
  DailyRecord,
  DailyMinimumRequirements,
  StreakFreezeLog,
  StreakState,
  StreakDayInfo,
  LifeScoreBreakdown,
  FocusInsight,
} from './types';

export const DEFAULT_DAILY_MINIMUM: DailyMinimumRequirements = {
  minHabitsCompleted: 1,
  minTasksCompleted: 1,
  minFocusMinutes: 25,
};

/**
 * Returns YYYY-MM-DD date string in the given IANA timezone.
 * Defaults to UTC if timezone is omitted or invalid.
 */
export function getUserLocalDate(
  dateInput: Date | string | number = new Date(),
  timezone?: string
): string {
  const date = typeof dateInput === 'string' || typeof dateInput === 'number'
    ? new Date(dateInput)
    : dateInput;

  const validTimezone = timezone && isValidTimezone(timezone) ? timezone : 'UTC';

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: validTimezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  return formatter.format(date);
}

/**
 * Returns the local hour (0-23) in the user's timezone.
 */
export function getUserLocalHour(
  dateInput: Date | string | number = new Date(),
  timezone?: string
): number {
  const date = typeof dateInput === 'string' || typeof dateInput === 'number'
    ? new Date(dateInput)
    : dateInput;

  const validTimezone = timezone && isValidTimezone(timezone) ? timezone : 'UTC';

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: validTimezone,
    hour: 'numeric',
    hourCycle: 'h23',
  });

  return parseInt(formatter.format(date), 10);
}

/**
 * Determines Today Card Mode:
 * - morning: 05:00 - 11:59
 * - daytime: 12:00 - 17:59
 * - evening: 18:00 - 04:59
 */
export function getTodayCardMode(
  dateInput: Date | string | number = new Date(),
  timezone?: string
): TodayMode {
  const hour = getUserLocalHour(dateInput, timezone);
  if (hour >= 5 && hour < 12) {
    return 'morning';
  }
  if (hour >= 12 && hour < 18) {
    return 'daytime';
  }
  return 'evening';
}

/**
 * Validates whether an IANA timezone string is recognized by the runtime.
 */
export function isValidTimezone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/**
 * Evaluates whether a daily record fulfills the Daily Minimum qualification.
 * A day qualifies if ANY of these criteria are met:
 * 1. Focused for at least minFocusMinutes (default 25m)
 * 2. Completed at least minHabitsCompleted (default 1) AND minTasksCompleted (default 1)
 * 3. Completed at least 2 habits (even if no tasks) OR completed at least 2 tasks
 */
export function isDailyMinimumMet(
  record: DailyRecord,
  config: Partial<DailyMinimumRequirements> = {}
): boolean {
  const req = { ...DEFAULT_DAILY_MINIMUM, ...config };

  if (record.focusMinutes >= req.minFocusMinutes) {
    return true;
  }

  if (
    record.habitsCompleted >= req.minHabitsCompleted &&
    record.tasksCompleted >= req.minTasksCompleted
  ) {
    return true;
  }

  if (record.habitsCompleted >= 2 || record.tasksCompleted >= 2) {
    return true;
  }

  // If user completed 100% of habits scheduled for that day (minimum 1 habit)
  if (record.habitsTotal > 0 && record.habitsCompleted === record.habitsTotal) {
    return true;
  }

  return false;
}

/**
 * Adds N days to a YYYY-MM-DD date string.
 */
export function addDaysToDateString(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  d.setUTCDate(d.getUTCDate() + days);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dt = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${dt}`;
}

/**
 * Calculates calendar difference in days between two YYYY-MM-DD strings (b - a).
 */
export function daysBetweenDateStrings(a: string, b: string): number {
  const [y1, m1, d1] = a.split('-').map(Number);
  const [y2, m2, d2] = b.split('-').map(Number);
  const utcA = Date.UTC(y1, m1 - 1, d1);
  const utcB = Date.UTC(y2, m2 - 1, d2);
  return Math.round((utcB - utcA) / (1000 * 60 * 60 * 24));
}

export interface CalculateStreakOptions {
  dailyRecords: DailyRecord[];
  freezeLogs: StreakFreezeLog[];
  todayDateString: string;
  config?: Partial<DailyMinimumRequirements>;
}

/**
 * Derives streak state, freeze balances, and preview info from daily records.
 * Rules:
 * - Freezes earned: 1 per 7 consecutive qualified days, maximum 2 held at a time.
 * - Freezes left = earned minus used (clamped 0 to 2).
 * - A day counts when its Daily Minimum is met.
 * - The "12 -> 13" preview appears only when the Daily Minimum is already complete today.
 */
export function calculateStreak(options: CalculateStreakOptions): StreakState {
  const { dailyRecords, freezeLogs, todayDateString, config } = options;

  // Index daily records by date
  const recordsByDate = new Map<string, DailyRecord>();
  for (const r of dailyRecords) {
    recordsByDate.set(r.date, r);
  }

  // Set of freeze dates
  const frozenDates = new Set<string>();
  for (const f of freezeLogs) {
    frozenDates.add(f.freeze_date);
  }

  // Find timeline start
  const allDates = [...recordsByDate.keys(), ...frozenDates].filter(d => d <= todayDateString);
  allDates.sort();

  if (allDates.length === 0) {
    const todayRecord = recordsByDate.get(todayDateString);
    const isTodayQual = todayRecord ? isDailyMinimumMet(todayRecord, config) : false;
    const streak = isTodayQual ? 1 : 0;
    return {
      currentStreak: streak,
      bestStreak: streak,
      freezesEarnedTotal: 0,
      freezesUsedTotal: 0,
      freezesLeft: 0,
      isTodayQualified: isTodayQual,
      nextMilestone: getNextMilestone(streak),
      streakPreview: {
        current: 0,
        next: 1,
        isPreviewActive: isTodayQual,
      },
      history: isTodayQual
        ? [{ date: todayDateString, isQualified: true, isFrozen: false }]
        : [],
    };
  }

  const startDate = allDates[0];
  const totalDays = daysBetweenDateStrings(startDate, todayDateString);

  let currentStreak = 0;
  let bestStreak = 0;
  let consecutiveQualifiedDays = 0;
  let freezesEarnedTotal = 0;
  let freezesUsedTotal = 0;
  let freezesHeld = 0;

  const history: StreakDayInfo[] = [];

  // Iterate day by day from startDate up to yesterday
  for (let i = 0; i < totalDays; i++) {
    const d = addDaysToDateString(startDate, i);
    const record = recordsByDate.get(d);
    const qualified = record ? isDailyMinimumMet(record, config) : false;
    const isFrozen = frozenDates.has(d);

    if (qualified) {
      currentStreak += 1;
      consecutiveQualifiedDays += 1;

      // Earning rule: 1 freeze earned per 7 consecutive qualified days, maximum 2 held at a time
      if (consecutiveQualifiedDays % 7 === 0) {
        freezesEarnedTotal += 1;
        freezesHeld = Math.min(2, freezesHeld + 1);
      }

      bestStreak = Math.max(bestStreak, currentStreak);
      history.push({ date: d, isQualified: true, isFrozen: false });
    } else if (isFrozen) {
      // Missed day protected by a freeze
      freezesUsedTotal += 1;
      freezesHeld = Math.max(0, freezesHeld - 1);
      // Streak is preserved, consecutive run continues or holds
      history.push({ date: d, isQualified: false, isFrozen: true });
    } else {
      // Missed day with no freeze: streak breaks
      currentStreak = 0;
      consecutiveQualifiedDays = 0;
      history.push({ date: d, isQualified: false, isFrozen: false });
    }
  }

  // Evaluate today
  const todayRecord = recordsByDate.get(todayDateString);
  const isTodayQualified = todayRecord ? isDailyMinimumMet(todayRecord, config) : false;

  const baseStreakBeforeToday = currentStreak;

  if (isTodayQualified) {
    currentStreak += 1;
    consecutiveQualifiedDays += 1;
    if (consecutiveQualifiedDays % 7 === 0) {
      freezesEarnedTotal += 1;
      freezesHeld = Math.min(2, freezesHeld + 1);
    }
    bestStreak = Math.max(bestStreak, currentStreak);
    history.push({ date: todayDateString, isQualified: true, isFrozen: false });
  }

  const nextMilestone = getNextMilestone(currentStreak);

  // The "current -> next" preview appears active ONLY when the Daily Minimum is already complete today
  const streakPreview = {
    current: isTodayQualified ? baseStreakBeforeToday : currentStreak,
    next: isTodayQualified ? currentStreak : currentStreak + 1,
    isPreviewActive: isTodayQualified,
  };

  return {
    currentStreak,
    bestStreak,
    freezesEarnedTotal,
    freezesUsedTotal,
    freezesLeft: Math.min(2, Math.max(0, freezesHeld)),
    isTodayQualified,
    nextMilestone,
    streakPreview,
    history,
  };
}

/**
 * Calculates next milestone threshold: 7, 14, 21, 30, 60, 90, 100, 365, etc.
 */
export function getNextMilestone(streak: number): number {
  const milestones = [7, 14, 21, 30, 60, 90, 100, 180, 365];
  for (const m of milestones) {
    if (streak < m) return m;
  }
  return Math.ceil((streak + 1) / 100) * 100;
}

/**
 * Formats a streak badge as tabular numerals with an explicit "D" suffix (e.g. "12D", "1D").
 */
export function formatStreakBadge(streak: number): string {
  return `${Math.max(0, Math.floor(streak))}D`;
}

/**
 * Computes Life Score (0-100) and delta vs yesterday.
 * Pure function: yesterday's score is computed using the identical formula from yesterday's data.
 *
 * Scoring breakdown:
 * - Habits (35%): completed / total (default full 35 if no habits scheduled)
 * - Focus (30%): focusMinutes / daily_focus_goal_minutes (capped at 30)
 * - Tasks (20%): tasksCompleted / 3 (capped at 20)
 * - Finance (15%): adherence to daily allowance budget
 */
export function calculateLifeScore(
  todayRecord: DailyRecord,
  yesterdayRecord?: DailyRecord | null
): LifeScoreBreakdown {
  const computeScore = (rec: DailyRecord): Omit<LifeScoreBreakdown, 'deltaVsYesterday'> => {
    // 1. Habits (35 points)
    let habitsScore = 0;
    if (rec.habitsTotal > 0) {
      habitsScore = Math.min(35, Math.round((rec.habitsCompleted / rec.habitsTotal) * 35));
    } else if (rec.habitsCompleted > 0) {
      habitsScore = 35;
    } else {
      habitsScore = 20; // baseline if no habits are configured
    }

    // 2. Focus (30 points)
    const focusGoal = rec.focusGoalMinutes && rec.focusGoalMinutes > 0 ? rec.focusGoalMinutes : 240;
    const focusScore = Math.min(30, Math.round((rec.focusMinutes / focusGoal) * 30));

    // 3. Tasks (20 points, target 3 completed tasks)
    const tasksScore = Math.min(20, Math.round((rec.tasksCompleted / 3) * 20));

    // 4. Finance / Allowance (15 points)
    let financeScore = 15;
    const budget = rec.dailyAllowanceBudget ?? 500;
    const expense = rec.dailyExpenseAmount ?? 0;
    if (budget > 0 && expense > budget) {
      const overspendRatio = (expense - budget) / budget;
      financeScore = Math.max(0, Math.round(15 - overspendRatio * 15));
    }

    const total = Math.min(100, Math.max(0, habitsScore + focusScore + tasksScore + financeScore));

    return {
      total,
      habitsScore,
      focusScore,
      tasksScore,
      financeScore,
    };
  };

  const todayScore = computeScore(todayRecord);

  let deltaVsYesterday = 0;
  if (yesterdayRecord) {
    const yesterdayScore = computeScore(yesterdayRecord);
    deltaVsYesterday = todayScore.total - yesterdayScore.total;
  }

  return {
    ...todayScore,
    deltaVsYesterday,
  };
}

/**
 * Computes Focus Insights from historical sessions.
 * Insight rules:
 * - Analyzes local peak hour.
 * - Hides insight (returns null insightText and null peakHour) until there are at least 14 distinct days of session data.
 */
export function calculateFocusInsights(
  sessions: FocusSession[],
  timezone?: string
): FocusInsight {
  const validSessions = sessions.filter(s => s.duration_seconds > 0);

  if (validSessions.length === 0) {
    return {
      peakHour: null,
      formattedPeakTime: null,
      totalSessions: 0,
      totalMinutes: 0,
      daysTracked: 0,
      hasEnoughData: false,
      insightText: null,
    };
  }

  const distinctDays = new Set<string>();
  const minutesByHour = new Map<number, number>();

  let totalSeconds = 0;

  for (const session of validSessions) {
    totalSeconds += session.duration_seconds;

    const sessionDate = getUserLocalDate(session.started_at, timezone);
    distinctDays.add(sessionDate);

    const hour = getUserLocalHour(session.started_at, timezone);
    const sessionMinutes = Math.round(session.duration_seconds / 60);
    minutesByHour.set(hour, (minutesByHour.get(hour) || 0) + sessionMinutes);
  }

  const daysTracked = distinctDays.size;
  const totalMinutes = Math.round(totalSeconds / 60);
  const hasEnoughData = daysTracked >= 14;

  if (!hasEnoughData) {
    return {
      peakHour: null,
      formattedPeakTime: null,
      totalSessions: validSessions.length,
      totalMinutes,
      daysTracked,
      hasEnoughData: false,
      insightText: null,
    };
  }

  let peakHour = 0;
  let maxMinutes = -1;

  for (let h = 0; h < 24; h++) {
    const mins = minutesByHour.get(h) || 0;
    if (mins > maxMinutes) {
      maxMinutes = mins;
      peakHour = h;
    }
  }

  const formattedPeakTime = formatHourTo12h(peakHour);
  const insightText = `You focus best around ${formattedPeakTime}`;

  return {
    peakHour,
    formattedPeakTime,
    totalSessions: validSessions.length,
    totalMinutes,
    daysTracked,
    hasEnoughData: true,
    insightText,
  };
}

/**
 * Formats a 0-23 hour number to a clean 12-hour string (e.g. "8 PM", "9 AM", "12 PM", "12 AM").
 */
export function formatHourTo12h(hour: number): string {
  const d = new Date(2026, 0, 1, hour, 0, 0);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
}
