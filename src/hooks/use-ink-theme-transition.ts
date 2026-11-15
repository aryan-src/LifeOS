"use client";

import { useCallback } from "react";
import { getGlobalInkTransition } from "../lib/ink-bleed/inkTransition";
import { inkParams } from "../lib/ink-bleed/gl/params";
import type { Theme } from "../lib/ink-bleed/theme";

export interface InkTransitionOptions {
  duration?: number;   // ms (default: 1400)
  noiseScale?: number; // frequency of ink tendrils (default: 1.0)
  tendril?: number;    // tendril reach multiplier (default: 1.0)
  drift?: number;      // evolution speed (default: 1.0)
  softness?: number;   // frontier half-width (default: 1.4)
  targetTheme?: Theme;
  ignoreReducedMotion?: boolean;
}

/**
 * Ink Bleed Theme Transition Hook
 * Powered by WebGL2 Simplex fBm ink renderer (from codemure-official/ink-bleed-theme-changer).
 */
export function useInkThemeTransition() {
  const triggerThemeTransition = useCallback(
    (
      event: React.MouseEvent | React.KeyboardEvent | null,
      applyTheme: () => void,
      options: InkTransitionOptions = {}
    ) => {
      if (typeof window === "undefined") {
        applyTheme();
        return;
      }

      if (options.duration) {
        inkParams.duration = options.duration / 1000;
      }
      if (options.noiseScale !== undefined) {
        inkParams.noiseScale = options.noiseScale;
      }
      if (options.tendril !== undefined) {
        inkParams.tendril = options.tendril;
      }
      if (options.drift !== undefined) {
        inkParams.drift = options.drift;
      }
      if (options.softness !== undefined) {
        inkParams.softness = options.softness;
      }

      let buttonEl: HTMLButtonElement | null = null;
      if (event && "currentTarget" in event && event.currentTarget instanceof HTMLButtonElement) {
        buttonEl = event.currentTarget;
      }

      const ink = getGlobalInkTransition(buttonEl);
      if (!ink) {
        applyTheme();
        return;
      }

      let point: { x: number; y: number } | undefined;
      if (
        event &&
        "clientX" in event &&
        typeof (event as React.MouseEvent).clientX === "number" &&
        (event as React.MouseEvent).clientX > 0
      ) {
        point = {
          x: (event as React.MouseEvent).clientX,
          y: (event as React.MouseEvent).clientY,
        };
      }

      ink.toggle(point, undefined, applyTheme, options.targetTheme);
    },
    []
  );

  return { triggerThemeTransition };
}
