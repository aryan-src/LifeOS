import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { User } from '@supabase/supabase-js';

const mockFrom = vi.fn();
const mockGetUser = vi.fn();

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  unstable_cache: vi.fn((fn: () => unknown) => fn),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: (...args: unknown[]) => mockGetUser(...args),
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    },
    from: (...args: unknown[]) => mockFrom(...args),
  }),
}));

import {
  DEV_BYPASS_MUTATION_ERROR,
  getAuthenticatedUser,
  isDevAuthBypassEnabled,
} from '@/lib/supabase/dev-auth';
import { getNotes, createNote } from '@/lib/actions/notes';
import {
  getAssignments,
  getAssignmentsWithStatus,
  createAssignment,
} from '@/lib/actions/assignments';
import { getTasks, createTask } from '@/lib/actions/tasks';
import { getHabits, createHabit, toggleHabitLog } from '@/lib/actions/habits';
import { getProjectOptions } from '@/lib/actions/projects-options';
import { getProjectsWithMetrics, createProject } from '@/lib/actions/projects';
import {
  getCategories,
  getTransactions,
  getFinancialAnalytics,
  createTransaction,
} from '@/lib/actions/finances';
import {
  getDailyLoopDashboardData,
  upsertDailyCheckIn,
} from '@/lib/actions/daily-loop';
import {
  getFocusBindingContext,
  logFocusSession,
} from '@/lib/actions/focus-session';
import { getFullAccountExport } from '@/lib/actions/export';
import { dispatchQuickCapture } from '@/lib/actions/quick-capture';
import { updateUserTimezone } from '@/lib/actions/profile';

function setNodeEnv(value: string) {
  (process.env as Record<string, string | undefined>).NODE_ENV = value;
}

describe('Dev Auth Bypass Helper & Server Action Guards', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  describe('isDevAuthBypassEnabled', () => {
    it('returns true only when NODE_ENV=development and DEV_BYPASS_AUTH=true', () => {
      setNodeEnv('development');
      process.env.DEV_BYPASS_AUTH = 'true';
      expect(isDevAuthBypassEnabled()).toBe(true);
    });

    it('returns false in production even when DEV_BYPASS_AUTH=true', () => {
      setNodeEnv('production');
      process.env.DEV_BYPASS_AUTH = 'true';
      expect(isDevAuthBypassEnabled()).toBe(false);
    });

    it('returns false in development when DEV_BYPASS_AUTH is unset or false', () => {
      setNodeEnv('development');
      delete process.env.DEV_BYPASS_AUTH;
      expect(isDevAuthBypassEnabled()).toBe(false);

      process.env.DEV_BYPASS_AUTH = 'false';
      expect(isDevAuthBypassEnabled()).toBe(false);
    });
  });

  describe('getAuthenticatedUser', () => {
    it('returns { user, isBypass: false } when authenticated regardless of bypass flag', async () => {
      setNodeEnv('development');
      process.env.DEV_BYPASS_AUTH = 'true';

      const mockUser = { id: 'user-123', email: 'test@lifeos.dev' } as User;
      const result = await getAuthenticatedUser({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
      });

      expect(result).toEqual({ user: mockUser, isBypass: false });
    });

    it('returns { user: null, isBypass: true } when unauthenticated in dev bypass mode', async () => {
      setNodeEnv('development');
      process.env.DEV_BYPASS_AUTH = 'true';

      const result = await getAuthenticatedUser({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: null,
          }),
        },
      });

      expect(result).toEqual({ user: null, isBypass: true });
    });

    it('throws Unauthorized in production even if DEV_BYPASS_AUTH=true', async () => {
      setNodeEnv('production');
      process.env.DEV_BYPASS_AUTH = 'true';

      await expect(
        getAuthenticatedUser({
          auth: {
            getUser: vi.fn().mockResolvedValue({
              data: { user: null },
              error: null,
            }),
          },
        })
      ).rejects.toThrow('Unauthorized');
    });
  });

  describe('Read Server Actions in Dev Bypass Mode', () => {
    it('returns safe empty/default fallbacks without throwing or logging Unauthorized errors', async () => {
      setNodeEnv('development');
      process.env.DEV_BYPASS_AUTH = 'true';

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const [
        notes,
        assignments,
        assignmentsStatus,
        tasks,
        habitsRes,
        projectOptions,
        projectsMetrics,
        categories,
        transactions,
        analytics,
        dailyLoop,
        focusCtx,
        accountExport,
      ] = await Promise.all([
        getNotes(),
        getAssignments(),
        getAssignmentsWithStatus(),
        getTasks(),
        getHabits(),
        getProjectOptions(),
        getProjectsWithMetrics(),
        getCategories(),
        getTransactions(),
        getFinancialAnalytics(),
        getDailyLoopDashboardData(),
        getFocusBindingContext(),
        getFullAccountExport(),
      ]);

      expect(notes).toEqual([]);
      expect(assignments).toEqual([]);
      expect(assignmentsStatus).toEqual({
        assignments: [],
        error: null,
        isSchemaMissing: false,
      });
      expect(tasks).toEqual([]);
      expect(habitsRes).toEqual({
        habits: [],
        error: null,
        isSchemaMissing: false,
      });
      expect(projectOptions).toEqual([]);
      expect(projectsMetrics).toEqual([]);
      expect(categories).toEqual([]);
      expect(transactions).toEqual([]);
      expect(analytics.monthlySpent).toBe(0);
      expect(dailyLoop.lifeScore.total).toBe(0);
      expect(focusCtx).toEqual({ tasks: [], projects: [] });
      expect(accountExport.success).toBe(true);
      expect(accountExport.data?.tasks).toEqual([]);

      expect(mockFrom).not.toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });

  describe('Mutation Server Actions in Dev Bypass Mode vs Production', () => {
    it('returns clean dev-bypass error without throwing or querying tables', async () => {
      setNodeEnv('development');
      process.env.DEV_BYPASS_AUTH = 'true';

      const noteForm = new FormData();
      noteForm.append('title', 'Test Note');
      noteForm.append('content', 'Some body');

      const taskForm = new FormData();
      taskForm.append('title', 'Test Task');
      taskForm.append('priority', '2');

      const habitForm = new FormData();
      habitForm.append('title', 'Morning Walk');

      const projectForm = new FormData();
      projectForm.append('title', 'LifeOS');

      const txForm = new FormData();
      txForm.append('description', 'Coffee');
      txForm.append('amount', '150');
      txForm.append('type', 'expense');

      const [
        noteRes,
        taskRes,
        assignmentRes,
        habitRes,
        toggleHabitRes,
        projectRes,
        txRes,
        checkInRes,
        focusRes,
        captureRes,
        tzRes,
      ] = await Promise.all([
        createNote(null, noteForm),
        createTask(null, taskForm),
        createAssignment({ subject: 'CS', title: 'Lab 1' }),
        createHabit(null, habitForm),
        toggleHabitLog('11111111-1111-4111-8111-111111111111', '2026-11-18'),
        createProject(null, projectForm),
        createTransaction(null, txForm),
        upsertDailyCheckIn({ mood: 'good' }),
        logFocusSession({ durationSeconds: 1500, mode: 'pomodoro' }),
        dispatchQuickCapture('task Buy notebooks'),
        updateUserTimezone('Asia/Kolkata'),
      ]);

      for (const res of [
        noteRes,
        taskRes,
        assignmentRes,
        habitRes,
        toggleHabitRes,
        projectRes,
        txRes,
        checkInRes,
        focusRes,
        captureRes,
        tzRes,
      ]) {
        expect(res).toEqual({
          success: false,
          error: DEV_BYPASS_MUTATION_ERROR,
        });
      }

      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('rejects unauthenticated mutations in production even when DEV_BYPASS_AUTH=true', async () => {
      setNodeEnv('production');
      process.env.DEV_BYPASS_AUTH = 'true';

      const noteForm = new FormData();
      noteForm.append('title', 'Test Note');
      noteForm.append('content', 'Some body');

      await expect(createNote(null, noteForm)).rejects.toThrow('Unauthorized');

      const focusRes = await logFocusSession({
        durationSeconds: 1500,
        mode: 'pomodoro',
      });
      expect(focusRes).toEqual({ success: false, error: 'Unauthorized' });
    });
  });
});
