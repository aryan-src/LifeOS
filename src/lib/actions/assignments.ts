'use server';

import { createClient } from '@/lib/supabase/server';
import { getEffectiveUserId } from '@/lib/auth/user';
import { revalidatePath } from 'next/cache';
import type { Assignment, AssignmentStatus } from '@/types/database.types';
import type { ActionResponse } from '@/types/action.types';
import { formatErrorMessage } from '@/lib/utils/errors';

export interface AssignmentWithProject extends Assignment {
  project?: {
    id: string;
    title: string;
    slug: string;
  } | null;
}

export interface CreateAssignmentInput {
  subject: string;
  title: string;
  due_date?: string | null;
  status?: AssignmentStatus;
  project_id?: string | null;
  marks_achieved?: number | null;
  total_marks?: number | null;
}

/**
 * Validates and normalizes date string strictly to YYYY-MM-DD
 * to prevent UTC midnight shifts in PostgreSQL date columns.
 */
function normalizeDateString(dateStr?: string | null): string | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const clean = dateStr.trim().split('T')[0];
  const parts = clean.split('-');
  if (parts.length === 3 && parts[0].length === 4 && parts[1].length === 2 && parts[2].length === 2) {
    return clean;
  }
  return null;
}

export interface GetAssignmentsResult {
  assignments: AssignmentWithProject[];
  error: string | null;
  isSchemaMissing: boolean;
}

/**
 * Fetches all assignments for the authenticated user, ordered by due date and status.
 */
export async function getAssignments(): Promise<AssignmentWithProject[]> {
  try {
    const supabase = await createClient();
    const effectiveUserId = await getEffectiveUserId(supabase);

    const { data, error } = await supabase
      .from('assignments')
      .select(`
        *,
        project:projects(id, title, slug)
      `)
      .eq('user_id', effectiveUserId)
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (error || !data) {
      if (error) console.error('Error fetching assignments:', error);
      return [];
    }

    return (data as any) || [];
  } catch (err) {
    console.error('Unhandled error in getAssignments:', err);
    return [];
  }
}

/**
 * Fetches assignments and captures explicit schema or network diagnostics.
 */
export async function getAssignmentsWithStatus(): Promise<GetAssignmentsResult> {
  try {
    const supabase = await createClient();
    const effectiveUserId = await getEffectiveUserId(supabase);

    const { data, error } = await supabase
      .from('assignments')
      .select(`
        *,
        project:projects(id, title, slug)
      `)
      .eq('user_id', effectiveUserId)
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (error) {
      const isSchemaMissing =
        (error as any)?.code === 'PGRST205' ||
        error.message?.includes('schema cache') ||
        error.message?.includes('does not exist') ||
        error.message?.includes('relation "public.');

      return {
        assignments: [],
        error: formatErrorMessage(error),
        isSchemaMissing,
      };
    }

    return {
      assignments: (data as any) || [],
      error: null,
      isSchemaMissing: false,
    };
  } catch (err) {
    const isSchemaMissing =
      String(err).includes('PGRST205') ||
      String(err).includes('schema cache') ||
      String(err).includes('does not exist');

    return {
      assignments: [],
      error: formatErrorMessage(err),
      isSchemaMissing,
    };
  }
}

/**
 * Creates a new assignment.
 * Enforces explicit session verification and strict YYYY-MM-DD date storage.
 */
export async function createAssignment(
  input: CreateAssignmentInput
): Promise<ActionResponse<AssignmentWithProject>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    const effectiveUserId = await getEffectiveUserId(supabase);
    if (authError && !effectiveUserId) {
      return { success: false, error: 'Authentication required to create assignments.' };
    }

    const subject = input.subject?.trim();
    const title = input.title?.trim();

    if (!subject) {
      return { success: false, error: 'Subject is required.' };
    }
    if (!title) {
      return { success: false, error: 'Assignment title is required.' };
    }

    const cleanDueDate = normalizeDateString(input.due_date);

    const { data: assignment, error: insertError } = await supabase
      .from('assignments')
      .insert({
        user_id: effectiveUserId,
        subject,
        title,
        due_date: cleanDueDate,
        status: input.status || 'not_started',
        project_id: input.project_id || null,
        marks_achieved: typeof input.marks_achieved === 'number' ? input.marks_achieved : null,
        total_marks: typeof input.total_marks === 'number' ? input.total_marks : null,
      })
      .select(`
        *,
        project:projects(id, title, slug)
      `)
      .single();

    if (insertError || !assignment) {
      console.error('Error creating assignment:', insertError);
      return { success: false, error: formatErrorMessage(insertError || 'Failed to create assignment.') };
    }

    revalidatePath('/assignments');
    revalidatePath('/');

    return { success: true, data: assignment as any };
  } catch (err) {
    console.error('Unhandled error in createAssignment:', err);
    return { success: false, error: formatErrorMessage(err) };
  }
}

/**
 * Updates the status of an assignment (e.g. from Kanban drag-and-drop or single-click action).
 */
export async function updateAssignmentStatus(
  id: string,
  status: AssignmentStatus
): Promise<ActionResponse<AssignmentWithProject>> {
  try {
    const supabase = await createClient();
    const effectiveUserId = await getEffectiveUserId(supabase);

    const { data, error } = await supabase
      .from('assignments')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', effectiveUserId)
      .select(`
        *,
        project:projects(id, title, slug)
      `)
      .single();

    if (error || !data) {
      console.error('Error updating assignment status:', error);
      return { success: false, error: formatErrorMessage(error || 'Failed to update assignment status.') };
    }

    revalidatePath('/assignments');
    revalidatePath('/');

    return { success: true, data: data as any };
  } catch (err) {
    console.error('Unhandled error in updateAssignmentStatus:', err);
    return { success: false, error: formatErrorMessage(err) };
  }
}

/**
 * Records marks achieved and total marks for an assignment, automatically transitioning
 * status to 'graded'.
 */
export async function gradeAssignment(
  id: string,
  marksAchieved: number,
  totalMarks: number
): Promise<ActionResponse<AssignmentWithProject>> {
  try {
    if (typeof marksAchieved !== 'number' || isNaN(marksAchieved) || marksAchieved < 0) {
      return { success: false, error: 'Marks achieved must be a non-negative number.' };
    }
    if (typeof totalMarks !== 'number' || isNaN(totalMarks) || totalMarks <= 0) {
      return { success: false, error: 'Total marks must be greater than zero.' };
    }
    if (marksAchieved > totalMarks) {
      return { success: false, error: 'Marks achieved cannot exceed total marks.' };
    }

    const supabase = await createClient();
    const effectiveUserId = await getEffectiveUserId(supabase);

    const { data, error } = await supabase
      .from('assignments')
      .update({
        marks_achieved: marksAchieved,
        total_marks: totalMarks,
        status: 'graded',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', effectiveUserId)
      .select(`
        *,
        project:projects(id, title, slug)
      `)
      .single();

    if (error || !data) {
      console.error('Error grading assignment:', error);
      return { success: false, error: formatErrorMessage(error || 'Failed to grade assignment.') };
    }

    revalidatePath('/assignments');
    revalidatePath('/');

    return { success: true, data: data as any };
  } catch (err) {
    console.error('Unhandled error in gradeAssignment:', err);
    return { success: false, error: formatErrorMessage(err) };
  }
}

/**
 * Updates an assignment's details.
 */
export async function updateAssignment(
  id: string,
  updates: Partial<CreateAssignmentInput>
): Promise<ActionResponse<AssignmentWithProject>> {
  try {
    const supabase = await createClient();
    const effectiveUserId = await getEffectiveUserId(supabase);

    const updatePayload: import('@/types/database.types').UpdateAssignment = {
      updated_at: new Date().toISOString(),
    };

    if (updates.subject !== undefined) updatePayload.subject = updates.subject.trim();
    if (updates.title !== undefined) updatePayload.title = updates.title.trim();
    if (updates.due_date !== undefined) updatePayload.due_date = normalizeDateString(updates.due_date);
    if (updates.status !== undefined) updatePayload.status = updates.status;
    if (updates.project_id !== undefined) updatePayload.project_id = updates.project_id;
    if (updates.marks_achieved !== undefined) updatePayload.marks_achieved = updates.marks_achieved;
    if (updates.total_marks !== undefined) updatePayload.total_marks = updates.total_marks;

    const { data, error } = await supabase
      .from('assignments')
      .update(updatePayload)
      .eq('id', id)
      .eq('user_id', effectiveUserId)
      .select(`
        *,
        project:projects(id, title, slug)
      `)
      .single();

    if (error || !data) {
      console.error('Error updating assignment:', error);
      return { success: false, error: formatErrorMessage(error || 'Failed to update assignment.') };
    }

    revalidatePath('/assignments');
    revalidatePath('/');

    return { success: true, data: data as any };
  } catch (err) {
    console.error('Unhandled error in updateAssignment:', err);
    return { success: false, error: formatErrorMessage(err) };
  }
}

/**
 * Deletes an assignment by id.
 */
export async function deleteAssignment(id: string): Promise<ActionResponse<void>> {
  try {
    const supabase = await createClient();
    const effectiveUserId = await getEffectiveUserId(supabase);

    const { error } = await supabase
      .from('assignments')
      .delete()
      .eq('id', id)
      .eq('user_id', effectiveUserId);

    if (error) {
      console.error('Error deleting assignment:', error);
      return { success: false, error: formatErrorMessage(error || 'Failed to delete assignment.') };
    }

    revalidatePath('/assignments');
    revalidatePath('/');

    return { success: true };
  } catch (err) {
    console.error('Unhandled error in deleteAssignment:', err);
    return { success: false, error: formatErrorMessage(err) };
  }
}
