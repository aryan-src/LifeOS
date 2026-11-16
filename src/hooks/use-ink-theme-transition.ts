"use client";

import { useCallback } from "react";
import { flushSync } from "react-dom";

export interface InkTransitionOptions {
  duration?: number; // ms (default: 750)
  targetTheme?: string;
}

/**
 * Generates a razor-sharp vector SVG liquid ink splatter with organic Venom-style
 * tendrils and detached satellite droplets encoded as a self-contained data URI.
 */
export function createVenomInkMaskDataUri(): string {
  const p1 = Math.random() * Math.PI * 2;
  const p2 = Math.random() * Math.PI * 2;
  const p3 = Math.random() * Math.PI * 2;
  const p4 = Math.random() * Math.PI * 2;

  const numPoints = 72;
  const pts: Array<{ x: number; y: number }> = [];

  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2;
    const wave =
      14 * Math.sin(3 * angle + p1) +
      10 * Math.cos(5 * angle + p2) +
      7 * Math.sin(8 * angle + p3) +
      4 * Math.cos(12 * angle + p4);

    // Clamp inner valleys >= 72 so full viewport coverage is guaranteed
    const r = Math.max(72, Math.min(112, 91 + wave));
    pts.push({
      x: Math.cos(angle) * r,
      y: Math.sin(angle) * r,
    });
  }

  // Convert polar points into a smooth closed cubic Bézier path (Catmull-Rom)
  let pathData = "";
  for (let i = 0; i < numPoints; i++) {
    const p0 = pts[(i - 1 + numPoints) % numPoints];
    const curr = pts[i];
    const next = pts[(i + 1) % numPoints];
    const p3Pt = pts[(i + 2) % numPoints];

    if (i === 0) {
      pathData += `M ${curr.x.toFixed(2)} ${curr.y.toFixed(2)} `;
    }

    const cp1x = curr.x + (next.x - p0.x) / 6;
    const cp1y = curr.y + (next.y - p0.y) / 6;
    const cp2x = next.x - (p3Pt.x - curr.x) / 6;
    const cp2y = next.y - (p3Pt.y - curr.y) / 6;

    pathData += `C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${next.x.toFixed(2)} ${next.y.toFixed(2)} `;
  }
  pathData += "Z";

  // Detached satellite ink droplets outside the main tendrils
  let droplets = "";
  const dropletCount = 14;
  for (let i = 0; i < dropletCount; i++) {
    const angle = (i / dropletCount) * Math.PI * 2 + Math.sin(i * 2.1 + p1) * 0.25;
    const dist = 100 + ((i * 7) % 15);
    const radius = 1.4 + (i % 3) * 0.9;
    const cx = (Math.cos(angle) * dist).toFixed(2);
    const cy = (Math.sin(angle) * dist).toFixed(2);
    droplets += `<circle cx="${cx}" cy="${cy}" r="${radius.toFixed(2)}" fill="#000"/>`;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-120 -120 240 240" width="240" height="240"><path d="${pathData}" fill="#000"/>${droplets}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

export function useInkThemeTransition() {
  const triggerThemeTransition = useCallback(
    (
      event: React.MouseEvent | React.KeyboardEvent | null,
      applyTheme: () => void,
      options: InkTransitionOptions = {}
    ) => {
      const { duration = 750 } = options;

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
        applyTheme();
        return;
      }

      // 1. Capture exact click origin (or viewport center for keyboard trigger)
      let x = window.innerWidth / 2;
      let y = window.innerHeight / 2;
      if (event && "clientX" in event && (event.clientX > 0 || event.clientY > 0)) {
        x = event.clientX;
        y = event.clientY;
      }

      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const maxCornerDist = Math.max(
        Math.hypot(x, y),
        Math.hypot(vw - x, y),
        Math.hypot(x, vh - y),
        Math.hypot(vw - x, vh - y)
      );

      // Inner valley ratio is 72/120 = 0.6; 1.75x guarantees 100% screen coverage
      const endRadius = maxCornerDist * 1.75;
      const endSize = endRadius * 2;

      const root = document.documentElement;
      const maskUri = createVenomInkMaskDataUri();

      // Attach mask & freeze CSS transitions BEFORE capturing snapshots
      root.style.setProperty("--ink-mask", maskUri);
      root.setAttribute("data-theme-transitioning", "true");

      const transition = doc.startViewTransition(() => {
        flushSync(() => {
          applyTheme();
        });
      });

      transition.ready
        .then(() => {
          // 120fps GPU-composited mask expansion pinned to click origin (x, y)
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
          // Fallback if browser skips transition
        });

      transition.finished.finally(() => {
        root.removeAttribute("data-theme-transitioning");
        root.style.removeProperty("--ink-mask");
      });
    },
    []
  );

  return { triggerThemeTransition };
}
