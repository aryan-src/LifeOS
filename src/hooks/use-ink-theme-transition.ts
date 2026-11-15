"use client";

import { useCallback } from "react";
import { flushSync } from "react-dom";

export interface InkTransitionOptions {
  duration?: number; // ms (default: 700)
  targetTheme?: string;
  ignoreReducedMotion?: boolean;
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

const SVG_ID = "ink-bleed-svg";

/**
 * Zero-Latency View Transitions Ink-Bleed Theme Transition Hook
 * Uses native Document View Transitions API with inline SVG <mask id="ink-bleed-mask">
 * and feTurbulence + feDisplacementMap filter for zero-latency, razor-sharp transitions.
 */
export function useInkThemeTransition() {
  const triggerThemeTransition = useCallback(
    (
      event: React.MouseEvent | React.KeyboardEvent | null,
      applyTheme: () => void,
      options: InkTransitionOptions = {}
    ) => {
      const { duration = 700, ignoreReducedMotion = false } = options;

      const prefersReducedMotion =
        !ignoreReducedMotion &&
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      const doc = document as Document & {
        startViewTransition?: (cb: () => void | Promise<void>) => {
          ready: Promise<void>;
          finished: Promise<void>;
        };
      };

      if (!doc.startViewTransition || prefersReducedMotion) {
        applyTheme();
        return;
      }

      // 1. Resolve click origin coordinates (falling back to viewport center)
      let originX = window.innerWidth / 2;
      let originY = window.innerHeight / 2;

      if (
        event &&
        "clientX" in event &&
        typeof (event as React.MouseEvent).clientX === "number" &&
        (event as React.MouseEvent).clientX > 0
      ) {
        originX = (event as React.MouseEvent).clientX;
        originY = (event as React.MouseEvent).clientY;
      }

      // 2. Calculate maximum corner distance + padding for complete coverage
      const d0 = Math.hypot(originX, originY);
      const d1 = Math.hypot(window.innerWidth - originX, originY);
      const d2 = Math.hypot(originX, window.innerHeight - originY);
      const d3 = Math.hypot(window.innerWidth - originX, window.innerHeight - originY);
      const targetRadius = Math.max(d0, d1, d2, d3) + 90;

      // 3. Mount zero-latency inline SVG mask with feTurbulence + feDisplacementMap
      let svg = document.getElementById(SVG_ID) as SVGSVGElement | null;
      if (svg) svg.remove();

      const seed = Math.floor(Math.random() * 1000);
      svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.id = SVG_ID;
      svg.setAttribute("width", "0");
      svg.setAttribute("height", "0");
      svg.style.position = "fixed";
      svg.style.top = "0";
      svg.style.left = "0";
      svg.style.pointerEvents = "none";
      svg.style.zIndex = "-1";
      svg.setAttribute("aria-hidden", "true");

      svg.innerHTML = `
        <defs>
          <filter id="ink-turbulence" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="3" seed="${seed}" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="75" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <mask id="ink-bleed-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="100%" height="100%">
            <rect width="100%" height="100%" fill="black" />
            <circle cx="${originX}" cy="${originY}" r="0" fill="white" filter="url(#ink-turbulence)" />
          </mask>
        </defs>
      `;
      document.body.appendChild(svg);

      const circle = svg.querySelector("circle");

      // 4. Freeze all CSS transitions on elements to snapshot 100% settled colors and crisp text
      document.documentElement.setAttribute("data-theme-transitioning", "true");

      let animId: number | null = null;
      let isCleanedUp = false;

      const cleanup = () => {
        if (isCleanedUp) return;
        isCleanedUp = true;
        if (animId !== null) {
          cancelAnimationFrame(animId);
          animId = null;
        }
        document.documentElement.removeAttribute("data-theme-transitioning");
        const el = document.getElementById(SVG_ID);
        if (el) el.remove();
      };

      // 5. Synchronously mutate documentElement inside startViewTransition before flushSync
      const transition = doc.startViewTransition(() => {
        const isCurrentDark = document.documentElement.classList.contains("dark");
        const nextIsDark = !isCurrentDark;
        document.documentElement.classList.toggle("dark", nextIsDark);
        const nextTheme = options.targetTheme || (nextIsDark ? "crimson-dark" : "nordic");
        document.documentElement.setAttribute("data-theme", nextTheme);

        flushSync(() => {
          applyTheme();
        });
      });

      // 6. Smooth requestAnimationFrame expansion on transition.ready
      transition.ready
        .then(() => {
          if (isCleanedUp) return;
          const startTime = performance.now();

          const renderFrame = (now: number) => {
            if (isCleanedUp) return;
            const elapsed = now - startTime;
            const t = Math.min(elapsed / duration, 1);
            const eased = easeInOutCubic(t);
            const currentRadius = eased * targetRadius;

            if (circle) {
              circle.setAttribute("r", String(currentRadius));
            }

            if (t < 1) {
              animId = requestAnimationFrame(renderFrame);
            } else {
              if (circle) {
                circle.setAttribute("r", String(targetRadius));
              }
            }
          };

          animId = requestAnimationFrame(renderFrame);
        })
        .catch(() => {
          cleanup();
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
