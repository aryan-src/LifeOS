'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getUserProfile } from '@/lib/actions/profile';
import type { ActionResponse } from '@/types/action.types';
import { formatErrorMessage } from '@/lib/utils/errors';
import { upsertDailyCheckInSchema, formatZodError } from '@/lib/validations';
import {
  addDaysToDateString,
  getFocusSessionDay,
  getUserLocalDate,
  getTodayCardMode,
  calculateStreak,
  calculateLifeScore,
  calculateFocusInsights,
  isFocusMode,
  isFocusSessionQualified,
  isDailyMinimumMet,
} from '@/lib/daily-loop/business-logic';
import type {
  DailyCheckIn,
  DailyRecord,
  FocusInsight,
  FocusSession,
  MoodRating,
  StreakFreezeLog,
  StreakState,
  LifeScoreBreakdown,
  TodayMode,
} from '@/lib/daily-loop/types';

export interface WeekStripDay {
  dayLabel: string;
  date: string;
  isToday: boolean;
  isPast: boolean;
  isFuture: boolean;
  isQualified: boolean;
  isFrozen: boolean;
}

export interface DailyLoopDashboardData {
  lifeScore: LifeScoreBreakdown;
  streakState: StreakState;
  timeFocused: {
    minutes: number;
    goalMinutes: number;
    formattedTime: string;
    formattedGoal: string;
    percent: number;
  };
  pocketLedger: {
    spentAmount: number;
    monthlyAllowance: number;
    remainingAllowance: number;
    allowancePercent: number;
    currentMonth: string;
  };
  weekStrip: WeekStripDay[];
  userTimezone: string;
  isTimezoneNull: boolean;
  todayDateStr: string;
  todayMode: TodayMode;
  todayCheckIn: DailyCheckIn | null;
  focusInsight: FocusInsight;
  todayExpenseAmount: number;
}

function computeWeekStrip(
  todayStr: string,
  recordsByDate: Map<string, DailyRecord>,
  frozenDates: Set<string>
): WeekStripDay[] {
  const [y, m, d] = todayStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const dayOfWeek = dt.getUTCDay();
  // Monday is index 0, Sunday is index 6
  const mondayOffset = (dayOfWeek + 6) % 7;
  const labels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const strip: WeekStripDay[] = [];

  for (let i = 0; i < 7; i++) {
    const dayDiff = i - mondayOffset;
    const cur = new Date(Date.UTC(y, m - 1, d + dayDiff));
    const curY = cur.getUTCFullYear();
    const curM = String(cur.getUTCMonth() + 1).padStart(2, '0');
    const curD = String(cur.getUTCDate()).padStart(2, '0');
    const dateStr = `${curY}-${curM}-${curD}`;

    const isToday = dateStr === todayStr;
    const isPast = dateStr < todayStr;
    const isFuture = dateStr > todayStr;

    const record = recordsByDate.get(dateStr);
    const isQualified = record ? isDailyMinimumMet(record) : false;
    const isFrozen = frozenDates.has(dateStr);

    strip.push({
      dayLabel: labels[i],
      date: dateStr,
      isToday,
      isPast,
      isFuture,
      isQualified,
      isFrozen,
    });
  }

  return strip;
}

export async function getDailyLoopDashboardData(): Promise<DailyLoopDashboardData> {
  const profile = await getUserProfile();
  const userTimezone = profile.timezone || 'UTC';
  const isTimezoneNull = !profile.timezone;

  const now = new Date();
  const todayStr = getUserLocalDate(now, userTimezone);
  const yesterdayStr = addDaysToDateString(todayStr, -1);
  const todayMode = getTodayCardMode(now, userTimezone);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const [todayYear, todayMonthStr] = todayStr.split('-');
  const nowYearMonth = `${todayYear}-${todayMonthStr}`;
  const currentMonthName = months[parseInt(todayMonthStr, 10) - 1] || 'Nov';

  const emptyFocusInsight: FocusInsight = {
    peakHour: null,
    formattedPeakTime: null,
    totalSessions: 0,
    totalMinutes: 0,
    daysTracked: 0,
    hasEnoughData: false,
    insightText: null,
  };

  const fallbackData: DailyLoopDashboardData = {
    lifeScore: {
      total: 0,
      habitsScore: 0,
      focusScore: 0,
      tasksScore: 0,
      financeScore: 15,
      deltaVsYesterday: 0,
    },
    streakState: {
      currentStreak: 0,
      bestStreak: 0,
      freezesEarnedTotal: 0,
      freezesUsedTotal: 0,
      freezesLeft: 0,
      isTodayQualified: false,
      nextMilestone: 7,
      streakPreview: { current: 0, next: 1, isPreviewActive: false },
      checklist: {
        hasFocusSession: false,
        hasHabitCompleted: false,
        hasExpenseLogged: false,
        completedCount: 0,
        totalRequired: 2,
        isQualified: false,
      },
      history: [],
    },
    timeFocused: {
      minutes: 0,
      goalMinutes: profile.daily_focus_goal_minutes || 240,
      formattedTime: '0m',
      formattedGoal: `${Math.round((profile.daily_focus_goal_minutes || 240) / 60)}h goal`,
      percent: 0,
    },
    pocketLedger: {
      spentAmount: 0,
      monthlyAllowance: profile.monthly_allowance_target || 15000,
      remainingAllowance: profile.monthly_allowance_target || 15000,
      allowancePercent: 0,
      currentMonth: currentMonthName,
    },
    weekStrip: computeWeekStrip(todayStr, new Map(), new Set()),
    userTimezone,
    isTimezoneNull,
    todayDateStr: todayStr,
    todayMode,
    todayCheckIn: null,
    focusInsight: emptyFocusInsight,
    todayExpenseAmount: 0,
  };

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return fallbackData;
    }

    // Run parallel queries with graceful missing-table catchers (code 42P01)
    const [
      focusSessionsRes,
      freezeLogsRes,
      habitLogsRes,
      habitsRes,
      transactionsRes,
      todayTasksRes,
      todayCheckInRes,
    ] = await Promise.all([
      supabase
        .from('focus_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false })
        .limit(500)
        .then((res) => {
          if (res.error) {
            if (res.error.code === '42P01') {
              console.warn('[DailyLoop] Table focus_sessions does not exist (42P01). Using fallback.');
              return { data: [] as FocusSession[] };
            }
            console.error('[DailyLoop] Error querying focus_sessions:', res.error);
          }
          return { data: (res.data || []) as FocusSession[] };
        }),

      supabase
        .from('streak_freeze_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('freeze_date', { ascending: false })
        .then((res) => {
          if (res.error) {
            if (res.error.code === '42P01') {
              console.warn('[DailyLoop] Table streak_freeze_logs does not exist (42P01). Using fallback.');
              return { data: [] as StreakFreezeLog[] };
            }
            console.error('[DailyLoop] Error querying streak_freeze_logs:', res.error);
          }
          return { data: (res.data || []) as StreakFreezeLog[] };
        }),

      supabase
        .from('habit_logs')
        .select('date, is_completed')
        .eq('user_id', user.id)
        .then((res) => {
          if (res.error) {
            if (res.error.code === '42P01') {
              return { data: [] };
            }
            console.error('[DailyLoop] Error querying habit_logs:', res.error);
          }
          return { data: res.data || [] };
        }),

      supabase
        .from('habits')
        .select('id')
        .eq('user_id', user.id)
        .then((res) => ({ count: res.data?.length || 0 })),

      supabase
        .from('transactions')
        .select('amount, type, date')
        .eq('user_id', user.id)
        .eq('type', 'expense')
        .then((res) => ({ data: res.data || [] })),

      supabase
        .from('tasks')
        .select('id, is_completed, updated_at')
        .eq('user_id', user.id)
        .eq('is_completed', true)
        .then((res) => ({ data: res.data || [] })),

      supabase
        .from('daily_check_ins')
        .select('*')
        .eq('user_id', user.id)
        .eq('check_in_date', todayStr)
        .maybeSingle()
        .then((res) => {
          if (res.error) {
            if (res.error.code === '42P01') {
              console.warn('[DailyLoop] Table daily_check_ins does not exist (42P01). Using fallback.');
              return { data: null as DailyCheckIn | null };
            }
            console.error('[DailyLoop] Error querying daily_check_ins:', res.error);
          }
          if (!res.data) return { data: null as DailyCheckIn | null };
          const row = res.data;
          const finishedTitles = Array.isArray(row.finished_task_titles)
            ? row.finished_task_titles.filter((item): item is string => typeof item === 'string')
            : [];
          return {
            data: {
              id: row.id,
              user_id: row.user_id,
              check_in_date: row.check_in_date,
              mood: row.mood as MoodRating,
              reflection_text: row.reflection_text ?? null,
              finished_task_titles: finishedTitles,
              created_at: row.created_at,
            } as DailyCheckIn,
          };
        }),
    ]);

    const focusSessions = focusSessionsRes.data || [];
    const freezeLogs = freezeLogsRes.data || [];
    const habitLogs = habitLogsRes.data || [];
    const totalHabitsCount = habitsRes.count || 0;
    const expenseTransactions = transactionsRes.data || [];
    const completedTasks = todayTasksRes.data || [];
    const todayCheckIn = todayCheckInRes.data || null;

    // Aggregate daily telemetry into DailyRecord map indexed by YYYY-MM-DD
    const recordsByDate = new Map<string, DailyRecord>();

    const getOrCreateRecord = (date: string): DailyRecord => {
      let r = recordsByDate.get(date);
      if (!r) {
        r = {
          date,
          focusSessionsCompleted: 0,
          habitsCompleted: 0,
          expensesLogged: 0,
          habitsTotal: totalHabitsCount,
          tasksCompleted: 0,
          focusMinutes: 0,
          focusGoalMinutes: profile.daily_focus_goal_minutes || 240,
          dailyExpenseAmount: 0,
          dailyAllowanceBudget: (profile.monthly_allowance_target || 15000) / 30,
        };
        recordsByDate.set(date, r);
      }
      return r;
    };

    // 1. Process Focus Sessions (focus modes only, attributed via single shared One-Day Rule helper)
    let todayFocusMinutes = 0;
    for (const session of focusSessions) {
      if (!isFocusMode(session.mode)) continue;

      const sessionDate = getFocusSessionDay(session, userTimezone);
      const rec = getOrCreateRecord(sessionDate);
      const mins = Math.round(session.duration_seconds / 60);
      rec.focusMinutes = (rec.focusMinutes ?? 0) + mins;

      if (isFocusSessionQualified(session)) {
        rec.focusSessionsCompleted += 1;
      }

      if (sessionDate === todayStr) {
        todayFocusMinutes += mins;
      }
    }

    // 2. Process Habit Logs
    for (const log of habitLogs) {
      if (log.is_completed && log.date) {
        const rec = getOrCreateRecord(log.date);
        rec.habitsCompleted += 1;
      }
    }

    // 3. Process Transactions (using user-timezone month boundary)
    let currentMonthSpend = 0;

    for (const tx of expenseTransactions) {
      if (tx.date) {
        const rec = getOrCreateRecord(tx.date);
        rec.expensesLogged += 1;
        rec.dailyExpenseAmount = (rec.dailyExpenseAmount ?? 0) + Number(tx.amount || 0);

        if (tx.date.startsWith(nowYearMonth)) {
          currentMonthSpend += Number(tx.amount || 0);
        }
      }
    }

    // 4. Process Tasks completed today
    for (const t of completedTasks) {
      if (t.updated_at) {
        const taskDate = getUserLocalDate(t.updated_at, userTimezone);
        const rec = getOrCreateRecord(taskDate);
        rec.tasksCompleted = (rec.tasksCompleted ?? 0) + 1;
      }
    }

    const todayRecord = getOrCreateRecord(todayStr);
    todayRecord.hasCheckIn = Boolean(todayCheckIn);
    const yesterdayRecord = recordsByDate.get(yesterdayStr) || null;

    // Calculate Streak, Life Score & Focus Insights using pure functions
    const dailyRecordsArray = Array.from(recordsByDate.values());
    const streakState = calculateStreak({
      dailyRecords: dailyRecordsArray,
      freezeLogs,
      todayDateString: todayStr,
    });

    const lifeScore = calculateLifeScore(todayRecord, yesterdayRecord);
    const focusInsight = calculateFocusInsights(focusSessions, userTimezone);

    const goalMinutes = profile.daily_focus_goal_minutes || 240;
    const focusHours = Math.floor(todayFocusMinutes / 60);
    const focusMinsRemaining = todayFocusMinutes % 60;
    const formattedFocusTime =
      focusHours > 0
        ? `${focusHours}h ${focusMinsRemaining}m`
        : `${todayFocusMinutes}m`;

    const monthlyAllowance = profile.monthly_allowance_target || 15000;
    const remainingAllowance = Math.max(0, monthlyAllowance - currentMonthSpend);
    const allowancePercent = Math.min(
      100,
      monthlyAllowance > 0 ? Math.round((currentMonthSpend / monthlyAllowance) * 100) : 0
    );

    const frozenDatesSet = new Set(freezeLogs.map((f) => f.freeze_date));
    const weekStrip = computeWeekStrip(todayStr, recordsByDate, frozenDatesSet);

    return {
      lifeScore,
      streakState,
      timeFocused: {
        minutes: todayFocusMinutes,
        goalMinutes,
        formattedTime: formattedFocusTime,
        formattedGoal: `${Math.round(goalMinutes / 60)}h goal`,
        percent: Math.min(100, Math.round((todayFocusMinutes / goalMinutes) * 100)),
      },
      pocketLedger: {
        spentAmount: currentMonthSpend,
        monthlyAllowance,
        remainingAllowance,
        allowancePercent,
        currentMonth: currentMonthName,
      },
      weekStrip,
      userTimezone,
      isTimezoneNull,
      todayDateStr: todayStr,
      todayMode,
      todayCheckIn,
      focusInsight,
      todayExpenseAmount: todayRecord.dailyExpenseAmount ?? 0,
    };
  } catch (err) {
    console.error('[DailyLoop] Unexpected error in getDailyLoopDashboardData:', err);
    return fallbackData;
  }
}

export interface UpsertDailyCheckInInput {
  mood: MoodRating;
  reflectionText?: string | null;
  finishedTaskTitles?: string[];
}

/**
 * Saves or updates today's evening check-in in public.daily_check_ins.
 * Uses the user's profile timezone for check_in_date and relies on
 * UNIQUE(user_id, check_in_date) so editing later updates the same record.
 */
export async function upsertDailyCheckIn(
  input: UpsertDailyCheckInInput
): Promise<ActionResponse<DailyCheckIn>> {
  const parsed = upsertDailyCheckInSchema.safeParse({
    mood: input.mood,
    reflectionText: input.reflectionText ?? null,
    finishedTaskTitles: input.finishedTaskTitles ?? [],
  });

  if (!parsed.success) {
    return { success: false, error: formatZodError(parsed.error) };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Unauthorized' };
    }

    const profile = await getUserProfile();
    const userTimezone = profile.timezone || 'UTC';
    const checkInDate = getUserLocalDate(new Date(), userTimezone);

    const { data, error } = await supabase
      .from('daily_check_ins')
      .upsert(
        {
          user_id: user.id,
          check_in_date: checkInDate,
          mood: parsed.data.mood,
          reflection_text: parsed.data.reflectionText || null,
          finished_task_titles: parsed.data.finishedTaskTitles,
        },
        { onConflict: 'user_id,check_in_date' }
      )
      .select('*')
      .single();

    if (error) {
      if (error.code === '42P01') {
        console.warn('[DailyLoop] Table daily_check_ins does not exist (42P01).');
        return { success: false, error: 'Daily check-ins table is not yet initialized.' };
      }
      console.error('[DailyLoop] Error saving daily check-in:', error);
      return { success: false, error: formatErrorMessage(error) };
    }

    const finishedTitles = Array.isArray(data.finished_task_titles)
      ? data.finished_task_titles.filter((item): item is string => typeof item === 'string')
      : [];

    revalidatePath('/dashboard');
    revalidatePath('/');

    return {
      success: true,
      data: {
        id: data.id,
        user_id: data.user_id,
        check_in_date: data.check_in_date,
        mood: data.mood as MoodRating,
        reflection_text: data.reflection_text ?? null,
        finished_task_titles: finishedTitles,
        created_at: data.created_at,
      },
    };
  } catch (err) {
    console.error('[DailyLoop] Unexpected error in upsertDailyCheckIn:', err);
    return { success: false, error: formatErrorMessage(err) };
  }
}
