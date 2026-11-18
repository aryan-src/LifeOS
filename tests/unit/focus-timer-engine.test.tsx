import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import {
  acknowledgeSessionDone,
  BREAK_DURATION_SECONDS,
  computeActiveElapsedSeconds,
  computeRemainingSeconds,
  createInitialFocusTimerState,
  discardPausedSession,
  MIN_EARLY_EXIT_SECONDS,
  pauseFocusSession,
  reconcileFocusTimer,
  resumeFocusSession,
  skipBreakSession,
  STALE_PAUSE_THRESHOLD_MS,
  startBreakSession,
  startFocusSession,
  stopFocusSessionEarly,
  validateFocusSessionPayload,
} from '@/lib/daily-loop/focus-timer-engine';
import {
  formatTimeInTimezone,
  getFocusSessionDay,
  isFocusMode,
} from '@/lib/daily-loop/business-logic';
import {
  claimSessionCompletionAlert,
  resetAlertClaimsForTests,
  type StorageLike,
} from '@/lib/daily-loop/focus-alerts';
import { useFocusTimerStore } from '@/lib/store/use-focus-timer-store';
import { logFocusSession } from '@/lib/actions/focus-session';
import { FloatingTimerPill } from '@/components/focus/floating-timer-pill';
import { SessionDoneView } from '@/components/focus/session-done-view';
import { FocusSanctuaryOverlay } from '@/components/focus/focus-sanctuary-overlay';
import type { PendingFocusSession } from '@/lib/daily-loop/types';

const TEST_UUID_1 = '11111111-1111-4111-8111-111111111111';
const TEST_UUID_2 = '22222222-2222-4222-8222-222222222222';

describe('Global Focus Timer — Pure State Machine & Edge Cases', () => {
  it('transitions cleanly through idle -> running -> paused -> running -> finished -> break -> idle', () => {
    const t0 = Date.parse('2026-11-18T09:00:00Z');
    let state = createInitialFocusTimerState();
    expect(state.status).toBe('idle');

    // Start 25m focus session
    state = startFocusSession(state, {
      durationMinutes: 25,
      taskId: 'task-1',
      taskTitle: 'Revise OS Ch. 4',
      clientSessionId: TEST_UUID_1,
      nowMs: t0,
    });
    expect(state.status).toBe('running');
    expect(state.mode).toBe('pomodoro');
    expect(state.endTimestampMs).toBe(t0 + 25 * 60 * 1000);
    expect(computeRemainingSeconds(state, t0 + 5 * 60 * 1000)).toBe(20 * 60);

    // Pause after 5m
    const tPause = t0 + 5 * 60 * 1000;
    state = pauseFocusSession(state, tPause);
    expect(state.status).toBe('paused');
    expect(state.endTimestampMs).toBeNull();
    expect(state.remainingSecondsWhenPaused).toBe(20 * 60);

    // Resume after 10m paused
    const tResume = tPause + 10 * 60 * 1000;
    state = resumeFocusSession(state, tResume);
    expect(state.status).toBe('running');
    expect(state.endTimestampMs).toBe(tResume + 20 * 60 * 1000);
    expect(state.accumulatedPausedMs).toBe(10 * 60 * 1000);

    // Natural finish at exact endTimestampMs
    const tEnd = tResume + 20 * 60 * 1000;
    const finished = reconcileFocusTimer(state, tEnd);
    expect(finished.nextState.status).toBe('finished');
    expect(finished.justFinishedSession?.durationSeconds).toBe(25 * 60);
    expect(finished.justFinishedSession?.clientSessionId).toBe(TEST_UUID_1);
    expect(finished.nextState.endedWhileAway).toBe(false);
    expect(finished.nextState.isAcknowledged).toBe(false);

    // Take 5 min break
    state = startBreakSession(finished.nextState, tEnd + 1000);
    expect(state.status).toBe('break');
    expect(state.mode).toBe('short-break');
    expect(state.isAcknowledged).toBe(true);
    expect(computeRemainingSeconds(state, tEnd + 1000)).toBe(BREAK_DURATION_SECONDS);

    // Break finishes -> returns to idle, never enqueues a focus_sessions row
    const afterBreak = reconcileFocusTimer(state, tEnd + 1000 + BREAK_DURATION_SECONDS * 1000);
    expect(afterBreak.breakEnded).toBe(true);
    expect(afterBreak.justFinishedSession).toBeNull();
    expect(afterBreak.nextState.status).toBe('idle');
    // Original pending focus session is still preserved if unsaved
    expect(afterBreak.nextState.pendingUnsavedSessions).toHaveLength(1);
  });

  it('handles closed tab / laptop sleep: counts exact planned duration, real finish timestamp, and attributes to started_at day in profile timezone', () => {
    // Started 2026-11-17 18:10 UTC = 2026-11-17 23:40 Asia/Kolkata
    const tStart = Date.parse('2026-11-17T18:10:00Z');
    const state = startFocusSession(createInitialFocusTimerState(), {
      durationMinutes: 25,
      taskTitle: 'Late night reading',
      clientSessionId: TEST_UUID_1,
      nowMs: tStart,
    });

    // Scheduled end is 18:35 UTC = 2026-11-18 00:05 Asia/Kolkata
    // Laptop sleeps and wakes up 8 hours later!
    const tWakeUp = tStart + 8 * 60 * 60 * 1000;
    const result = reconcileFocusTimer(state, tWakeUp);

    expect(result.nextState.status).toBe('finished');
    expect(result.nextState.endedWhileAway).toBe(true);
    expect(result.nextState.finishedAtMs).toBe(tStart + 25 * 60 * 1000);
    expect(result.justFinishedSession).not.toBeNull();
    // Duration must be exact 25m (1500s), NEVER inflated to 8 hours!
    expect(result.justFinishedSession?.durationSeconds).toBe(25 * 60);
    expect(result.justFinishedSession?.endedAt).toBe(
      new Date(tStart + 25 * 60 * 1000).toISOString()
    );

    // One-Day Rule: started_at (23:40 IST on Nov 17) attributes to 2026-11-17 in Asia/Kolkata
    expect(getFocusSessionDay(result.justFinishedSession!.startedAt, 'Asia/Kolkata')).toBe(
      '2026-11-17'
    );
    // Real finish time formatted in Asia/Kolkata is 12:05 AM (not wake-up time)
    expect(formatTimeInTimezone(result.nextState.finishedAtMs!, 'Asia/Kolkata')).toBe(
      '12:05 AM'
    );
  });

  it('enforces the 10-minute early-exit rule (599s discarded, 600s saved)', () => {
    const t0 = Date.parse('2026-11-18T10:00:00Z');
    const running = startFocusSession(createInitialFocusTimerState(), {
      durationMinutes: 25,
      clientSessionId: TEST_UUID_1,
      nowMs: t0,
    });

    // Stop at 599s -> discarded cleanly, no DB write
    const tooEarly = stopFocusSessionEarly(running, t0 + (MIN_EARLY_EXIT_SECONDS - 1) * 1000);
    expect(tooEarly.qualified).toBe(false);
    expect(tooEarly.sessionToPersist).toBeNull();
    expect(tooEarly.nextState.status).toBe('idle');
    expect(tooEarly.nextState.pendingUnsavedSessions).toHaveLength(0);

    // Stop at 600s -> qualified, transitions to finished and enqueues exact 600s
    const qualified = stopFocusSessionEarly(running, t0 + MIN_EARLY_EXIT_SECONDS * 1000);
    expect(qualified.qualified).toBe(true);
    expect(qualified.sessionToPersist?.durationSeconds).toBe(600);
    expect(qualified.nextState.status).toBe('finished');
    expect(qualified.nextState.lastCompletedMinutes).toBe(10);
    expect(qualified.nextState.pendingUnsavedSessions).toHaveLength(1);
  });

  it('detects forgotten pause (> 2 hours), prompts resume/discard, never counts paused time, and never auto-saves', () => {
    const t0 = Date.parse('2026-11-18T08:00:00Z');
    let state = startFocusSession(createInitialFocusTimerState(), {
      durationMinutes: 25,
      clientSessionId: TEST_UUID_1,
      nowMs: t0,
    });

    // Pause after 12 minutes of active work
    const tPause = t0 + 12 * 60 * 1000;
    state = pauseFocusSession(state, tPause);

    // Next load is 2 hours + 5 minutes later
    const tLater = tPause + STALE_PAUSE_THRESHOLD_MS + 5 * 60 * 1000;
    const reconciled = reconcileFocusTimer(state, tLater);

    expect(reconciled.becameStalePause).toBe(true);
    expect(reconciled.nextState.status).toBe('paused');
    expect(reconciled.nextState.isStalePause).toBe(true);
    // Must NEVER auto-save a paused session
    expect(reconciled.justFinishedSession).toBeNull();
    expect(reconciled.nextState.pendingUnsavedSessions).toHaveLength(0);
    // Active elapsed remains strictly 12m (paused 2h 5m is NEVER counted)
    expect(computeActiveElapsedSeconds(reconciled.nextState, tLater)).toBe(12 * 60);

    // User chooses Discard -> returns cleanly to idle with zero DB write
    const discarded = discardPausedSession(reconciled.nextState);
    expect(discarded.status).toBe('idle');
    expect(discarded.pendingUnsavedSessions).toHaveLength(0);

    // Or user chooses Resume -> clears isStalePause and keeps exact 13m remaining
    const resumed = resumeFocusSession(reconciled.nextState, tLater);
    expect(resumed.status).toBe('running');
    expect(resumed.isStalePause).toBe(false);
    expect(computeRemainingSeconds(resumed, tLater)).toBe(13 * 60);
  });

  it('shows Session done only once per session (acknowledged flag prevents reappearance on reload)', () => {
    const t0 = Date.parse('2026-11-18T10:00:00Z');
    const started = startFocusSession(createInitialFocusTimerState(), {
      durationMinutes: 15,
      clientSessionId: TEST_UUID_1,
      nowMs: t0,
    });
    const finished = reconcileFocusTimer(started, t0 + 15 * 60 * 1000).nextState;

    expect(finished.status).toBe('finished');
    expect(finished.isAcknowledged).toBe(false);

    // User acknowledges ("Done")
    const acknowledged = acknowledgeSessionDone(finished);
    expect(acknowledged.status).toBe('idle');
    expect(acknowledged.isAcknowledged).toBe(true);

    // Reload / re-reconcile later must NEVER re-show Session done
    const afterReload = reconcileFocusTimer(acknowledged, t0 + 60 * 60 * 1000).nextState;
    expect(afterReload.status).toBe('idle');
    expect(afterReload.isAcknowledged).toBe(true);
  });

  it('skipBreak returns cleanly to idle without touching unsaved focus sessions', () => {
    const t0 = Date.parse('2026-11-18T10:00:00Z');
    const started = startFocusSession(createInitialFocusTimerState(), {
      durationMinutes: 25,
      clientSessionId: TEST_UUID_1,
      nowMs: t0,
    });
    const finished = reconcileFocusTimer(started, t0 + 25 * 60 * 1000).nextState;
    const onBreak = startBreakSession(finished, t0 + 25 * 60 * 1000);
    const skipped = skipBreakSession(onBreak);

    expect(skipped.status).toBe('idle');
    expect(skipped.pendingUnsavedSessions).toHaveLength(1);
    expect(isFocusMode('short-break')).toBe(false);
  });
});

describe('Global Focus Timer — Save Failure, Retry & Double-Save Idempotency', () => {
  beforeEach(() => {
    useFocusTimerStore.getState().resetForTests();
  });

  it('keeps finished session on save failure and succeeds on retry with exactly one row', async () => {
    const dbRows = new Map<string, PendingFocusSession>();

    const t0 = Date.parse('2026-11-18T09:00:00Z');
    const started = startFocusSession(createInitialFocusTimerState(), {
      durationMinutes: 25,
      taskTitle: 'Write tests',
      clientSessionId: TEST_UUID_1,
      nowMs: t0,
    });
    const finished = reconcileFocusTimer(started, t0 + 25 * 60 * 1000).nextState;
    useFocusTimerStore.setState({ timer: finished });

    // 1. First save attempt fails (offline / Supabase error)
    const failedRes = await useFocusTimerStore.getState().flushPendingSaves(async () => ({
      success: false,
      error: 'Network offline',
    }));
    expect(failedRes.savedCount).toBe(0);
    expect(useFocusTimerStore.getState().timer.isSaved).toBe(false);
    expect(useFocusTimerStore.getState().timer.pendingUnsavedSessions).toHaveLength(1);
    expect(useFocusTimerStore.getState().timer.saveError).toBe('Network offline');

    // Even if user dismisses Session Done while offline, unsaved session is NEVER dropped
    useFocusTimerStore.getState().acknowledgeDone();
    expect(useFocusTimerStore.getState().timer.pendingUnsavedSessions).toHaveLength(1);

    // 2. Retry succeeds when connection returns (idempotent upsert by clientSessionId)
    const idempotentDbWrite = async (session: PendingFocusSession) => {
      if (!dbRows.has(session.clientSessionId)) {
        dbRows.set(session.clientSessionId, session);
      }
      return { success: true };
    };

    const retryRes = await useFocusTimerStore.getState().flushPendingSaves(idempotentDbWrite);
    expect(retryRes.savedCount).toBe(1);
    expect(useFocusTimerStore.getState().timer.pendingUnsavedSessions).toHaveLength(0);
    expect(useFocusTimerStore.getState().timer.saveError).toBeNull();
    expect(dbRows.size).toBe(1);
    expect(dbRows.get(TEST_UUID_1)?.durationSeconds).toBe(1500);
  });

  it('prevents double-saving across concurrent / two-tab flushes with the same client_session_id', async () => {
    const dbRows = new Map<string, PendingFocusSession>();

    const t0 = Date.parse('2026-11-18T09:00:00Z');
    const started = startFocusSession(createInitialFocusTimerState(), {
      durationMinutes: 25,
      clientSessionId: TEST_UUID_2,
      nowMs: t0,
    });
    const finished = reconcileFocusTimer(started, t0 + 25 * 60 * 1000).nextState;
    useFocusTimerStore.setState({ timer: finished });

    let rpcCalls = 0;
    const simulatedUpsert = async (session: PendingFocusSession) => {
      rpcCalls += 1;
      // Simulate Postgres ON CONFLICT (client_session_id) DO NOTHING
      if (!dbRows.has(session.clientSessionId)) {
        dbRows.set(session.clientSessionId, session);
      }
      return { success: true };
    };

    // Fire two concurrent flushes (simulating reload/focus race)
    await Promise.all([
      useFocusTimerStore.getState().flushPendingSaves(simulatedUpsert),
      useFocusTimerStore.getState().flushPendingSaves(simulatedUpsert),
    ]);

    expect(rpcCalls).toBe(1);
    expect(dbRows.size).toBe(1);
    expect(useFocusTimerStore.getState().timer.isSaved).toBe(true);
    expect(useFocusTimerStore.getState().timer.pendingUnsavedSessions).toHaveLength(0);
  });
});

describe('Server Validation — validateFocusSessionPayload', () => {
  const nowMs = Date.parse('2026-11-18T12:00:00Z');

  it('accepts valid pomodoro and deep-work sessions', () => {
    const validPomodoro = validateFocusSessionPayload(
      {
        clientSessionId: TEST_UUID_1,
        mode: 'pomodoro',
        durationSeconds: 1500,
        plannedDurationSeconds: 1500,
        startedAt: new Date(nowMs - 1500 * 1000).toISOString(),
        endedAt: new Date(nowMs).toISOString(),
      },
      nowMs
    );
    expect(validPomodoro.valid).toBe(true);

    const validDeepWork = validateFocusSessionPayload(
      {
        clientSessionId: TEST_UUID_2,
        mode: 'deep-work',
        durationSeconds: 5400,
        plannedDurationSeconds: 5400,
        startedAt: new Date(nowMs - 5400 * 1000).toISOString(),
        endedAt: new Date(nowMs).toISOString(),
      },
      nowMs
    );
    expect(validDeepWork.valid).toBe(true);
  });

  it('rejects break modes (short-break, long-break) and stopwatch', () => {
    for (const badMode of ['short-break', 'long-break', 'stopwatch']) {
      const res = validateFocusSessionPayload(
        {
          clientSessionId: TEST_UUID_1,
          mode: badMode,
          durationSeconds: 300,
          startedAt: new Date(nowMs - 300 * 1000).toISOString(),
          endedAt: new Date(nowMs).toISOString(),
        },
        nowMs
      );
      expect(res.valid).toBe(false);
    }
  });

  it('rejects ended_at in the future', () => {
    const res = validateFocusSessionPayload(
      {
        clientSessionId: TEST_UUID_1,
        mode: 'pomodoro',
        durationSeconds: 1500,
        startedAt: new Date(nowMs).toISOString(),
        endedAt: new Date(nowMs + 5 * 60 * 1000).toISOString(),
      },
      nowMs
    );
    expect(res.valid).toBe(false);
    if (!res.valid) {
      expect(res.error.toLowerCase()).toContain('future');
    }
  });

  it('rejects non-positive duration and duration far above mode ceiling', () => {
    const zeroDur = validateFocusSessionPayload(
      {
        clientSessionId: TEST_UUID_1,
        mode: 'pomodoro',
        durationSeconds: 0,
        startedAt: new Date(nowMs - 1000).toISOString(),
        endedAt: new Date(nowMs).toISOString(),
      },
      nowMs
    );
    expect(zeroDur.valid).toBe(false);

    const negativeDur = validateFocusSessionPayload(
      {
        clientSessionId: TEST_UUID_1,
        mode: 'pomodoro',
        durationSeconds: -300,
        startedAt: new Date(nowMs - 1000).toISOString(),
        endedAt: new Date(nowMs).toISOString(),
      },
      nowMs
    );
    expect(negativeDur.valid).toBe(false);

    const inflatedPomodoro = validateFocusSessionPayload(
      {
        clientSessionId: TEST_UUID_1,
        mode: 'pomodoro',
        durationSeconds: 4 * 60 * 60, // 4 hours claimed on a pomodoro
        startedAt: new Date(nowMs - 4 * 60 * 60 * 1000).toISOString(),
        endedAt: new Date(nowMs).toISOString(),
      },
      nowMs
    );
    expect(inflatedPomodoro.valid).toBe(false);
  });

  it('logFocusSession server action directly rejects break modes and future ended_at before touching DB', async () => {
    const breakRes = await logFocusSession({
      clientSessionId: TEST_UUID_1,
      mode: 'short-break',
      durationSeconds: 300,
      startedAt: new Date(Date.now() - 300_000).toISOString(),
      endedAt: new Date().toISOString(),
    });
    expect(breakRes.success).toBe(false);
    expect(breakRes.error?.toLowerCase()).toContain('break');

    const futureRes = await logFocusSession({
      clientSessionId: TEST_UUID_2,
      mode: 'pomodoro',
      durationSeconds: 1500,
      startedAt: new Date().toISOString(),
      endedAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    });
    expect(futureRes.success).toBe(false);
    expect(futureRes.error?.toLowerCase()).toContain('future');
  });
});

describe('Two-Tab Alert Lock', () => {
  beforeEach(() => {
    resetAlertClaimsForTests();
  });

  it('allows only one tab to claim completion chime & notification for a session', () => {
    const backing = new Map<string, string>();
    const sharedStorage: StorageLike = {
      getItem: (k) => backing.get(k) ?? null,
      setItem: (k, v) => {
        backing.set(k, v);
      },
    };

    const tabAWon = claimSessionCompletionAlert(TEST_UUID_1, 'tab-A', sharedStorage);
    // Simulate Tab B in separate JS memory sharing the same localStorage
    resetAlertClaimsForTests();
    const tabBWon = claimSessionCompletionAlert(TEST_UUID_1, 'tab-B', sharedStorage);

    expect(tabAWon).toBe(true);
    expect(tabBWon).toBe(false);
  });
});

describe('Global Focus UI — Visual Contract, Lining Numerals & Zero Italics', () => {
  it('renders FloatingTimerPill color states (running=teal, paused=amber, break=grey-green) with no italics', () => {
    const base = createInitialFocusTimerState();

    const runningHtml = renderToString(
      <FloatingTimerPill
        timer={{ ...base, status: 'running', taskTitle: 'OS Ch. 4' }}
        remainingSeconds={1122}
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
    expect(runningHtml).toContain('bg-secondary');
    expect(runningHtml).toContain('bottom-[108px]');
    expect(runningHtml).toContain('18:42');
    expect(runningHtml).toContain('font-variant-numeric:lining-nums tabular-nums');
    expect(runningHtml).not.toContain('italic');

    const pausedHtml = renderToString(
      <FloatingTimerPill
        timer={{ ...base, status: 'paused', isStalePause: true, taskTitle: 'OS Ch. 4' }}
        remainingSeconds={600}
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
    expect(pausedHtml).toContain('bg-tertiary-fixed');
    expect(pausedHtml).toContain('Resume');
    expect(pausedHtml).toContain('Discard');
    expect(pausedHtml).not.toContain('italic');

    const breakHtml = renderToString(
      <FloatingTimerPill
        timer={{ ...base, status: 'break', mode: 'short-break' }}
        remainingSeconds={240}
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
    expect(breakHtml).toContain('bg-secondary-fixed');
    expect(breakHtml).toContain('5m Break');
    expect(breakHtml).not.toContain('italic');
  });

  it('renders SessionDoneView with real finish time when away, retry notice on failure, and both action buttons', () => {
    const finishedAtMs = Date.parse('2026-11-18T10:12:00Z'); // 3:42 PM in Asia/Kolkata
    const html = renderToString(
      <SessionDoneView
        minutesAdded={25}
        taskTitle="Revise OS Ch. 4"
        endedWhileAway={true}
        finishedAtMs={finishedAtMs}
        userTimezone="Asia/Kolkata"
        hasUnsavedRetry={true}
        isSaving={false}
        onTakeBreak={() => {}}
        onStartAnother={() => {}}
        onDismiss={() => {}}
        onRetrySave={() => {}}
      />
    );

    expect(html).toContain('Session done');
    expect(html).toContain('25');
    expect(html).toContain('added to Time Focused');
    expect(html).toContain('Finished at');
    expect(html).toContain('3:42 PM');
    expect(html).toContain('Take a 5 min break');
    expect(html).toContain('Start another');
    expect(html).toContain('Couldn&#x27;t save yet. Check your connection and sign in, then press Retry.');
    expect(html).not.toContain('italic');
  });

  it('renders FocusSanctuaryOverlay with large countdown, minimal Exit, and zero italics', () => {
    const base = createInitialFocusTimerState();
    const html = renderToString(
      <FocusSanctuaryOverlay
        timer={{
          ...base,
          status: 'running',
          isFullscreenOpen: true,
          plannedDurationSeconds: 1500,
          taskTitle: 'Revise OS Ch. 4',
        }}
        remainingSeconds={1308}
        nowMs={Date.now()}
        userTimezone="Asia/Kolkata"
        isSaving={false}
        onExit={() => {}}
        onPause={() => {}}
        onResume={() => {}}
        onDiscardPaused={() => {}}
        onStopEarly={() => {}}
        onSkipBreak={() => {}}
        onTakeBreak={() => {}}
        onStartAnother={() => {}}
        onDismissDone={() => {}}
        onToggleSound={() => {}}
        onToggleNotifications={() => {}}
        onRetrySave={() => {}}
      />
    );

    expect(html).toContain('data-purpose="fullscreen-focus-mode"');
    expect(html).toContain('21:48');
    expect(html).toContain('Revise OS Ch. 4');
    expect(html).toContain('Exit');
    expect(html).toContain('Pause');
    expect(html).toContain('End');
    expect(html).not.toContain('italic');
  });
});
