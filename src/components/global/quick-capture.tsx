'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUIStore } from '@/lib/store/use-ui-store';
import { useModalA11y } from '@/hooks/use-modal-a11y';
import {
  parseQuickCapture,
  type ParsedChips,
  type QuickCaptureContext,
  type CaptureTarget,
} from '@/lib/parser/quick-capture';
import {
  dispatchQuickCapture,
  undoQuickCapture,
  getQuickCaptureContext,
} from '@/lib/actions/quick-capture';
import {
  queueCapture,
  isBrowserOffline,
  flushQueuedCaptures,
  getQueuedCaptures,
} from '@/lib/offline/capture-queue';
import {
  Command,
  ArrowRight,
  X,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  WifiOff,
  RotateCcw,
  Calendar,
  Tag,
  Folder,
  IndianRupee,
  Flag,
} from 'lucide-react';

export function QuickCaptureOmnibar({
  initialContext,
}: {
  initialContext?: QuickCaptureContext;
} = {}) {
  const router = useRouter();
  const { isQuickCaptureOpen, closeQuickCapture, quickCaptureInitialValue } = useUIStore();
  const [input, setInput] = useState(quickCaptureInitialValue || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [queuedCount, setQueuedCount] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Context: Categories, Projects, Habits, Profile Timezone
  const [context, setContext] = useState<QuickCaptureContext>(() => ({
    timezone: initialContext?.timezone || 'Asia/Kolkata',
    categories: initialContext?.categories || [],
    projects: initialContext?.projects || [],
    habits: initialContext?.habits || [],
  }));

  // User-edited overrides on the preview chips
  const [chipOverrides, setChipOverrides] = useState<Partial<ParsedChips>>({});

  // 5-Second Undo State
  const [undoState, setUndoState] = useState<{
    target: CaptureTarget;
    entityId: string;
    extra?: { habitDate?: string; habitChanged?: boolean };
    message: string;
  } | null>(null);
  const [undoSecondsLeft, setUndoSecondsLeft] = useState(5);
  const undoIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load contextual data on open
  useEffect(() => {
    if (isQuickCaptureOpen) {
      getQuickCaptureContext()
        .then((ctx) => {
          if (ctx) setContext(ctx);
        })
        .catch(() => {});
    }
  }, [isQuickCaptureOpen]);

  // Clear timers on unmount or close
  const clearUndoTimer = useCallback(() => {
    if (undoIntervalRef.current) {
      clearInterval(undoIntervalRef.current);
      undoIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearUndoTimer();
  }, [clearUndoTimer]);

  // Modal close handler: resets state, clears timers, and triggers router.refresh if items were saved
  const handleClose = useCallback(() => {
    clearUndoTimer();
    setInput('');
    setChipOverrides({});
    setFeedback(null);
    if (undoState) {
      router.refresh();
    }
    setUndoState(null);
    closeQuickCapture();
  }, [clearUndoTimer, closeQuickCapture, undoState, router]);

  // Accessible modal focus trapping, Escape handling, and focus restoration
  useModalA11y(isQuickCaptureOpen, handleClose, dialogRef);

  // Monitor network online/offline status & queue size
  const syncOfflineQueue = useCallback(async () => {
    const queue = getQueuedCaptures();
    setQueuedCount(queue.length);

    if (navigator.onLine && queue.length > 0) {
      const { synced, failed } = await flushQueuedCaptures(dispatchQuickCapture);
      setQueuedCount(getQueuedCaptures().length);
      if (synced > 0) {
        setFeedback({
          type: 'success',
          message: `Reconnected — synced ${synced} offline item${synced > 1 ? 's' : ''}${failed > 0 ? ` (${failed} pending)` : ''}.`,
        });
        router.refresh();
      }
    }
  }, [router]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOffline(isBrowserOffline());
    setQueuedCount(getQueuedCaptures().length);

    const handleOnline = () => {
      setIsOffline(false);
      syncOfflineQueue();
    };

    const handleOffline = () => {
      setIsOffline(true);
      setQueuedCount(getQueuedCaptures().length);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    syncOfflineQueue();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncOfflineQueue]);

  // Global Keyboard Shortcuts (Cmd+K / Ctrl+K to toggle; Escape is handled by useModalA11y)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const store = useUIStore.getState();
        if (store.isQuickCaptureOpen) {
          handleClose();
        } else {
          store.openQuickCapture();
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleClose]);

  // Focus Management when opened
  useEffect(() => {
    if (isQuickCaptureOpen) {
      if (quickCaptureInitialValue) {
        setInput(quickCaptureInitialValue);
      }
      setTimeout(() => {
        inputRef.current?.focus();
        if (quickCaptureInitialValue && inputRef.current) {
          const len = inputRef.current.value.length;
          inputRef.current.setSelectionRange(len, len);
        }
      }, 50);
    } else {
      setInput('');
      setChipOverrides({});
      setFeedback(null);
      setUndoState(null);
      clearUndoTimer();
    }
  }, [isQuickCaptureOpen, quickCaptureInitialValue, clearUndoTimer]);

  // Reset chip overrides whenever user edits the raw input
  const handleInputChange = (val: string) => {
    setInput(val);
    setChipOverrides({});
    setUndoState(null);
    clearUndoTimer();
  };

  // Parser Execution
  const parsed = useMemo(() => {
    return parseQuickCapture(input, context);
  }, [input, context]);

  // Merged effective chips (parsed + any direct edits made on preview chips)
  const effectiveChips: ParsedChips = useMemo(() => {
    return {
      ...parsed.chips,
      ...chipOverrides,
    };
  }, [parsed.chips, chipOverrides]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setFeedback(null);
    clearUndoTimer();

    // If browser is currently offline, queue immediately without crashing
    if (isBrowserOffline()) {
      queueCapture(input);
      setQueuedCount(getQueuedCaptures().length);
      setIsSubmitting(false);
      setFeedback({
        type: 'success',
        message: 'Saved offline — will sync automatically when back online.',
      });
      setInput('');
      setChipOverrides({});
      setTimeout(() => {
        closeQuickCapture();
        setFeedback(null);
      }, 1600);
      return;
    }

    try {
      const res = await dispatchQuickCapture(input, effectiveChips, context);
      setIsSubmitting(false);

      if (res.success && res.data) {
        setInput('');
        setChipOverrides({});
        router.refresh();

        // Habit check-in: if already done today, no undo needed
        if (res.data.target === 'habit' && res.data.message === 'Already done') {
          setFeedback({ type: 'success', message: 'Already done' });
          setTimeout(() => {
            closeQuickCapture();
            router.refresh();
            setFeedback(null);
          }, 1500);
          return;
        }

        // Start 5-second Undo Window
        setUndoState({
          target: res.data.target,
          entityId: res.data.entityId,
          extra: res.data.extra,
          message: res.data.message,
        });
        setUndoSecondsLeft(5);

        undoIntervalRef.current = setInterval(() => {
          setUndoSecondsLeft((prev) => {
            if (prev <= 1) {
              clearUndoTimer();
              setUndoState(null);
              closeQuickCapture();
              router.refresh();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        if (res.error?.includes('network') || res.error?.includes('fetch failed')) {
          queueCapture(input);
          setQueuedCount(getQueuedCaptures().length);
          setFeedback({
            type: 'success',
            message: 'Saved offline — will sync automatically when back online.',
          });
          setInput('');
          setChipOverrides({});
          setTimeout(() => {
            closeQuickCapture();
            setFeedback(null);
          }, 1600);
        } else {
          setFeedback({ type: 'error', message: res.error || 'Failed to dispatch entry.' });
        }
      }
    } catch (_err) {
      queueCapture(input);
      setQueuedCount(getQueuedCaptures().length);
      setIsSubmitting(false);
      setFeedback({
        type: 'success',
        message: 'Saved offline — will sync automatically when back online.',
      });
      setInput('');
      setChipOverrides({});
      setTimeout(() => {
        closeQuickCapture();
        setFeedback(null);
      }, 1600);
    }
  };

  const handleUndo = async () => {
    if (!undoState) return;
    clearUndoTimer();

    try {
      const res = await undoQuickCapture(
        undoState.target,
        undoState.entityId,
        undoState.extra
      );
      if (res.success) {
        setFeedback({ type: 'success', message: 'Undone' });
        setUndoState(null);
        router.refresh();
        setTimeout(() => {
          handleClose();
          router.refresh();
        }, 1200);
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to undo.' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Failed to undo.' });
    }
  };

  if (!isQuickCaptureOpen) return null;

  const showChips = Boolean(input.trim());

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-20 sm:pt-28 bg-on-surface/25 dark:bg-black/60 backdrop-blur-xs px-4 transition-opacity animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Quick Capture"
        className="w-full max-w-2xl rounded-2xl border border-outline-variant/40 dark:border-zinc-800/80 bg-surface-container-lowest dark:bg-zinc-900 shadow-2xl overflow-hidden ring-1 ring-black/5 dark:ring-white/5 transition-colors duration-200"
      >
        <form onSubmit={handleSubmit} className="relative">
          {/* Main Input Row */}
          <div className="flex items-center px-4 py-3.5 border-b border-outline-variant/20 dark:border-zinc-800/60">
            <Command size={18} className="text-secondary dark:text-emerald-400 shrink-0 mr-3" />
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="Type anything: '₹450 lunch', 't Ship v1 tomorrow !high', 'Read 20 pages'..."
              className="w-full bg-transparent text-sm text-on-surface dark:text-zinc-100 placeholder:text-outline dark:placeholder:text-zinc-500 focus:outline-none"
            />

            {/* Offline or Queue Indicator */}
            {(isOffline || queuedCount > 0) && (
              <span className="flex items-center gap-1 font-mono text-[11px] text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded mr-2 shrink-0 border border-amber-500/20">
                <WifiOff size={11} />
                <span>{isOffline ? 'Offline' : `${queuedCount} waiting to sync`}</span>
              </span>
            )}

            {input && (
              <button
                type="button"
                onClick={() => handleInputChange('')}
                className="text-outline dark:text-zinc-500 hover:text-on-surface dark:hover:text-zinc-200 p-1 mr-2 transition-colors cursor-pointer"
                title="Clear input"
              >
                <X size={15} />
              </button>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !input.trim()}
              className="flex items-center gap-1.5 rounded-lg bg-primary dark:bg-zinc-100 px-3.5 py-1.5 text-xs font-semibold text-on-primary dark:text-zinc-900 shadow-xs hover:opacity-90 dark:hover:bg-zinc-200 disabled:opacity-40 transition shrink-0 cursor-pointer"
            >
              <span>{isSubmitting ? 'Saving...' : isOffline ? 'Save offline' : 'Capture'}</span>
              <ArrowRight size={13} />
            </button>
          </div>

          {/* Editable Preview Chips Row (Enter saves, Esc closes, Tab moves between chips) */}
          {showChips && (
            <div
              data-testid="preview-chips-row"
              className="flex items-center flex-wrap gap-2 px-4 py-2 bg-surface-container-low/50 dark:bg-zinc-950/40 border-b border-outline-variant/15 dark:border-zinc-800/60 text-xs"
            >
              <span className="text-[11px] font-medium text-on-surface-variant/70 dark:text-zinc-400 shrink-0">
                Create:
              </span>

              {/* Type Chip */}
              <div className="inline-flex items-center bg-surface-container dark:bg-zinc-800 rounded-md border border-outline-variant/30 dark:border-zinc-700/60 px-2 py-0.5 text-xs text-on-surface dark:text-zinc-200 focus-within:ring-1 focus-within:ring-primary">
                <select
                  data-testid="chip-type"
                  value={
                    effectiveChips.type === 'transaction' || effectiveChips.type === 'expense'
                      ? 'expense'
                      : effectiveChips.type
                  }
                  onChange={(e) =>
                    setChipOverrides((prev) => ({
                      ...prev,
                      type: e.target.value as CaptureTarget,
                    }))
                  }
                  className="bg-transparent border-0 outline-none text-xs font-medium cursor-pointer py-0.5 capitalize text-on-surface dark:text-zinc-200"
                >
                  <option value="task" className="dark:bg-zinc-900">Task</option>
                  <option value="expense" className="dark:bg-zinc-900">Expense</option>
                  <option value="assignment" className="dark:bg-zinc-900">Assignment</option>
                  <option value="habit" className="dark:bg-zinc-900">Habit</option>
                  <option value="note" className="dark:bg-zinc-900">Idea</option>
                </select>
              </div>

              {/* Title Chip */}
              <div className="inline-flex items-center bg-surface-container dark:bg-zinc-800 rounded-md border border-outline-variant/30 dark:border-zinc-700/60 px-2 py-0.5 text-xs text-on-surface dark:text-zinc-200 focus-within:ring-1 focus-within:ring-primary max-w-[200px]">
                <input
                  data-testid="chip-title"
                  type="text"
                  value={effectiveChips.title || ''}
                  onChange={(e) =>
                    setChipOverrides((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Title"
                  className="bg-transparent border-0 outline-none text-xs w-full text-on-surface dark:text-zinc-200 placeholder:text-outline"
                />
              </div>

              {/* Due / Date Chip (for tasks, assignments, expenses, habits) */}
              {(effectiveChips.type === 'task' ||
                effectiveChips.type === 'assignment' ||
                effectiveChips.type === 'transaction' ||
                effectiveChips.type === 'expense' ||
                effectiveChips.type === 'habit') && (
                <div className="inline-flex items-center gap-1 bg-surface-container dark:bg-zinc-800 rounded-md border border-outline-variant/30 dark:border-zinc-700/60 px-2 py-0.5 text-xs text-on-surface dark:text-zinc-200 focus-within:ring-1 focus-within:ring-primary">
                  <Calendar size={12} className="text-outline dark:text-zinc-400 shrink-0" />
                  <input
                    data-testid="chip-date"
                    type="date"
                    value={effectiveChips.date || ''}
                    onChange={(e) =>
                      setChipOverrides((prev) => ({ ...prev, date: e.target.value || null }))
                    }
                    className="bg-transparent border-0 outline-none text-xs cursor-pointer text-on-surface dark:text-zinc-200"
                  />
                </div>
              )}

              {/* Priority Chip (for tasks) */}
              {effectiveChips.type === 'task' && (
                <div className="inline-flex items-center gap-1 bg-surface-container dark:bg-zinc-800 rounded-md border border-outline-variant/30 dark:border-zinc-700/60 px-2 py-0.5 text-xs text-on-surface dark:text-zinc-200 focus-within:ring-1 focus-within:ring-primary">
                  <Flag size={12} className="text-outline dark:text-zinc-400 shrink-0" />
                  <select
                    data-testid="chip-priority"
                    value={effectiveChips.priority || 2}
                    onChange={(e) =>
                      setChipOverrides((prev) => ({
                        ...prev,
                        priority: Number(e.target.value) as 1 | 2 | 3 | 4,
                      }))
                    }
                    className="bg-transparent border-0 outline-none text-xs cursor-pointer text-on-surface dark:text-zinc-200"
                  >
                    <option value={1} className="dark:bg-zinc-900">Low (1)</option>
                    <option value={2} className="dark:bg-zinc-900">Medium (2)</option>
                    <option value={3} className="dark:bg-zinc-900">High (3)</option>
                    <option value={4} className="dark:bg-zinc-900">Urgent (4)</option>
                  </select>
                </div>
              )}

              {/* Amount Chip (for expenses) */}
              {(effectiveChips.type === 'transaction' || effectiveChips.type === 'expense') && (
                <div className="inline-flex items-center gap-1 bg-surface-container dark:bg-zinc-800 rounded-md border border-outline-variant/30 dark:border-zinc-700/60 px-2 py-0.5 text-xs text-on-surface dark:text-zinc-200 focus-within:ring-1 focus-within:ring-primary w-24">
                  <IndianRupee size={12} className="text-outline dark:text-zinc-400 shrink-0" />
                  <input
                    data-testid="chip-amount"
                    type="number"
                    step="any"
                    value={effectiveChips.amount ?? ''}
                    onChange={(e) =>
                      setChipOverrides((prev) => ({
                        ...prev,
                        amount: e.target.value === '' ? null : Number(e.target.value),
                      }))
                    }
                    placeholder="Amount"
                    className="bg-transparent border-0 outline-none text-xs w-full text-on-surface dark:text-zinc-200"
                  />
                </div>
              )}

              {/* Category Chip (for expenses) */}
              {(effectiveChips.type === 'transaction' || effectiveChips.type === 'expense') && (
                <div className="inline-flex items-center gap-1 bg-surface-container dark:bg-zinc-800 rounded-md border border-outline-variant/30 dark:border-zinc-700/60 px-2 py-0.5 text-xs text-on-surface dark:text-zinc-200 focus-within:ring-1 focus-within:ring-primary">
                  <Tag size={12} className="text-outline dark:text-zinc-400 shrink-0" />
                  <select
                    data-testid="chip-category"
                    value={effectiveChips.categoryId || ''}
                    onChange={(e) => {
                      const selectedId = e.target.value || null;
                      const matched = context.categories?.find((c) => c.id === selectedId);
                      setChipOverrides((prev) => ({
                        ...prev,
                        categoryId: selectedId,
                        category: matched ? matched.name : null,
                      }));
                    }}
                    className="bg-transparent border-0 outline-none text-xs cursor-pointer text-on-surface dark:text-zinc-200"
                  >
                    <option value="" className="dark:bg-zinc-900">No category</option>
                    {context.categories?.map((c) => (
                      <option key={c.id} value={c.id} className="dark:bg-zinc-900">
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Project Chip (for tasks, assignments, expenses, notes) */}
              {effectiveChips.type !== 'habit' && (
                <div className="inline-flex items-center gap-1 bg-surface-container dark:bg-zinc-800 rounded-md border border-outline-variant/30 dark:border-zinc-700/60 px-2 py-0.5 text-xs text-on-surface dark:text-zinc-200 focus-within:ring-1 focus-within:ring-primary">
                  <Folder size={12} className="text-outline dark:text-zinc-400 shrink-0" />
                  <select
                    data-testid="chip-project"
                    value={effectiveChips.projectId || ''}
                    onChange={(e) => {
                      const selectedId = e.target.value || null;
                      const matched = context.projects?.find((p) => p.id === selectedId);
                      setChipOverrides((prev) => ({
                        ...prev,
                        projectId: selectedId,
                        project: matched ? matched.title : null,
                      }));
                    }}
                    className="bg-transparent border-0 outline-none text-xs cursor-pointer text-on-surface dark:text-zinc-200"
                  >
                    <option value="" className="dark:bg-zinc-900">No project</option>
                    {context.projects?.map((p) => (
                      <option key={p.id} value={p.id} className="dark:bg-zinc-900">
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Habit Status Chip */}
              {effectiveChips.type === 'habit' && (
                <span className="font-mono text-[11px] text-secondary dark:text-emerald-400 bg-secondary/10 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-secondary/20">
                  {effectiveChips.statusNote || 'Ready to check in'}
                </span>
              )}
            </div>
          )}

          {/* Footer Shortcuts Strip */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-surface-container-low/70 dark:bg-zinc-950/60 text-xs gap-2">
            <div className="flex items-center gap-2 min-w-0 truncate">
              <Sparkles size={13} className="text-secondary dark:text-emerald-400 shrink-0" />
              <span className="font-mono text-[11px] text-on-surface-variant dark:text-zinc-300 truncate">
                {input.trim()
                  ? parsed.summaryPill
                  : 'Type anything: ₹450 lunch, t Task tomorrow, i Idea, a Assignment'}
              </span>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <div className="flex items-center gap-2 text-[10px] text-outline dark:text-zinc-500 font-mono">
                <span>Tab moves chips</span>
                <span>•</span>
                <span>Esc closes</span>
                <span>•</span>
                <span>Enter saves</span>
              </div>
            </div>
          </div>
        </form>

        {/* 5-Second Undo Toast */}
        {undoState && (
          <div
            data-testid="undo-toast"
            className="flex items-center justify-between px-4 py-3 text-xs font-medium border-t border-secondary/20 dark:border-emerald-800/40 bg-secondary-container dark:bg-emerald-950/40 text-on-secondary-container dark:text-emerald-300 transition-colors animate-in fade-in"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 size={15} />
              <span>Added: {undoState.message}</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleUndo}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-secondary text-on-secondary dark:bg-emerald-500 dark:text-zinc-950 font-semibold hover:opacity-90 transition cursor-pointer"
              >
                <RotateCcw size={12} />
                <span>Undo ({undoSecondsLeft}s)</span>
              </button>
            </div>
          </div>
        )}

        {/* Regular Feedback Toast */}
        {!undoState && feedback && (
          <div
            data-testid="feedback-toast"
            className={`flex items-center gap-2 px-4 py-3 text-xs font-medium border-t transition-colors ${
              feedback.type === 'success'
                ? 'border-secondary/20 dark:border-emerald-800/40 bg-secondary-container dark:bg-emerald-950/40 text-on-secondary-container dark:text-emerald-300'
                : 'border-error/20 dark:border-rose-800/40 bg-error-container dark:bg-rose-950/40 text-on-error-container dark:text-rose-300'
            }`}
          >
            {feedback.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
            <span>{feedback.message}</span>
          </div>
        )}
      </div>
    </div>
  );
}
