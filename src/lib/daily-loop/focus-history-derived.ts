import type { DailyLoopDashboardData } from '@/lib/actions/daily-loop';
import {
  computeCalibrationProgress,
  formatCalendarMetaFromDateString,
  formatMinutesCompact,
  type CalibrationProgress,
} from './dashboard-derived';

export interface FocusHistoryBar {
  date: string;
  dayLabel: string;
  minutes: number | null;
  percentOfGoal: number;
  isToday: boolean;
  isQualified: boolean;
  isFuture: boolean;
}

export interface FocusHistorySummary {
  todayFormatted: string;
  todayGoalFormatted: string;
  todayPercent: number;
  totalMinutesLogged: number;
  totalFormatted: string;
  totalSessions: number;
  averageSessionMinutes: number;
  qualifiedDaysThisWeek: number;
  calibration: CalibrationProgress;
  peakWindowText: string;
  weekLabel: string;
  weeklyBars: FocusHistoryBar[];
}

export function deriveFocusHistorySummary(
  data: DailyLoopDashboardData
): FocusHistorySummary {
  const { timeFocused, focusInsight, weekStrip, todayDateStr } = data;
  const totalSessions = Math.max(0, focusInsight.totalSessions || 0);
  const totalMinutesLogged = Math.max(0, focusInsight.totalMinutes || 0);
  const averageSessionMinutes =
    totalSessions > 0 ? Math.round(totalMinutesLogged / totalSessions) : 0;

  const calibration = computeCalibrationProgress(focusInsight.daysTracked || 0, 14);
  const calendarMeta = formatCalendarMetaFromDateString(todayDateStr);
  const year = todayDateStr.slice(0, 4) || String(new Date().getUTCFullYear());

  const goalMinutes = Math.max(1, timeFocused.goalMinutes || 240);
  const qualifiedDaysThisWeek = weekStrip.filter((d) => d.isQualified).length;

  const weeklyBars: FocusHistoryBar[] = weekStrip.map((day) => {
    const minutes = day.isToday ? timeFocused.minutes : null;
    const percentOfGoal =
      minutes !== null
        ? Math.min(100, Math.round((minutes / goalMinutes) * 100))
        : day.isQualified
        ? 60
        : 0;

    return {
      date: day.date,
      dayLabel: day.dayLabel,
      minutes,
      percentOfGoal,
      isToday: day.isToday,
      isQualified: day.isQualified,
      isFuture: day.isFuture,
    };
  });

  const peakWindowText =
    focusInsight.hasEnoughData && focusInsight.insightText
      ? focusInsight.insightText
      : `Log ${Math.max(0, 14 - calibration.daysTracked)} more ${
          14 - calibration.daysTracked === 1 ? 'day' : 'days'
        } of focus sessions to unlock your peak-hour window.`;

  return {
    todayFormatted: timeFocused.formattedTime,
    todayGoalFormatted: timeFocused.formattedGoal,
    todayPercent: Math.min(100, Math.round(timeFocused.percent)),
    totalMinutesLogged,
    totalFormatted: formatMinutesCompact(totalMinutesLogged),
    totalSessions,
    averageSessionMinutes,
    qualifiedDaysThisWeek,
    calibration,
    peakWindowText,
    weekLabel: `Week ${calendarMeta.weekNumber} · ${year}`,
    weeklyBars,
  };
}
