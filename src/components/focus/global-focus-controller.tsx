'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  FOCUS_TIMER_STORAGE_KEY,
  useFocusTimerStore,
} from '@/lib/store/use-focus-timer-store';
import { useUIStore } from '@/lib/store/use-ui-store';
import { computeRemainingSeconds } from '@/lib/daily-loop/focus-timer-engine';
import {
  claimSessionCompletionAlert,
  playFocusCompletionChime,
  requestFocusNotificationPermission,
  showFocusCompletionNotification,
} from '@/lib/daily-loop/focus-alerts';
import { FloatingTimerPill } from './floating-timer-pill';
import { FocusSanctuaryOverlay } from './focus-sanctuary-overlay';

function createTabId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `tab-${Math.random().toString(36).slice(2)}-${Date.now()}`;
}

export function GlobalFocusController() {
  const router = useRouter();
  const tabIdRef = useRef<string>(createTabId());
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  const timer = useFocusTimerStore((s) => s.timer);
  const hasHydrated = useFocusTimerStore((s) => s.hasHydrated);
  const isSaving = useFocusTimerStore((s) => s.isSaving);
  const userTimezone = useFocusTimerStore((s) => s.userTimezone);
  const hydrateFromStorage = useFocusTimerStore((s) => s.hydrateFromStorage);
  const syncFromStorageEvent = useFocusTimerStore((s) => s.syncFromStorageEvent);
  const reconcile = useFocusTimerStore((s) => s.reconcile);
  const flushPendingSaves = useFocusTimerStore((s) => s.flushPendingSaves);
  const pauseFocus = useFocusTimerStore((s) => s.pauseFocus);
  const resumeFocus = useFocusTimerStore((s) => s.resumeFocus);
  const discardPaused = useFocusTimerStore((s) => s.discardPaused);
  const stopEarly = useFocusTimerStore((s) => s.stopEarly);
  const acknowledgeDone = useFocusTimerStore((s) => s.acknowledgeDone);
  const startBreak = useFocusTimerStore((s) => s.startBreak);
  const skipBreak = useFocusTimerStore((s) => s.skipBreak);
  const startAnother = useFocusTimerStore((s) => s.startAnother);
  const openFullscreen = useFocusTimerStore((s) => s.openFullscreen);
  const closeFullscreen = useFocusTimerStore((s) => s.closeFullscreen);
  const toggleSound = useFocusTimerStore((s) => s.toggleSound);
  const setNotificationsEnabled = useFocusTimerStore((s) => s.setNotificationsEnabled);

  const isDockVisible = useUIStore((s) => s.isDockVisible);
  const isModalOpen = useUIStore((s) => s.isModalOpen);
  const isCreateProjectOpen = useUIStore((s) => s.isCreateProjectOpen);
  const isLandingPage = useUIStore((s) => s.isLandingPage);
  const isDockHidden = isLandingPage || isModalOpen || isCreateProjectOpen || !isDockVisible;

  const triggerAlertsIfWinner = useCallback(
    (clientSessionId: string, minutesAdded: number, taskTitle: string | null) => {
      const current = useFocusTimerStore.getState().timer;
      const won = claimSessionCompletionAlert(clientSessionId, tabIdRef.current);
      if (!won) return;

      if (current.soundEnabled) {
        playFocusCompletionChime();
      }
      if (current.notificationsEnabled) {
        showFocusCompletionNotification(
          'Session done',
          `+${minutesAdded}m added to Time Focused${taskTitle ? ` · ${taskTitle}` : ''}`
        );
      }
    },
    []
  );

  const flushAndRefresh = useCallback(async () => {
    const { savedCount } = await flushPendingSaves();
    if (savedCount > 0) {
      router.refresh();
    }
  }, [flushPendingSaves, router]);

  const runReconcileAndFlush = useCallback(() => {
    const currentNow = Date.now();
    setNowMs(currentNow);
    const result = reconcile(currentNow);
    if (result.justFinishedSession) {
      const mins = Math.max(1, Math.round(result.justFinishedSession.durationSeconds / 60));
      triggerAlertsIfWinner(
        result.justFinishedSession.clientSessionId,
        mins,
        result.justFinishedSession.taskTitle
      );
    }
    if (useFocusTimerStore.getState().timer.pendingUnsavedSessions.length > 0) {
      void flushAndRefresh();
    }
  }, [reconcile, triggerAlertsIfWinner, flushAndRefresh]);

  // 1. Hydrate from localStorage on mount & immediately retry any pending unsaved sessions
  useEffect(() => {
    hydrateFromStorage();
    const state = useFocusTimerStore.getState().timer;
    if (state.pendingUnsavedSessions.length > 0) {
      void flushAndRefresh();
    }
  }, [hydrateFromStorage, flushAndRefresh]);

  // 2. Tick every second while running/break/paused so countdown and completion stay crisp
  useEffect(() => {
    if (!hasHydrated) return;
    if (timer.status !== 'running' && timer.status !== 'break' && timer.status !== 'paused') {
      return;
    }

    const interval = setInterval(() => {
      runReconcileAndFlush();
    }, 1000);

    return () => clearInterval(interval);
  }, [hasHydrated, timer.status, runReconcileAndFlush]);

  // 3. Reconcile & retry unsaved sessions on tab wake, window focus, network online, and storage events
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        runReconcileAndFlush();
      }
    };
    const handleFocus = () => {
      runReconcileAndFlush();
    };
    const handleOnline = () => {
      void flushAndRefresh();
    };
    const handleStorage = (e: StorageEvent) => {
      if (e.key === FOCUS_TIMER_STORAGE_KEY) {
        syncFromStorageEvent(e.newValue);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleOnline);
    window.addEventListener('storage', handleStorage);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('storage', handleStorage);
    };
  }, [runReconcileAndFlush, flushAndRefresh, syncFromStorageEvent]);

  const handleStopEarly = () => {
    const res = stopEarly();
    if (res.qualified && res.sessionToPersist) {
      void flushAndRefresh();
    }
  };

  const handleToggleNotifications = async () => {
    if (timer.notificationsEnabled) {
      setNotificationsEnabled(false);
      return;
    }
    // Only request permission inside an explicit user click handler
    const permission = await requestFocusNotificationPermission();
    setNotificationsEnabled(permission === 'granted');
  };

  if (!hasHydrated) return null;

  const remainingSeconds = computeRemainingSeconds(timer, nowMs);

  return (
    <>
      <FloatingTimerPill
        timer={timer}
        remainingSeconds={remainingSeconds}
        isDockHidden={isDockHidden}
        isSaving={isSaving}
        onOpenFullscreen={openFullscreen}
        onPause={pauseFocus}
        onResume={resumeFocus}
        onDiscard={discardPaused}
        onSkipBreak={skipBreak}
        onRetrySave={() => void flushAndRefresh()}
      />

      <FocusSanctuaryOverlay
        timer={timer}
        remainingSeconds={remainingSeconds}
        nowMs={nowMs}
        userTimezone={userTimezone}
        isSaving={isSaving}
        onExit={closeFullscreen}
        onPause={pauseFocus}
        onResume={resumeFocus}
        onDiscardPaused={discardPaused}
        onStopEarly={handleStopEarly}
        onSkipBreak={skipBreak}
        onTakeBreak={startBreak}
        onStartAnother={startAnother}
        onDismissDone={acknowledgeDone}
        onToggleSound={toggleSound}
        onToggleNotifications={() => void handleToggleNotifications()}
        onRetrySave={() => void flushAndRefresh()}
      />
    </>
  );
}
