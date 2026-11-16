"use client";

import { useCallback } from "react";
import { flushSync } from "react-dom";

/**
 * -----------------------------------------------------------------------------
 * ORGANIC LIQUID-INK THEME TRANSITION CONFIGURATION
 * -----------------------------------------------------------------------------
 * Calibrated to recreate the exact fluid ink-spreading feel from the reference:
 * - Viscous deceleration easing (rapid initial burst, gentle ink absorption).
 * - Organic tendril branching that morphs over time.
 * - Satellite droplets and splatters dispersing ahead of the main wavefront.
 */
export const INK_TRANSITION_CONFIG = {
  DURATION_MS: 1100,      // Total duration in ms (1.0 to 1.2s)
  TENDRIL_COUNT: 8,       // Number of prominent organic tendril lobes
  TENDRIL_REACH: 0.32,    // Tendril reach ahead of main wavefront (% diagonal)
  DROPLET_COUNT: 14,      // Number of satellite droplets ahead of the front
  HARMONIC_OCTAVES: 5,    // Fibonacci harmonic wave frequencies
  EASING_EXPONENT: 2.5,   // Viscous power-curve easing exponent
};

/**
 * Backward-compatible tunables configuration for legacy tests
 */
export const VENOM_CONFIG = {
  TENDRIL_COUNT: 8,
  TENDRIL_LENGTH: 0.28,
  GOO_SMOOTHNESS: 0.032,
  WRITHE_AMOUNT: 0.010,
  GLOSS_STRENGTH: 0.85,
  DURATION_MS: 1100,
};

export interface InkTransitionOptions {
  duration?: number; // ms (defaults to INK_TRANSITION_CONFIG.DURATION_MS)
  targetTheme?: string;
}

interface ActiveTransitionHandle {
  skipTransition?: () => void;
  cleanup: () => void;
}

let activeTransition: ActiveTransitionHandle | null = null;

/**
 * Generates an organic liquid-ink SVG mask with dynamic path morphing.
 * - Multi-frequency harmonic contours mimicking ink dispersing into paper fibers
 * - Branching tendrils extending dynamically along the trajectory of travel
 * - Coordinated satellite droplets that appear ahead of the front and merge naturally
 * - Smooth closed Catmull-Rom cubic Bézier spline for razor-sharp vector antialiasing
 */
export function generateOrganicInkSvg(
  progress: number, // 0.0 (impact) to 1.0 (full screen coverage)
  originX: number,
  originY: number,
  vw: number,
  vh: number
): string {
  const diag = Math.hypot(vw, vh);
  const maxCornerDist = Math.max(
    Math.hypot(originX, originY),
    Math.hypot(vw - originX, originY),
    Math.hypot(originX, vh - originY),
    Math.hypot(vw - originX, vh - originY)
  );

  const t = Math.max(0, Math.min(1.0, progress));
  // Viscous fluid easing: rapid initial dispersion, gentle deceleration
  const ease = 1.0 - Math.pow(1.0 - t, INK_TRANSITION_CONFIG.EASING_EXPONENT);
  // Guarantee full viewport coverage at t=1.0 (with 1.35x margin over max corner)
  const rBase = maxCornerDist * 1.35 * ease;

  const numPts = 96;
  const pts: Array<{ x: number; y: number }> = [];

  // 8 organic branching tendril lobes radiating outward
  const lobes = [
    { a: 0.80, w: 0.32, s: 0.12, curl: 0.15 },
    { a: 1.45, w: 0.38, s: 0.14, curl: -0.12 },
    { a: 2.10, w: 0.34, s: 0.11, curl: 0.18 },
    { a: 2.75, w: 0.28, s: 0.13, curl: -0.14 },
    { a: 3.45, w: 0.36, s: 0.12, curl: 0.16 },
    { a: 4.15, w: 0.30, s: 0.15, curl: -0.10 },
    { a: 4.95, w: 0.33, s: 0.11, curl: 0.14 },
    { a: 5.65, w: 0.27, s: 0.14, curl: -0.15 },
  ];

  for (let i = 0; i < numPts; i++) {
    const angle = (i / numPts) * Math.PI * 2;

    // Multi-frequency harmonic wave (Fibonacci series) for irregular ink contours
    const wave =
      0.15 * Math.sin(3 * angle + 0.6) +
      0.10 * Math.cos(5 * angle + 1.4) +
      0.06 * Math.sin(8 * angle + 2.3) +
      0.03 * Math.cos(13 * angle - 1.1) +
      0.02 * Math.sin(21 * angle + 3.2);

    let tendril = 0;
    for (const lobe of lobes) {
      // Dynamic tendril tip curl as ink front moves
      const curAngle = lobe.a + lobe.curl * Math.sin(Math.PI * 2 * t);
      let diff = Math.abs(angle - curAngle);
      if (diff > Math.PI) diff = 2 * Math.PI - diff;
      if (diff < 0.45) {
        tendril += lobe.w * Math.exp(-(diff * diff) / (2 * lobe.s * lobe.s));
      }
    }

    const r = Math.max(0, rBase * (1.0 + wave + tendril));
    pts.push({
      x: originX + Math.cos(angle) * r,
      y: originY + Math.sin(angle) * r,
    });
  }

  // Convert points into a smooth closed cubic Bézier path (Catmull-Rom)
  let pathD = "";
  for (let i = 0; i < numPts; i++) {
    const p0 = pts[(i - 1 + numPts) % numPts];
    const curr = pts[i];
    const next = pts[(i + 1) % numPts];
    const p3 = pts[(i + 2) % numPts];

    if (i === 0) {
      pathD += `M ${curr.x.toFixed(1)} ${curr.y.toFixed(1)} `;
    }

    const cp1x = curr.x + (next.x - p0.x) / 6;
    const cp1y = curr.y + (next.y - p0.y) / 6;
    const cp2x = next.x - (p3.x - curr.x) / 6;
    const cp2y = next.y - (p3.y - curr.y) / 6;

    pathD += `C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${next.x.toFixed(1)} ${next.y.toFixed(1)} `;
  }
  pathD += "Z";

  // Satellite droplets and splatters dispersing ahead of the tendrils
  let dropletsSvg = "";
  const numDrops = INK_TRANSITION_CONFIG.DROPLET_COUNT;
  for (let d = 0; d < numDrops; d++) {
    const dAngle = (d / numDrops) * Math.PI * 2 + Math.sin(d * 1.8) * 0.22;
    // Droplets lead ahead of the main body, then merge as the front expands
    const dropDist = rBase * (1.16 + 0.14 * Math.sin(d * 3.7 + 1.2));
    const dropRadius = Math.max(0.6, (diag * 0.0035) * (1.0 - ease * 0.5) * (0.8 + 0.4 * (d % 3)));
    const cx = originX + Math.cos(dAngle) * dropDist;
    const cy = originY + Math.sin(dAngle) * dropDist;
    dropletsSvg += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${dropRadius.toFixed(1)}" fill="#000"/>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vw} ${vh}" width="${vw}" height="${vh}"><path d="${pathD}" fill="#000"/>${dropletsSvg}</svg>`;
}

/**
 * Encodes the organic ink SVG mask into a self-contained data URI.
 */
export function createLiquidInkMaskDataUri(
  progress = 0.5,
  originX = 960,
  originY = 40,
  vw = 1920,
  vh = 1080
): string {
  const svg = generateOrganicInkSvg(progress, originX, originY, vw, vh);
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

/**
 * Standard vector SVG data URI generator for initial setup and unit test compatibility.
 */
export function createVenomInkMaskDataUri(): string {
  const numPoints = 72;
  const pts: Array<{ x: number; y: number }> = [];

  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2;
    const wave =
      12 * Math.sin(3 * angle + 0.5) +
      8 * Math.cos(5 * angle + 1.2) +
      5 * Math.sin(8 * angle + 2.1);

    const r = Math.max(72, Math.min(115, 88 + wave));
    pts.push({
      x: Math.cos(angle) * r,
      y: Math.sin(angle) * r,
    });
  }

  let pathData = "";
  for (let i = 0; i < numPoints; i++) {
    const p0 = pts[(i - 1 + numPoints) % numPoints];
    const curr = pts[i];
    const next = pts[(i + 1) % numPoints];
    const p3Pt = pts[(i + 2) % numPoints];

    if (i === 0) pathData += `M ${curr.x.toFixed(2)} ${curr.y.toFixed(2)} `;

    const cp1x = curr.x + (next.x - p0.x) / 6;
    const cp1y = curr.y + (next.y - p0.y) / 6;
    const cp2x = next.x - (p3Pt.x - curr.x) / 6;
    const cp2y = next.y - (p3Pt.y - curr.y) / 6;

    pathData += `C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${next.x.toFixed(2)} ${next.y.toFixed(2)} `;
  }
  pathData += "Z";

  let droplets = "";
  const dropletCount = 12;
  for (let i = 0; i < dropletCount; i++) {
    const angle = (i / dropletCount) * Math.PI * 2 + Math.sin(i * 2.1) * 0.22;
    const dist = 104 + ((i * 7) % 12);
    const radius = 1.5 + (i % 3) * 0.8;
    const cx = (Math.cos(angle) * dist).toFixed(2);
    const cy = (Math.sin(angle) * dist).toFixed(2);
    droplets += `<circle cx="${cx}" cy="${cy}" r="${radius.toFixed(2)}" fill="#000"/>`;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-120 -120 240 240" width="240" height="240"><path d="${pathData}" fill="#000"/>${droplets}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

/**
 * Custom React Hook: useInkThemeTransition
 * Recreates the authentic liquid-ink theme transition from the reference video:
 * 1. Immediate trigger from interaction point (or top-right toggle button).
 * 2. Organic ink expansion resembling ink dispersing over paper fibers.
 * 3. Progressive destination theme reveal synchronized with mask morphing.
 * 4. Clean completion with zero artifacts and instant interactive state restoration.
 */
export function useInkThemeTransition() {
  const triggerThemeTransition = useCallback(
    (
      event: React.MouseEvent | React.KeyboardEvent | null,
      applyTheme: () => void,
      options: InkTransitionOptions = {}
    ) => {
      // 1. Concurrency control: gracefully complete any currently active transition
      if (activeTransition) {
        try {
          if (activeTransition.skipTransition) activeTransition.skipTransition();
        } catch {}
        activeTransition.cleanup();
        activeTransition = null;
      }

      const duration = options.duration ?? INK_TRANSITION_CONFIG.DURATION_MS;

      const prefersReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      const doc = document as Document & {
        startViewTransition?: (cb: () => void) => {
          ready: Promise<void>;
          finished: Promise<void>;
          skipTransition?: () => void;
        };
      };

      // Reduced motion or missing View Transitions API: instant swap fallback
      if (!doc.startViewTransition || prefersReducedMotion) {
        applyTheme();
        return;
      }

      const vw = typeof window !== "undefined" ? window.innerWidth : 1000;
      const vh = typeof window !== "undefined" ? window.innerHeight : 800;

      // 2. Capture interaction origin (or viewport center for keyboard / fallback triggers)
      let x = vw / 2;
      let y = vh / 2;

      if (event && "clientX" in event && (event.clientX > 0 || event.clientY > 0)) {
        x = event.clientX;
        y = event.clientY;
      }

      const maxCornerDist = Math.max(
        Math.hypot(x, y),
        Math.hypot(vw - x, y),
        Math.hypot(x, vh - y),
        Math.hypot(vw - x, vh - y)
      );
      const endRadius = maxCornerDist * 1.75;
      const endSize = endRadius * 2;

      const root = document.documentElement;

      // 3. Freeze global CSS transitions before snapshot capture
      root.setAttribute("data-theme-transitioning", "true");

      // 4. Initial SVG ink mask setup
      const initialMask = generateOrganicInkSvg(0.001, x, y, vw, vh);
      const initialMaskUri = `url("data:image/svg+xml,${encodeURIComponent(initialMask)}")`;
      root.style.setProperty("--ink-mask", initialMaskUri);

      let rafId: number | null = null;
      let isCleanedUp = false;

      const cleanup = () => {
        if (isCleanedUp) return;
        isCleanedUp = true;
        if (rafId !== null && typeof cancelAnimationFrame === "function") {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
        root.removeAttribute("data-theme-transitioning");
        root.style.removeProperty("--ink-mask");
        activeTransition = null;
      };

      // 5. Trigger View Transition with synchronous React DOM flush
      const transition = doc.startViewTransition(() => {
        flushSync(() => {
          applyTheme();
        });
      });

      activeTransition = {
        skipTransition: transition.skipTransition?.bind(transition),
        cleanup,
      };

      transition.ready
        .then(() => {
          // Hardware-accelerated WAAPI animation for smooth compositor tracking
          root.animate(
            [
              {
                maskSize: "0px 0px",
                WebkitMaskSize: "0px 0px",
                maskPosition: `${x}px ${y}px`,
                WebkitMaskPosition: `${x}px ${y}px`,
              },
              {
                maskSize: `${endSize}px ${endSize}px`,
                WebkitMaskSize: `${endSize}px ${endSize}px`,
                maskPosition: `${x - endSize / 2}px ${y - endSize / 2}px`,
                WebkitMaskPosition: `${x - endSize / 2}px ${y - endSize / 2}px`,
              },
            ],
            {
              duration,
              easing: "cubic-bezier(0.65, 0, 0.35, 1)",
              fill: "forwards",
              pseudoElement: "::view-transition-new(root)",
            }
          );

          // Continuous 60/120fps organic SVG path morphing loop
          if (typeof requestAnimationFrame === "function") {
            const startTime = performance.now();

            const renderTick = (now: number) => {
              if (isCleanedUp) return;
              const elapsed = now - startTime;
              const progress = Math.min(1.0, elapsed / duration);

              // Update the morphing organic SVG ink mask
              const frameSvg = generateOrganicInkSvg(progress, x, y, vw, vh);
              root.style.setProperty(
                "--ink-mask",
                `url("data:image/svg+xml,${encodeURIComponent(frameSvg)}")`
              );

              if (progress < 1.0) {
                rafId = requestAnimationFrame(renderTick);
              }
            };

            rafId = requestAnimationFrame(renderTick);
          }
        })
        .catch(() => {
          cleanup();
        });

      transition.finished.finally(() => {
        cleanup();
      });

      // Failsafe timer to guarantee cleanup even if browser stalls transition
      setTimeout(() => {
        cleanup();
      }, duration + 250);
    },
    []
  );

  return { triggerThemeTransition };
}
