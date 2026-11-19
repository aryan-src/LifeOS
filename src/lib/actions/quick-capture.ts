'use server';

import { createTask, deleteTask } from '@/lib/actions/tasks';
import {
  createTransaction,
  deleteTransaction,
  getCategories,
} from '@/lib/actions/finances';
import { createNote, deleteNote } from '@/lib/actions/notes';
import {
  createAssignment,
  deleteAssignment,
} from '@/lib/actions/assignments';
import { toggleHabitLog, getHabits } from '@/lib/actions/habits';
import { getProjectOptions } from '@/lib/actions/projects-options';
import { getProfile } from '@/lib/actions/profile';
import {
  parseQuickCapture,
  type ParsedChips,
  type QuickCaptureContext,
} from '@/lib/parser/quick-capture';
import type { ActionResponse } from '@/types/action.types';
import { formatErrorMessage } from '@/lib/utils/errors';
import { quickCaptureSchema, formatZodError } from '@/lib/validations';

export interface DispatchResult {
  target: 'transaction' | 'task' | 'note' | 'assignment' | 'habit';
  message: string;
  projectId?: string | null;
  entityId: string;
  extra?: {
    habitDate?: string;
    habitChanged?: boolean;
  };
}

/**
 * Retrieves the contextual data (categories, projects, habits, profile timezone)
 * required by the deterministic parser to intelligently guess categories and link entities.
 */
export async function getQuickCaptureContext(): Promise<QuickCaptureContext> {
  try {
    const [categories, projects, habitsRes, profileRes] = await Promise.all([
      getCategories().catch(() => []),
      getProjectOptions().catch(() => []),
      getHabits().catch(() => ({ habits: [] })),
      getProfile().catch(() => null),
    ]);

    const timezone =
      profileRes?.timezone ||
      Intl.DateTimeFormat().resolvedOptions().timeZone ||
      'Asia/Kolkata';

    return {
      timezone,
      categories: (categories || []).map((c) => ({ id: c.id, name: c.name })),
      projects: (projects || []).map((p) => ({ id: p.id, title: p.title, slug: p.slug })),
      habits: (habitsRes.habits || []).map((h) => ({
        id: h.id,
        title: h.title,
        is_completed_today: h.is_completed_today,
      })),
    };
  } catch (err) {
    console.error('Error fetching quick capture context:', err);
    return {
      timezone: 'Asia/Kolkata',
      categories: [],
      projects: [],
      habits: [],
    };
  }
}

/**
 * Route Dispatcher for Quick Capture Omnibar.
 * Saves ONLY through existing server actions (createTask, createTransaction,
 * createNote, createAssignment, toggleHabitLog).
 * Zero direct Supabase table inserts from this module.
 */
export async function dispatchQuickCapture(
  rawInput: string,
  customChips?: ParsedChips,
  context?: QuickCaptureContext
): Promise<ActionResponse<DispatchResult>> {
  const validation = quickCaptureSchema.safeParse({ rawInput });
  if (!validation.success) {
    return { success: false, error: formatZodError(validation.error) };
  }

  const trimmed = validation.data.rawInput;
  const parsed = parseQuickCapture(trimmed, context || {});
  const effectiveChips: ParsedChips = customChips || parsed.chips;
  const target = effectiveChips.type || parsed.target;

  // 1. Task Dispatch
  if (target === 'task') {
    const title = effectiveChips.title || parsed.payload.title || 'Untitled task';
    const fd = new FormData();
    fd.append('title', title);
    if (effectiveChips.date || parsed.payload.dueDate) {
      fd.append('dueDate', (effectiveChips.date || parsed.payload.dueDate)!);
    }
    const prio = effectiveChips.priority || parsed.payload.priority || 2;
    fd.append('priority', String(prio));
    const projId = effectiveChips.projectId || parsed.payload.projectId;
    if (projId) {
      fd.append('projectId', projId);
    }

    const res = await createTask(null, fd);
    if (!res.success || !res.data) {
      return { success: false, error: res.error || 'Failed to create task.' };
    }

    return {
      success: true,
      data: {
        target: 'task',
        entityId: res.data.id,
        projectId: projId || null,
        message: `Created task "${res.data.title}"`,
      },
    };
  }

  // 2. Transaction / Expense Dispatch
  if (target === 'transaction' || target === 'expense') {
    const rawAmt =
      effectiveChips.amount !== undefined && effectiveChips.amount !== null
        ? effectiveChips.amount
        : parsed.payload.amount !== undefined
        ? Math.abs(parsed.payload.amount)
        : 0;
    const amountVal = Math.abs(rawAmt);
    const description =
      effectiveChips.title ||
      parsed.payload.description ||
      parsed.payload.title ||
      'Quick Capture Transaction';

    const fd = new FormData();
    fd.append('amount', String(amountVal));
    fd.append('type', 'expense');
    fd.append('description', description);
    if (effectiveChips.date || parsed.payload.date) {
      fd.append('date', (effectiveChips.date || parsed.payload.date)!);
    }
    const catId = effectiveChips.categoryId || parsed.payload.categoryId;
    if (catId) {
      fd.append('categoryId', catId);
    }
    const projId = effectiveChips.projectId || parsed.payload.projectId;
    if (projId) {
      fd.append('projectId', projId);
    }

    const res = await createTransaction(null, fd);
    if (!res.success || !res.data?.id) {
      return { success: false, error: res.error || 'Failed to create transaction.' };
    }

    return {
      success: true,
      data: {
        target: 'transaction',
        entityId: res.data.id,
        projectId: projId || null,
        message: `Logged expense ₹${amountVal} (${description})`,
      },
    };
  }

  // 3. Assignment Dispatch
  if (target === 'assignment') {
    const title = effectiveChips.title || parsed.payload.title || 'Untitled Assignment';
    const subject = parsed.payload.subject || 'General';
    const projId = effectiveChips.projectId || parsed.payload.projectId || null;
    const dueDate = effectiveChips.date || parsed.payload.dueDate || null;

    const res = await createAssignment({
      title,
      subject,
      due_date: dueDate,
      project_id: projId,
      status: 'not_started',
    });

    if (!res.success || !res.data) {
      return { success: false, error: res.error || 'Failed to create assignment.' };
    }

    return {
      success: true,
      data: {
        target: 'assignment',
        entityId: res.data.id,
        projectId: projId,
        message: `Created assignment "${res.data.title}" (${subject})`,
      },
    };
  }

  // 4. Habit Check-in Dispatch
  if (target === 'habit') {
    const habitId = parsed.payload.habitId;
    if (!habitId) {
      return { success: false, error: 'No matching habit found.' };
    }

    // Rule 4: If habit is already completed today, show "Already done" and do nothing
    if (parsed.payload.isAlreadyCompletedToday || effectiveChips.statusNote === 'Already done') {
      return {
        success: true,
        data: {
          target: 'habit',
          entityId: habitId,
          message: 'Already done',
          extra: {
            habitDate: parsed.payload.date || undefined,
            habitChanged: false,
          },
        },
      };
    }

    const res = await toggleHabitLog(habitId, parsed.payload.date || undefined);
    if (!res.success) {
      return { success: false, error: res.error || 'Failed to check in habit.' };
    }

    return {
      success: true,
      data: {
        target: 'habit',
        entityId: habitId,
        message: `Checked in "${effectiveChips.title || parsed.payload.habitTitle || 'habit'}"`,
        extra: {
          habitDate: parsed.payload.date || undefined,
          habitChanged: true,
        },
      },
    };
  }

  // 5. Fallback Note / Idea Dispatch (Nothing Lost)
  const noteTitle = effectiveChips.title || parsed.payload.title || 'Quick Captured Idea';
  const content = parsed.payload.content || trimmed;
  const fd = new FormData();
  fd.append('title', noteTitle);
  fd.append('content', content);
  if (parsed.projectSlug) {
    fd.append('tags', parsed.projectSlug);
  }

  const res = await createNote(null, fd);
  if (!res.success || !res.data) {
    return { success: false, error: res.error || 'Failed to save note.' };
  }

  return {
    success: true,
    data: {
      target: 'note',
      entityId: res.data.id,
      projectId: effectiveChips.projectId || parsed.payload.projectId || null,
      message: `Saved idea "${res.data.title}"`,
    },
  };
}

/**
 * 5-Second Undo Handler for Quick Capture.
 * Strictly uses the exact entity ID returned by the creation action.
 * Never performs "find latest" queries.
 */
export async function undoQuickCapture(
  target: 'transaction' | 'task' | 'note' | 'assignment' | 'habit',
  entityId: string,
  extra?: { habitDate?: string; habitChanged?: boolean }
): Promise<ActionResponse<{ undone: boolean }>> {
  if (!entityId && target !== 'habit') {
    return { success: false, error: 'Cannot undo without an entity ID.' };
  }

  try {
    switch (target) {
      case 'task': {
        const res = await deleteTask(entityId);
        return { success: res.success, error: res.error, data: { undone: true } };
      }
      case 'transaction': {
        const res = await deleteTransaction(entityId);
        return { success: res.success, error: res.error, data: { undone: true } };
      }
      case 'note': {
        const res = await deleteNote(entityId);
        return { success: res.success, error: res.error, data: { undone: true } };
      }
      case 'assignment': {
        const res = await deleteAssignment(entityId);
        return { success: res.success, error: res.error, data: { undone: true } };
      }
      case 'habit': {
        // Only undo if this capture actually changed the habit
        if (!extra?.habitChanged) {
          return { success: true, data: { undone: false } };
        }
        const res = await toggleHabitLog(entityId, extra.habitDate);
        return { success: res.success, error: res.error, data: { undone: true } };
      }
      default:
        return { success: false, error: 'Unknown target type' };
    }
  } catch (err) {
    return { success: false, error: formatErrorMessage(err) };
  }
}
