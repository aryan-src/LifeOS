"use client";

import { useCallback, useEffect, useRef } from "react";
import { flushSync } from "react-dom";
import {
  InkMaskRenderer,
  easeInk,
  type InkSeed,
} from "@/lib/theme/ink-mask-renderer";

export interface InkTransitionOptions {
  duration?: number; // default: 1400ms
}

export function useRadialThemeTransition() {
  const activeRafRef = useRef<number | null>(null);
  const holdAnimationRef = useRef<Animation | null>(null);

  // Pre-warm WebGL 2 program and tileable noise texture on idle/mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    const prewarm = () => {
      InkMaskRenderer.getInstance().prewarm();
    };

    if ("requestIdleCallback" in window) {
      const handle = (window as Window & { requestIdleCallback: (cb: () => void) => number }).requestIdleCallback(prewarm);
      return () => {
        if ("cancelIdleCallback" in window) {
          (window as Window & { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(handle);
        }
      };
    } else {
      const timer = setTimeout(prewarm, 100);
      return () => clearTimeout(timer);
    }
  }, []);

  const triggerThemeTransition = useCallback(
    (
      event: React.MouseEvent | React.KeyboardEvent | null | undefined,
      nextTheme: string,
      applyThemeState: (theme: string) => void,
      options: InkTransitionOptions = {}
    ) => {
      const { duration = 1400 } = options;

      if (typeof window === "undefined" || typeof document === "undefined") {
        applyThemeState(nextTheme);
        return;
      }

      const root = document.documentElement;

      // Resolve whether the target theme renders in dark mode
      const systemPrefersDark =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches;

      const isTargetDark =
        nextTheme === "dark" ||
        nextTheme === "crimson-dark" ||
        nextTheme === "tui" ||
        nextTheme === "monsoon-night" ||
        (nextTheme === "system" && systemPrefersDark);

      const syncDomAttributes = () => {
        root.classList.toggle("dark", isTargetDark);
        root.setAttribute("data-theme", nextTheme);
        root.style.colorScheme = isTargetDark ? "dark" : "light";
        flushSync(() => {
          applyThemeState(nextTheme);
        });
      };

      const prefersReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      const doc = document as Document & {
        startViewTransition?: (cb: () => void) => {
          ready: Promise<void>;
          finished: Promise<void>;
        };
      };

      if (!doc.startViewTransition || prefersReducedMotion) {
        syncDomAttributes();
        return;
      }

      // Capture click coordinates or fall back to viewport center for keyboard activation
      let x = window.innerWidth / 2;
      let y = window.innerHeight / 2;
      if (event && "clientX" in event && (event.clientX > 0 || event.clientY > 0)) {
        x = event.clientX;
        y = event.clientY;
      }

      const maxDist = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      );

      // Cancel any active animation frame or hold animation
      if (activeRafRef.current !== null) {
        cancelAnimationFrame(activeRafRef.current);
        activeRafRef.current = null;
      }
      if (holdAnimationRef.current) {
        holdAnimationRef.current.cancel();
        holdAnimationRef.current = null;
      }

      // Random seed for this specific click
      const seed: InkSeed = {
        x: (Math.random() - 0.5) * 20,
        y: (Math.random() - 0.5) * 20,
        angle: Math.random() * Math.PI * 2,
      };

      const renderer = InkMaskRenderer.getInstance();
      const initialMask = renderer.renderMask(
        0,
        0,
        0,
        { x, y },
        seed,
        window.innerWidth,
        window.innerHeight
      );

      if (initialMask) {
        root.style.setProperty("--ink-mask", `url("${initialMask}")`);
      }

      // Freeze CSS transitions and set direction attribute for top-layer rim lighting
      root.setAttribute("data-transition-dir", isTargetDark ? "to-dark" : "to-light");
      root.setAttribute("data-theme-transitioning", "true");

      const transition = doc.startViewTransition(() => {
        syncDomAttributes();
      });

      transition.ready
        .then(() => {
          // If WebGL renderer generated an ink mask, run the rAF loop with hold animation
          if (initialMask) {
            const holdAnim = root.animate(
              [{ opacity: 1 }, { opacity: 1 }],
              {
                duration,
                easing: "linear",
                fill: "forwards",
                pseudoElement: "::view-transition-new(root)",
              }
            );
            holdAnimationRef.current = holdAnim;

            const startTime = performance.now();

            const tick = (now: number) => {
              const elapsed = now - startTime;
              const linearProgress = Math.min(1, Math.max(0, elapsed / duration));
              const easedProgress = easeInk(linearProgress);
              const timeSeconds = elapsed / 1000;

              if (linearProgress < 1) {
                // Calibrated spread: organic growth with progressive corner sweep
                const radius = easedProgress * maxDist * 0.92;
                const ramp = Math.max(0, (linearProgress - 0.38) / 0.62);
                const cleanup =
                  ramp * ramp * maxDist * 0.42 +
                  (linearProgress > 0.94 ? ((linearProgress - 0.94) / 0.06) * maxDist : 0);

                const maskUri = renderer.renderMask(
                  radius,
                  cleanup,
                  timeSeconds,
                  { x, y },
                  seed,
                  window.innerWidth,
                  window.innerHeight
                );

                if (maskUri) {
                  root.style.setProperty("--ink-mask", `url("${maskUri}")`);
                }
                activeRafRef.current = requestAnimationFrame(tick);
              } else {
                root.style.setProperty("--ink-mask", "none");
                activeRafRef.current = null;
                if (holdAnimationRef.current) {
                  holdAnimationRef.current.finish();
                }
              }
            };

            activeRafRef.current = requestAnimationFrame(tick);
          } else {
            // Fallback for environments where WebGL is unsupported
            root.animate(
              {
                clipPath: [
                  `circle(0px at ${x}px ${y}px)`,
                  `circle(${maxDist}px at ${x}px ${y}px)`,
                ],
              },
              {
                duration,
                easing: "cubic-bezier(0.22, 1, 0.36, 1)",
                fill: "forwards",
                pseudoElement: "::view-transition-new(root)",
              }
            );
          }
        })
        .catch(() => {
          // Graceful fallback if transition is skipped
        });

      transition.finished.finally(() => {
        if (activeRafRef.current !== null) {
          cancelAnimationFrame(activeRafRef.current);
          activeRafRef.current = null;
        }
        if (holdAnimationRef.current) {
          holdAnimationRef.current = null;
        }
        root.removeAttribute("data-theme-transitioning");
        root.removeAttribute("data-transition-dir");
        root.style.removeProperty("--ink-mask");
      });
    },
    []
  );

  return { triggerThemeTransition };
}

// Named alias
export const useInkThemeTransition = useRadialThemeTransition;
