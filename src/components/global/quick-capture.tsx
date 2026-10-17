'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUIStore } from '@/lib/store/use-ui-store';
import { parseQuickCapture } from '@/lib/parser/quick-capture';
import { dispatchQuickCapture } from '@/lib/actions/quick-capture';
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
  Zap,
} from 'lucide-react';

export function QuickCaptureOmnibar() {
  const router = useRouter();
  const { isQuickCaptureOpen, closeQuickCapture, quickCaptureInitialValue } = useUIStore();
  const [input, setInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [queuedCount, setQueuedCount] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

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

    // Initial sync check on mount
    syncOfflineQueue();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncOfflineQueue]);

  // Global Keyboard Shortcuts (Cmd+K / Ctrl+K and Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const store = useUIStore.getState();
        if (store.isQuickCaptureOpen) {
          store.closeQuickCapture();
        } else {
          store.openQuickCapture();
        }
      } else if (e.key === 'Escape' && isQuickCaptureOpen) {
        e.preventDefault();
        setInput('');
        setFeedback(null);
        closeQuickCapture();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isQuickCaptureOpen, closeQuickCapture]);

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
      setFeedback(null);
    }
  }, [isQuickCaptureOpen, quickCaptureInitialValue]);

  // Real, Measured Quick-Capture Latency Metrics via performance.now()
  const { parsed, parseDurationMs } = useMemo(() => {
    const start = performance.now();
    const result = parseQuickCapture(input);
    const duration = performance.now() - start;
    return { parsed: result, parseDurationMs: duration };
  }, [input]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setFeedback(null);

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
      setTimeout(() => {
        closeQuickCapture();
        setFeedback(null);
      }, 1600);
      return;
    }

    try {
      const res = await dispatchQuickCapture(input);
      setIsSubmitting(false);

      if (res.success && res.data) {
        setFeedback({ type: 'success', message: res.data.message });
        setInput('');
        setTimeout(() => {
          closeQuickCapture();
          setFeedback(null);
        }, 1500);
      } else {
        // Fallback: If network connection failed, queue offline
        if (res.error?.includes('network') || res.error?.includes('fetch failed')) {
          queueCapture(input);
          setQueuedCount(getQueuedCaptures().length);
          setFeedback({
            type: 'success',
            message: 'Saved offline — will sync automatically when back online.',
          });
          setInput('');
          setTimeout(() => {
            closeQuickCapture();
            setFeedback(null);
          }, 1600);
        } else {
          setFeedback({ type: 'error', message: res.error || 'Failed to dispatch entry.' });
        }
      }
    } catch (_err) {
      // Unhandled network exception fallback to offline queue
      queueCapture(input);
      setQueuedCount(getQueuedCaptures().length);
      setIsSubmitting(false);
      setFeedback({
        type: 'success',
        message: 'Saved offline — will sync automatically when back online.',
      });
      setInput('');
      setTimeout(() => {
        closeQuickCapture();
        setFeedback(null);
      }, 1600);
    }
  };

  if (!isQuickCaptureOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-20 sm:pt-28 bg-on-surface/25 dark:bg-black/60 backdrop-blur-xs px-4 transition-opacity animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          closeQuickCapture();
        }
      }}
    >
      <div className="w-full max-w-2xl rounded-2xl border border-outline-variant/40 dark:border-zinc-800/80 bg-surface-container-lowest dark:bg-zinc-900/95 shadow-2xl overflow-hidden ring-1 ring-black/5 dark:ring-white/5 transition-colors duration-200">
        <form onSubmit={handleSubmit} className="relative">
          {/* Main Input Row */}
          <div className="flex items-center px-4 py-3.5 border-b border-outline-variant/20 dark:border-zinc-800/60">
            <Command size={18} className="text-secondary dark:text-emerald-400 shrink-0 mr-3" />
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type anything: '$50 hosting #cloud' or 'todo: Ship v1 @tomorrow'..."
              className="w-full bg-transparent text-sm text-on-surface dark:text-zinc-100 placeholder:text-outline dark:placeholder:text-zinc-500 focus:outline-none"
            />

            {/* Offline or Queue Indicator */}
            {(isOffline || queuedCount > 0) && (
              <span className="flex items-center gap-1 font-mono text-[11px] text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded mr-2 shrink-0 border border-amber-500/20">
                <WifiOff size={11} />
                <span>{isOffline ? 'Offline' : `${queuedCount} queued`}</span>
              </span>
            )}

            {input && (
              <button
                type="button"
                onClick={() => setInput('')}
                className="text-outline dark:text-zinc-500 hover:text-on-surface dark:hover:text-zinc-200 p-1 mr-2 transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !input.trim()}
              className="flex items-center gap-1.5 rounded-lg bg-primary dark:bg-zinc-100 px-3.5 py-1.5 text-xs font-semibold text-on-primary dark:text-zinc-900 shadow-xs hover:opacity-90 dark:hover:bg-zinc-200 disabled:opacity-40 transition shrink-0 cursor-pointer"
            >
              <span>{isSubmitting ? 'Routing...' : isOffline ? 'Save Offline' : 'Capture'}</span>
              <ArrowRight size={13} />
            </button>
          </div>

          {/* Dynamic Summary Pill & Real Latency Benchmark Feedback */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-surface-container-low/70 dark:bg-zinc-950/60 text-xs border-b border-outline-variant/15 dark:border-zinc-800/60 gap-2">
            <div className="flex items-center gap-2 min-w-0 truncate">
              <Sparkles size={13} className="text-secondary dark:text-emerald-400 shrink-0" />
              <span className="font-mono text-[11px] text-on-surface-variant dark:text-zinc-300 truncate">
                {input.trim()
                  ? parsed.summaryPill
                  : 'Examples: "$45 dinner", "todo: File taxes @tomorrow #ops", "Note ideas..."'}
              </span>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              {/* Real Measured Parse Time */}
              {input.trim() && (
                <span className="hidden sm:inline-flex items-center gap-1 font-mono text-[10px] text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  <Zap size={10} className="fill-current" />
                  <span>Parsed in {parseDurationMs < 0.1 ? '<0.1' : parseDurationMs.toFixed(2)}ms</span>
                </span>
              )}
              <div className="flex items-center gap-2 text-[10px] text-outline dark:text-zinc-500 font-mono">
                <span>ESC to cancel</span>
                <span>•</span>
                <span>ENTER to log</span>
              </div>
            </div>
          </div>
        </form>

        {/* Action Dispatch Feedback Toast */}
        {feedback && (
          <div
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
