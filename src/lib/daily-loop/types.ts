/**
 * Types for the LifeOS Daily Loop, Streaks, Focus Telemetry, and Life Score.
 * Strict TypeScript: no any, explicit models and interfaces.
 */

export type TodayMode = 'morning' | 'daytime' | 'evening';

export type FocusMode = 'pomodoro' | 'short-break' | 'long-break' | 'stopwatch' | 'deep-work';

// Ordered worst to best, matching the 5 mood reflection icons
export type MoodRating = 'exhausted' | 'tough' | 'neutral' | 'good' | 'great';

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
  mood: MoodRating;
  reflection_text?: string | null;
  finished_task_titles: string[];
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
  focusSessionsCompleted: number; // completed focus sessions (not breaks)
  habitsCompleted: number;        // at least 1 habit completed
  expensesLogged: number;         // at least 1 expense logged
  // Additional telemetry metrics for Life Score and display
  habitsTotal?: number;
  tasksCompleted?: number;
  focusMinutes?: number;
  focusGoalMinutes?: number;
  dailyExpenseAmount?: number;
  dailyAllowanceBudget?: number;
  hasCheckIn?: boolean;
}

export interface DailyMinimumChecklist {
  hasFocusSession: boolean;
  hasHabitCompleted: boolean;
  hasExpenseLogged: boolean;
  completedCount: number;
  totalRequired: number; // 2
  isQualified: boolean;
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
  checklist: DailyMinimumChecklist;
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

export type FocusTimerStatus = 'idle' | 'running' | 'paused' | 'finished' | 'break';

export type PersistableFocusMode = 'pomodoro' | 'deep-work';

export type FocusSessionErrorCode =
  | 'dev_bypass'
  | 'not_authenticated'
  | 'validation'
  | 'db_error'
  | 'unknown';

export type FocusSaveStatus = 'idle' | 'saved' | 'error';

export interface PendingFocusSession {
  clientSessionId: string;
  mode: PersistableFocusMode;
  durationSeconds: number;
  plannedDurationSeconds: number;
  startedAt: string; // ISO 8601
  endedAt: string;   // ISO 8601
  taskId: string | null;
  taskTitle: string | null;
  projectId: string | null;
}

export interface FocusTimerState {
  status: FocusTimerStatus;
  clientSessionId: string | null;
  mode: PersistableFocusMode | 'short-break';
  plannedDurationSeconds: number;
  startedAtMs: number | null;
  endTimestampMs: number | null;
  remainingSecondsWhenPaused: number | null;
  pausedAtMs: number | null;
  accumulatedPausedMs: number;
  isStalePause: boolean;
  taskId: string | null;
  taskTitle: string | null;
  projectId: string | null;
  isFullscreenOpen: boolean;
  isSaved: boolean;
  isAcknowledged: boolean;
  endedWhileAway: boolean;
  finishedAtMs: number | null;
  lastCompletedMinutes: number;
  lastDurationMinutes: number;
  pendingUnsavedSessions: PendingFocusSession[];
  saveError: string | null;
  saveErrorCode?: FocusSessionErrorCode | null;
  lastSaveStatus?: FocusSaveStatus;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
}
