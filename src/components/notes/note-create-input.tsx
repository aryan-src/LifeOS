'use client';

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react';
import {
  Lightbulb,
  Hash,
  ArrowUp,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ----------------------------------------------------------------------
// Transition Physics & Spring Curves from Origin / Jahed AI Input
// ----------------------------------------------------------------------
const SPRING_TRANSITION =
  'height 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.25s ease';
const SMOOTH_HEIGHT_TRANSITION =
  'height 0.15s ease-out, box-shadow 0.25s ease';

const NOTE_TAGS = [
  'ai-research',
  'engineering',
  'design',
  'academics',
  'personal',
  'reading',
  'fleeting',
];

// ----------------------------------------------------------------------
// Kinetic Morphing Text Pill
// ----------------------------------------------------------------------
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

interface NoteCreateInputProps {
  onSubmit: (content: string, tag: string) => Promise<void> | void;
  isSubmitting?: boolean;
  className?: string;
}

export function NoteCreateInput({
  onSubmit,
  isSubmitting = false,
  className,
}: NoteCreateInputProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const topFadeRef = useRef<HTMLDivElement>(null);
  const bottomFadeRef = useRef<HTMLDivElement>(null);
  const tagMenuRef = useRef<HTMLDivElement>(null);

  const [content, setContent] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('ai-research');

  const [expanded, setExpanded] = useState(false);
  const [isSmoothResize, setIsSmoothResize] = useState(false);
  const [containerHeight, setContainerHeight] = useState(116);
  const [textareaHeight, setTextareaHeight] = useState(64);
  const [isScrolling, setIsScrolling] = useState(false);
  const [isTagSelectOpen, setIsTagSelectOpen] = useState(false);

  const [tagHoverStyle, setTagHoverStyle] = useState({
    opacity: 0,
    transform: 'translateY(0px) scale(0.95)',
    transition: 'none',
  });

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

  const handleContentChange = useCallback((val: string) => {
    setIsSmoothResize(true);
    setContent(val);
  }, []);

  const expand = () => {
    setIsSmoothResize(false);
    setExpanded(true);
  };

  useEffect(() => {
    if (expanded) {
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [expanded]);

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

    const newH = Math.max(64, Math.min(scrollH, 150));
    el.style.height = `${newH}px`;
    setTextareaHeight(newH);
    setIsScrolling(scrollH > 150);
    setTimeout(updateFades, 0);
  }, [content, expanded]);

  useEffect(() => {
    setContainerHeight(Math.max(116, textareaHeight + 52));
    setTimeout(updateFades, 0);
  }, [textareaHeight]);

  // Outside click listener
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        isTagSelectOpen &&
        tagMenuRef.current &&
        !tagMenuRef.current.contains(target)
      ) {
        setIsTagSelectOpen(false);
      }

      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        content.trim() === '' &&
        !isTagSelectOpen
      ) {
        setIsSmoothResize(false);
        setExpanded(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isTagSelectOpen) setIsTagSelectOpen(false);
        else if (content.trim() === '') {
          setIsSmoothResize(false);
          setExpanded(false);
        }
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isTagSelectOpen, content]);

  const handleSubmit = async () => {
    if (!content.trim() || isSubmitting) return;
    await onSubmit(content, selectedTag);
    setContent('');
    setIsSmoothResize(false);
    setExpanded(false);
    setIsTagSelectOpen(false);
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={(e) => {
        const isTextarea = e.target === textareaRef.current;
        if (expanded && !isTextarea && !isSubmitting) {
          e.preventDefault();
          textareaRef.current?.focus();
        }
      }}
      style={{
        height: expanded ? containerHeight : 50,
        transition: isSmoothResize
          ? SMOOTH_HEIGHT_TRANSITION
          : SPRING_TRANSITION,
        overflow: expanded ? 'visible' : 'hidden',
      }}
      className={cn(
        'relative w-full rounded-2xl border border-outline-variant/60 dark:border-stone-800 bg-surface-container-lowest dark:bg-stone-900 shadow-sm transition-all focus-within:shadow-md focus-within:border-primary/40 focus-within:ring-1 focus-within:ring-primary/20 hover:border-outline-variant z-10',
        expanded ? 'cursor-text' : 'cursor-default',
        className
      )}
    >
      {/* Resting State Trigger Button */}
      <button
        type="button"
        onClick={expand}
        style={{
          transition: isSmoothResize
            ? 'none'
            : 'all 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        }}
        className={cn(
          'absolute inset-x-0 top-0 z-[1] flex items-center justify-between h-[50px] px-4 text-left outline-none cursor-pointer',
          !expanded
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 scale-95 translate-y-1 pointer-events-none'
        )}
        aria-label="Capture spark or note"
      >
        <div className="flex items-center gap-2.5 text-outline">
          <span className="material-symbols-outlined text-[19px] text-[#2f5c3a] dark:text-emerald-400">
            lightbulb
          </span>
          <span className="text-[13px] font-normal text-outline">
            Capture a fleeting spark, code snippet, or reading note...
          </span>
        </div>
        <div className="flex items-center gap-1.5 mr-10">
          <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-mono text-outline bg-surface-container dark:bg-stone-800 px-1.5 py-0.5 rounded border border-outline-variant/40">
            <span>⌘↵</span>
            <span>Deposit</span>
          </kbd>
        </div>
      </button>

      {/* Multi-line Textarea (Expanded) */}
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => handleContentChange(e.target.value)}
        onScroll={updateFades}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault();
            handleSubmit();
          }
        }}
        placeholder="Capture a fleeting spark, code snippet, or reading note... (⌘+Enter to deposit, Shift+Enter for newline)"
        aria-label="Note content"
        disabled={isSubmitting}
        style={{
          transition: isSmoothResize
            ? 'height 0.15s ease-out'
            : 'opacity 0.25s ease-out, transform 0.25s ease-out',
        }}
        className={cn(
          'absolute top-0 inset-x-0 z-[1] w-full resize-none bg-transparent pl-4 pr-12 pt-3 pb-2 text-[14px] leading-[22px] text-on-surface outline-none placeholder:text-outline/70 cursor-text',
          expanded
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 scale-95 -translate-y-1 pointer-events-none',
          isScrolling ? 'overflow-y-auto' : 'overflow-y-hidden'
        )}
      />

      {/* Top & Bottom Fade Overlays */}
      <div
        ref={topFadeRef}
        className="absolute left-4 right-12 top-0 z-[2] h-6 bg-gradient-to-b from-surface-container-lowest via-surface-container-lowest/80 to-transparent dark:from-stone-900 pointer-events-none"
      />
      <div
        ref={bottomFadeRef}
        className="absolute left-4 right-12 z-[2] h-6 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest/80 to-transparent dark:from-stone-900 pointer-events-none"
        style={{
          opacity: 0,
          top: `${textareaHeight - 24}px`,
          transition: isSmoothResize ? 'top 0.15s ease-out' : 'top 0.35s ease',
        }}
      />

      {/* Bottom Action Bar */}
      <div
        className={cn(
          'absolute bottom-2 left-3 right-12 z-[10] flex items-center justify-between transition-all duration-300 ease-[cubic-bezier(0.175,0.885,0.32,1.275)]',
          expanded
            ? 'opacity-100 blur-0 translate-y-0 pointer-events-auto'
            : 'opacity-0 blur-sm translate-y-2 pointer-events-none'
        )}
      >
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Tag Dropdown Pill */}
          <div className="relative" ref={tagMenuRef}>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => {
                e.stopPropagation();
                setIsTagSelectOpen((prev) => !prev);
              }}
              className={cn(
                'group flex items-center gap-1.5 rounded-full px-2.5 py-1 text-on-surface-variant hover:text-on-surface bg-surface-container hover:bg-surface-container-high transition-all duration-200 outline-none text-[12px] font-mono cursor-pointer',
                isTagSelectOpen && 'bg-surface-container-high ring-1 ring-primary/20 text-on-surface'
              )}
              aria-label={`Select tag. Current: #${selectedTag}`}
            >
              <Hash size={13} className="text-[#2f5c3a] dark:text-emerald-400 group-hover:scale-110 transition-transform" />
              <span className="font-medium select-none">
                <MorphingText text={`#${selectedTag}`} />
              </span>
            </button>

            {/* Tag Selection Dropdown Menu */}
            {isTagSelectOpen && (
              <div
                style={{ transformOrigin: 'bottom left' }}
                onMouseLeave={() => {
                  setTagHoverStyle((prev) => ({
                    ...prev,
                    opacity: 0,
                    transform: prev.transform.replace('scale(1)', 'scale(0.95)'),
                    transition: 'opacity 0.2s ease-in, transform 0.2s ease-out',
                  }));
                }}
                className="absolute bottom-full left-0 mb-2 z-50 w-44 rounded-xl border border-outline-variant/60 bg-surface-container-lowest dark:bg-stone-900 p-1 shadow-xl backdrop-blur-md flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-200"
              >
                <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-outline border-b border-surface-container-high/60 mb-0.5">
                  Tack to Category
                </div>
                <div className="relative flex flex-col gap-0.5">
                  <div
                    style={tagHoverStyle}
                    className="absolute left-0 right-0 top-0 h-7 -z-10 rounded-lg bg-surface-container pointer-events-none"
                  />
                  {NOTE_TAGS.map((tag, idx) => (
                    <button
                      key={tag}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onMouseEnter={() => {
                        setTagHoverStyle({
                          opacity: 1,
                          transform: `translateY(${idx * 30}px) scale(1)`,
                          transition: 'opacity 0.15s ease-out, transform 0.2s ease-out',
                        });
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTag(tag);
                        setIsTagSelectOpen(false);
                      }}
                      className={cn(
                        'group flex h-7 w-full items-center justify-between rounded-lg px-2 text-left text-[12px] font-mono transition-colors cursor-pointer',
                        selectedTag === tag ? 'font-semibold text-primary' : 'text-on-surface-variant'
                      )}
                    >
                      <span>#{tag}</span>
                      {selectedTag === tag && (
                        <span className="text-[11px] text-[#2f5c3a] dark:text-emerald-400">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick Tag Pills for 1-click convenience */}
          <div className="hidden sm:flex items-center gap-1 text-[11px] font-mono">
            {['ai-research', 'engineering', 'design', 'personal'].map((tag) => (
              <button
                key={tag}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setSelectedTag(tag)}
                className={cn(
                  'px-2 py-0.5 rounded transition-colors cursor-pointer',
                  selectedTag === tag
                    ? 'bg-[#2f5c3a] text-white dark:bg-emerald-500/20 dark:text-emerald-300 font-medium'
                    : 'text-outline hover:text-on-surface hover:bg-surface-container'
                )}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>

        {/* Telemetry Indicator */}
        <div className="hidden md:flex items-center gap-1.5 font-label-sm text-label-sm text-[#2f5c3a] dark:text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-[#2f5c3a] dark:bg-emerald-400 animate-pulse" />
          <span>Vault active</span>
        </div>
      </div>

      {/* Circular Action Button at Bottom-Right */}
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onClick={handleSubmit}
        disabled={!hasValue || isSubmitting}
        aria-label="Deposit Spark"
        style={{ borderRadius: 9999 }}
        className={cn(
          'absolute right-2.5 bottom-2 z-[10] flex size-8 items-center justify-center transition-all duration-300 outline-none cursor-pointer',
          hasValue
            ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-sm hover:opacity-90 active:scale-95'
            : 'bg-surface-container text-outline/50 cursor-not-allowed opacity-60'
        )}
      >
        {isSubmitting ? (
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
  );
}
