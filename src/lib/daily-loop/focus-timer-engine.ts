import type {
  FocusSessionErrorCode,
  FocusTimerState,
  PendingFocusSession,
  PersistableFocusMode,
} from './types';

export const FOCUS_PRESET_MINUTES = [15, 25, 50, 90] as const;
export const BREAK_DURATION_SECONDS = 5 * 60; // 5 minutes
export const MIN_EARLY_EXIT_SECONDS = 10 * 60; // 10 minutes
export const STALE_PAUSE_THRESHOLD_MS = 2 * 60 * 60 * 1000; // 2 hours
export const AWAY_FINISH_THRESHOLD_MS = 15 * 1000; // 15 seconds past endTimestampMs
export const FUTURE_END_TOLERANCE_MS = 60 * 1000; // 60 seconds clock skew tolerance

/**
 * Maximum allowed duration per persistable focus mode (planned max + 5 min tolerance).
 * - pomodoro: max preset 50m (3000s) -> ceiling 55m (3300s)
 * - deep-work: preset 90m (5400s) -> ceiling 95m (5700s)
 */
export const MODE_MAX_DURATION_SECONDS: Record<PersistableFocusMode, number> = {
  pomodoro: 55 * 60,
  'deep-work': 95 * 60,
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function createInitialFocusTimerState(): FocusTimerState {
  return {
    status: 'idle',
    clientSessionId: null,
    mode: 'pomodoro',
    plannedDurationSeconds: 25 * 60,
    startedAtMs: null,
    endTimestampMs: null,
    remainingSecondsWhenPaused: null,
    pausedAtMs: null,
    accumulatedPausedMs: 0,
    isStalePause: false,
    taskId: null,
    taskTitle: null,
    projectId: null,
    isFullscreenOpen: false,
    isSaved: false,
    isAcknowledged: true,
    endedWhileAway: false,
    finishedAtMs: null,
    lastCompletedMinutes: 0,
    lastDurationMinutes: 25,
    pendingUnsavedSessions: [],
    saveError: null,
    saveErrorCode: null,
    lastSaveStatus: 'idle',
    soundEnabled: true,
    notificationsEnabled: false,
  };
}

export function getModeForPresetMinutes(minutes: number): PersistableFocusMode {
  return minutes >= 90 ? 'deep-work' : 'pomodoro';
}

export function isPersistableFocusMode(mode: string): mode is PersistableFocusMode {
  return mode === 'pomodoro' || mode === 'deep-work';
}

/**
 * Computes remaining countdown seconds strictly from endTimestampMs (when running/break)
 * or remainingSecondsWhenPaused (when paused). Never drifts with tab sleep.
 */
export function computeRemainingSeconds(
  state: FocusTimerState,
  nowMs: number
): number {
  if (state.status === 'running' || state.status === 'break') {
    if (state.endTimestampMs === null) return 0;
    return Math.max(0, Math.ceil((state.endTimestampMs - nowMs) / 1000));
  }
  if (state.status === 'paused') {
    return Math.max(0, state.remainingSecondsWhenPaused ?? 0);
  }
  return 0;
}

/**
 * Computes active focus seconds elapsed (strictly excluding paused time).
 */
export function computeActiveElapsedSeconds(
  state: FocusTimerState,
  nowMs: number
): number {
  if (state.status !== 'running' && state.status !== 'paused') {
    return 0;
  }
  const remaining = computeRemainingSeconds(state, nowMs);
  return Math.max(0, state.plannedDurationSeconds - remaining);
}

/**
 * Formats seconds as MM:SS (e.g. "25:00", "04:09", "90:00").
 */
export function formatCountdownMMSS(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function enqueuePendingSession(
  queue: PendingFocusSession[],
  session: PendingFocusSession
): PendingFocusSession[] {
  if (queue.some((item) => item.clientSessionId === session.clientSessionId)) {
    return queue;
  }
  return [...queue, session];
}

export interface StartFocusSessionParams {
  durationMinutes: number;
  taskId?: string | null;
  taskTitle?: string | null;
  projectId?: string | null;
  clientSessionId: string;
  nowMs: number;
  openFullscreen?: boolean;
}

export function startFocusSession(
  state: FocusTimerState,
  params: StartFocusSessionParams
): FocusTimerState {
  const safeMinutes = Math.max(1, Math.min(90, Math.round(params.durationMinutes)));
  const plannedDurationSeconds = safeMinutes * 60;
  const mode = getModeForPresetMinutes(safeMinutes);

  return {
    ...state,
    status: 'running',
    clientSessionId: params.clientSessionId,
    mode,
    plannedDurationSeconds,
    startedAtMs: params.nowMs,
    endTimestampMs: params.nowMs + plannedDurationSeconds * 1000,
    remainingSecondsWhenPaused: null,
    pausedAtMs: null,
    accumulatedPausedMs: 0,
    isStalePause: false,
    taskId: params.taskId ?? null,
    taskTitle: params.taskTitle ?? null,
    projectId: params.projectId ?? null,
    isFullscreenOpen: params.openFullscreen ?? state.isFullscreenOpen,
    isSaved: false,
    isAcknowledged: false,
    endedWhileAway: false,
    finishedAtMs: null,
    lastDurationMinutes: safeMinutes,
    lastSaveStatus: 'idle',
  };
}

export function pauseFocusSession(
  state: FocusTimerState,
  nowMs: number
): FocusTimerState {
  if (state.status !== 'running' || state.endTimestampMs === null) {
    return state;
  }
  const remaining = Math.max(0, Math.ceil((state.endTimestampMs - nowMs) / 1000));
  return {
    ...state,
    status: 'paused',
    endTimestampMs: null,
    remainingSecondsWhenPaused: remaining,
    pausedAtMs: nowMs,
    isStalePause: false,
  };
}

export function resumeFocusSession(
  state: FocusTimerState,
  nowMs: number
): FocusTimerState {
  if (state.status !== 'paused') {
    return state;
  }
  const remaining = Math.max(1, state.remainingSecondsWhenPaused ?? state.plannedDurationSeconds);
  const pauseDelta =
    state.pausedAtMs !== null ? Math.max(0, nowMs - state.pausedAtMs) : 0;

  return {
    ...state,
    status: 'running',
    endTimestampMs: nowMs + remaining * 1000,
    remainingSecondsWhenPaused: null,
    pausedAtMs: null,
    accumulatedPausedMs: state.accumulatedPausedMs + pauseDelta,
    isStalePause: false,
  };
}

/**
 * Discards a paused or forgotten-pause session cleanly without saving or counting paused time.
 * Preserves any previously finished unsaved sessions in pendingUnsavedSessions.
 */
export function discardPausedSession(state: FocusTimerState): FocusTimerState {
  if (state.status !== 'paused' && state.status !== 'running') {
    return state;
  }
  return {
    ...state,
    status: 'idle',
    clientSessionId: null,
    startedAtMs: null,
    endTimestampMs: null,
    remainingSecondsWhenPaused: null,
    pausedAtMs: null,
    accumulatedPausedMs: 0,
    isStalePause: false,
    isFullscreenOpen: false,
    isSaved: false,
    isAcknowledged: true,
    endedWhileAway: false,
    finishedAtMs: null,
  };
}

export interface StopEarlyResult {
  nextState: FocusTimerState;
  qualified: boolean;
  sessionToPersist: PendingFocusSession | null;
}

/**
 * Stops an active (running or paused) focus session early.
 * Enforces the 10-minute (600s) early-exit rule:
 * - elapsed < 600s: discards to idle with no DB write.
 * - elapsed >= 600s: transitions to finished and enqueues PendingFocusSession with exact active elapsed seconds.
 */
export function stopFocusSessionEarly(
  state: FocusTimerState,
  nowMs: number
): StopEarlyResult {
  if (state.status !== 'running' && state.status !== 'paused') {
    return { nextState: state, qualified: false, sessionToPersist: null };
  }

  const elapsedSeconds = computeActiveElapsedSeconds(state, nowMs);

  if (
    elapsedSeconds < MIN_EARLY_EXIT_SECONDS ||
    !state.clientSessionId ||
    !isPersistableFocusMode(state.mode) ||
    state.startedAtMs === null
  ) {
    return {
      nextState: discardPausedSession(state),
      qualified: false,
      sessionToPersist: null,
    };
  }

  // Never count paused time; if stopped while paused, actual end time is pausedAtMs (or nowMs if running)
  const effectiveEndMs =
    state.status === 'paused' && state.pausedAtMs !== null
      ? state.pausedAtMs
      : nowMs;

  const sessionToPersist: PendingFocusSession = {
    clientSessionId: state.clientSessionId,
    mode: state.mode,
    durationSeconds: elapsedSeconds,
    plannedDurationSeconds: state.plannedDurationSeconds,
    startedAt: new Date(state.startedAtMs).toISOString(),
    endedAt: new Date(effectiveEndMs).toISOString(),
    taskId: state.taskId,
    taskTitle: state.taskTitle,
    projectId: state.projectId,
  };

  const completedMinutes = Math.max(1, Math.round(elapsedSeconds / 60));

  return {
    qualified: true,
    sessionToPersist,
    nextState: {
      ...state,
      status: 'finished',
      endTimestampMs: null,
      remainingSecondsWhenPaused: null,
      pausedAtMs: null,
      isStalePause: false,
      isSaved: false,
      isAcknowledged: false,
      endedWhileAway: false,
      finishedAtMs: effectiveEndMs,
      lastCompletedMinutes: completedMinutes,
      pendingUnsavedSessions: enqueuePendingSession(
        state.pendingUnsavedSessions,
        sessionToPersist
      ),
    },
  };
}

export interface ReconcileResult {
  nextState: FocusTimerState;
  justFinishedSession: PendingFocusSession | null;
  becameStalePause: boolean;
  breakEnded: boolean;
}

/**
 * Reconciles persisted timer state against the current wall clock `nowMs`.
 * Handles:
 * - Natural session completion (including while tab was closed or laptop slept)
 * - Break completion (returns to idle, never persisted)
 * - Forgotten pause (> 2 hours) -> sets isStalePause = true without auto-saving
 */
export function reconcileFocusTimer(
  state: FocusTimerState,
  nowMs: number
): ReconcileResult {
  // 1. Running focus session reached or passed endTimestampMs
  if (
    state.status === 'running' &&
    state.endTimestampMs !== null &&
    nowMs >= state.endTimestampMs
  ) {
    const actualEndMs = state.endTimestampMs;
    const endedWhileAway = nowMs - actualEndMs > AWAY_FINISH_THRESHOLD_MS;
    const completedMinutes = Math.max(
      1,
      Math.round(state.plannedDurationSeconds / 60)
    );

    let justFinishedSession: PendingFocusSession | null = null;
    let nextQueue = state.pendingUnsavedSessions;

    if (
      state.clientSessionId &&
      isPersistableFocusMode(state.mode) &&
      state.startedAtMs !== null &&
      !state.isSaved
    ) {
      justFinishedSession = {
        clientSessionId: state.clientSessionId,
        mode: state.mode,
        durationSeconds: state.plannedDurationSeconds,
        plannedDurationSeconds: state.plannedDurationSeconds,
        startedAt: new Date(state.startedAtMs).toISOString(),
        endedAt: new Date(actualEndMs).toISOString(),
        taskId: state.taskId,
        taskTitle: state.taskTitle,
        projectId: state.projectId,
      };
      nextQueue = enqueuePendingSession(nextQueue, justFinishedSession);
    }

    return {
      justFinishedSession,
      becameStalePause: false,
      breakEnded: false,
      nextState: {
        ...state,
        status: 'finished',
        endTimestampMs: null,
        remainingSecondsWhenPaused: null,
        pausedAtMs: null,
        isStalePause: false,
        isAcknowledged: false,
        endedWhileAway,
        finishedAtMs: actualEndMs,
        lastCompletedMinutes: completedMinutes,
        pendingUnsavedSessions: nextQueue,
      },
    };
  }

  // 2. Break session reached or passed endTimestampMs -> quietly return to idle (never persisted)
  if (
    state.status === 'break' &&
    state.endTimestampMs !== null &&
    nowMs >= state.endTimestampMs
  ) {
    return {
      justFinishedSession: null,
      becameStalePause: false,
      breakEnded: true,
      nextState: {
        ...state,
        status: 'idle',
        clientSessionId: null,
        mode: 'pomodoro',
        startedAtMs: null,
        endTimestampMs: null,
        remainingSecondsWhenPaused: null,
        pausedAtMs: null,
        isStalePause: false,
        isFullscreenOpen: false,
        isAcknowledged: true,
      },
    };
  }

  // 3. Forgotten pause (> 2 hours) -> ask user to resume or discard; never auto-save
  if (
    state.status === 'paused' &&
    state.pausedAtMs !== null &&
    !state.isStalePause &&
    nowMs - state.pausedAtMs > STALE_PAUSE_THRESHOLD_MS
  ) {
    return {
      justFinishedSession: null,
      becameStalePause: true,
      breakEnded: false,
      nextState: {
        ...state,
        isStalePause: true,
      },
    };
  }

  return {
    nextState: state,
    justFinishedSession: null,
    becameStalePause: false,
    breakEnded: false,
  };
}

/**
 * Acknowledges the "Session done" screen so it is shown only once and never reappears on reload.
 * Preserves pendingUnsavedSessions so any failed save still retries in the background.
 */
export function acknowledgeSessionDone(state: FocusTimerState): FocusTimerState {
  if (state.status !== 'finished') {
    return { ...state, isAcknowledged: true };
  }
  return {
    ...state,
    status: 'idle',
    isAcknowledged: true,
    isFullscreenOpen: false,
    endedWhileAway: false,
    finishedAtMs: null,
  };
}

export function startBreakSession(
  state: FocusTimerState,
  nowMs: number
): FocusTimerState {
  return {
    ...state,
    status: 'break',
    clientSessionId: null,
    mode: 'short-break',
    plannedDurationSeconds: BREAK_DURATION_SECONDS,
    startedAtMs: nowMs,
    endTimestampMs: nowMs + BREAK_DURATION_SECONDS * 1000,
    remainingSecondsWhenPaused: null,
    pausedAtMs: null,
    accumulatedPausedMs: 0,
    isStalePause: false,
    isAcknowledged: true,
    endedWhileAway: false,
    finishedAtMs: null,
  };
}

export function skipBreakSession(state: FocusTimerState): FocusTimerState {
  if (state.status !== 'break') return state;
  return {
    ...state,
    status: 'idle',
    clientSessionId: null,
    mode: 'pomodoro',
    startedAtMs: null,
    endTimestampMs: null,
    remainingSecondsWhenPaused: null,
    pausedAtMs: null,
    isStalePause: false,
    isFullscreenOpen: false,
    isAcknowledged: true,
  };
}

export function markSessionSaved(
  state: FocusTimerState,
  clientSessionId: string
): FocusTimerState {
  const remainingQueue = state.pendingUnsavedSessions.filter(
    (item) => item.clientSessionId !== clientSessionId
  );
  const matchesCurrent = state.clientSessionId === clientSessionId;
  const allSaved = remainingQueue.length === 0;
  return {
    ...state,
    pendingUnsavedSessions: remainingQueue,
    isSaved: matchesCurrent ? true : state.isSaved,
    saveError: allSaved ? null : state.saveError,
    saveErrorCode: allSaved ? null : (state.saveErrorCode ?? null),
    lastSaveStatus: allSaved ? 'saved' : state.lastSaveStatus ?? 'error',
  };
}

export const DEFAULT_SAVE_RETRY_MESSAGE = "Couldn't save yet, retrying";
export const PROD_SAVE_RETRY_MESSAGE =
  "Couldn't save yet. Check your connection and sign in, then press Retry.";
export const DEV_BYPASS_NOTICE_MESSAGE =
  'Dev mode: sign in with a real account to save sessions';

export interface SaveNoticeContent {
  text: string;
  showSignInLink: boolean;
  showRetryButton: boolean;
  tone: 'amber' | 'emerald';
}

/**
 * Resolves the exact non-blocking save notice copy and actions for a focus session.
 * - `isSaving`: shows `"Saving session..."`
 * - `justSaved`: shows `"Saved"` confirmation
 * - `dev_bypass`: shows `"Dev mode: sign in with a real account to save sessions"` (+ real code/message in dev) with Sign in & Retry
 * - `not_authenticated`: shows real `[not_authenticated]` + message in dev, friendly production message in prod, with Sign in & Retry
 * - `validation` / `db_error` / `unknown`: shows real `[code]: message` in dev, friendly production message in prod, with Retry
 */
export function getSaveNoticeContent(params: {
  saveError?: string | null;
  saveErrorCode?: FocusSessionErrorCode | null;
  isSaving?: boolean;
  justSaved?: boolean;
}): SaveNoticeContent {
  const {
    saveError,
    saveErrorCode = null,
    isSaving = false,
    justSaved = false,
  } = params;

  if (isSaving) {
    return {
      text: 'Saving session...',
      showSignInLink: false,
      showRetryButton: false,
      tone: 'amber',
    };
  }

  if (justSaved) {
    return {
      text: 'Saved',
      showSignInLink: false,
      showRetryButton: false,
      tone: 'emerald',
    };
  }

  const isDev = process.env.NODE_ENV === 'development';
  const detail = typeof saveError === 'string' ? saveError.trim() : '';

  if (saveErrorCode === 'dev_bypass') {
    const devDetail =
      isDev && detail
        ? ` [dev_bypass: ${detail}]`
        : isDev
        ? ' [dev_bypass]'
        : '';
    return {
      text: `${DEV_BYPASS_NOTICE_MESSAGE}${devDetail}`,
      showSignInLink: true,
      showRetryButton: true,
      tone: 'amber',
    };
  }

  if (saveErrorCode === 'not_authenticated') {
    const text = isDev
      ? `Couldn't save yet [not_authenticated]${detail ? `: ${detail}` : ''}`
      : PROD_SAVE_RETRY_MESSAGE;
    return {
      text,
      showSignInLink: true,
      showRetryButton: true,
      tone: 'amber',
    };
  }

  if (isDev) {
    const codeLabel = saveErrorCode ?? 'unknown';
    const hasDetail =
      Boolean(detail) &&
      detail !== DEFAULT_SAVE_RETRY_MESSAGE &&
      detail !== PROD_SAVE_RETRY_MESSAGE;
    return {
      text: hasDetail
        ? `Couldn't save yet [${codeLabel}]: ${detail}`
        : `Couldn't save yet [${codeLabel}]`,
      showSignInLink: false,
      showRetryButton: true,
      tone: 'amber',
    };
  }

  return {
    text: PROD_SAVE_RETRY_MESSAGE,
    showSignInLink: false,
    showRetryButton: true,
    tone: 'amber',
  };
}

/**
 * Formats the non-blocking save-failure retry notice for focus sessions.
 * - In development builds (`NODE_ENV === 'development'`), appends the actual
 *   error message returned by `logFocusSession` (e.g. Supabase or validation reason).
 * - In production builds (and all non-development environments), keeps the base text unchanged.
 */
export function formatSaveRetryNotice(
  saveError: string | null | undefined,
  baseMessage: string = DEFAULT_SAVE_RETRY_MESSAGE
): string {
  if (process.env.NODE_ENV !== 'development') {
    return baseMessage;
  }
  const detail = typeof saveError === 'string' ? saveError.trim() : '';
  if (!detail || detail === baseMessage || detail === DEFAULT_SAVE_RETRY_MESSAGE) {
    return baseMessage;
  }
  return `${baseMessage} (${detail})`;
}

export function markSessionSaveFailed(
  state: FocusTimerState,
  errorMessage: string,
  errorCode: FocusSessionErrorCode = 'unknown'
): FocusTimerState {
  return {
    ...state,
    saveError: errorMessage,
    saveErrorCode: errorCode,
    lastSaveStatus: 'error',
  };
}

export interface FocusSessionValidationInput {
  clientSessionId: string;
  mode: string;
  durationSeconds: number;
  plannedDurationSeconds?: number;
  startedAt: string;
  endedAt: string;
}

export type FocusSessionValidationResult =
  | { valid: true; mode: PersistableFocusMode }
  | { valid: false; error: string };

/**
 * Strict server-side payload validation for public.focus_sessions.
 * - Rejects break modes (short-break, long-break) and unknown/stopwatch modes.
 * - Rejects non-positive duration or duration far above planned ceiling for the mode.
 * - Rejects ended_at in the future (beyond 60s clock skew tolerance) or before started_at.
 * - Rejects invalid UUID client_session_id.
 */
export function validateFocusSessionPayload(
  input: FocusSessionValidationInput,
  nowMs: number = Date.now()
): FocusSessionValidationResult {
  if (!input.clientSessionId || !UUID_REGEX.test(input.clientSessionId)) {
    return { valid: false, error: 'Invalid client_session_id UUID.' };
  }

  if (!isPersistableFocusMode(input.mode)) {
    return {
      valid: false,
      error: `Invalid focus mode "${input.mode}". Break modes are not accepted.`,
    };
  }

  if (
    typeof input.durationSeconds !== 'number' ||
    !Number.isFinite(input.durationSeconds) ||
    !Number.isInteger(input.durationSeconds) ||
    input.durationSeconds <= 0
  ) {
    return { valid: false, error: 'Focus duration must be a positive integer in seconds.' };
  }

  const modeMaxSeconds = MODE_MAX_DURATION_SECONDS[input.mode];
  if (input.durationSeconds > modeMaxSeconds) {
    return {
      valid: false,
      error: `Focus duration exceeds maximum allowed for ${input.mode} (${modeMaxSeconds}s).`,
    };
  }

  if (
    typeof input.plannedDurationSeconds === 'number' &&
    Number.isFinite(input.plannedDurationSeconds) &&
    input.plannedDurationSeconds > 0 &&
    input.durationSeconds > input.plannedDurationSeconds + 300
  ) {
    return {
      valid: false,
      error: 'Focus duration exceeds planned session duration ceiling.',
    };
  }

  const startedMs = Date.parse(input.startedAt);
  const endedMs = Date.parse(input.endedAt);

  if (Number.isNaN(startedMs) || Number.isNaN(endedMs)) {
    return { valid: false, error: 'Invalid started_at or ended_at timestamp.' };
  }

  if (endedMs > nowMs + FUTURE_END_TOLERANCE_MS) {
    return { valid: false, error: 'ended_at cannot be in the future.' };
  }

  if (endedMs < startedMs) {
    return { valid: false, error: 'ended_at cannot be earlier than started_at.' };
  }

  const wallClockSpanSeconds = Math.ceil((endedMs - startedMs) / 1000);
  if (input.durationSeconds > wallClockSpanSeconds + 60) {
    return {
      valid: false,
      error: 'duration_seconds cannot exceed the elapsed wall-clock window.',
    };
  }

  return { valid: true, mode: input.mode };
}
