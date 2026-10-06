'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useUIStore } from '@/lib/store/use-ui-store';
import { parseQuickCapture } from '@/lib/parser/quick-capture';
import { dispatchQuickCapture } from '@/lib/actions/quick-capture';
import { Command, ArrowRight, X, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

export function QuickCaptureOmnibar() {
  const { isQuickCaptureOpen, closeQuickCapture } = useUIStore();
  const [input, setInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  // CRITICAL CONSTRAINT (Focus Management):
  // When summoned, the input element must immediately and automatically receive focus.
  useEffect(() => {
    if (isQuickCaptureOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setInput('');
      setFeedback(null);
    }
  }, [isQuickCaptureOpen]);

  // Real-time Parser Preview Pill (Updates as user types)
  const parsed = parseQuickCapture(input);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setFeedback(null);

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
      setFeedback({ type: 'error', message: res.error || 'Failed to dispatch entry.' });
    }
  };

  if (!isQuickCaptureOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-slate-950/80 backdrop-blur-md px-4 transition-opacity animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          closeQuickCapture();
        }
      }}
    >
      <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900/95 shadow-2xl overflow-hidden ring-1 ring-white/10">
        <form onSubmit={handleSubmit} className="relative">
          {/* Main Input Row */}
          <div className="flex items-center px-4 py-3.5 border-b border-slate-800/80">
            <Command size={18} className="text-indigo-400 shrink-0 mr-3" />
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type anything: '$50 hosting #cloud' or 'todo: Ship v1 @tomorrow'..."
              className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
            />
            {input && (
              <button
                type="button"
                onClick={() => setInput('')}
                className="text-slate-500 hover:text-slate-300 p-1 mr-2"
              >
                <X size={15} />
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting || !input.trim()}
              className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-indigo-500/20 hover:bg-indigo-500 disabled:opacity-40 transition"
            >
              <span>{isSubmitting ? 'Routing...' : 'Capture'}</span>
              <ArrowRight size={13} />
            </button>
          </div>

          {/* Dynamic Summary Pill Feedback Mechanism */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950/50 text-xs border-b border-slate-800/40">
            <div className="flex items-center gap-2 truncate">
              <Sparkles size={13} className="text-amber-400 shrink-0" />
              <span className="font-mono text-[11px] text-slate-300 truncate">
                {input.trim() ? parsed.summaryPill : 'Examples: "$45 dinner", "todo: File taxes @tomorrow #ops", "Note ideas..."'}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0 text-[10px] text-slate-500 font-mono">
              <span>ESC to cancel</span>
              <span>•</span>
              <span>ENTER to log</span>
            </div>
          </div>
        </form>

        {/* Action Dispatch Feedback Toast */}
        {feedback && (
          <div
            className={`flex items-center gap-2 px-4 py-3 text-xs font-medium border-t ${
              feedback.type === 'success'
                ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                : 'border-rose-500/20 bg-rose-500/10 text-rose-300'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 size={15} />
            ) : (
              <AlertCircle size={15} />
            )}
            <span>{feedback.message}</span>
          </div>
        )}
      </div>
    </div>
  );
}
