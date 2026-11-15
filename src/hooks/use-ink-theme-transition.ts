"use client";

import { useCallback, useEffect } from "react";
import { flushSync } from "react-dom";

export interface InkTransitionOptions {
  duration?: number; // ms (default: 1100, range: 1000-1200ms)
  targetTheme?: string;
  ignoreReducedMotion?: boolean;
}

// Module-level guard to ignore extra clicks while transition is active
let isTransitionActive = false;

/**
 * High-Performance View Transitions Ink-Bleed Theme Transition Hook
 * Uses hardware-accelerated CSS steps() sprite-sheet alpha mask on ::view-transition-new(root)
 * for a crisp, tendril-spreading ink bleed at 60fps with zero click lag.
 */
export function useInkThemeTransition() {
  // Preload and pre-decode the sprite sheet image on idle/mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const img = new Image();
      img.src = "/images/ink-mask-spritesheet.webp";
      if ("decode" in img) {
        img.decode().catch(() => {});
      }
    }
  }, []);

  const triggerThemeTransition = useCallback(
    (
      event: React.MouseEvent | React.KeyboardEvent | null,
      applyTheme: () => void,
      options: InkTransitionOptions = {}
    ) => {
      // 1. Ignore extra clicks while a transition is running
      if (isTransitionActive) {
        return;
      }

      const { duration = 1100, ignoreReducedMotion = false } = options;

      const prefersReducedMotion =
        !ignoreReducedMotion &&
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      // 2. Reduced motion fallback: switch instantly with no animation
      if (prefersReducedMotion) {
        applyTheme();
        return;
      }

      const doc = document as Document & {
        startViewTransition?: (cb: () => void) => {
          ready: Promise<void>;
          finished: Promise<void>;
        };
      };

      // 3. Unsupported browser fallback: quick 200ms crossfade
      if (!doc.startViewTransition) {
        if (typeof document !== "undefined" && document.documentElement) {
          document.documentElement.setAttribute("data-theme-crossfading", "true");
        }
        applyTheme();
        setTimeout(() => {
          if (typeof document !== "undefined" && document.documentElement) {
            document.documentElement.removeAttribute("data-theme-crossfading");
          }
        }, 200);
        return;
      }

      // 4. Resolve mask origin: toggle button bounding-box center, falling back to click event or viewport center
      let originX = typeof window !== "undefined" ? window.innerWidth / 2 : 0;
      let originY = typeof window !== "undefined" ? window.innerHeight / 2 : 0;

      let btnEl: HTMLElement | null = null;
      if (event && "currentTarget" in event && event.currentTarget instanceof HTMLElement) {
        btnEl = event.currentTarget;
      } else if (typeof document !== "undefined") {
        if (typeof document.getElementById === "function") {
          btnEl = document.getElementById("theme-toggle-btn");
        }
        if (!btnEl && typeof document.querySelector === "function") {
          btnEl = document.querySelector<HTMLElement>('[data-theme-toggle="true"], [data-purpose="theme-toggle-button"]');
        }
      }

      if (btnEl && typeof btnEl.getBoundingClientRect === "function") {
        const rect = btnEl.getBoundingClientRect();
        originX = rect.left + rect.width / 2;
        originY = rect.top + rect.height / 2;
      } else if (
        event &&
        "clientX" in event &&
        typeof (event as React.MouseEvent).clientX === "number" &&
        (event as React.MouseEvent).clientX > 0
      ) {
        originX = (event as React.MouseEvent).clientX;
        originY = (event as React.MouseEvent).clientY;
      }

      // 5. Calculate geometry: maximum corner distance to ensure full viewport coverage
      const winW = typeof window !== "undefined" ? window.innerWidth : 1920;
      const winH = typeof window !== "undefined" ? window.innerHeight : 1080;

      const d0 = Math.hypot(originX, originY);
      const d1 = Math.hypot(winW - originX, originY);
      const d2 = Math.hypot(originX, winH - originY);
      const d3 = Math.hypot(winW - originX, winH - originY);
      const maxDist = Math.max(d0, d1, d2, d3);

      const frameSize = Math.ceil(maxDist * 2 * 1.05);
      const xStart = Math.round(originX - frameSize / 2);
      const yStart = Math.round(originY - frameSize / 2);
      // 32 frames total: step from frame 0 to frame 31
      const xEnd = Math.round(xStart - frameSize * 31);

      if (document.documentElement.style?.setProperty) {
        document.documentElement.style.setProperty("--mask-x", `${xStart}px`);
        document.documentElement.style.setProperty("--mask-y", `${yStart}px`);
        document.documentElement.style.setProperty("--mask-x-end", `${xEnd}px`);
        document.documentElement.style.setProperty("--mask-size", `${frameSize}px`);
        document.documentElement.style.setProperty("--ink-duration", `${duration}ms`);
      }

      // 6. Freeze all element CSS transitions and animations during snapshot capture
      document.documentElement.setAttribute("data-theme-transitioning", "true");
      isTransitionActive = true;

      const cleanup = () => {
        isTransitionActive = false;
        document.documentElement.removeAttribute("data-theme-transitioning");
        if (document.documentElement.style?.removeProperty) {
          document.documentElement.style.removeProperty("--mask-x");
          document.documentElement.style.removeProperty("--mask-y");
          document.documentElement.style.removeProperty("--mask-x-end");
          document.documentElement.style.removeProperty("--mask-size");
          document.documentElement.style.removeProperty("--ink-duration");
        }
      };

      // 7. Synchronously update DOM inside startViewTransition before flushSync
      const transition = doc.startViewTransition(() => {
        if (options.targetTheme) {
          const isTargetDark =
            options.targetTheme.includes("dark") ||
            options.targetTheme === "tui" ||
            options.targetTheme === "spatial-glass";
          document.documentElement.classList.toggle("dark", isTargetDark);
          document.documentElement.setAttribute("data-theme", options.targetTheme);
        } else {
          const isCurrentDark = document.documentElement.classList.contains("dark");
          const nextIsDark = !isCurrentDark;
          document.documentElement.classList.toggle("dark", nextIsDark);
          const nextTheme = nextIsDark ? "crimson-dark" : "nordic";
          document.documentElement.setAttribute("data-theme", nextTheme);
        }

        flushSync(() => {
          applyTheme();
        });
      });

      transition.finished
        .catch(() => {})
        .finally(() => {
          cleanup();
        });
    },
    []
  );

  return { triggerThemeTransition };
}
