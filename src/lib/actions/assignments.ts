'use server';

import { createClient } from '@/lib/supabase/server';
import { requireUserId } from '@/lib/auth/user';
import { revalidatePath } from 'next/cache';
import type { Assignment, AssignmentStatus } from '@/types/database.types';
import type { ActionResponse } from '@/types/action.types';
import { formatErrorMessage } from '@/lib/utils/errors';
import {
  createAssignmentSchema,
  updateAssignmentStatusSchema,
  gradeAssignmentSchema,
  deleteAssignmentSchema,
  uuidSchema,
  formatZodError,
} from '@/lib/validations';

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
    const effectiveUserId = await requireUserId(supabase);

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
      console.error('Error fetching assignments:', error);
      return [];
    }

    return (data as unknown as AssignmentWithProject[]) || [];
  } catch (err) {
    console.error('Unhandled error in getAssignments:', err);
    return [];
  }
}

/**
 * Enhanced fetcher returning structured status including missing table detection.
 */
export async function getAssignmentsWithStatus(): Promise<GetAssignmentsResult> {
  try {
    const supabase = await createClient();
    const effectiveUserId = await requireUserId(supabase);

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
      const errCode = (error as { code?: string })?.code;
      const isSchemaMissing =
        errCode === 'PGRST205' ||
        errCode === '42P01' ||
        error.message?.includes('does not exist') ||
        error.message?.includes('relation "public.assignments"');

      return {
        assignments: [],
        error: isSchemaMissing ? null : formatErrorMessage(error),
        isSchemaMissing: Boolean(isSchemaMissing),
      };
    }

    return {
      assignments: (data as unknown as AssignmentWithProject[]) || [],
      error: null,
      isSchemaMissing: false,
    };
  } catch (err) {
    const isSchemaMissing =
      typeof err === 'object' &&
      err !== null &&
      'message' in err &&
      typeof (err as { message: unknown }).message === 'string' &&
      ((err as { message: string }).message.includes('relation "public.assignments"') ||
        (err as { message: string }).message.includes('does not exist'));

    return {
      assignments: [],
      error: formatErrorMessage(err),
      isSchemaMissing,
    };
  }
}

/**
 * Creates a new assignment with Zod validation.
 */
export async function createAssignment(
  input: CreateAssignmentInput
): Promise<ActionResponse<AssignmentWithProject>> {
  const parsed = createAssignmentSchema.safeParse({
    subject: input.subject,
    title: input.title,
    due_date: normalizeDateString(input.due_date),
    status: input.status || 'not_started',
    project_id: input.project_id || null,
    marks_achieved: input.marks_achieved,
    total_marks: input.total_marks,
  });

  if (!parsed.success) {
    return { success: false, error: formatZodError(parsed.error) };
  }

  try {
    const supabase = await createClient();
    const effectiveUserId = await requireUserId(supabase);

    const { data: assignment, error: insertError } = await supabase
      .from('assignments')
      .insert({
        user_id: effectiveUserId,
        subject: parsed.data.subject,
        title: parsed.data.title,
        due_date: parsed.data.due_date || null,
        status: parsed.data.status,
        project_id: parsed.data.project_id || null,
        marks_achieved: typeof parsed.data.marks_achieved === 'number' ? parsed.data.marks_achieved : null,
        total_marks: typeof parsed.data.total_marks === 'number' ? parsed.data.total_marks : null,
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
    revalidatePath('/dashboard');
    revalidatePath('/');

    return { success: true, data: assignment as unknown as AssignmentWithProject };
  } catch (err) {
    console.error('Unhandled error in createAssignment:', err);
    return { success: false, error: formatErrorMessage(err) };
  }
}

/**
 * Updates the status of an assignment with Zod validation.
 */
export async function updateAssignmentStatus(
  id: string,
  status: AssignmentStatus
): Promise<ActionResponse<AssignmentWithProject>> {
  const parsed = updateAssignmentStatusSchema.safeParse({ id, status });
  if (!parsed.success) {
    return { success: false, error: formatZodError(parsed.error) };
  }

  try {
    const supabase = await createClient();
    const effectiveUserId = await requireUserId(supabase);

    const { data, error } = await supabase
      .from('assignments')
      .update({ status: parsed.data.status, updated_at: new Date().toISOString() })
      .eq('id', parsed.data.id)
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
    revalidatePath('/dashboard');
    revalidatePath('/');

    return { success: true, data: data as unknown as AssignmentWithProject };
  } catch (err) {
    console.error('Unhandled error in updateAssignmentStatus:', err);
    return { success: false, error: formatErrorMessage(err) };
  }
}

/**
 * Records marks achieved and total marks for an assignment with Zod validation.
 */
export async function gradeAssignment(
  id: string,
  marksAchieved: number,
  totalMarks: number
): Promise<ActionResponse<AssignmentWithProject>> {
  const parsed = gradeAssignmentSchema.safeParse({
    id,
    marks_achieved: marksAchieved,
    total_marks: totalMarks,
  });

  if (!parsed.success) {
    return { success: false, error: formatZodError(parsed.error) };
  }

  try {
    const supabase = await createClient();
    const effectiveUserId = await requireUserId(supabase);

    const { data, error } = await supabase
      .from('assignments')
      .update({
        marks_achieved: parsed.data.marks_achieved,
        total_marks: parsed.data.total_marks,
        status: 'graded',
        updated_at: new Date().toISOString(),
      })
      .eq('id', parsed.data.id)
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
    revalidatePath('/dashboard');
    revalidatePath('/');

    return { success: true, data: data as unknown as AssignmentWithProject };
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
  const idParsed = uuidSchema.safeParse(id);
  if (!idParsed.success) {
    return { success: false, error: 'Invalid assignment ID.' };
  }

  try {
    const supabase = await createClient();
    const effectiveUserId = await requireUserId(supabase);

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
      .eq('id', idParsed.data)
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
    revalidatePath('/dashboard');
    revalidatePath('/');

    return { success: true, data: data as unknown as AssignmentWithProject };
  } catch (err) {
    console.error('Unhandled error in updateAssignment:', err);
    return { success: false, error: formatErrorMessage(err) };
  }
}

/**
 * Deletes an assignment by id.
 */
export async function deleteAssignment(id: string): Promise<ActionResponse<void>> {
  const idParsed = deleteAssignmentSchema.safeParse({ id });
  if (!idParsed.success) {
    return { success: false, error: formatZodError(idParsed.error) };
  }

  try {
    const supabase = await createClient();
    const effectiveUserId = await requireUserId(supabase);

    const { error } = await supabase
      .from('assignments')
      .delete()
      .eq('id', idParsed.data.id)
      .eq('user_id', effectiveUserId);

    if (error) {
      console.error('Error deleting assignment:', error);
      return { success: false, error: formatErrorMessage(error || 'Failed to delete assignment.') };
    }

    revalidatePath('/assignments');
    revalidatePath('/dashboard');
    revalidatePath('/');

    return { success: true };
  } catch (err) {
    console.error('Unhandled error in deleteAssignment:', err);
    return { success: false, error: formatErrorMessage(err) };
  }
}
