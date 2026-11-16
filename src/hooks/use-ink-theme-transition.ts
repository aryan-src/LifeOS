"use client";

import { useCallback } from "react";
import { flushSync } from "react-dom";
import { applyThemeToDOM } from "@/lib/theme/use-theme";

export interface InkTransitionOptions {
  duration?: number; // ms (default: 750)
  targetTheme?: string;
  ignoreReducedMotion?: boolean;
}

export const VENOM_DEFAULT_DURATION = 750;

interface ActiveViewTransition {
  ready: Promise<void>;
  finished: Promise<void>;
  skipTransition: () => void;
}

let currentTransition: ActiveViewTransition | null = null;
let currentAnimFrame: number | null = null;

/**
 * Standard cubic ease-in-out easing function:
 * Provides an explosive, organic start with a gentle, silky finish.
 */
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Injects a hidden, Retina-sharp GPU Liquid SVG Mask containing:
 * 1. Filter pipeline: feTurbulence (organic tendrils) -> feGaussianBlur (fluid curves)
 *    -> feDisplacementMap (tendril & droplet warp) -> feComponentTransfer (crushes alpha to pure 0 or 1).
 * 2. Mask: full black background with displaced white circle.
 */
export function injectVenomSvgMask(
  originX: number,
  originY: number,
  vw: number,
  vh: number
): SVGSVGElement | null {
  if (typeof document === "undefined" || !document.body) {
    return null;
  }

  // Remove any preexisting mask SVG to avoid id collisions
  const existingSvg = document.getElementById("venom-ink-svg");
  if (existingSvg) {
    existingSvg.remove();
  }

  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("id", "venom-ink-svg");
  svg.setAttribute("width", "0");
  svg.setAttribute("height", "0");
  svg.setAttribute("aria-hidden", "true");
  svg.style.position = "fixed";
  svg.style.pointerEvents = "none";
  svg.style.zIndex = "-1";

  const randomSeed = Math.floor(Math.random() * 1000) + 1;

  svg.innerHTML = `
    <defs>
      <filter id="venom-liquid-filter" x="-25%" y="-25%" width="150%" height="150%" color-interpolation-filters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.0055" numOctaves="4" seed="${randomSeed}" result="rawNoise" />
        <feGaussianBlur in="rawNoise" stdDeviation="3.5" result="smoothNoise" />
        <feDisplacementMap in="SourceGraphic" in2="smoothNoise" scale="145" xChannelSelector="R" yChannelSelector="G" result="displaced" />
        <feComponentTransfer in="displaced">
          <feFuncA type="linear" slope="60" intercept="-28" />
        </feComponentTransfer>
      </filter>
    </defs>
    <mask id="venom-ink-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="${vw}" height="${vh}">
      <rect width="100%" height="100%" fill="black" />
      <circle id="venom-ink-circle" cx="${originX}" cy="${originY}" r="0" fill="white" filter="url(#venom-liquid-filter)" />
    </mask>
  `;

  document.body.appendChild(svg);
  return svg;
}

/**
 * High-Performance View Transitions GPU Liquid Theme Transition Hook
 * Uses inline SVG feTurbulence + feDisplacementMap + feComponentTransfer mask
 * with rAF-driven circle expansion for 120fps razor-sharp, obsidian-black symbiote wipes.
 */
export function useInkThemeTransition() {
  const triggerThemeTransition = useCallback(
    (
      event: React.MouseEvent | React.KeyboardEvent | null,
      applyTheme: () => void,
      options: InkTransitionOptions = {}
    ) => {
      // 1. If a transition is currently running, skip it immediately to clean up and start fresh
      if (currentTransition) {
        try {
          currentTransition.skipTransition();
        } catch {
          // ignore if already done
        }
        currentTransition = null;
      }
      if (currentAnimFrame !== null) {
        cancelAnimationFrame(currentAnimFrame);
        currentAnimFrame = null;
      }

      const { duration = VENOM_DEFAULT_DURATION, ignoreReducedMotion = false } = options;

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

      // 4. Resolve mask origin: toggle button bounding-box center, click event, or top-right default
      const vw = typeof window !== "undefined" ? window.innerWidth : 1920;
      const vh = typeof window !== "undefined" ? window.innerHeight : 1080;
      let originX = vw - 60;
      let originY = 40;

      let btnEl: HTMLElement | null = null;
      if (event && "currentTarget" in event && event.currentTarget instanceof HTMLElement) {
        btnEl = event.currentTarget;
      } else if (typeof document !== "undefined") {
        if (typeof document.getElementById === "function") {
          btnEl = document.getElementById("theme-toggle-btn");
        }
        if (!btnEl && typeof document.querySelector === "function") {
          btnEl = document.querySelector<HTMLElement>(
            '[data-theme-toggle="true"], [data-purpose="theme-toggle-button"]'
          );
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

      const d0 = Math.hypot(originX, originY);
      const d1 = Math.hypot(vw - originX, originY);
      const d2 = Math.hypot(originX, vh - originY);
      const d3 = Math.hypot(vw - originX, vh - originY);
      const maxCornerDistance = Math.max(d0, d1, d2, d3);
      const targetRadius = maxCornerDistance + 150;

      // 5. Inject Retina-sharp GPU Liquid SVG Mask before transition starts
      injectVenomSvgMask(originX, originY, vw, vh);

      // 6. Freeze all element CSS transitions and animations during capture so snapshot is 100% crisp
      document.documentElement.setAttribute("data-theme-transitioning", "true");

      const cleanup = () => {
        if (currentAnimFrame !== null) {
          cancelAnimationFrame(currentAnimFrame);
          currentAnimFrame = null;
        }
        const svgEl = document.getElementById("venom-ink-svg");
        if (svgEl) {
          svgEl.remove();
        }
        if (typeof document !== "undefined" && document.documentElement) {
          document.documentElement.removeAttribute("data-theme-transitioning");
        }
      };

      // 7. Synchronously mutate DOM theme state inside startViewTransition before flushSync
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

      // 8. Animate circle r attribute via requestAnimationFrame from 0 to maxCornerDistance + 150
      const startAnimation = () => {
        const startTime = performance.now();
        const circle = document.getElementById("venom-ink-circle");

        const step = (now: number) => {
          const elapsed = now - startTime;
          const progress = Math.min(1, Math.max(0, elapsed / duration));
          const eased = easeInOutCubic(progress);
          const currentR = eased * targetRadius;

          if (circle) {
            circle.setAttribute("r", currentR.toFixed(2));
          }

          if (progress < 1) {
            currentAnimFrame = requestAnimationFrame(step);
          } else {
            currentAnimFrame = null;
            try {
              transition.skipTransition();
            } catch {
              // ignore if already finished
            }
          }
        };

        currentAnimFrame = requestAnimationFrame(step);
      };

      if (transition.ready && typeof transition.ready.then === "function") {
        transition.ready
          .then(() => {
            startAnimation();
          })
          .catch(() => {});
      } else {
        startAnimation();
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
