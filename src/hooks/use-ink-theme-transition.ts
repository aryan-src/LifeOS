"use client";

import { useCallback } from "react";
import { flushSync } from "react-dom";

/**
 * -----------------------------------------------------------------------------
 * VENOM SYMBIOTE TRANSITION TUNABLES
 * -----------------------------------------------------------------------------
 * Tweak these variables to dial in the living symbiote goo aesthetic:
 */
export const VENOM_CONFIG = {
  TENDRIL_COUNT: 8,       // 6 to 10 long tendrils reaching ahead of the main mass
  TENDRIL_LENGTH: 0.28,   // 0.15 to 0.35 of screen diagonal ahead of front
  GOO_SMOOTHNESS: 0.032,  // 0.02 to 0.04 of diagonal (smooth-min k factor)
  WRITHE_AMOUNT: 0.010,   // 0.005 to 0.015 of diagonal (boundary noise ripple)
  GLOSS_STRENGTH: 0.85,   // 0 to 1 (specular highlight and rim light intensity)
  DURATION_MS: 1100,      // 1000 to 1200 ms total duration
};

export interface InkTransitionOptions {
  duration?: number; // ms (defaults to VENOM_CONFIG.DURATION_MS)
  targetTheme?: string;
}

/**
 * Smooth minimum polynomial union (smin)
 */
function smin(a: number, b: number, k: number): number {
  const h = Math.max(k - Math.abs(a - b), 0.0) / k;
  return Math.min(a, b) - h * h * h * k * (1.0 / 6.0);
}

/**
 * Smooth maximum polynomial union (smax)
 */
function smax(a: number, b: number, k: number): number {
  return -smin(-a, -b, k);
}

/**
 * Generates a razor-sharp vector SVG liquid ink splatter with organic Venom-style
 * tendrils and satellite droplets encoded as a self-contained data URI.
 * Guaranteed to cover 100% of viewport at end scale while preserving sharp tendril tips.
 */
export function createVenomInkMaskDataUri(): string {
  const numPoints = 120;
  const pts: Array<{ x: number; y: number }> = [];

  const tendrilCount = VENOM_CONFIG.TENDRIL_COUNT;
  const tendrilAngles: number[] = [];
  const tendrilReaches: number[] = [];

  for (let i = 0; i < tendrilCount; i++) {
    const angle = (i / tendrilCount) * Math.PI * 2 + Math.sin(i * 1.7) * 0.12;
    tendrilAngles.push(angle);
    // Tendril reach extends towards viewBox boundary (-120 to +120)
    tendrilReaches.push(26 + ((i * 7) % 11));
  }

  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2;
    // Base organic lumpy mass
    const baseWave =
      10 * Math.sin(3 * angle + 0.4) +
      6 * Math.cos(5 * angle + 1.2) +
      3 * Math.sin(7 * angle + 2.1);
    const baseR = 76 + baseWave;

    let r = baseR;
    for (let t = 0; t < tendrilCount; t++) {
      const tAngle = tendrilAngles[t];
      let diff = Math.abs(angle - tAngle);
      if (diff > Math.PI) diff = 2 * Math.PI - diff;
      const sigma = 0.11; // Sharp tapered tendril profile
      if (diff < 0.35) {
        const reach = baseR + tendrilReaches[t] * Math.exp(-(diff * diff) / (2 * sigma * sigma));
        r = smax(r, reach, 5.0);
      }
    }

    // Clamp inner valleys >= 72 so 1.75x scale guarantees 100% screen corner coverage
    const clampedR = Math.max(72, Math.min(115, r));
    pts.push({
      x: Math.cos(angle) * clampedR,
      y: Math.sin(angle) * clampedR,
    });
  }

  // Convert polar coordinates to Catmull-Rom cubic Bézier path
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

  // Detached elongated satellite droplets ahead of the tendrils
  let droplets = "";
  const dropletCount = 12;
  for (let i = 0; i < dropletCount; i++) {
    const angle = (i / dropletCount) * Math.PI * 2 + Math.sin(i * 2.3) * 0.22;
    const dist = 104 + ((i * 7) % 12);
    const radius = 1.6 + (i % 3) * 0.8;
    const cx = (Math.cos(angle) * dist).toFixed(2);
    const cy = (Math.sin(angle) * dist).toFixed(2);
    droplets += `<circle cx="${cx}" cy="${cy}" r="${radius.toFixed(2)}" fill="#000"/>`;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-120 -120 240 240" width="240" height="240"><path d="${pathData}" fill="#000"/>${droplets}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

/**
 * Renders one frame of the living, viscous Venom symbiote goo onto an overlay canvas.
 * - Sharp analytic antialiased GPU rasterization
 * - Tendrils launch fast with slight overshoot, then settle; heavy viscous body follows
 * - Writhing boundary noise & oscillating tip curls
 * - Tube specular highlight along spine & rim lights (lit side near-white, shadow cool blue-violet)
 * - Light-to-dark: expanding obsidian body (#050507)
 * - Dark-to-light: 2-4% diagonal glossy black leading-edge bead sweeping across
 */
function renderSymbioteFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  originX: number,
  originY: number,
  progress: number, // 0 to 1
  isDarkToLight: boolean
) {
  const diag = Math.hypot(width, height);
  const maxDist = Math.max(
    Math.hypot(originX, originY),
    Math.hypot(width - originX, originY),
    Math.hypot(originX, height - originY),
    Math.hypot(width - originX, height - originY)
  );

  // 1. Tendril extension: fast launch with subtle overshoot, settling into place
  const tTendril = Math.min(1.0, progress / 0.82);
  const pTendrilLaunch = 1 - Math.exp(-6.5 * tTendril) * Math.cos(2.2 * tTendril);

  // 2. Heavy viscous body: lags 140ms behind, moves with viscous weight
  const tBody = Math.max(0.0, (progress - 0.13) / 0.87);
  const pBody = 1.0 - Math.pow(1.0 - tBody, 3.2);

  const rBodyOuter = maxDist * 1.18 * pBody;
  const beadWidth = diag * 0.035; // 3.5% diagonal leading-edge bead
  const rBodyInner = isDarkToLight ? Math.max(0.0, rBodyOuter - beadWidth) : 0.0;

  // Tendrils extend ahead of the main body
  const tendrilCount = VENOM_CONFIG.TENDRIL_COUNT;
  const tendrilBaseLength = diag * VENOM_CONFIG.TENDRIL_LENGTH;
  const kSmooth = diag * VENOM_CONFIG.GOO_SMOOTHNESS;
  const writheAmp = diag * VENOM_CONFIG.WRITHE_AMOUNT;

  ctx.clearRect(0, 0, width, height);

  // =========================================================================
  // Layer A: Main Symbiote Mass (Opaque True Obsidian Black #050507)
  // =========================================================================
  ctx.save();
  ctx.fillStyle = "#050507";
  ctx.strokeStyle = "#050507";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Build outer boundary with lumpy harmonics and time-advected boundary writhe
  const steps = 96;
  const outerCoords: Array<{ x: number; y: number; angle: number; r: number }> = [];

  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * Math.PI * 2;
    const lumpy =
      0.06 * Math.sin(3 * angle + 0.8) +
      0.04 * Math.cos(5 * angle + 1.4) +
      0.02 * Math.sin(8 * angle + 2.5);

    const writhe =
      writheAmp *
      (0.65 * Math.sin(7 * angle + 5.2 * progress) +
        0.35 * Math.cos(13 * angle - 7.1 * progress));

    const r = Math.max(0, rBodyOuter * (1.0 + lumpy) + writhe);
    outerCoords.push({
      x: originX + Math.cos(angle) * r,
      y: originY + Math.sin(angle) * r,
      angle,
      r,
    });
  }

  // Draw main mass path
  ctx.beginPath();
  if (outerCoords.length > 0) {
    ctx.moveTo(outerCoords[0].x, outerCoords[0].y);
    for (let i = 1; i < outerCoords.length; i++) {
      ctx.lineTo(outerCoords[i].x, outerCoords[i].y);
    }
    ctx.closePath();
  }

  // In dark-to-light, carve out inner light opening behind the leading bead
  if (isDarkToLight && rBodyInner > 0) {
    ctx.moveTo(originX + rBodyInner, originY);
    for (let i = steps; i >= 0; i--) {
      const angle = (i / steps) * Math.PI * 2;
      const rInner = Math.max(0, rBodyInner * (1.0 + 0.03 * Math.sin(4 * angle + 1.0)));
      ctx.lineTo(originX + Math.cos(angle) * rInner, originY + Math.sin(angle) * rInner);
    }
    ctx.closePath();
    ctx.fill("evenodd");
  } else {
    ctx.fill();
  }

  // =========================================================================
  // Layer B: Tendrils & Side Branches (Tapered curved capsules with sharp tips)
  // =========================================================================
  const tendrilSpines: Array<Array<{ x: number; y: number; width: number; tangentX: number; tangentY: number }>> = [];

  for (let j = 0; j < tendrilCount; j++) {
    const baseAngle = (j / tendrilCount) * Math.PI * 2 + Math.sin(j * 1.9) * 0.14;
    const lengthMultiplier = 0.85 + 0.3 * (((j * 5) % 7) / 6);
    // Tendrils reach ahead of the main front, gradually swallowed as body catches up
    const length = tendrilBaseLength * lengthMultiplier * pTendrilLaunch * (1.0 - 0.75 * pBody);
    if (length <= 2) continue;

    const baseWidth = diag * (0.036 + 0.012 * (((j * 3) % 5) / 4));
    const curvature = 0.35 * Math.sin(j * 2.7);
    const tipCurl = ((8.0 * Math.PI) / 180.0) * Math.sin(Math.PI * 2 * 3.5 * progress + j * 0.8) * (1.0 - progress * 0.3);
    const hasSpiral = j % 3 === 1;

    const spine: Array<{ x: number; y: number; width: number; tangentX: number; tangentY: number }> = [];
    const segs = 18;

    for (let sIdx = 0; sIdx <= segs; sIdx++) {
      const s = sIdx / segs;
      let angle = baseAngle + curvature * s + tipCurl * (s * s);
      if (hasSpiral && s > 0.75) {
        angle += 0.4 * Math.pow((s - 0.75) / 0.25, 2);
      }

      const dist = rBodyOuter + s * length;
      const px = originX + Math.cos(angle) * dist;
      const py = originY + Math.sin(angle) * dist;

      // Smooth-min root flare merging organically into the body like muscle
      const flare = s < 0.25 ? (kSmooth / baseWidth) * Math.pow(1.0 - s / 0.25, 2) : 0;
      const w = baseWidth * (1.0 - Math.pow(s, 1.1)) + flare;

      const tangentX = Math.cos(angle);
      const tangentY = Math.sin(angle);
      spine.push({ x: px, y: py, width: Math.max(0.5, w), tangentX, tangentY });
    }

    tendrilSpines.push(spine);

    // Render tendril boundary polygon
    ctx.beginPath();
    // Left boundary from root to tip
    for (let sIdx = 0; sIdx <= segs; sIdx++) {
      const pt = spine[sIdx];
      const normX = -pt.tangentY;
      const normY = pt.tangentX;
      const h = pt.width * 0.5;
      const lx = pt.x + normX * h;
      const ly = pt.y + normY * h;
      if (sIdx === 0) ctx.moveTo(lx, ly);
      else ctx.lineTo(lx, ly);
    }
    // Right boundary from tip back to root
    for (let sIdx = segs; sIdx >= 0; sIdx--) {
      const pt = spine[sIdx];
      const normX = -pt.tangentY;
      const normY = pt.tangentX;
      const h = pt.width * 0.5;
      const rx = pt.x - normX * h;
      const ry = pt.y - normY * h;
      ctx.lineTo(rx, ry);
    }
    ctx.closePath();
    ctx.fill();

    // Side branches on tendrils 2 and 5
    if (j === 2 || j === 5) {
      const branchRoot = spine[Math.floor(segs * 0.55)];
      const branchAngle = baseAngle + (j === 2 ? 0.65 : -0.65);
      const branchLen = length * 0.35;
      const branchBaseWidth = branchRoot.width * 0.45;

      ctx.beginPath();
      const bTipX = branchRoot.x + Math.cos(branchAngle) * branchLen;
      const bTipY = branchRoot.y + Math.sin(branchAngle) * branchLen;
      const bNormX = -Math.sin(branchAngle) * (branchBaseWidth * 0.5);
      const bNormY = Math.cos(branchAngle) * (branchBaseWidth * 0.5);

      ctx.moveTo(branchRoot.x + bNormX, branchRoot.y + bNormY);
      ctx.lineTo(bTipX, bTipY);
      ctx.lineTo(branchRoot.x - bNormX, branchRoot.y - bNormY);
      ctx.closePath();
      ctx.fill();
    }
  }

  // =========================================================================
  // Layer C: Droplets with Stretching Necks & Pinch-Off
  // =========================================================================
  const dropletCount = 11;
  const dropletHighlights: Array<{ x: number; y: number; radiusA: number; radiusB: number; angle: number }> = [];

  for (let d = 0; d < dropletCount; d++) {
    const travelAngle = (d / dropletCount) * Math.PI * 2 + Math.sin(d * 2.2) * 0.2;
    const pinchTime = 0.28 + 0.08 * (d % 3);
    const beadRadius = diag * (0.0035 + 0.003 * ((d * 3) % 4));
    const beadDist = rBodyOuter + diag * 0.16 * pTendrilLaunch * (0.8 + 0.4 * ((d % 5) / 4));

    const cx = originX + Math.cos(travelAngle) * beadDist;
    const cy = originY + Math.sin(travelAngle) * beadDist;

    // Stretching neck bridge prior to pinch-off
    if (progress < pinchTime && beadDist > rBodyOuter) {
      const neckRatio = Math.max(0.0, 1.0 - progress / pinchTime);
      const neckWidth = beadRadius * 1.8 * Math.pow(neckRatio, 1.4);

      const rootX = originX + Math.cos(travelAngle) * rBodyOuter;
      const rootY = originY + Math.sin(travelAngle) * rBodyOuter;
      const normX = -Math.sin(travelAngle);
      const normY = Math.cos(travelAngle);

      ctx.beginPath();
      ctx.moveTo(rootX + normX * (neckWidth * 1.5), rootY + normY * (neckWidth * 1.5));
      ctx.quadraticCurveTo(
        (rootX + cx) / 2 + normX * (neckWidth * 0.4),
        (rootY + cy) / 2 + normY * (neckWidth * 0.4),
        cx + normX * beadRadius,
        cy + normY * beadRadius
      );
      ctx.lineTo(cx - normX * beadRadius, cy - normY * beadRadius);
      ctx.quadraticCurveTo(
        (rootX + cx) / 2 - normX * (neckWidth * 0.4),
        (rootY + cy) / 2 - normY * (neckWidth * 0.4),
        rootX - normX * (neckWidth * 1.5),
        rootY - normY * (neckWidth * 1.5)
      );
      ctx.closePath();
      ctx.fill();
    }

    // Elongated droplet bead (elongated along direction of travel)
    const radiusA = beadRadius * 1.5; // major axis
    const radiusB = beadRadius / 1.2; // minor axis

    ctx.beginPath();
    ctx.ellipse(cx, cy, radiusA, radiusB, travelAngle, 0, Math.PI * 2);
    ctx.fill();

    dropletHighlights.push({ x: cx, y: cy, radiusA, radiusB, angle: travelAngle });
  }

  // =========================================================================
  // Layer D: Material Highlights (Tube Specular Line & Dual-Tone Rim Light)
  // =========================================================================
  const gloss = VENOM_CONFIG.GLOSS_STRENGTH;
  const lightDirX = -0.707; // Top-left light source
  const lightDirY = -0.707;

  // 1. Tube specular line running along tendril spines (half-cylinder normal)
  ctx.lineCap = "round";
  for (const spine of tendrilSpines) {
    if (spine.length < 4) continue;
    ctx.beginPath();
    let started = false;

    for (let sIdx = 1; sIdx < spine.length - 1; sIdx++) {
      const pt = spine[sIdx];
      const normX = -pt.tangentY;
      const normY = pt.tangentX;
      const dotL = normX * lightDirX + normY * lightDirY;

      // Offset specular highlight slightly towards light source
      const offset = (pt.width * 0.22) * Math.sign(dotL || 1);
      const hx = pt.x + normX * offset;
      const hy = pt.y + normY * offset;

      if (!started) {
        ctx.moveTo(hx, hy);
        started = true;
      } else {
        ctx.lineTo(hx, hy);
      }
    }

    ctx.lineWidth = Math.max(1.4, diag * 0.0016);
    ctx.strokeStyle = `rgba(255, 255, 255, ${(0.82 * gloss).toFixed(2)})`;
    ctx.stroke();
  }

  // 2. Near-white lit-side rim light (top-left) & cool blue-violet shadow reflection (bottom-right)
  for (const spine of tendrilSpines) {
    if (spine.length < 3) continue;

    // Lit side (outer edge facing light source)
    ctx.beginPath();
    let litStarted = false;
    for (let sIdx = 1; sIdx < spine.length; sIdx++) {
      const pt = spine[sIdx];
      const normX = -pt.tangentY;
      const normY = pt.tangentX;
      const dot = normX * lightDirX + normY * lightDirY;
      if (dot > 0.1) {
        const lx = pt.x + normX * (pt.width * 0.5);
        const ly = pt.y + normY * (pt.width * 0.5);
        if (!litStarted) {
          ctx.moveTo(lx, ly);
          litStarted = true;
        } else {
          ctx.lineTo(lx, ly);
        }
      }
    }
    if (litStarted) {
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = `rgba(250, 250, 255, ${(0.88 * gloss).toFixed(2)})`;
      ctx.stroke();
    }

    // Shadow side (outer edge facing opposite light source)
    ctx.beginPath();
    let shStarted = false;
    for (let sIdx = 1; sIdx < spine.length; sIdx++) {
      const pt = spine[sIdx];
      const normX = -pt.tangentY;
      const normY = pt.tangentX;
      const dot = normX * lightDirX + normY * lightDirY;
      if (dot < -0.1) {
        const sx = pt.x + normX * (pt.width * 0.5);
        const sy = pt.y + normY * (pt.width * 0.5);
        if (!shStarted) {
          ctx.moveTo(sx, sy);
          shStarted = true;
        } else {
          ctx.lineTo(sx, sy);
        }
      }
    }
    if (shStarted) {
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = `rgba(80, 105, 205, ${(0.18 * gloss).toFixed(2)})`;
      ctx.stroke();
    }
  }

  // 3. Droplet highlights: specular dot on top-left shoulder + cool crescent reflection
  for (const drop of dropletHighlights) {
    // Primary specular dot
    const dotX = drop.x - drop.radiusA * 0.35 * Math.cos(drop.angle - Math.PI / 4);
    const dotY = drop.y - drop.radiusB * 0.35 * Math.sin(drop.angle - Math.PI / 4);
    ctx.beginPath();
    ctx.arc(dotX, dotY, Math.max(1.0, drop.radiusB * 0.32), 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${(0.92 * gloss).toFixed(2)})`;
    ctx.fill();

    // Cool rim crescent
    const cresX = drop.x + drop.radiusA * 0.3 * Math.cos(drop.angle - Math.PI / 4);
    const cresY = drop.y + drop.radiusB * 0.3 * Math.sin(drop.angle - Math.PI / 4);
    ctx.beginPath();
    ctx.arc(cresX, cresY, Math.max(0.8, drop.radiusB * 0.25), 0, Math.PI * 2);
    ctx.fillStyle = `rgba(85, 110, 215, ${(0.22 * gloss).toFixed(2)})`;
    ctx.fill();
  }

  ctx.restore();
}

export function useInkThemeTransition() {
  const triggerThemeTransition = useCallback(
    (
      event: React.MouseEvent | React.KeyboardEvent | null,
      applyTheme: () => void,
      options: InkTransitionOptions = {}
    ) => {
      const duration = options.duration ?? VENOM_CONFIG.DURATION_MS;

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
      let x = typeof window !== "undefined" ? window.innerWidth / 2 : 500;
      let y = typeof window !== "undefined" ? window.innerHeight / 2 : 400;
      if (event && "clientX" in event && (event.clientX > 0 || event.clientY > 0)) {
        x = event.clientX;
        y = event.clientY;
      }

      const vw = typeof window !== "undefined" ? window.innerWidth : 1000;
      const vh = typeof window !== "undefined" ? window.innerHeight : 800;
      const maxCornerDist = Math.max(
        Math.hypot(x, y),
        Math.hypot(vw - x, y),
        Math.hypot(x, vh - y),
        Math.hypot(vw - x, vh - y)
      );

      // Inner valley ratio is 72/120 = 0.6; 1.75x guarantees 100% screen coverage
      const endRadius = maxCornerDist * 1.75;
      const endSize = endRadius * 2;

      // 2. Determine transition direction
      const root = document.documentElement;
      const isCurrentlyDark =
        Boolean(root.classList?.contains?.("dark")) ||
        (typeof root.getAttribute === "function" && root.getAttribute("data-theme") === "crimson-dark");
      const targetIsDark = options.targetTheme
        ? options.targetTheme.includes("dark")
        : !isCurrentlyDark;
      const isDarkToLight = isCurrentlyDark && !targetIsDark;

      // 3. Attach mask & freeze CSS transitions BEFORE capturing snapshots
      const maskUri = createVenomInkMaskDataUri();
      root.style.setProperty("--ink-mask", maskUri);
      root.setAttribute("data-theme-transitioning", "true");

      // 4. Create GPU overlay canvas for living Venom symbiote rendering
      let canvas: HTMLCanvasElement | null = null;
      let ctx: CanvasRenderingContext2D | null = null;
      let rafId: number | null = null;
      let isCleanedUp = false;

      if (typeof document !== "undefined" && typeof document.createElement === "function") {
        try {
          canvas = document.createElement("canvas");
          canvas.id = "venom-symbiote-canvas";
          canvas.setAttribute("popover", "manual");
          canvas.style.cssText =
            "position:fixed;inset:0;width:100vw;height:100vh;margin:0;padding:0;border:none;background:transparent;pointer-events:none;z-index:2147483647;display:block;";

          const dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2) : 1;
          canvas.width = Math.round(vw * dpr);
          canvas.height = Math.round(vh * dpr);

          ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.scale(dpr, dpr);
          }

          if (document.body && typeof document.body.appendChild === "function") {
            document.body.appendChild(canvas);
            if (typeof canvas.showPopover === "function") {
              try {
                canvas.showPopover();
              } catch {}
            }
          }
        } catch {
          // Graceful fallback if DOM methods are unavailable
        }
      }

      const cleanup = () => {
        if (isCleanedUp) return;
        isCleanedUp = true;
        if (rafId !== null && typeof cancelAnimationFrame === "function") {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
        root.removeAttribute("data-theme-transitioning");
        root.style.removeProperty("--ink-mask");
        if (canvas && canvas.parentNode) {
          canvas.remove();
        }
      };

      // 5. Trigger View Transition
      const transition = doc.startViewTransition(() => {
        flushSync(() => {
          applyTheme();
        });
      });

      transition.ready
        .then(() => {
          // WAAPI GPU mask expansion pinned to click origin
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

          // 60/120fps living symbiote animation loop
          if (ctx && typeof requestAnimationFrame === "function") {
            const startTime = performance.now();

            const renderTick = (currentTime: number) => {
              if (isCleanedUp) return;
              const elapsed = currentTime - startTime;
              const progress = Math.min(1.0, elapsed / duration);

              if (ctx) {
                renderSymbioteFrame(ctx, vw, vh, x, y, progress, isDarkToLight);
              }

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

      // Failsafe timeout to prevent any stranded overlay
      setTimeout(() => {
        cleanup();
      }, duration + 300);
    },
    []
  );

  return { triggerThemeTransition };
}
