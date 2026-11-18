import { create } from 'zustand';
import type { FocusTimerState, PendingFocusSession } from '@/lib/daily-loop/types';
import {
  acknowledgeSessionDone,
  createInitialFocusTimerState,
  discardPausedSession,
  markSessionSaved,
  markSessionSaveFailed,
  pauseFocusSession,
  reconcileFocusTimer,
  resumeFocusSession,
  skipBreakSession,
  startBreakSession,
  startFocusSession,
  stopFocusSessionEarly,
  type ReconcileResult,
} from '@/lib/daily-loop/focus-timer-engine';
import { logFocusSession } from '@/lib/actions/focus-session';

export const FOCUS_TIMER_STORAGE_KEY = 'lifeos_focus_timer_v1';

export type PersistFocusSessionFn = (
  session: PendingFocusSession
) => Promise<{ success: boolean; error?: string }>;

function generateClientSessionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback RFC4122 v4 UUID generator
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function readPersistedState(raw: string | null): FocusTimerState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<FocusTimerState>;
    if (!parsed || typeof parsed !== 'object') return null;
    const base = createInitialFocusTimerState();
    return {
      ...base,
      ...parsed,
      pendingUnsavedSessions: Array.isArray(parsed.pendingUnsavedSessions)
        ? parsed.pendingUnsavedSessions
        : [],
    };
  } catch {
    return null;
  }
}

function writePersistedState(state: FocusTimerState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(FOCUS_TIMER_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Gracefully ignore storage quota / private mode errors
  }
}

const defaultPersistFn: PersistFocusSessionFn = async (session) => {
  const res = await logFocusSession({
    clientSessionId: session.clientSessionId,
    mode: session.mode,
    durationSeconds: session.durationSeconds,
    plannedDurationSeconds: session.plannedDurationSeconds,
    startedAt: session.startedAt,
    endedAt: session.endedAt,
    taskId: session.taskId,
    projectId: session.projectId,
  });
  return { success: res.success, error: res.error };
};

const inFlightSessionIds = new Set<string>();

export interface FocusTimerStore {
  timer: FocusTimerState;
  hasHydrated: boolean;
  isSaving: boolean;
  userTimezone: string;
  isDevMockActive: boolean;

  hydrateFromStorage: () => void;
  syncFromStorageEvent: (rawValue: string | null) => void;
  setUserTimezone: (timezone: string) => void;
  setDevMockActive: (active: boolean) => void;

  startFocus: (params: {
    durationMinutes: number;
    taskId?: string | null;
    taskTitle?: string | null;
    projectId?: string | null;
    openFullscreen?: boolean;
  }) => void;
  pauseFocus: () => void;
  resumeFocus: () => void;
  discardPaused: () => void;
  stopEarly: () => { qualified: boolean; sessionToPersist: PendingFocusSession | null };
  reconcile: (nowMs?: number) => ReconcileResult;
  acknowledgeDone: () => void;
  startBreak: () => void;
  skipBreak: () => void;
  startAnother: () => void;
  openFullscreen: () => void;
  closeFullscreen: () => void;
  toggleSound: () => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  flushPendingSaves: (persistFn?: PersistFocusSessionFn) => Promise<{ savedCount: number }>;
  resetForTests: () => void;
}

export const useFocusTimerStore = create<FocusTimerStore>((set, get) => {
  const commit = (nextTimer: FocusTimerState) => {
    writePersistedState(nextTimer);
    set({ timer: nextTimer });
  };

  return {
    timer: createInitialFocusTimerState(),
    hasHydrated: false,
    isSaving: false,
    userTimezone: 'UTC',
    isDevMockActive: false,

    hydrateFromStorage: () => {
      if (typeof window === 'undefined') return;
      const raw = (() => {
        try {
          return window.localStorage.getItem(FOCUS_TIMER_STORAGE_KEY);
        } catch {
          return null;
        }
      })();
      const restored = readPersistedState(raw);
      const browserTz = (() => {
        try {
          return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
        } catch {
          return 'UTC';
        }
      })();

      if (restored) {
        const reconciled = reconcileFocusTimer(restored, Date.now());
        writePersistedState(reconciled.nextState);
        set((s) => ({
          timer: reconciled.nextState,
          hasHydrated: true,
          userTimezone: s.userTimezone === 'UTC' ? browserTz : s.userTimezone,
        }));
      } else {
        set((s) => ({
          hasHydrated: true,
          userTimezone: s.userTimezone === 'UTC' ? browserTz : s.userTimezone,
        }));
      }
    },

    syncFromStorageEvent: (rawValue: string | null) => {
      const restored = readPersistedState(rawValue);
      if (restored) {
        set({ timer: restored });
      }
    },

    setUserTimezone: (timezone: string) => {
      if (timezone) {
        set({ userTimezone: timezone });
      }
    },

    setDevMockActive: (active: boolean) => {
      const isDev = process.env.NODE_ENV !== 'production';
      set({ isDevMockActive: isDev && active });
    },

    startFocus: ({ durationMinutes, taskId, taskTitle, projectId, openFullscreen = true }) => {
      const next = startFocusSession(get().timer, {
        durationMinutes,
        taskId: taskId ?? null,
        taskTitle: taskTitle ?? null,
        projectId: projectId ?? null,
        clientSessionId: generateClientSessionId(),
        nowMs: Date.now(),
        openFullscreen,
      });
      commit(next);
    },

    pauseFocus: () => {
      const next = pauseFocusSession(get().timer, Date.now());
      commit(next);
    },

    resumeFocus: () => {
      const next = resumeFocusSession(get().timer, Date.now());
      commit(next);
    },

    discardPaused: () => {
      const next = discardPausedSession(get().timer);
      commit(next);
    },

    stopEarly: () => {
      const result = stopFocusSessionEarly(get().timer, Date.now());
      commit(result.nextState);
      return {
        qualified: result.qualified,
        sessionToPersist: result.sessionToPersist,
      };
    },

    reconcile: (nowMs = Date.now()) => {
      const current = get().timer;
      const result = reconcileFocusTimer(current, nowMs);
      if (result.nextState !== current) {
        commit(result.nextState);
      }
      return result;
    },

    acknowledgeDone: () => {
      const next = acknowledgeSessionDone(get().timer);
      commit(next);
    },

    startBreak: () => {
      const next = startBreakSession(get().timer, Date.now());
      commit(next);
    },

    skipBreak: () => {
      const next = skipBreakSession(get().timer);
      commit(next);
    },

    startAnother: () => {
      const current = get().timer;
      const next = startFocusSession(current, {
        durationMinutes: current.lastDurationMinutes || 25,
        taskId: current.taskId,
        taskTitle: current.taskTitle,
        projectId: current.projectId,
        clientSessionId: generateClientSessionId(),
        nowMs: Date.now(),
        openFullscreen: current.isFullscreenOpen,
      });
      commit(next);
    },

    openFullscreen: () => {
      commit({ ...get().timer, isFullscreenOpen: true });
    },

    closeFullscreen: () => {
      commit({ ...get().timer, isFullscreenOpen: false });
    },

    toggleSound: () => {
      const current = get().timer;
      commit({ ...current, soundEnabled: !current.soundEnabled });
    },

    setNotificationsEnabled: (enabled: boolean) => {
      commit({ ...get().timer, notificationsEnabled: enabled });
    },

    flushPendingSaves: async (persistFn = defaultPersistFn) => {
      const { timer, isDevMockActive } = get();
      const queue = [...timer.pendingUnsavedSessions];
      if (queue.length === 0) return { savedCount: 0 };

      // Strictly never write fake rows into Supabase while Dev Mock is ON
      if (isDevMockActive && process.env.NODE_ENV !== 'production') {
        let updated = get().timer;
        for (const item of queue) {
          updated = markSessionSaved(updated, item.clientSessionId);
        }
        commit(updated);
        return { savedCount: queue.length };
      }

      set({ isSaving: true });
      let savedCount = 0;

      try {
        for (const session of queue) {
          if (inFlightSessionIds.has(session.clientSessionId)) {
            continue;
          }
          inFlightSessionIds.add(session.clientSessionId);
          try {
            const res = await persistFn(session);
            if (res.success) {
              savedCount += 1;
              commit(markSessionSaved(get().timer, session.clientSessionId));
            } else {
              commit(
                markSessionSaveFailed(
                  get().timer,
                  res.error || "Couldn't save yet, retrying"
                )
              );
            }
          } catch {
            commit(
              markSessionSaveFailed(get().timer, "Couldn't save yet, retrying")
            );
          } finally {
            inFlightSessionIds.delete(session.clientSessionId);
          }
        }
      } finally {
        set({ isSaving: false });
      }

      return { savedCount };
    },

    resetForTests: () => {
      inFlightSessionIds.clear();
      set({
        timer: createInitialFocusTimerState(),
        hasHydrated: true,
        isSaving: false,
        userTimezone: 'UTC',
        isDevMockActive: false,
      });
    },
  };
});
