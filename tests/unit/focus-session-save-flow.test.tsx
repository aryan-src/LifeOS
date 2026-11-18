import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import type { User } from '@supabase/supabase-js';

const mockGetUser = vi.fn();
const mockUpsert = vi.fn();
const mockUpdateEq = vi.fn();
const mockCreateClient = vi.fn();

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: (...args: unknown[]) => mockCreateClient(...args),
}));

import { logFocusSession } from '@/lib/actions/focus-session';
import {
  DEV_BYPASS_NOTICE_MESSAGE,
  PROD_SAVE_RETRY_MESSAGE,
  createInitialFocusTimerState,
  getSaveNoticeContent,
} from '@/lib/daily-loop/focus-timer-engine';
import {
  FOCUS_TIMER_STORAGE_KEY,
  useFocusTimerStore,
  type PersistFocusSessionFn,
} from '@/lib/store/use-focus-timer-store';
import { SessionDoneView } from '@/components/focus/session-done-view';
import { FloatingTimerPill } from '@/components/focus/floating-timer-pill';
import type { PendingFocusSession } from '@/lib/daily-loop/types';

function setNodeEnv(value: string) {
  (process.env as Record<string, string | undefined>).NODE_ENV = value;
}

const VALID_SESSION_UUID = '33333333-3333-4333-8333-333333333333';

function createMemoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear() {
      map.clear();
    },
    getItem(key: string) {
      return map.has(key) ? map.get(key)! : null;
    },
    key(index: number) {
      return Array.from(map.keys())[index] ?? null;
    },
    removeItem(key: string) {
      map.delete(key);
    },
    setItem(key: string, value: string) {
      map.set(key, value);
    },
  };
}

describe('Focus Session Save Flow — Error Codes, Notices, Retry & Reload Survival', () => {
  const originalEnv = { ...process.env };
  const originalWindow = globalThis.window;

  beforeEach(() => {
    vi.clearAllMocks();
    useFocusTimerStore.getState().resetForTests();

    mockUpdateEq.mockResolvedValue({ error: null });
    mockUpsert.mockResolvedValue({ error: null });
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-real-123' } as User },
      error: null,
    });
    mockCreateClient.mockResolvedValue({
      auth: { getUser: (...args: unknown[]) => mockGetUser(...args) },
      from: vi.fn((table: string) => {
        if (table === 'focus_sessions') {
          return { upsert: (...args: unknown[]) => mockUpsert(...args) };
        }
        return {
          update: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: (...args: unknown[]) => mockUpdateEq(...args),
            })),
          })),
        };
      }),
    });
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    if (originalWindow === undefined) {
      delete (globalThis as { window?: unknown }).window;
    } else {
      globalThis.window = originalWindow;
    }
    vi.restoreAllMocks();
  });

  describe('logFocusSession structured { success, code, message } mapping', () => {
    it('returns code="validation" for short duration, break mode, and invalid task UUID', async () => {
      const shortRes = await logFocusSession({ durationSeconds: 30, mode: 'pomodoro' });
      expect(shortRes).toMatchObject({
        success: false,
        code: 'validation',
        message: 'Session under 1m not logged',
      });

      const breakRes = await logFocusSession({
        durationSeconds: 300,
        mode: 'short-break',
        clientSessionId: VALID_SESSION_UUID,
      });
      expect(breakRes.success).toBe(false);
      expect(breakRes.code).toBe('validation');
      expect(breakRes.message).toContain('Break modes are not accepted');

      const badTaskRes = await logFocusSession({
        durationSeconds: 660,
        mode: 'pomodoro',
        clientSessionId: VALID_SESSION_UUID,
        taskId: 't-1',
      });
      expect(badTaskRes).toMatchObject({
        success: false,
        code: 'validation',
        message: 'Invalid task_id UUID.',
      });
    });

    it('returns code="dev_bypass" when unauthenticated with DEV_BYPASS_AUTH=true in development', async () => {
      setNodeEnv('development');
      process.env.DEV_BYPASS_AUTH = 'true';
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

      const res = await logFocusSession({
        durationSeconds: 660,
        plannedDurationSeconds: 1500,
        mode: 'pomodoro',
        clientSessionId: VALID_SESSION_UUID,
      });

      expect(res).toMatchObject({
        success: false,
        code: 'dev_bypass',
        message: 'Connect Supabase to persist changes in dev mode',
      });
      expect(mockUpsert).not.toHaveBeenCalled();
    });

    it('returns code="not_authenticated" when unauthenticated outside dev bypass', async () => {
      setNodeEnv('production');
      process.env.DEV_BYPASS_AUTH = 'true';
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

      const res = await logFocusSession({
        durationSeconds: 660,
        plannedDurationSeconds: 1500,
        mode: 'pomodoro',
        clientSessionId: VALID_SESSION_UUID,
      });

      expect(res).toMatchObject({
        success: false,
        code: 'not_authenticated',
        message: 'Unauthorized',
      });
      expect(mockUpsert).not.toHaveBeenCalled();
    });

    it('returns code="db_error" including Postgres error code and message without swallowing it', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      mockUpsert.mockResolvedValue({
        error: {
          code: '42501',
          message: 'new row violates row-level security policy for table "focus_sessions"',
        },
      });

      const res = await logFocusSession({
        durationSeconds: 660,
        plannedDurationSeconds: 1500,
        mode: 'pomodoro',
        clientSessionId: VALID_SESSION_UUID,
      });

      expect(res.success).toBe(false);
      expect(res.code).toBe('db_error');
      expect(res.message).toBe(
        'Supabase error (42501): new row violates row-level security policy for table "focus_sessions"'
      );
    });

    it('returns code="unknown" when an unexpected runtime error is thrown', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      mockCreateClient.mockRejectedValueOnce(new Error('Network socket hang up'));

      const res = await logFocusSession({
        durationSeconds: 660,
        plannedDurationSeconds: 1500,
        mode: 'pomodoro',
        clientSessionId: VALID_SESSION_UUID,
      });

      expect(res).toMatchObject({
        success: false,
        code: 'unknown',
        message: 'Network socket hang up',
      });
    });

    it('returns code="ok" and uses idempotent onConflict client_session_id with ignoreDuplicates', async () => {
      const res = await logFocusSession({
        durationSeconds: 660,
        plannedDurationSeconds: 1500,
        mode: 'pomodoro',
        clientSessionId: VALID_SESSION_UUID,
        taskId: null,
        projectId: null,
      });

      expect(res.success).toBe(true);
      expect(res.code).toBe('ok');
      expect(res.data?.clientSessionId).toBe(VALID_SESSION_UUID);
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-real-123',
          client_session_id: VALID_SESSION_UUID,
          duration_seconds: 660,
          mode: 'pomodoro',
          task_id: null,
          project_id: null,
        }),
        {
          onConflict: 'client_session_id',
          ignoreDuplicates: true,
        }
      );
    });
  });

  describe('Notice text per error code (development vs production) & UI rendering', () => {
    it('shows real code and message in development and friendly text in production', () => {
      // Development mode
      setNodeEnv('development');

      const devBypass = getSaveNoticeContent({
        saveErrorCode: 'dev_bypass',
        saveError: 'Connect Supabase to persist changes in dev mode',
      });
      expect(devBypass.text).toContain(DEV_BYPASS_NOTICE_MESSAGE);
      expect(devBypass.text).toContain('dev_bypass');
      expect(devBypass.showSignInLink).toBe(true);
      expect(devBypass.showRetryButton).toBe(true);

      const devUnauth = getSaveNoticeContent({
        saveErrorCode: 'not_authenticated',
        saveError: 'Unauthorized',
      });
      expect(devUnauth.text).toContain('[not_authenticated]');
      expect(devUnauth.text).toContain('Unauthorized');
      expect(devUnauth.showSignInLink).toBe(true);

      const devDb = getSaveNoticeContent({
        saveErrorCode: 'db_error',
        saveError: 'Supabase error (42P01): relation "focus_sessions" does not exist',
      });
      expect(devDb.text).toContain('[db_error]');
      expect(devDb.text).toContain('42P01');
      expect(devDb.showSignInLink).toBe(false);

      const devValidation = getSaveNoticeContent({
        saveErrorCode: 'validation',
        saveError: 'ended_at cannot be in the future.',
      });
      expect(devValidation.text).toContain('[validation]');
      expect(devValidation.text).toContain('ended_at cannot be in the future.');

      // Production mode — never leaks raw DB/validation details
      setNodeEnv('production');

      const prodDb = getSaveNoticeContent({
        saveErrorCode: 'db_error',
        saveError: 'Supabase error (42P01): relation "focus_sessions" does not exist',
      });
      expect(prodDb.text).toBe(PROD_SAVE_RETRY_MESSAGE);
      expect(prodDb.text).not.toContain('42P01');
      expect(prodDb.showSignInLink).toBe(false);

      const prodUnauth = getSaveNoticeContent({
        saveErrorCode: 'not_authenticated',
        saveError: 'Unauthorized',
      });
      expect(prodUnauth.text).toBe(PROD_SAVE_RETRY_MESSAGE);
      expect(prodUnauth.showSignInLink).toBe(true);

      const prodDevBypass = getSaveNoticeContent({
        saveErrorCode: 'dev_bypass',
        saveError: 'Connect Supabase to persist changes in dev mode',
      });
      expect(prodDevBypass.text).toBe(DEV_BYPASS_NOTICE_MESSAGE);
      expect(prodDevBypass.showSignInLink).toBe(true);

      const saved = getSaveNoticeContent({ justSaved: true });
      expect(saved).toEqual({
        text: 'Saved',
        showSignInLink: false,
        showRetryButton: false,
        tone: 'emerald',
      });
    });

    it('renders Sign in link and Retry in SessionDoneView and FloatingTimerPill, and Saved on success', () => {
      setNodeEnv('production');

      const unauthDoneHtml = renderToString(
        <SessionDoneView
          minutesAdded={11}
          taskTitle={null}
          endedWhileAway={false}
          finishedAtMs={null}
          userTimezone="Asia/Kolkata"
          hasUnsavedRetry={true}
          saveError="Unauthorized"
          saveErrorCode="not_authenticated"
          lastSaveStatus="error"
          isSaving={false}
          onTakeBreak={() => {}}
          onStartAnother={() => {}}
          onDismiss={() => {}}
          onRetrySave={() => {}}
        />
      );
      expect(unauthDoneHtml).toContain('href="/login"');
      expect(unauthDoneHtml).toContain('Sign in');
      expect(unauthDoneHtml).toContain('Retry');

      const savedDoneHtml = renderToString(
        <SessionDoneView
          minutesAdded={11}
          taskTitle={null}
          endedWhileAway={false}
          finishedAtMs={null}
          userTimezone="Asia/Kolkata"
          hasUnsavedRetry={false}
          saveError={null}
          saveErrorCode={null}
          lastSaveStatus="saved"
          isSaving={false}
          onTakeBreak={() => {}}
          onStartAnother={() => {}}
          onDismiss={() => {}}
          onRetrySave={() => {}}
        />
      );
      expect(savedDoneHtml).toContain('Saved');
      expect(savedDoneHtml).not.toContain('Retry');

      const pendingSession: PendingFocusSession = {
        clientSessionId: VALID_SESSION_UUID,
        mode: 'pomodoro',
        durationSeconds: 660,
        plannedDurationSeconds: 1500,
        startedAt: '2026-11-18T04:50:00.000Z',
        endedAt: '2026-11-18T05:01:00.000Z',
        taskId: null,
        taskTitle: null,
        projectId: null,
      };
      const pillHtml = renderToString(
        <FloatingTimerPill
          timer={{
            ...createInitialFocusTimerState(),
            status: 'idle',
            pendingUnsavedSessions: [pendingSession],
            saveError: 'Connect Supabase to persist changes in dev mode',
            saveErrorCode: 'dev_bypass',
            lastSaveStatus: 'error',
          }}
          remainingSeconds={0}
          isDockHidden={false}
          isSaving={false}
          onOpenFullscreen={() => {}}
          onPause={() => {}}
          onResume={() => {}}
          onDiscard={() => {}}
          onSkipBreak={() => {}}
          onRetrySave={() => {}}
        />
      );
      expect(pillHtml).toContain(DEV_BYPASS_NOTICE_MESSAGE);
      expect(pillHtml).toContain('href="/login"');
      expect(pillHtml).toContain('Retry');
    });
  });

  describe('Retry recovery, idempotency, and reload persistence', () => {
    it('succeeds on Retry after a failed attempt, persists exactly one row, and never double-saves', async () => {
      const savedIds = new Set<string>();
      let upsertCalls = 0;

      const store = useFocusTimerStore.getState();
      store.startFocus({ durationMinutes: 25, taskId: null, taskTitle: null });
      const endMs = useFocusTimerStore.getState().timer.endTimestampMs!;
      useFocusTimerStore.getState().reconcile(endMs + 1000);

      expect(useFocusTimerStore.getState().timer.pendingUnsavedSessions).toHaveLength(1);

      // 1st attempt fails (not authenticated)
      const failPersist: PersistFocusSessionFn = async () => ({
        success: false,
        code: 'not_authenticated',
        message: 'Unauthorized',
      });
      const first = await useFocusTimerStore.getState().flushPendingSaves(failPersist);
      expect(first).toEqual({
        savedCount: 0,
        failedCode: 'not_authenticated',
        failedMessage: 'Unauthorized',
      });
      expect(useFocusTimerStore.getState().timer.pendingUnsavedSessions).toHaveLength(1);
      expect(useFocusTimerStore.getState().timer.saveErrorCode).toBe('not_authenticated');
      expect(useFocusTimerStore.getState().timer.lastSaveStatus).toBe('error');

      // 2nd attempt (Retry after sign-in, triggered concurrently twice) succeeds once with 1 row
      const okPersist: PersistFocusSessionFn = async (session) => {
        upsertCalls += 1;
        await new Promise((r) => setTimeout(r, 15));
        savedIds.add(session.clientSessionId);
        return { success: true, code: 'ok', message: 'Saved' };
      };

      const [retryA, retryB] = await Promise.all([
        useFocusTimerStore.getState().flushPendingSaves(okPersist),
        useFocusTimerStore.getState().flushPendingSaves(okPersist),
      ]);

      expect(retryA.savedCount + retryB.savedCount).toBe(1);
      expect(upsertCalls).toBe(1);
      expect(savedIds.size).toBe(1);

      const finalTimer = useFocusTimerStore.getState().timer;
      expect(finalTimer.pendingUnsavedSessions).toHaveLength(0);
      expect(finalTimer.isSaved).toBe(true);
      expect(finalTimer.saveError).toBeNull();
      expect(finalTimer.saveErrorCode).toBeNull();
      expect(finalTimer.lastSaveStatus).toBe('saved');

      // 3rd call is a no-op (never double-saves)
      const third = await useFocusTimerStore.getState().flushPendingSaves(okPersist);
      expect(third.savedCount).toBe(0);
      expect(upsertCalls).toBe(1);
    });

    it('keeps pending unsaved session in localStorage across a full page reload until confirmed saved', async () => {
      const storage = createMemoryStorage();
      (globalThis as unknown as { window: { localStorage: Storage } }).window = {
        localStorage: storage,
      };

      // Finish a session and fail to save (e.g., dev_bypass or offline)
      useFocusTimerStore.getState().startFocus({
        durationMinutes: 25,
        taskId: null,
        taskTitle: 'Reload Survival Session',
      });
      const sessionId = useFocusTimerStore.getState().timer.clientSessionId!;
      const endMs = useFocusTimerStore.getState().timer.endTimestampMs!;
      useFocusTimerStore.getState().reconcile(endMs + 500);

      await useFocusTimerStore.getState().flushPendingSaves(async () => ({
        success: false,
        code: 'dev_bypass',
        message: 'Connect Supabase to persist changes in dev mode',
      }));

      // Confirm localStorage holds the pending session
      const rawBeforeReload = storage.getItem(FOCUS_TIMER_STORAGE_KEY);
      expect(rawBeforeReload).toBeTruthy();
      expect(rawBeforeReload).toContain(sessionId);

      // Simulate full browser reload / navigation to /login and back
      useFocusTimerStore.getState().resetForTests();
      expect(useFocusTimerStore.getState().timer.pendingUnsavedSessions).toHaveLength(0);

      useFocusTimerStore.getState().hydrateFromStorage();

      const hydrated = useFocusTimerStore.getState().timer;
      expect(hydrated.pendingUnsavedSessions).toHaveLength(1);
      expect(hydrated.pendingUnsavedSessions[0].clientSessionId).toBe(sessionId);
      expect(hydrated.saveErrorCode).toBe('dev_bypass');

      // Retry after signing in saves the surviving session and clears storage queue
      const persisted: string[] = [];
      const res = await useFocusTimerStore.getState().flushPendingSaves(async (s) => {
        persisted.push(s.clientSessionId);
        return { success: true, code: 'ok', message: 'Saved' };
      });

      expect(res.savedCount).toBe(1);
      expect(persisted).toEqual([sessionId]);
      expect(useFocusTimerStore.getState().timer.pendingUnsavedSessions).toHaveLength(0);
      expect(useFocusTimerStore.getState().timer.lastSaveStatus).toBe('saved');
    });
  });
});
