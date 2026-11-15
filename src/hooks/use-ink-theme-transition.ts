"use client";

import { useCallback, useEffect } from "react";
import { flushSync } from "react-dom";
import { applyThemeToDOM } from "@/lib/theme/use-theme";

export interface InkTransitionOptions {
  duration?: number; // ms (default: 1500)
  targetTheme?: string;
  ignoreReducedMotion?: boolean;
}

// 48 frames packed in an 8x6 grid matching public/ink-mask.webp
export const INK_GRID_COLS = 8;
export const INK_GRID_ROWS = 6;
export const INK_GRID_FRAMES = 48;
export const INK_DEFAULT_DURATION = 1500;

interface ActiveViewTransition {
  ready: Promise<void>;
  finished: Promise<void>;
  skipTransition: () => void;
}

let currentTransition: ActiveViewTransition | null = null;

/**
 * Generate 48 keyframes stepping maskPosition across the 8x6 sprite sheet.
 * Using steps(1, jump-end) holds each frame until the next for crisp, 60fps frame pacing.
 */
export const getInkKeyframes = (
  cols: number = INK_GRID_COLS,
  rows: number = INK_GRID_ROWS,
  totalFrames: number = INK_GRID_FRAMES
) =>
  Array.from({ length: totalFrames }, (_, i) => {
    const c = i % cols;
    const r = Math.floor(i / cols);
    const xPct = cols > 1 ? (c / (cols - 1)) * 100 : 0;
    const yPct = rows > 1 ? (r / (rows - 1)) * 100 : 0;
    const pos = `${xPct}% ${yPct}%`;
    return {
      maskPosition: pos,
      webkitMaskPosition: pos,
      easing: "steps(1, jump-end)",
    };
  });

/**
 * High-Performance View Transitions Ink-Bleed Theme Transition Hook
 * Uses hardware-accelerated 8x6 grid sprite-sheet (48 frames) on ::view-transition-new(root)
 * with WAAPI keyframe animation, instant synchronous DOM theme flipping, and zero dead tail.
 */
export function useInkThemeTransition() {
  // Preload and decode the 48-frame grid mask on mount/idle
  useEffect(() => {
    if (typeof window !== "undefined") {
      const img = new Image();
      img.src = "/ink-mask.webp";
      if ("decode" in img && typeof img.decode === "function") {
        img.decode().catch(() => {});
      }
    }
  }, []);

  const triggerThemeTransition = useCallback(
    (
      _event: React.MouseEvent | React.KeyboardEvent | null,
      applyTheme: () => void,
      options: InkTransitionOptions = {}
    ) => {
      // 1. If a transition is already running, clicking mid-animation skips it cleanly to start the new one
      if (currentTransition) {
        try {
          currentTransition.skipTransition();
        } catch {
          // ignore if already resolved
        }
        currentTransition = null;
      }

      const { duration = INK_DEFAULT_DURATION, ignoreReducedMotion = false } = options;

      const prefersReducedMotion =
        !ignoreReducedMotion &&
        typeof window !== "undefined" &&
        typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      // 2. Reduced motion fallback: switch instantly with no animation
      if (prefersReducedMotion) {
        applyTheme();
        return;
      }

      const doc =
        typeof document !== "undefined"
          ? (document as Document & {
              startViewTransition?: (cb: () => void) => ActiveViewTransition;
            })
          : undefined;

      // 3. Fallback when View Transitions API is not supported: quick 200ms crossfade
      if (!doc || typeof doc.startViewTransition !== "function") {
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

      // 4. Freeze all element CSS transitions and animations during capture so snapshot is 100% crisp
      document.documentElement.setAttribute("data-theme-transitioning", "true");

      const cleanup = () => {
        if (typeof document !== "undefined" && document.documentElement) {
          document.documentElement.removeAttribute("data-theme-transitioning");
        }
      };

      // 5. Synchronously mutate DOM theme state inside startViewTransition before flushSync
      const transition = doc.startViewTransition(() => {
        if (options.targetTheme) {
          applyThemeToDOM(options.targetTheme);
        } else {
          const isCurrentDark = document.documentElement.classList.contains("dark");
          const nextIsDark = !isCurrentDark;
          if (nextIsDark) {
            applyThemeToDOM("crimson-dark");
          } else {
            applyThemeToDOM("nordic");
          }
        }

        flushSync(() => {
          applyTheme();
        });
      });

      currentTransition = transition;

      // 6. Animate mask position through 48 frames using WAAPI
      if (transition.ready && typeof transition.ready.then === "function") {
        transition.ready
          .then(() => {
            if (
              typeof document !== "undefined" &&
              document.documentElement &&
              typeof document.documentElement.animate === "function"
            ) {
              try {
                const anim = document.documentElement.animate(getInkKeyframes(), {
                  duration,
                  easing: "linear",
                  fill: "forwards",
                  pseudoElement: "::view-transition-new(root)",
                });

                // The last frame is fully revealed, so ending the transition makes the page clickable immediately
                if (anim && anim.finished && typeof anim.finished.then === "function") {
                  anim.finished
                    .then(() => {
                      transition.skipTransition();
                    })
                    .catch(() => {});
                }
              } catch {
                // If pseudoElement is not supported in animate, let view transition proceed naturally
              }
            }
          })
          .catch(() => {});
      }

      if (transition.finished && typeof transition.finished.finally === "function") {
        transition.finished
          .catch(() => {})
          .finally(() => {
            if (currentTransition === transition) {
              currentTransition = null;
            }
            cleanup();
          });
      } else {
        cleanup();
      }
    },
    []
  );

  return { triggerThemeTransition };
}
