/**
 * Pure derived-value helpers for the Dashboard and Daily Loop telemetry.
 * Eliminates hardcoded dates, week numbers, and mockup values.
 */

export interface FocusRemainingSummary {
  remainingMinutes: number;
  formattedRemaining: string;
  isGoalMet: boolean;
}

export interface CalibrationProgress {
  daysTracked: number;
  targetDays: number;
  percent: number;
  isCalibrated: boolean;
  label: string;
}

export interface BudgetUtilizationSummary {
  percentUtilized: number;
  remainingAmount: number;
  safeDailyPace: number;
  daysLeftInMonth: number;
  tone: 'secondary' | 'tertiary' | 'error';
}

export function formatMinutesCompact(totalMinutes: number): string {
  const safe = Math.max(0, Math.round(totalMinutes));
  if (safe === 0) return '0m';
  const hours = Math.floor(safe / 60);
  const mins = safe % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

export function computeFocusRemaining(
  loggedMinutes: number,
  goalMinutes: number
): FocusRemainingSummary {
  const safeGoal = Math.max(0, Math.round(goalMinutes));
  const safeLogged = Math.max(0, Math.round(loggedMinutes));
  const remainingMinutes = Math.max(0, safeGoal - safeLogged);
  return {
    remainingMinutes,
    formattedRemaining: formatMinutesCompact(remainingMinutes),
    isGoalMet: safeGoal > 0 && remainingMinutes === 0,
  };
}

export function computeCalibrationProgress(
  daysTracked: number,
  targetDays = 14
): CalibrationProgress {
  const safeTarget = Math.max(1, targetDays);
  const safeTracked = Math.max(0, Math.floor(daysTracked));
  const clamped = Math.min(safeTracked, safeTarget);
  const percent = Math.round((clamped / safeTarget) * 100);
  const isCalibrated = safeTracked >= safeTarget;

  return {
    daysTracked: safeTracked,
    targetDays: safeTarget,
    percent,
    isCalibrated,
    label: isCalibrated
      ? `Baseline calibrated (${safeTracked} days logged)`
      : `${clamped} of ${safeTarget} days logged for peak-focus calibration`,
  };
}

export function computeDaysLeftInMonth(todayDateStr: string): number {
  const parts = todayDateStr.split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) {
    return 1;
  }
  const [year, month, day] = parts;
  const totalDaysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return Math.max(1, totalDaysInMonth - day + 1);
}

export function computeBudgetUtilization(
  spentAmount: number,
  monthlyAllowance: number,
  todayDateStr: string
): BudgetUtilizationSummary {
  const safeAllowance = Math.max(0, monthlyAllowance);
  const safeSpent = Math.max(0, spentAmount);
  const remainingAmount = Math.max(0, safeAllowance - safeSpent);
  const percentUtilized =
    safeAllowance > 0
      ? Math.min(100, Math.round((safeSpent / safeAllowance) * 100))
      : 0;
  const daysLeftInMonth = computeDaysLeftInMonth(todayDateStr);
  const safeDailyPace =
    safeAllowance > 0 && daysLeftInMonth > 0 ? Math.floor(remainingAmount / daysLeftInMonth) : 0;

  let tone: 'secondary' | 'tertiary' | 'error' = 'secondary';
  if (percentUtilized >= 90) {
    tone = 'error';
  } else if (percentUtilized >= 70) {
    tone = 'tertiary';
  }

  return {
    percentUtilized,
    remainingAmount,
    safeDailyPace,
    daysLeftInMonth,
    tone,
  };
}

export function formatCalendarMetaFromDateString(dateStr: string): {
  dayName: string;
  dateFormatted: string;
  monthShort: string;
  weekNumber: number;
} {
  const parts = dateStr.split('-').map(Number);
  const now = new Date();
  const [y, m, d] =
    parts.length === 3 && parts.every((n) => Number.isFinite(n))
      ? parts
      : [now.getUTCFullYear(), now.getUTCMonth() + 1, now.getUTCDate()];

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const utcDate = new Date(Date.UTC(y, m - 1, d));
  const dayName = dayNames[utcDate.getUTCDay()];
  const monthShort = months[m - 1] ?? 'Jan';
  const dateFormatted = `${d} ${monthShort}`;

  const isoCopy = new Date(Date.UTC(y, m - 1, d));
  const dayNum = isoCopy.getUTCDay() || 7;
  isoCopy.setUTCDate(isoCopy.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(isoCopy.getUTCFullYear(), 0, 1));
  const weekNumber = Math.ceil(((isoCopy.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);

  return { dayName, dateFormatted, monthShort, weekNumber };
}
