'use client';

import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ModalMaxWidth = 'sm' | 'md' | 'lg' | 'xl';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  /** Use Playfair Display hero heading (reserved strictly for Session Complete & Streak Milestones). */
  heroTitle?: boolean;
  maxWidth?: ModalMaxWidth;
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  className?: string;
  children: React.ReactNode;
}

const MAX_WIDTH_CLASSES: Record<ModalMaxWidth, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
};

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/**
 * Pure helper computing wrap-around index for keyboard focus trapping.
 */
export function getWrappedFocusIndex(
  currentIndex: number,
  totalCount: number,
  shiftKey: boolean
): number {
  if (totalCount <= 0) return -1;
  if (shiftKey) {
    return currentIndex <= 0 ? totalCount - 1 : currentIndex - 1;
  }
  return currentIndex === -1 || currentIndex >= totalCount - 1 ? 0 : currentIndex + 1;
}

/**
 * Accessible Stitch Modal with Escape close, backdrop dismissal, and Tab focus trap.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  heroTitle = false,
  maxWidth = 'md',
  showCloseButton = true,
  closeOnBackdrop = true,
  className,
  children,
}: ModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const dialogEl = dialogRef.current;

    if (dialogEl) {
      const focusables = Array.from(
        dialogEl.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      );
      if (focusables.length > 0) {
        focusables[0].focus();
      } else {
        dialogEl.focus();
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key === 'Tab' && dialogEl) {
        const focusables = Array.from(
          dialogEl.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
        );
        if (focusables.length === 0) {
          event.preventDefault();
          dialogEl.focus();
          return;
        }
        const activeIndex = focusables.indexOf(document.activeElement as HTMLElement);
        const nextIndex = getWrappedFocusIndex(
          activeIndex,
          focusables.length,
          event.shiftKey
        );
        if (nextIndex >= 0) {
          event.preventDefault();
          focusables[nextIndex].focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
        previouslyFocused.focus();
      }
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/35 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (closeOnBackdrop && e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={cn(
          'relative w-full max-h-[90vh] overflow-y-auto rounded-2xl border border-outline-variant/50 bg-surface-container-lowest p-6 text-on-surface shadow-ambient focus:outline-none',
          MAX_WIDTH_CLASSES[maxWidth],
          className
        )}
      >
        {(title || showCloseButton) && (
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="min-w-0">
              {title && (
                <h2
                  id={titleId}
                  className={cn(
                    'text-on-surface',
                    heroTitle
                      ? 'font-serif text-modal-hero font-normal tracking-tight'
                      : 'font-sans text-title-lg font-medium tracking-tight'
                  )}
                >
                  {title}
                </h2>
              )}
              {description && (
                <p
                  id={descriptionId}
                  className="mt-1 text-body-sm text-on-surface-variant"
                >
                  {description}
                </p>
              )}
            </div>
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close modal"
                className="shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/50"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
