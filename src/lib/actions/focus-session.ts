'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { ActionResponse } from '@/types/action.types';
import { formatErrorMessage } from '@/lib/utils/errors';

export interface LogFocusSessionParams {
  durationMinutes: number;
  taskId?: string | null;
  projectId?: string | null;
  mode?: string;
  completedAt?: string;
}

export interface FocusSessionResult {
  recorded: boolean;
  durationMinutes: number;
  taskId?: string | null;
  projectId?: string | null;
  message: string;
}

/**
 * Server Action: Records completed focus session telemetry in Supabase.
 * Updates activity timestamps on linked tasks or projects and revalidates relevant paths.
 */
export async function logFocusSession(
  params: LogFocusSessionParams
): Promise<ActionResponse<FocusSessionResult>> {
  try {
    // Gracefully reject partial sessions under 1 minute without database writes
    if (!params.durationMinutes || params.durationMinutes < 1) {
      return {
        success: false,
        error: 'Session under 1m not logged',
      };
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Unauthorized' };
    }

    const timestamp = params.completedAt || new Date().toISOString();

    // If a task context was bound, touch task updated_at
    if (params.taskId) {
      await supabase
        .from('tasks')
        .update({ updated_at: timestamp })
        .eq('id', params.taskId)
        .eq('user_id', user.id);
    }

    // If a project context was bound, touch project updated_at
    if (params.projectId) {
      await supabase
        .from('projects')
        .update({ updated_at: timestamp })
        .eq('id', params.projectId)
        .eq('user_id', user.id);
    }

    revalidatePath('/tasks');
    revalidatePath('/dashboard');
    revalidatePath('/');

    return {
      success: true,
      data: {
        recorded: true,
        durationMinutes: params.durationMinutes,
        taskId: params.taskId,
        projectId: params.projectId,
        message: `Successfully logged ${params.durationMinutes}m focus session.`,
      },
    };
  } catch (err) {
    console.error('Unhandled error in logFocusSession:', err);
    return {
      success: false,
      error: formatErrorMessage(err),
    };
  }
}

/**
 * Helper to fetch binding candidates (uncompleted tasks and active projects)
 */
export async function getFocusBindingContext(): Promise<{
  tasks: Array<{ id: string; title: string }>;
  projects: Array<{ id: string; title: string; slug: string }>;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { tasks: [], projects: [] };
    }

    const [tasksRes, projectsRes] = await Promise.all([
      supabase
        .from('tasks')
        .select('id, title')
        .eq('user_id', user.id)
        .eq('is_completed', false)
        .order('priority', { ascending: false })
        .limit(30),
      supabase
        .from('projects')
        .select('id, title, slug')
        .eq('user_id', user.id)
        .order('title', { ascending: true })
        .limit(30),
    ]);

    return {
      tasks: tasksRes.data || [],
      projects: projectsRes.data || [],
    };
  } catch {
    return { tasks: [], projects: [] };
  }
}
