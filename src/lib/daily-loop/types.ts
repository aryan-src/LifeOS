/**
 * Types for the LifeOS Daily Loop, Streaks, Focus Telemetry, and Life Score.
 * Strict TypeScript: no any, explicit models and interfaces.
 */

export type TodayMode = 'morning' | 'daytime' | 'evening';

export type FocusMode = 'pomodoro' | 'short-break' | 'long-break' | 'stopwatch' | 'deep-work';

export type CheckInMood = 'great' | 'good' | 'neutral' | 'difficult' | 'tough';

export interface FocusSession {
  id: string;
  client_session_id: string;
  user_id: string;
  task_id?: string | null;
  project_id?: string | null;
  duration_seconds: number;
  started_at: string; // ISO 8601 string
  ended_at: string;   // ISO 8601 string
  mode: FocusMode;
  created_at?: string;
}

export interface DailyCheckIn {
  id?: string;
  user_id: string;
  check_in_date: string; // YYYY-MM-DD
  mood: CheckInMood;
  reflection_text?: string | null;
  finished_task_titles: string[];
  energy_rating?: number | null; // 1-5
  created_at?: string;
}

export interface StreakFreezeLog {
  id?: string;
  user_id: string;
  freeze_date: string; // YYYY-MM-DD
  used_at?: string;
  created_at?: string;
}

export interface DailyRecord {
  date: string; // YYYY-MM-DD
  habitsCompleted: number;
  habitsTotal: number;
  tasksCompleted: number;
  focusMinutes: number;
  focusGoalMinutes?: number;
  dailyExpenseAmount?: number;
  dailyAllowanceBudget?: number;
  hasCheckIn?: boolean;
}

export interface DailyMinimumRequirements {
  minHabitsCompleted: number;
  minTasksCompleted: number;
  minFocusMinutes: number;
}

export interface StreakDayInfo {
  date: string;
  isQualified: boolean;
  isFrozen: boolean;
}

export interface StreakPreview {
  current: number;
  next: number;
  isPreviewActive: boolean;
}

export interface StreakState {
  currentStreak: number;
  bestStreak: number;
  freezesEarnedTotal: number;
  freezesUsedTotal: number;
  freezesLeft: number; // max 2 held at a time
  isTodayQualified: boolean;
  nextMilestone: number;
  streakPreview: StreakPreview;
  history: StreakDayInfo[];
}

export interface LifeScoreBreakdown {
  total: number; // 0 - 100
  habitsScore: number;  // 0 - 35
  focusScore: number;   // 0 - 30
  tasksScore: number;   // 0 - 20
  financeScore: number; // 0 - 15
  deltaVsYesterday: number; // positive, 0, or negative
}

export interface FocusInsight {
  peakHour: number | null;
  formattedPeakTime: string | null;
  totalSessions: number;
  totalMinutes: number;
  daysTracked: number;
  hasEnoughData: boolean; // requires >= 14 days
  insightText: string | null;
}
