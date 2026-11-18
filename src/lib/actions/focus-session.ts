'use server';

import { randomUUID } from 'crypto';
import { createClient } from '@/lib/supabase/server';
import {
  DEV_BYPASS_MUTATION_ERROR,
  getAuthenticatedUser,
} from '@/lib/supabase/dev-auth';
import { revalidatePath } from 'next/cache';
import type { ActionResponse } from '@/types/action.types';
import { formatErrorMessage } from '@/lib/utils/errors';
import { validateFocusSessionPayload } from '@/lib/daily-loop/focus-timer-engine';
import type { PersistableFocusMode } from '@/lib/daily-loop/types';

export interface LogFocusSessionParams {
  /** Preferred exact duration in seconds (used by global focus timer) */
  durationSeconds?: number;
  /** Backwards-compatible duration in minutes */
  durationMinutes?: number;
  /** Optional planned session duration in seconds for ceiling validation */
  plannedDurationSeconds?: number;
  /** Client-generated UUID v4 used as UNIQUE idempotency key in public.focus_sessions */
  clientSessionId?: string;
  taskId?: string | null;
  projectId?: string | null;
  mode?: string;
  startedAt?: string;
  endedAt?: string;
  /** Backwards-compatible alias for endedAt */
  completedAt?: string;
}

export interface FocusSessionResult {
  recorded: boolean;
  clientSessionId: string;
  durationSeconds: number;
  durationMinutes: number;
  mode: PersistableFocusMode;
  taskId?: string | null;
  projectId?: string | null;
  message: string;
}

/**
 * Server Action: Records a completed focus session in public.focus_sessions.
 * - Sets user_id strictly from the authenticated Supabase session (never from client params).
 * - Enforces strict server validation (rejects break modes, non-positive duration,
 *   duration far above mode ceiling, and future ended_at).
 * - Uses ON CONFLICT (client_session_id) DO NOTHING (ignoreDuplicates: true) so retries
 *   and multi-tab races are idempotent and never create duplicates or error on conflict.
 */
export async function logFocusSession(
  params: LogFocusSessionParams
): Promise<ActionResponse<FocusSessionResult>> {
  try {
    const nowMs = Date.now();
    const durationSeconds =
      typeof params.durationSeconds === 'number'
        ? Math.round(params.durationSeconds)
        : typeof params.durationMinutes === 'number'
        ? Math.round(params.durationMinutes * 60)
        : 0;

    if (durationSeconds < 60) {
      return {
        success: false,
        error: 'Session under 1m not logged',
      };
    }

    const rawMode = (params.mode || 'pomodoro').toLowerCase().trim();
    const normalizedMode =
      rawMode === 'focus' || rawMode === 'sprint' || rawMode === 'pomodoro'
        ? 'pomodoro'
        : rawMode === 'deep-work' || rawMode === 'deep_work' || rawMode === 'deep'
        ? 'deep-work'
        : rawMode;

    const endedAt = params.endedAt || params.completedAt || new Date(nowMs).toISOString();
    const endedMs = Date.parse(endedAt);
    const startedAt =
      params.startedAt ||
      (Number.isFinite(endedMs)
        ? new Date(endedMs - Math.max(0, durationSeconds) * 1000).toISOString()
        : new Date(nowMs).toISOString());

    const clientSessionId = params.clientSessionId || randomUUID();

    // Strict server-side validation before touching auth/database
    const validation = validateFocusSessionPayload(
      {
        clientSessionId,
        mode: normalizedMode,
        durationSeconds,
        plannedDurationSeconds: params.plannedDurationSeconds,
        startedAt,
        endedAt,
      },
      nowMs
    );

    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const supabase = await createClient();
    const { user, isBypass } = await getAuthenticatedUser(supabase);
    if (isBypass || !user) {
      return { success: false, error: DEV_BYPASS_MUTATION_ERROR };
    }

    // Idempotent insert into public.focus_sessions (ON CONFLICT (client_session_id) DO NOTHING)
    const { error: upsertError } = await supabase
      .from('focus_sessions')
      .upsert(
        {
          user_id: user.id, // Always derived from authenticated session
          client_session_id: clientSessionId,
          task_id: params.taskId ?? null,
          project_id: params.projectId ?? null,
          duration_seconds: durationSeconds,
          started_at: startedAt,
          ended_at: endedAt,
          mode: validation.mode,
        },
        {
          onConflict: 'client_session_id',
          ignoreDuplicates: true,
        }
      );

    if (upsertError) {
      if (upsertError.code === '42P01') {
        console.warn('[FocusSession] Table focus_sessions does not exist (42P01).');
        return { success: false, error: 'Focus sessions table is not initialized.' };
      }
      console.error('[FocusSession] Error persisting focus_sessions row:', upsertError);
      return { success: false, error: formatErrorMessage(upsertError) };
    }

    // Touch linked task/project activity timestamps when bound
    if (params.taskId) {
      await supabase
        .from('tasks')
        .update({ updated_at: endedAt })
        .eq('id', params.taskId)
        .eq('user_id', user.id);
    }

    if (params.projectId) {
      await supabase
        .from('projects')
        .update({ updated_at: endedAt })
        .eq('id', params.projectId)
        .eq('user_id', user.id);
    }

    revalidatePath('/tasks');
    revalidatePath('/dashboard');
    revalidatePath('/');

    const durationMinutes = Math.max(1, Math.round(durationSeconds / 60));

    return {
      success: true,
      data: {
        recorded: true,
        clientSessionId,
        durationSeconds,
        durationMinutes,
        mode: validation.mode,
        taskId: params.taskId ?? null,
        projectId: params.projectId ?? null,
        message: `Successfully logged ${durationMinutes}m focus session.`,
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
    const { user, isBypass } = await getAuthenticatedUser(supabase);
    if (isBypass || !user) {
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
