'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useUIStore } from '@/lib/store/use-ui-store';
import { parseQuickCapture } from '@/lib/parser/quick-capture';
import { dispatchQuickCapture } from '@/lib/actions/quick-capture';
import { Command, ArrowRight, X, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

export function QuickCaptureOmnibar() {
  const { isQuickCaptureOpen, closeQuickCapture, quickCaptureInitialValue } = useUIStore();
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
      className="fixed inset-0 z-[100] flex items-start justify-center pt-20 sm:pt-28 bg-on-surface/25 backdrop-blur-xs px-4 transition-opacity animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          closeQuickCapture();
        }
      }}
    >
      <div className="w-full max-w-2xl rounded-2xl border border-outline-variant/40 bg-surface-container-lowest shadow-2xl overflow-hidden ring-1 ring-black/5">
        <form onSubmit={handleSubmit} className="relative">
          {/* Main Input Row */}
          <div className="flex items-center px-4 py-3.5 border-b border-outline-variant/20">
            <Command size={18} className="text-secondary shrink-0 mr-3" />
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type anything: '$50 hosting #cloud' or 'todo: Ship v1 @tomorrow'..."
              className="w-full bg-transparent text-sm text-on-surface placeholder:text-outline focus:outline-none"
            />
            {input && (
              <button
                type="button"
                onClick={() => setInput('')}
                className="text-outline hover:text-on-surface p-1 mr-2 transition-colors"
              >
                <X size={15} />
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting || !input.trim()}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-semibold text-on-primary shadow-xs hover:opacity-90 disabled:opacity-40 transition shrink-0"
            >
              <span>{isSubmitting ? 'Routing...' : 'Capture'}</span>
              <ArrowRight size={13} />
            </button>
          </div>

          {/* Dynamic Summary Pill Feedback Mechanism */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-surface-container-low/70 text-xs border-b border-outline-variant/15 gap-2">
            <div className="flex items-center gap-2 min-w-0 truncate">
              <Sparkles size={13} className="text-secondary shrink-0" />
              <span className="font-mono text-[11px] text-on-surface-variant truncate">
                {input.trim() ? parsed.summaryPill : 'Examples: "$45 dinner", "todo: File taxes @tomorrow #ops", "Note ideas..."'}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0 text-[10px] text-outline font-mono">
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
                ? 'border-secondary/20 bg-secondary-container text-on-secondary-container'
                : 'border-error/20 bg-error-container text-on-error-container'
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
