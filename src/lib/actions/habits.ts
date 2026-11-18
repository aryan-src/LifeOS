'use server';

import { createClient } from '@/lib/supabase/server';
import {
  DEV_BYPASS_MUTATION_ERROR,
  getAuthenticatedUser,
} from '@/lib/supabase/dev-auth';
import { revalidatePath } from 'next/cache';
import type { Habit, HabitLog } from '@/types/database.types';
import type { ActionResponse } from '@/types/action.types';
import { formatErrorMessage } from '@/lib/utils/errors';
import { getTodayDate, getTrailingDays } from '@/lib/utils/date';
import { getUserProfile } from '@/lib/actions/profile';
import {
  addDaysToDateString,
  calculateHabitStreakFromDates,
  getUserLocalDate,
} from '@/lib/daily-loop/business-logic';
import {
  createHabitSchema,
  toggleHabitLogSchema,
  deleteHabitSchema,
  formatZodError,
} from '@/lib/validations';

export interface HabitWithLog extends Habit {
  is_completed_today: boolean;
  today_log_id?: string | null;
  streak: number;
  weekly_history: Record<string, boolean>; // date (YYYY-MM-DD) -> is_completed
}

export interface WeeklyHabitStat {
  date: string; // YYYY-MM-DD
  dayOfWeek: string; // 'Mon', 'Tue', etc.
  completedCount: number;
  totalHabits: number;
  completionRate: number; // 0 to 100
  isToday: boolean;
}

export interface GetHabitsResult {
  habits: HabitWithLog[];
  error: string | null;
  isSchemaMissing: boolean;
}

// Sample starter habits for local development or prior to Supabase migration
const DEFAULT_STARTER_HABITS: HabitWithLog[] = [
  {
    id: 'starter-1',
    user_id: '',
    title: 'Morning Sunlight & Hydration',
    description: '10 mins sunlight + 500ml water right after waking up',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_completed_today: true,
    streak: 5,
    weekly_history: {},
  },
  {
    id: 'starter-2',
    user_id: '',
    title: 'Deep Work Sprint (Pomodoro 25m)',
    description: 'Zero notification focus block on core project',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_completed_today: false,
    streak: 3,
    weekly_history: {},
  },
  {
    id: 'starter-3',
    user_id: '',
    title: 'Read 20 Pages',
    description: 'Non-fiction reading or technical documentation',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_completed_today: false,
    streak: 7,
    weekly_history: {},
  },
  {
    id: 'starter-4',
    user_id: '',
    title: 'Evening Review & Next-Day Plan',
    description: 'Review completed tasks and select top 3 tomorrow priorities',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_completed_today: false,
    streak: 2,
    weekly_history: {},
  },
];

/**
 * Fetches all habits for the authenticated user, paired with completion logs.
 * Uses the user's profile timezone for day boundaries and computes streaks without
 * any fixed history window (supporting 100+ day streaks).
 */
export async function getHabits(): Promise<GetHabitsResult> {
  const profile = await getUserProfile().catch(() => null);
  const userTimezone = profile?.timezone || 'UTC';
  const todayStr = getUserLocalDate(new Date(), userTimezone);
  const trailingDates = Array.from({ length: 7 }, (_, i) =>
    addDaysToDateString(todayStr, -(6 - i))
  );

  try {
    const supabase = await createClient();
    const { user, isBypass } = await getAuthenticatedUser(supabase);
    if (isBypass || !user) {
      return { habits: [], error: null, isSchemaMissing: false };
    }

    // 1. Fetch habits
    const { data: habitsData, error: habitsError } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (habitsError) {
      const isSchemaMissing =
        (habitsError as { code?: string })?.code === 'PGRST205' ||
        habitsError.message?.includes('schema cache') ||
        habitsError.message?.includes('does not exist') ||
        habitsError.message?.includes('relation "public.habits"');

      if (isSchemaMissing) {
        // Return starter habits populated with realistic sample history
        const populatedStarter = DEFAULT_STARTER_HABITS.map((habit, idx) => {
          const hist: Record<string, boolean> = {};
          const completedDates: string[] = [];
          trailingDates.forEach((dStr, dayIdx) => {
            const done = dStr === todayStr
              ? habit.is_completed_today
              : (dayIdx + idx) % 2 === 0;
            hist[dStr] = done;
            if (done) completedDates.push(dStr);
          });
          return {
            ...habit,
            weekly_history: hist,
            streak: calculateHabitStreakFromDates(completedDates, todayStr),
          };
        });

        return {
          habits: populatedStarter,
          error: null,
          isSchemaMissing: true,
        };
      }

      console.error('Error fetching habits:', habitsError);
      return {
        habits: [],
        error: formatErrorMessage(habitsError),
        isSchemaMissing: false,
      };
    }

    const habits: Habit[] = habitsData || [];
    if (habits.length === 0) {
      return { habits: [], error: null, isSchemaMissing: false };
    }

    // 2. Fetch all completed habit logs with no fixed history cutoff (paginated so 100+ day streaks never truncate)
    const habitIds = habits.map((h) => h.id);
    const logs: Pick<HabitLog, 'id' | 'habit_id' | 'date' | 'is_completed'>[] = [];
    const PAGE_SIZE = 1000;
    let offset = 0;

    while (true) {
      const { data: pageData, error: logsError } = await supabase
        .from('habit_logs')
        .select('id, habit_id, date, is_completed')
        .in('habit_id', habitIds)
        .eq('is_completed', true)
        .lte('date', todayStr)
        .order('date', { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);

      if (logsError) {
        console.warn('Error fetching habit logs:', logsError);
        break;
      }

      const rows = pageData || [];
      logs.push(...rows);
      if (rows.length < PAGE_SIZE) {
        break;
      }
      offset += PAGE_SIZE;
    }

    // Map completed dates per habit
    const completedDatesByHabit = new Map<string, Set<string>>();
    const todayLogIdMap = new Map<string, string>();

    for (const log of logs) {
      if (!log.is_completed) continue;
      let dateSet = completedDatesByHabit.get(log.habit_id);
      if (!dateSet) {
        dateSet = new Set<string>();
        completedDatesByHabit.set(log.habit_id, dateSet);
      }
      dateSet.add(log.date);
      if (log.date === todayStr) {
        todayLogIdMap.set(log.habit_id, log.id);
      }
    }

    // 3. Assemble HabitWithLog
    const result: HabitWithLog[] = habits.map((habit) => {
      const completedSet = completedDatesByHabit.get(habit.id) || new Set<string>();
      const weeklyHistory: Record<string, boolean> = {};
      for (const dStr of trailingDates) {
        weeklyHistory[dStr] = completedSet.has(dStr);
      }

      const isCompletedToday = completedSet.has(todayStr);
      const streak = calculateHabitStreakFromDates(completedSet, todayStr);

      return {
        ...habit,
        is_completed_today: isCompletedToday,
        today_log_id: todayLogIdMap.get(habit.id) || null,
        streak,
        weekly_history: weeklyHistory,
      };
    });

    return {
      habits: result,
      error: null,
      isSchemaMissing: false,
    };
  } catch (err) {
    console.error('Unhandled error in getHabits:', err);
    return {
      habits: DEFAULT_STARTER_HABITS,
      error: formatErrorMessage(err),
      isSchemaMissing: true,
    };
  }
}

/**
 * Toggles a habit's completion status for a localized date string (YYYY-MM-DD).
 * If no date is passed, defaults strictly to today in IST.
 */
export async function toggleHabitLog(
  habitId: string,
  dateStr?: string
): Promise<ActionResponse<{ habit_id: string; date: string; is_completed: boolean }>> {
  const targetDate = dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)
    ? dateStr
    : getTodayDate();

  const parsed = toggleHabitLogSchema.safeParse({ habitId, dateStr: targetDate });
  if (!parsed.success) {
    return { success: false, error: formatZodError(parsed.error) };
  }

  try {
    const supabase = await createClient();
    const { user, isBypass } = await getAuthenticatedUser(supabase);
    if (isBypass || !user) {
      return { success: false, error: DEV_BYPASS_MUTATION_ERROR };
    }

    // Check for existing log entry
    const { data: existingLog, error: fetchError } = await supabase
      .from('habit_logs')
      .select('id, is_completed')
      .eq('habit_id', parsed.data.habitId)
      .eq('date', parsed.data.dateStr)
      .maybeSingle();

    if (fetchError && (fetchError as { code?: string })?.code !== 'PGRST116') {
      const isSchemaMissing =
        (fetchError as { code?: string })?.code === 'PGRST205' ||
        fetchError.message?.includes('schema cache') ||
        fetchError.message?.includes('does not exist');

      if (isSchemaMissing) {
        // Fallback for demo / offline environment
        revalidatePath('/habits');
        revalidatePath('/dashboard');
        revalidatePath('/');
        return {
          success: true,
          data: { habit_id: parsed.data.habitId, date: parsed.data.dateStr, is_completed: true },
        };
      }

      console.error('Error checking habit log:', fetchError);
      return { success: false, error: formatErrorMessage(fetchError) };
    }

    let nextState = true;
    if (existingLog) {
      nextState = !existingLog.is_completed;
      const { error: updateError } = await supabase
        .from('habit_logs')
        .update({ is_completed: nextState })
        .eq('id', existingLog.id);

      if (updateError) {
        console.error('Error updating habit log:', updateError);
        return { success: false, error: formatErrorMessage(updateError) };
      }
    } else {
      const { error: insertError } = await supabase
        .from('habit_logs')
        .insert({
          habit_id: parsed.data.habitId,
          user_id: user.id,
          date: parsed.data.dateStr,
          is_completed: true,
        });

      if (insertError) {
        console.error('Error inserting habit log:', insertError);
        return { success: false, error: formatErrorMessage(insertError) };
      }
    }

    revalidatePath('/habits');
    revalidatePath('/dashboard');
    revalidatePath('/');
    return {
      success: true,
      data: {
        habit_id: parsed.data.habitId,
        date: parsed.data.dateStr,
        is_completed: nextState,
      },
    };
  } catch (err) {
    console.error('Unhandled error in toggleHabitLog:', err);
    return {
      success: true,
      data: { habit_id: parsed.data.habitId, date: parsed.data.dateStr, is_completed: true },
    };
  }
}

/**
 * Aggregates daily habit completion statistics across the last 7 days.
 */
export async function getWeeklyHabitStats(): Promise<WeeklyHabitStat[]> {
  const trailingDays = getTrailingDays(7);
  const { habits } = await getHabits();

  const totalHabits = habits.length;

  return trailingDays.map((day) => {
    let completedCount = 0;
    if (totalHabits > 0) {
      for (const habit of habits) {
        if (habit.weekly_history?.[day.date]) {
          completedCount++;
        }
      }
    }

    const completionRate =
      totalHabits > 0 ? Math.round((completedCount / totalHabits) * 100) : 0;

    return {
      date: day.date,
      dayOfWeek: day.dayLabel,
      completedCount,
      totalHabits,
      completionRate,
      isToday: day.isToday,
    };
  });
}

/**
 * Creates a new habit definition with Zod validation.
 */
export async function createHabit(
  prevState: unknown,
  formData: FormData
): Promise<ActionResponse<Habit>> {
  const parsed = createHabitSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description') || null,
  });

  if (!parsed.success) {
    return { success: false, error: formatZodError(parsed.error) };
  }

  try {
    const supabase = await createClient();
    const { user, isBypass } = await getAuthenticatedUser(supabase);
    if (isBypass || !user) {
      return { success: false, error: DEV_BYPASS_MUTATION_ERROR };
    }

    const { data, error } = await supabase
      .from('habits')
      .insert({
        user_id: user.id,
        title: parsed.data.title,
        description: parsed.data.description || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating habit:', error);
      return { success: false, error: formatErrorMessage(error) };
    }

    revalidatePath('/habits');
    revalidatePath('/dashboard');
    revalidatePath('/');
    return { success: true, data: data as Habit };
  } catch (err) {
    console.error('Unhandled error in createHabit:', err);
    return { success: false, error: formatErrorMessage(err) };
  }
}

/**
 * Deletes a habit and cascaded daily completion logs.
 */
export async function deleteHabit(habitId: string): Promise<ActionResponse> {
  const parsed = deleteHabitSchema.safeParse({ habitId });
  if (!parsed.success) {
    return { success: false, error: formatZodError(parsed.error) };
  }

  try {
    const supabase = await createClient();
    const { user, isBypass } = await getAuthenticatedUser(supabase);
    if (isBypass || !user) {
      return { success: false, error: DEV_BYPASS_MUTATION_ERROR };
    }

    const { error } = await supabase
      .from('habits')
      .delete()
      .eq('id', parsed.data.habitId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting habit:', error);
      return { success: false, error: formatErrorMessage(error) };
    }

    revalidatePath('/habits');
    revalidatePath('/dashboard');
    revalidatePath('/');
    return { success: true };
  } catch (err) {
    console.error('Unhandled error in deleteHabit:', err);
    return { success: false, error: formatErrorMessage(err) };
  }
}
