"use client";

import { useCallback } from "react";
import { flushSync } from "react-dom";

/**
 * -----------------------------------------------------------------------------
 * VENOM SYMBIOTE THEME TRANSITION CONFIGURATION
 * -----------------------------------------------------------------------------
 * Fine-tune the living, viscous, glossy obsidian symbiote aesthetic:
 */
export const VENOM_CONFIG = {
  TENDRIL_COUNT: 8,       // 6 to 10 tendrils that reach ahead of the main mass
  TENDRIL_LENGTH: 0.28,   // 15% to 35% of the screen diagonal long
  GOO_SMOOTHNESS: 0.032,  // Smooth union blend (2% to 4% of diagonal)
  WRITHE_AMOUNT: 0.010,   // Boundary rippling noise (0.5% to 1.5% of diagonal)
  GLOSS_STRENGTH: 0.85,   // Specular tube line and rim light intensity (0 to 1)
  DURATION_MS: 1100,      // Total duration in ms (1.0 to 1.2s)
};

export const INK_TRANSITION_CONFIG = {
  DURATION_MS: VENOM_CONFIG.DURATION_MS,
  TENDRIL_COUNT: VENOM_CONFIG.TENDRIL_COUNT,
  TENDRIL_REACH: VENOM_CONFIG.TENDRIL_LENGTH,
  DROPLET_COUNT: 14,
  WARP_ROUGHNESS: VENOM_CONFIG.WRITHE_AMOUNT,
  EASING_EXPONENT: 2.5,
};

export interface InkTransitionOptions {
  duration?: number; // ms (defaults to VENOM_CONFIG.DURATION_MS)
  targetTheme?: string;
}

interface ActiveTransitionHandle {
  skipTransition?: () => void;
  cleanup: () => void;
}

let activeTransition: ActiveTransitionHandle | null = null;

/**
 * Generates a razor-sharp vector SVG liquid ink splatter with organic Venom-style
 * tendrils and detached satellite droplets encoded as a self-contained data URI.
 */
export function createOrganicInkMaskDataUri(seed = 0): string {
  const numPoints = 84;
  const pts: Array<{ x: number; y: number }> = [];

  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2;
    const phase = seed * 1.7;
    const wave =
      14 * Math.sin(3 * angle + 0.5 + phase) +
      9 * Math.cos(5 * angle + 1.2 - phase) +
      6 * Math.sin(8 * angle + 2.1 + phase * 0.5);

    const r = Math.max(70, Math.min(125, 92 + wave));
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
  const dropletCount = 14;
  for (let i = 0; i < dropletCount; i++) {
    const angle = (i / dropletCount) * Math.PI * 2 + Math.sin(i * 2.1 + seed) * 0.22;
    const dist = 105 + ((i * 7 + Math.floor(seed * 5)) % 15);
    const radius = 1.6 + (i % 3) * 0.9;
    const cx = (Math.cos(angle) * dist).toFixed(2);
    const cy = (Math.sin(angle) * dist).toFixed(2);
    droplets += `<circle cx="${cx}" cy="${cy}" r="${radius.toFixed(2)}" fill="#000"/>`;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-130 -130 260 260" width="260" height="260"><path d="${pathData}" fill="#000"/>${droplets}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

/**
 * Legacy vector ink mask generator with default seed
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
 * Generates an organic liquid-ink SVG mask with dynamic path morphing.
 */
export function generateOrganicInkSvg(
  progress: number,
  originX: number,
  originY: number,
  vw: number,
  vh: number
): string {
  const maxCornerDist = Math.max(
    Math.hypot(originX, originY),
    Math.hypot(vw - originX, originY),
    Math.hypot(originX, vh - originY),
    Math.hypot(vw - originX, vh - originY)
  );

  const t = Math.max(0, Math.min(1.0, progress));
  const ease = 1.0 - Math.pow(1.0 - t, 2.5);
  const rBase = maxCornerDist * 1.35 * ease;

  const numPts = 96;
  const pts: Array<{ x: number; y: number }> = [];

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
    const wave =
      0.15 * Math.sin(3 * angle + 0.6) +
      0.10 * Math.cos(5 * angle + 1.4) +
      0.06 * Math.sin(8 * angle + 2.3) +
      0.03 * Math.cos(13 * angle - 1.1) +
      0.02 * Math.sin(21 * angle + 3.2);

    let tendril = 0;
    for (const lobe of lobes) {
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

  let pathD = "";
  for (let i = 0; i < numPts; i++) {
    const p0 = pts[(i - 1 + numPts) % numPts];
    const curr = pts[i];
    const next = pts[(i + 1) % numPts];
    const p3 = pts[(i + 2) % numPts];

    if (i === 0) pathD += `M ${curr.x.toFixed(1)} ${curr.y.toFixed(1)} `;

    const cp1x = curr.x + (next.x - p0.x) / 6;
    const cp1y = curr.y + (next.y - p0.y) / 6;
    const cp2x = next.x - (p3.x - curr.x) / 6;
    const cp2y = next.y - (p3.y - curr.y) / 6;

    pathD += `C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${next.x.toFixed(1)} ${next.y.toFixed(1)} `;
  }
  pathD += "Z";

  let dropletsSvg = "";
  const numDrops = 14;
  for (let d = 0; d < numDrops; d++) {
    const dAngle = (d / numDrops) * Math.PI * 2 + Math.sin(d * 1.8) * 0.22;
    const dropDist = rBase * (1.16 + 0.14 * Math.sin(d * 3.7 + 1.2));
    const diag = Math.hypot(vw, vh);
    const dropRadius = Math.max(0.6, (diag * 0.0035) * (1.0 - ease * 0.5) * (0.8 + 0.4 * (d % 3)));
    const cx = originX + Math.cos(dAngle) * dropDist;
    const cy = originY + Math.sin(dAngle) * dropDist;
    dropletsSvg += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${dropRadius.toFixed(1)}" fill="#000"/>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vw} ${vh}" width="${vw}" height="${vh}"><path d="${pathD}" fill="#000"/>${dropletsSvg}</svg>`;
}

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
 * Pre-warmed pool of pre-encoded vector SVG ink masks.
 * Ensures Frame 1 has 0ms synchronous string encoding overhead on main thread.
 */
const PREWARMED_POOL_SIZE = 4;
const prewarmedMasks: string[] = [];
let maskPoolIndex = 0;

for (let i = 0; i < PREWARMED_POOL_SIZE; i++) {
  prewarmedMasks.push(createOrganicInkMaskDataUri(i));
}

function getNextPrewarmedMask(): string {
  if (prewarmedMasks.length === 0) {
    return createOrganicInkMaskDataUri(0);
  }
  const mask = prewarmedMasks[maskPoolIndex % prewarmedMasks.length];
  maskPoolIndex++;
  return mask;
}

function replenishPoolAsynchronously() {
  const schedule =
    typeof window !== "undefined" && "requestIdleCallback" in window
      ? (window as Window & { requestIdleCallback: (cb: () => void) => number }).requestIdleCallback
      : (cb: () => void) => setTimeout(cb, 0);

  schedule(() => {
    const idx = (maskPoolIndex - 1 + prewarmedMasks.length) % prewarmedMasks.length;
    prewarmedMasks[idx] = createOrganicInkMaskDataUri(maskPoolIndex);
  });
}

/**
 * View Transitions theme transition hook:
 * - Direct Top-Layer GPU rendering via ::view-transition-new(root) with drop-shadow filter.
 * - Zero canvas DOM overhead.
 * - Hardware WAAPI radial scaling from user interaction origin.
 * - Direction-aware data-transition-dir attribute ("to-dark" | "to-light").
 * - Fully accessible with reduced-motion fallback and concurrency control.
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

      const duration = options.duration ?? VENOM_CONFIG.DURATION_MS;

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

      // 3. Determine transition direction
      const isCurrentlyDark =
        Boolean(root.classList?.contains?.("dark")) ||
        (typeof root.getAttribute === "function" && root.getAttribute("data-theme") === "crimson-dark");
      const targetIsDark = options.targetTheme
        ? options.targetTheme.includes("dark")
        : !isCurrentlyDark;
      const transitionDir = targetIsDark ? "to-dark" : "to-light";

      // 4. Freeze global CSS transitions before snapshot capture & set direction
      root.setAttribute("data-theme-transitioning", "true");
      root.setAttribute("data-transition-dir", transitionDir);

      // 5. Initial SVG ink mask setup from pre-warmed pool (0ms Frame-1 main-thread cost)
      const initialMaskUri = getNextPrewarmedMask();
      root.style.setProperty("--ink-mask", initialMaskUri);

      let isCleanedUp = false;

      const cleanup = () => {
        if (isCleanedUp) return;
        isCleanedUp = true;
        root.removeAttribute("data-theme-transitioning");
        root.removeAttribute("data-transition-dir");
        root.style.removeProperty("--ink-mask");
        activeTransition = null;
      };

      // 6. Trigger View Transition with synchronous React DOM flush
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
        })
        .catch(() => {
          cleanup();
        });

      transition.finished.finally(() => {
        cleanup();
        replenishPoolAsynchronously();
      });

      // Failsafe timer to guarantee cleanup even if browser stalls transition
      setTimeout(() => {
        cleanup();
      }, duration + 400);
    },
    []
  );

  return { triggerThemeTransition };
}
