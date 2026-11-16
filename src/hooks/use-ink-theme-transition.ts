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
  DROPLET_COUNT: 11,
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
 * Renders one frame of the living, viscous Venom symbiote goo onto the GPU canvas.
 * Implements:
 * - Opaque true black body (RGB <= 8, #050507) with volume gradient (darker in core).
 * - Lumpy main mass + 6-10 tapered curved tendrils with sharp points & side branches.
 * - Smooth-min root fillets blending tendrils into body like muscle.
 * - Droplets stretching on necks before pinching off into elongated beads with specular dots.
 * - Fast burst tendril launch with overshoot; heavy viscous body follows 140ms behind.
 * - Dynamic boundary rippling (time-advected noise) and oscillating tip curl.
 * - Glossy tube specular line along tendril spines, sliding dynamically as shape moves.
 * - 1-2px near-white rim light (top-left) & faint cool blue reflection (shadow side).
 * - Dark-to-light: 2-4% diagonal glossy black leading bead sweeping across, revealing light behind it.
 * - Light-to-dark: solid black symbiote body expanding across light page.
 */
function renderVenomSymbioteFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  originX: number,
  originY: number,
  progress: number, // 0.0 to 1.0
  isDarkToLight: boolean
) {
  const diag = Math.hypot(width, height);
  const maxDist = Math.max(
    Math.hypot(originX, originY),
    Math.hypot(width - originX, originY),
    Math.hypot(originX, height - originY),
    Math.hypot(width - originX, height - originY)
  );

  // 1. Tendril extension: fast burst with slight overshoot, settling into place
  const tTendril = Math.min(1.0, progress / 0.82);
  const pTendrilLaunch = 1.0 - Math.exp(-6.5 * tTendril) * Math.cos(2.2 * tTendril);

  // 2. Heavy viscous body: lags 140ms behind (progress 0.13), moves with viscous weight
  const tBody = Math.max(0.0, (progress - 0.13) / 0.87);
  const pBody = 1.0 - Math.pow(1.0 - tBody, 3.2);

  const rBodyOuter = maxDist * 1.18 * pBody;
  const beadWidth = diag * 0.035; // 3.5% diagonal leading-edge bead (2% to 4%)
  const rBodyInner = isDarkToLight ? Math.max(0.0, rBodyOuter - beadWidth) : 0.0;

  const tendrilCount = VENOM_CONFIG.TENDRIL_COUNT;
  const tendrilBaseLength = diag * VENOM_CONFIG.TENDRIL_LENGTH;
  const kSmooth = diag * VENOM_CONFIG.GOO_SMOOTHNESS;
  const writheAmp = diag * VENOM_CONFIG.WRITHE_AMOUNT;

  ctx.clearRect(0, 0, width, height);

  // =========================================================================
  // Layer A: Main Symbiote Mass (Opaque True Black, RGB <= 8: #050507)
  // =========================================================================
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Volume shading: radial gradient from subtle charcoal edge (#0d0e14) to deep obsidian core (#020204)
  const volumeGrad = ctx.createRadialGradient(
    originX,
    originY,
    Math.max(0, rBodyOuter * 0.2),
    originX,
    originY,
    Math.max(10, rBodyOuter * 1.1)
  );
  volumeGrad.addColorStop(0, "#030305"); // True black core (RGB <= 8)
  volumeGrad.addColorStop(0.7, "#050507"); // Deep obsidian body (RGB <= 8)
  volumeGrad.addColorStop(1, "#0d0e14"); // Subtle volume edge

  ctx.fillStyle = volumeGrad;
  ctx.strokeStyle = "#050507";

  // Build outer boundary with lumpy harmonics and constantly rippling time-moving noise
  const steps = 96;
  const outerCoords: Array<{ x: number; y: number; angle: number; r: number }> = [];

  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * Math.PI * 2;
    const lumpy =
      0.07 * Math.sin(3 * angle + 0.8) +
      0.05 * Math.cos(5 * angle + 1.4) +
      0.02 * Math.sin(8 * angle + 2.5);

    // Constant edge ripple: time-moving boundary noise (0.5% to 1.5% diagonal)
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

  // Dark-to-light: carve out inner light opening behind the 2-4% leading bead
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
  // Layer B: Tendrils & Side Branches (Tapered curved shapes with sharp points)
  // =========================================================================
  const tendrilSpines: Array<Array<{ x: number; y: number; width: number; tangentX: number; tangentY: number }>> = [];

  for (let j = 0; j < tendrilCount; j++) {
    const baseAngle = (j / tendrilCount) * Math.PI * 2 + Math.sin(j * 1.9) * 0.14;
    const lengthMultiplier = 0.85 + 0.3 * (((j * 5) % 7) / 6);
    // Tendrils shoot out first; swallowed as heavy body catches up
    const length = tendrilBaseLength * lengthMultiplier * pTendrilLaunch * (1.0 - 0.75 * pBody);
    if (length <= 2) continue;

    // Base width: 3% to 5% of screen diagonal
    const baseWidth = diag * (0.036 + 0.012 * (((j * 3) % 5) / 4));
    const curvature = 0.35 * Math.sin(j * 2.7);
    // Dynamic tip curl oscillating as tendrils extend
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
      // Taper down to needle point at s = 1.0
      const w = baseWidth * (1.0 - Math.pow(s, 1.05)) + flare;

      const tangentX = Math.cos(angle);
      const tangentY = Math.sin(angle);
      spine.push({ x: px, y: py, width: Math.max(0.5, w), tangentX, tangentY });
    }

    tendrilSpines.push(spine);

    // Draw tendril body
    ctx.beginPath();
    // Left boundary from root to sharp tip
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

    // Side branches on tendrils 2 and 5 (thin side branch tapering to point)
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
  const dropletCount = 11; // 8 to 14 droplets
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

    // Elongated droplet bead (slightly stretched along travel direction)
    const radiusA = beadRadius * 1.55; // Major axis along travel
    const radiusB = beadRadius / 1.25; // Minor axis perpendicular

    ctx.beginPath();
    ctx.ellipse(cx, cy, radiusA, radiusB, travelAngle, 0, Math.PI * 2);
    ctx.fill();

    dropletHighlights.push({ x: cx, y: cy, radiusA, radiusB, angle: travelAngle });
  }

  // =========================================================================
  // Layer D: Highlights & Rim Lights (Dynamic sliding specular lines)
  // =========================================================================
  const gloss = VENOM_CONFIG.GLOSS_STRENGTH;
  const lightDirX = -0.707; // Top-left light source
  const lightDirY = -0.707;

  // 1. Tube specular highlight line running along the spine of each tendril
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

      // Specular highlight slides dynamically along tendril spine with travel
      const offset = pt.width * 0.22 * Math.sign(dotL || 1);
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

  // 2. 1-2px near-white rim light (top-left) & faint cool blue reflection (shadow side)
  for (const spine of tendrilSpines) {
    if (spine.length < 3) continue;

    // Lit side (top-left facing edge)
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
      ctx.lineWidth = 1.3;
      ctx.strokeStyle = `rgba(250, 250, 255, ${(0.88 * gloss).toFixed(2)})`;
      ctx.stroke();
    }

    // Shadow side (opposite edge facing bottom-right)
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

  // 3. Droplet specular dots
  for (const drop of dropletHighlights) {
    const dotX = drop.x - drop.radiusA * 0.35 * Math.cos(drop.angle - Math.PI / 4);
    const dotY = drop.y - drop.radiusB * 0.35 * Math.sin(drop.angle - Math.PI / 4);
    ctx.beginPath();
    ctx.arc(dotX, dotY, Math.max(1.0, drop.radiusB * 0.32), 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${(0.92 * gloss).toFixed(2)})`;
    ctx.fill();

    const cresX = drop.x + drop.radiusA * 0.3 * Math.cos(drop.angle - Math.PI / 4);
    const cresY = drop.y + drop.radiusB * 0.3 * Math.sin(drop.angle - Math.PI / 4);
    ctx.beginPath();
    ctx.arc(cresX, cresY, Math.max(0.8, drop.radiusB * 0.25), 0, Math.PI * 2);
    ctx.fillStyle = `rgba(85, 110, 215, ${(0.22 * gloss).toFixed(2)})`;
    ctx.fill();
  }

  ctx.restore();
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
      const isDarkToLight = isCurrentlyDark && !targetIsDark;

      // 4. Freeze global CSS transitions before snapshot capture
      root.setAttribute("data-theme-transitioning", "true");

      // 5. Initial SVG ink mask setup
      const initialMask = generateOrganicInkSvg(0.001, x, y, vw, vh);
      const initialMaskUri = `url("data:image/svg+xml,${encodeURIComponent(initialMask)}")`;
      root.style.setProperty("--ink-mask", initialMaskUri);

      // 6. Create Top-Layer GPU overlay canvas for living Venom symbiote rendering
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
        } catch {}
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
        activeTransition = null;
      };

      // 7. Trigger View Transition with synchronous React DOM flush
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

          // Continuous 60/120fps living symbiote animation loop
          if (typeof requestAnimationFrame === "function") {
            const startTime = performance.now();

            const renderTick = (now: number) => {
              if (isCleanedUp) return;
              const elapsed = now - startTime;
              const progress = Math.min(1.0, elapsed / duration);

              // Update the morphing organic SVG ink mask for ::view-transition-new(root)
              const frameSvg = generateOrganicInkSvg(progress, x, y, vw, vh);
              root.style.setProperty(
                "--ink-mask",
                `url("data:image/svg+xml,${encodeURIComponent(frameSvg)}")`
              );

              // Render the living glossy Venom symbiote onto the top-layer canvas
              if (ctx) {
                renderVenomSymbioteFrame(ctx, vw, vh, x, y, progress, isDarkToLight);
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

      // Failsafe timer to guarantee cleanup even if browser stalls transition
      setTimeout(() => {
        cleanup();
      }, duration + 250);
    },
    []
  );

  return { triggerThemeTransition };
}
