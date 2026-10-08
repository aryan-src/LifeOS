'use server';

import { createClient } from '@/lib/supabase/server';
import { getEffectiveUserId } from '@/lib/auth/user';
import { revalidatePath } from 'next/cache';
import { parseQuickCapture } from '@/lib/parser/quick-capture';
import type { ActionResponse } from '@/types/action.types';
import { formatErrorMessage } from '@/lib/utils/errors';
import { getTodayDate } from '@/lib/utils/date';

export interface DispatchResult {
  target: 'transaction' | 'task' | 'note' | 'assignment';
  message: string;
  projectId?: string | null;
  entityId: string;
}

/**
 * Route Dispatcher for Quick Capture Omnibar.
 * Parses input and routes dynamically to projects, tasks, finances, or notes.
 * Uses idx_projects_slug index for instantaneous foreign key resolution.
 */
export async function dispatchQuickCapture(
  rawInput: string
): Promise<ActionResponse<DispatchResult>> {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return { success: false, error: 'Input cannot be empty.' };
  }

  const parsed = parseQuickCapture(trimmed);
  const supabase = await createClient();
  const effectiveUserId = await getEffectiveUserId(supabase);

  // 1. Resolve project_id via indexed slug lookup if present
  let resolvedProjectId: string | null = null;
  let resolvedProjectTitle: string | null = null;

  if (parsed.projectSlug) {
    const { data: project } = await supabase
      .from('projects')
      .select('id, title, slug')
      .eq('user_id', effectiveUserId)
      .eq('slug', parsed.projectSlug)
      .maybeSingle();

    if (project) {
      resolvedProjectId = project.id;
      resolvedProjectTitle = project.title;
    }
  }

  // 2. Dispatch to Target Module
  if (parsed.target === 'transaction') {
    const amount = parsed.payload.amount || 0;
    const type = parsed.payload.type || 'expense';
    const description = parsed.payload.description || 'Quick Capture Transaction';
    const date = parsed.payload.dueDate || getTodayDate();

    const { data: tx, error: txErr } = await supabase
      .from('transactions')
      .insert({
        user_id: effectiveUserId,
        amount,
        type,
        description,
        date,
        project_id: resolvedProjectId,
      })
      .select('id')
      .single();

    if (txErr || !tx) {
      console.error('Quick capture transaction error:', txErr);
      return { success: false, error: formatErrorMessage(txErr || 'Failed to record transaction.') };
    }

    revalidatePath('/finances');
    revalidatePath('/projects');
    revalidatePath('/');

    const sign = amount >= 0 ? '+' : '-';
    const projectInfo = resolvedProjectTitle ? ` tied to #${parsed.projectSlug}` : '';
    return {
      success: true,
      data: {
        target: 'transaction',
        entityId: tx.id,
        projectId: resolvedProjectId,
        message: `Logged ${sign}$${Math.abs(amount).toFixed(2)} (${description})${projectInfo}`,
      },
    };
  }

  if (parsed.target === 'task') {
    const title = parsed.payload.title || 'Untitled task';
    const dueDate = parsed.payload.dueDate || null;
    const priority = parsed.payload.priority || 2;

    const { data: task, error: taskErr } = await supabase
      .from('tasks')
      .insert({
        user_id: effectiveUserId,
        title,
        due_date: dueDate,
        priority,
        project_id: resolvedProjectId,
        is_completed: false,
      })
      .select('id')
      .single();

    if (taskErr || !task) {
      console.error('Quick capture task error:', taskErr);
      return { success: false, error: formatErrorMessage(taskErr || 'Failed to create task.') };
    }

    revalidatePath('/tasks');
    revalidatePath('/projects');
    revalidatePath('/');

    const projectInfo = resolvedProjectTitle ? ` under #${parsed.projectSlug}` : '';
    const dueInfo = dueDate ? ` due ${dueDate}` : '';
    return {
      success: true,
      data: {
        target: 'task',
        entityId: task.id,
        projectId: resolvedProjectId,
        message: `Created task "${title}"${dueInfo}${projectInfo}`,
      },
    };
  }

  if (parsed.target === 'assignment') {
    const title = parsed.payload.title || 'Untitled Assignment';
    const subject = parsed.payload.subject || 'General';
    const dueDate = parsed.payload.dueDate || null;

    const { data: assignment, error: assignmentErr } = await supabase
      .from('assignments')
      .insert({
        user_id: effectiveUserId,
        title,
        subject,
        due_date: dueDate,
        status: 'not_started',
        project_id: resolvedProjectId,
      })
      .select('id')
      .single();

    if (assignmentErr || !assignment) {
      console.error('Quick capture assignment error:', assignmentErr);
      return { success: false, error: formatErrorMessage(assignmentErr || 'Failed to create assignment.') };
    }

    revalidatePath('/assignments');
    revalidatePath('/projects');
    revalidatePath('/');

    const projectInfo = resolvedProjectTitle ? ` under #${parsed.projectSlug}` : '';
    const dueInfo = dueDate ? ` due ${dueDate}` : '';
    return {
      success: true,
      data: {
        target: 'assignment',
        entityId: assignment.id,
        projectId: resolvedProjectId,
        message: `Created assignment "${title}" (${subject})${dueInfo}${projectInfo}`,
      },
    };
  }

  // Fallback: Note / Idea
  const noteTitle = parsed.payload.title || 'Quick Captured Idea';
  const content = parsed.payload.content || trimmed;

  const { data: note, error: noteErr } = await supabase
    .from('notes')
    .insert({
      user_id: effectiveUserId,
      title: noteTitle,
      content,
      tags: parsed.projectSlug ? [parsed.projectSlug] : [],
      project_id: resolvedProjectId,
    })
    .select('id')
    .single();

  if (noteErr || !note) {
    console.error('Quick capture note error:', noteErr);
    return { success: false, error: formatErrorMessage(noteErr || 'Failed to save note.') };
  }

  revalidatePath('/notes');
  revalidatePath('/');

  return {
    success: true,
    data: {
      target: 'note',
      entityId: note.id,
      projectId: resolvedProjectId,
      message: `Saved idea to scratchpad${resolvedProjectTitle ? ` tagged to #${parsed.projectSlug}` : ''}`,
    },
  };
}
