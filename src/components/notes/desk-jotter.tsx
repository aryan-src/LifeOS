'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ArrowUp,
  Copy,
  Check,
  Trash2,
  Loader2,
  Sparkles,
  Bookmark,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ----------------------------------------------------------------------
// Transition Physics & Spring Curves from Origin / Jahed AI Input
// ----------------------------------------------------------------------
const SPRING_TRANSITION =
  'height 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.25s ease';
const SMOOTH_HEIGHT_TRANSITION =
  'height 0.15s ease-out, box-shadow 0.25s ease';

function MorphingText({ text }: { text: string }) {
  const [width, setWidth] = useState<number | 'auto'>('auto');
  const spanRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (spanRef.current) {
      setWidth(spanRef.current.offsetWidth);
    }
  }, [text]);

  return (
    <span
      className="relative inline-flex items-center justify-center overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.175,0.885,0.32,1.275)]"
      style={{ width }}
    >
      <span ref={spanRef} className="invisible whitespace-nowrap px-0.5">
        {text}
      </span>
      <span
        key={text}
        className="absolute inset-0 flex items-center justify-center whitespace-nowrap animate-in fade-in zoom-in-95 duration-300"
      >
        {text}
      </span>
    </span>
  );
}

interface DeskJotterProps {
  content: string;
  onChange: (val: string) => void;
  onAppendToVault: () => Promise<void> | void;
  isAppending?: boolean;
  className?: string;
}

export function DeskJotter({
  content,
  onChange,
  onAppendToVault,
  isAppending = false,
  className,
}: DeskJotterProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const topFadeRef = useRef<HTMLDivElement>(null);
  const bottomFadeRef = useRef<HTMLDivElement>(null);

  const [copied, setCopied] = useState(false);
  const [isSmoothResize, setIsSmoothResize] = useState(false);
  const [textareaHeight, setTextareaHeight] = useState(160);
  const [containerHeight, setContainerHeight] = useState(250);
  const [isScrolling, setIsScrolling] = useState(false);

  const hasValue = content.trim() !== '';

  const updateFades = () => {
    const el = textareaRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    if (topFadeRef.current) {
      topFadeRef.current.style.opacity = Math.min(scrollTop / 20, 1).toString();
    }
    if (bottomFadeRef.current) {
      const bottomScroll = scrollHeight - clientHeight - scrollTop;
      bottomFadeRef.current.style.opacity = Math.min(
        Math.max(bottomScroll - 16, 0) / 10,
        1
      ).toString();
    }
  };

  const handleTextChange = useCallback(
    (val: string) => {
      setIsSmoothResize(true);
      onChange(val);
    },
    [onChange]
  );

  // Auto-resize textarea with content
  useEffect(() => {
    if (!textareaRef.current) return;
    const el = textareaRef.current;
    const currentH = el.style.height;
    el.style.transition = 'none';
    el.style.height = '0px';
    const scrollH = el.scrollHeight;
    el.style.height = currentH;
    void el.offsetHeight;
    el.style.transition = '';

    const newH = Math.max(140, Math.min(scrollH, 320));
    el.style.height = `${newH}px`;
    setTextareaHeight(newH);
    setIsScrolling(scrollH > 320);
    setTimeout(updateFades, 0);
  }, [content]);

  useEffect(() => {
    setContainerHeight(textareaHeight + 96);
    setTimeout(updateFades, 0);
  }, [textareaHeight]);

  const handleCopy = async () => {
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard fallback
    }
  };

  const handleClear = () => {
    setIsSmoothResize(false);
    onChange('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      if (hasValue && !isAppending) {
        onAppendToVault();
      }
    }
  };

  return (
    <div
      ref={containerRef}
      style={{
        height: containerHeight,
        transition: isSmoothResize
          ? SMOOTH_HEIGHT_TRANSITION
          : SPRING_TRANSITION,
      }}
      className={cn(
        'relative w-full rounded-2xl border border-outline-variant/60 dark:border-stone-800 bg-surface-container-lowest dark:bg-stone-900 shadow-sm transition-all focus-within:shadow-md focus-within:border-primary/40 focus-within:ring-1 focus-within:ring-primary/20 hover:border-outline-variant flex flex-col justify-between overflow-hidden',
        className
      )}
    >
      {/* Top Header Dock */}
      <div className="relative z-[10] flex items-center justify-between px-4 pt-3.5 pb-2 border-b border-surface-container-high/60 bg-surface-container-lowest/80 dark:bg-stone-900/80 backdrop-blur-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
          <span className="font-headline-sm text-[14px] text-on-surface font-semibold tracking-tight">
            Desk Jotter
          </span>
          <span className="text-[10px] font-mono text-outline bg-surface-container px-1.5 py-0.5 rounded">
            Auto-persists
          </span>
        </div>
        <div className="text-[11px] font-mono text-outline">
          <MorphingText text={`${content.length} chars`} />
        </div>
      </div>

      {/* Main Text Area with Top/Bottom Gradient Fades */}
      <div className="relative flex-1 px-4 py-2 overflow-hidden">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => handleTextChange(e.target.value)}
          onScroll={updateFades}
          onKeyDown={handleKeyDown}
          placeholder="Keep an untruncated fleeting stream here. Everything written auto-persists locally until you hit deposit or clear."
          aria-label="Desk Jotter Scratchpad"
          disabled={isAppending}
          style={{
            height: `${textareaHeight}px`,
            transition: isSmoothResize ? 'height 0.15s ease-out' : 'none',
          }}
          className={cn(
            'w-full resize-none bg-transparent pt-1 pb-2 text-[13px] leading-[22px] text-on-surface outline-none placeholder:text-outline/70 font-sans cursor-text',
            isScrolling ? 'overflow-y-auto' : 'overflow-y-hidden'
          )}
        />

        {/* Gradient Fades for Long Content */}
        <div
          ref={topFadeRef}
          className="absolute left-4 right-4 top-0 z-[2] h-4 bg-gradient-to-b from-surface-container-lowest to-transparent dark:from-stone-900 pointer-events-none"
        />
        <div
          ref={bottomFadeRef}
          className="absolute left-4 right-4 bottom-0 z-[2] h-6 bg-gradient-to-t from-surface-container-lowest to-transparent dark:from-stone-900 pointer-events-none"
          style={{ opacity: 0 }}
        />
      </div>

      {/* Bottom Action Bar (Morphing Toolbar) */}
      <div className="relative z-[10] flex items-center justify-between px-3.5 py-2.5 border-t border-surface-container-high/60 bg-surface-container-lowest/90 dark:bg-stone-900/90 backdrop-blur-xs">
        {/* Left Toolbar Controls */}
        <div className="flex items-center gap-1.5 text-[11px] font-mono">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleClear}
            disabled={!hasValue}
            className="flex items-center gap-1 px-2 py-1 rounded-full text-outline hover:text-error hover:bg-surface-container transition-colors disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            aria-label="Clear jotter"
          >
            <Trash2 size={12} />
            <span>Clear</span>
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleCopy}
            disabled={!hasValue}
            className={cn(
              'flex items-center gap-1 px-2.5 py-1 rounded-full transition-colors cursor-pointer',
              copied
                ? 'bg-secondary text-on-secondary font-medium'
                : 'text-on-surface-variant hover:text-on-surface bg-surface-container hover:bg-surface-container-high'
            )}
            aria-label="Copy jotter contents"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            <span>
              <MorphingText text={copied ? 'Copied!' : 'Copy'} />
            </span>
          </button>

          <div className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-full text-outline/80 bg-surface-container/60">
            <Bookmark size={11} className="text-secondary" />
            <span>#scratchpad</span>
          </div>
        </div>

        {/* Right Action: Deposit into Vault Button */}
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-block text-[10px] font-mono text-outline">
            ⌘↵ deposit
          </span>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onClick={onAppendToVault}
            disabled={!hasValue || isAppending}
            aria-label="Deposit into Vault"
            style={{ borderRadius: 9999 }}
            className={cn(
              'flex size-8 items-center justify-center transition-all duration-300 outline-none cursor-pointer shrink-0',
              hasValue
                ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-sm hover:opacity-90 active:scale-95'
                : 'bg-surface-container text-outline/50 cursor-not-allowed opacity-60'
            )}
          >
            {isAppending ? (
              <Loader2 size={15} className="animate-spin text-current" />
            ) : (
              <ArrowUp
                size={15}
                strokeWidth={2.25}
                className={cn(
                  'transition-transform duration-200',
                  hasValue ? 'translate-y-0 scale-100' : 'translate-y-0.5 scale-90'
                )}
              />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
