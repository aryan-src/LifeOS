'use client';

import React, { useEffect, useRef, useState } from 'react';

// ---------------------------------------------------------------------------
// Deterministic 2-octave value noise & curl-noise wind field
// Zero heavy external physics dependencies; quiet, smooth aesthetic
// ---------------------------------------------------------------------------
function hash2(x: number, y: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return n - Math.floor(n);
}

function vnoise(x: number, y: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi);
  const b = hash2(xi + 1, yi);
  const c = hash2(xi, yi + 1);
  const d = hash2(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

function noise2(x: number, y: number): number {
  return 0.65 * vnoise(x, y) + 0.35 * vnoise(x * 2.1 + 19.7, y * 2.1 + 7.3);
}

// ---------------------------------------------------------------------------
// Particle & Simulation Constants
// Tuned for Notion-style matte aesthetics: fine stipple grains, gentle vapor
// ---------------------------------------------------------------------------
const FLOATS = 6; // grains: x, y, vx, vy, hx, hy · vapor: x, y, vx, vy, age, life
const MAX_GRAINS = 1500; // per digit
const SAMPLE_STRIDE = 3; // px between alpha samples on glyph raster
const SPRING_K = 90; // s⁻² — soft harmonic spring constant
const ZETA = 0.55; // damping ratio
const DRAG = 0.92; // per-frame velocity drag
const DT_MAX = 0.032; // s — clamp tab-switch jumps
const FIELD_SCALE = 0.008; // px → noise units for wind field
const CURL_EPS = 0.75; // noise-space finite difference
const PAD_X = 24; // overdraw bounds
const PAD_TOP = 40; // headroom for rising vapor
const PAD_BOTTOM = 12;

type Slot = {
  g: Float32Array; // incoming / settled grains
  v: Float32Array; // sublimating vapor grains
  gc: number;
  vc: number;
  active: boolean;
};

export interface VaporCountdownDigitsProps {
  minutes: number;
  seconds: number;
  isRunning?: boolean;
  className?: string;
  digitClassName?: string;
}

export function VaporCountdownDigits({
  minutes,
  seconds,
  isRunning = false,
  className = '',
  digitClassName = '',
}: VaporCountdownDigitsProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef<HTMLTimeElement>(null);

  const [isCanvasReady, setIsCanvasReady] = useState<boolean>(false);

  // Normalize numbers to padded two-character strings
  const clampedMin = Math.max(0, Math.min(99, Math.floor(minutes)));
  const clampedSec = Math.max(0, Math.min(59, Math.floor(seconds)));
  const mm = String(clampedMin).padStart(2, '0');
  const ss = String(clampedSec).padStart(2, '0');
  const targetDigits = `${mm}${ss}`; // 4 digits: M1, M2, S1, S2

  // Refs for tracking mutable animation loop state without re-render churn
  const digitsRef = useRef<string>(targetDigits);
  const slotsRef = useRef<Slot[]>(
    Array.from({ length: 4 }, () => ({
      g: new Float32Array(MAX_GRAINS * FLOATS),
      v: new Float32Array(MAX_GRAINS * FLOATS),
      gc: 0,
      vc: 0,
      active: false,
    }))
  );
  const glyphsRef = useRef<Float32Array[] | null>(null);
  const cellsRef = useRef<{ x: number; y: number }[]>([]);
  const grainColorRef = useRef<string>('#1c1917');
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const cwRef = useRef<number>(0);
  const chRef = useRef<number>(0);
  const isReducedMotionRef = useRef<boolean>(false);

  // Wake loop function ref
  const wakeRef = useRef<() => void>(() => {});
  const transitionRef = useRef<(slotIdx: number, newDigit: number) => void>(() => {});

  // 1. Core Canvas and Physics Lifecycle
  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const timeEl = timeRef.current;
    if (!root || !canvas || !timeEl) return;

    const digitEls = Array.from(root.querySelectorAll<HTMLSpanElement>('[data-vc-digit]'));
    if (digitEls.length !== 4) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    isReducedMotionRef.current = reduced;
    if (reduced) {
      setIsCanvasReady(false);
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let disposed = false;
    const dampC = 2 * ZETA * Math.sqrt(SPRING_K);

    const updateGrainColor = () => {
      if (digitEls[0]) {
        const computed = getComputedStyle(digitEls[0]).color;
        if (computed && computed !== 'transparent' && computed !== 'rgba(0, 0, 0, 0)') {
          grainColorRef.current = computed;
        }
      }
    };
    updateGrainColor();

    const loop = (now: number) => {
      const dt = Math.min(Math.max((now - lastTimeRef.current) / 1000, 0), DT_MAX);
      lastTimeRef.current = now;

      ctx.clearRect(0, 0, cwRef.current, chRef.current);
      ctx.fillStyle = grainColorRef.current;
      let anyActive = false;

      const slots = slotsRef.current;

      for (let s = 0; s < 4; s++) {
        const slot = slots[s];
        const g = slot.g;
        const v = slot.v;

        if (!slot.active) {
          // Asleep slot: settled grains sit crisp at home — no physics computation
          ctx.globalAlpha = 0.85;
          for (let i = 0; i < slot.gc; i++) {
            const o = i * FLOATS;
            ctx.fillRect(g[o] - 1, g[o + 1] - 1, 2, 2);
          }
          continue;
        }

        anyActive = true;
        let settled = true;

        // Incoming grains: underdamped spring seeking glyph homes
        for (let i = 0; i < slot.gc; i++) {
          const o = i * FLOATS;
          let x = g[o];
          let y = g[o + 1];
          let vx = g[o + 2];
          let vy = g[o + 3];
          const hx = g[o + 4];
          const hy = g[o + 5];

          vx = (vx + (SPRING_K * (hx - x) - dampC * vx) * dt) * DRAG;
          vy = (vy + (SPRING_K * (hy - y) - dampC * vy) * dt) * DRAG;
          x += vx * dt;
          y += vy * dt;

          g[o] = x;
          g[o + 1] = y;
          g[o + 2] = vx;
          g[o + 3] = vy;

          if (
            Math.abs(x - hx) > 0.5 ||
            Math.abs(y - hy) > 0.5 ||
            Math.abs(vx) > 2 ||
            Math.abs(vy) > 2
          ) {
            settled = false;
          }

          const speed = Math.hypot(vx, vy);
          ctx.globalAlpha = 0.65 + 0.35 * Math.min(1, speed / 500);
          ctx.fillRect(x - 1, y - 1, 2, 2);
        }

        // Sublimating vapor grains: curl-noise wind, subtle upward drift, gentle fade
        let j = 0;
        while (j < slot.vc) {
          const o = j * FLOATS;
          const age = v[o + 4] + dt * 1000;
          const life = v[o + 5];

          if (age >= life) {
            // Swap-remove with last live vapor grain
            const lo = (slot.vc - 1) * FLOATS;
            for (let k = 0; k < FLOATS; k++) v[o + k] = v[lo + k];
            slot.vc--;
            continue;
          }

          v[o + 4] = age;
          let x = v[o];
          let y = v[o + 1];
          let vx = v[o + 2];
          let vy = v[o + 3];

          // Wind = curl of noise field: (∂n/∂y, -∂n/∂x)
          const nx = x * FIELD_SCALE;
          const ny = y * FIELD_SCALE;
          const dndx = noise2(nx + CURL_EPS, ny) - noise2(nx - CURL_EPS, ny);
          const dndy = noise2(nx, ny + CURL_EPS) - noise2(nx, ny - CURL_EPS);
          let wx = dndy;
          let wy = -dndx;
          const cl = Math.hypot(wx, wy) || 1;
          const sp = 35 + 40 * hash2(j * 1.31, s * 7.7);
          wx = (wx / cl) * sp * 0.5;
          wy = (wy / cl) * sp * 0.5 - sp * 0.65; // gentle upward drift
          const mix = Math.min(1, dt * 5);
          vx += (wx - vx) * mix;
          vy += (wy - vy) * mix;
          x += vx * dt;
          y += vy * dt;

          v[o] = x;
          v[o + 1] = y;
          v[o + 2] = vx;
          v[o + 3] = vy;

          const speed = Math.hypot(vx, vy);
          ctx.globalAlpha =
            (1 - age / life) * (0.6 + 0.4 * Math.min(1, speed / 500));
          ctx.fillRect(x - 1, y - 1, 2, 2);
          j++;
        }

        if (slot.vc > 0) settled = false;

        if (settled) {
          for (let i = 0; i < slot.gc; i++) {
            const o = i * FLOATS;
            g[o] = g[o + 4];
            g[o + 1] = g[o + 5];
            g[o + 2] = 0;
            g[o + 3] = 0;
          }
          slot.active = false;
        }
      }

      ctx.globalAlpha = 1;
      rafRef.current = anyActive ? requestAnimationFrame(loop) : 0;
    };

    const wake = () => {
      if (!rafRef.current && ctx) {
        lastTimeRef.current = performance.now();
        rafRef.current = requestAnimationFrame(loop);
      }
    };
    wakeRef.current = wake;

    const transition = (s: number, d: number) => {
      const glyphs = glyphsRef.current;
      const cells = cellsRef.current;
      if (!glyphs || !cells[s]) return;

      const slot = slotsRef.current[s];
      const g = slot.g;
      const v = slot.v;

      // Outgoing digit sublimates into vapor pool
      let vc = 0;
      for (let i = 0; i < slot.gc && vc < MAX_GRAINS; i++) {
        const o = i * FLOATS;
        const vo = vc * FLOATS;
        v[vo] = g[o];
        v[vo + 1] = g[o + 1];
        v[vo + 2] = g[o + 2] * 0.35;
        v[vo + 3] = g[o + 3] * 0.35 - 10;
        v[vo + 4] = 0;
        v[vo + 5] = 550 + Math.random() * 250;
        vc++;
      }
      slot.vc = vc;

      // Incoming digit condenses out of departing cloud region
      const homes = glyphs[d];
      if (!homes) return;
      const cell = cells[s];
      const n = homes.length / 2;
      slot.gc = n;

      for (let i = 0; i < n; i++) {
        const o = i * FLOATS;
        const hx = cell.x + homes[i * 2];
        const hy = cell.y + homes[i * 2 + 1];

        if (vc > 0) {
          const src = ((Math.random() * vc) | 0) * FLOATS;
          g[o] = v[src] + (Math.random() - 0.5) * 8;
          g[o + 1] = v[src + 1] + (Math.random() - 0.5) * 8;
          g[o + 2] = (Math.random() - 0.5) * 30;
          g[o + 3] = -15 - Math.random() * 30;
        } else {
          g[o] = hx;
          g[o + 1] = hy;
          g[o + 2] = 0;
          g[o + 3] = 0;
        }
        g[o + 4] = hx;
        g[o + 5] = hy;
      }
      slot.active = true;
    };
    transitionRef.current = transition;

    const init = () => {
      if (!ctx || disposed) return;
      const rootRect = root.getBoundingClientRect();
      const w = Math.round(rootRect.width);
      const h = Math.round(rootRect.height);
      if (w < 2 || h < 2) return;

      cwRef.current = w + PAD_X * 2;
      chRef.current = h + PAD_TOP + PAD_BOTTOM;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = cwRef.current * dpr;
      canvas.height = chRef.current * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      cellsRef.current = digitEls.map((el) => {
        const r = el.getBoundingClientRect();
        return {
          x: r.left - rootRect.left + PAD_X,
          y: r.top - rootRect.top + PAD_TOP,
        };
      });

      // Rasterize glyphs 0-9 using exact computed typography of digit cells
      const cellRect = digitEls[0].getBoundingClientRect();
      const gw = Math.max(2, Math.ceil(cellRect.width));
      const gh = Math.max(2, Math.ceil(cellRect.height));
      const off = document.createElement('canvas');
      off.width = gw;
      off.height = gh;
      const octx = off.getContext('2d', { willReadFrequently: true });
      if (!octx) return;

      const cs = getComputedStyle(digitEls[0]);
      octx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      octx.textAlign = 'center';
      octx.textBaseline = 'middle';
      octx.fillStyle = '#ffffff';

      const newGlyphs: Float32Array[] = [];
      for (let d = 0; d < 10; d++) {
        octx.clearRect(0, 0, gw, gh);
        octx.fillText(String(d), gw / 2, gh / 2);
        const alpha = octx.getImageData(0, 0, gw, gh).data;
        const pts: number[] = [];
        for (let y = 1; y < gh; y += SAMPLE_STRIDE) {
          const row = y * gw;
          for (let x = 1; x < gw; x += SAMPLE_STRIDE) {
            if (alpha[(row + x) * 4 + 3] > 128) {
              pts.push(x, y);
            }
          }
        }
        const total = pts.length / 2;
        const keepEvery = Math.max(1, Math.ceil(total / MAX_GRAINS));
        const homes = new Float32Array(Math.ceil(total / keepEvery) * 2);
        let n = 0;
        for (let i = 0; i < total; i += keepEvery) {
          homes[n * 2] = pts[i * 2];
          homes[n * 2 + 1] = pts[i * 2 + 1];
          n++;
        }
        newGlyphs.push(homes.subarray(0, n * 2));
      }
      glyphsRef.current = newGlyphs;

      // Seat slots on current digits at rest — calm first paint
      const curDigits = digitsRef.current;
      const slots = slotsRef.current;
      for (let s = 0; s < 4; s++) {
        const slot = slots[s];
        const digitVal = Number(curDigits.charAt(s)) || 0;
        const homes = newGlyphs[digitVal];
        const cell = cellsRef.current[s];
        if (!homes || !cell) continue;

        const n = homes.length / 2;
        slot.gc = n;
        slot.vc = 0;
        slot.active = false;

        for (let i = 0; i < n; i++) {
          const o = i * FLOATS;
          const hx = cell.x + homes[i * 2];
          const hy = cell.y + homes[i * 2 + 1];
          slot.g[o] = hx;
          slot.g[o + 1] = hy;
          slot.g[o + 2] = 0;
          slot.g[o + 3] = 0;
          slot.g[o + 4] = hx;
          slot.g[o + 5] = hy;
        }
      }

      setIsCanvasReady(true);
      wake();
    };

    let ro: ResizeObserver | undefined;
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        if (disposed) return;
        init();
        ro = new ResizeObserver(() => {
          if (!disposed) init();
        });
        ro.observe(root);
      });
    } else {
      init();
    }

    // Theme mutation observer: re-derive ink color on light/dark toggle
    const onThemeChange = () => {
      updateGrainColor();
      wake();
    };
    const mo = new MutationObserver(onThemeChange);
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme'],
    });

    const colorScheme = window.matchMedia('(prefers-color-scheme: dark)');
    colorScheme.addEventListener('change', onThemeChange);

    return () => {
      disposed = true;
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
      ro?.disconnect();
      mo.disconnect();
      colorScheme.removeEventListener('change', onThemeChange);
    };
  }, []);

  // 2. Props Change Handler: Wire Pomodoro countdown engine directly to vapor transitions
  useEffect(() => {
    const prev = digitsRef.current;
    const next = targetDigits;
    digitsRef.current = next;

    if (prev !== next && isCanvasReady && !isReducedMotionRef.current) {
      for (let s = 0; s < 4; s++) {
        if (next.charAt(s) !== prev.charAt(s)) {
          transitionRef.current(s, Number(next.charAt(s)));
        }
      }
      wakeRef.current();
    }
  }, [targetDigits, isCanvasReady]);

  return (
    <div
      ref={rootRef}
      className={`relative inline-flex items-center select-none ${className}`}
      role="timer"
      aria-label={`${clampedMin} minutes and ${clampedSec} seconds remaining`}
    >
      {/* Screen-reader and SSR truth: accessible, matches verbatim MM:SS format */}
      <time
        ref={timeRef}
        dateTime={`PT${mm}M${ss}S`}
        className={`relative flex items-center font-bold tracking-tight text-neutral-900 dark:text-zinc-100 font-sans tabular-nums leading-none select-none ${digitClassName}`}
      >
        {/* Contiguous accessible text for screen-readers & SSR testing */}
        <span className="sr-only">{mm + ':' + ss}</span>

        {/* Visual Digit Layout */}
        <span className="flex items-center" aria-hidden="true">
          {/* Minutes */}
          <span className="flex items-center">
            <span
              data-vc-digit
              className={`inline-block w-[0.6em] text-center transition-opacity duration-200 ${
                isCanvasReady ? 'opacity-0 motion-reduce:opacity-100' : 'opacity-100'
              }`}
            >
              {mm[0]}
            </span>
            <span
              data-vc-digit
              className={`inline-block w-[0.6em] text-center transition-opacity duration-200 ${
                isCanvasReady ? 'opacity-0 motion-reduce:opacity-100' : 'opacity-100'
              }`}
            >
              {mm[1]}
            </span>
          </span>

          {/* Mathematically Centered Colon Dots */}
          <span
            className={`inline-flex flex-col items-center justify-center gap-[0.38em] mx-[0.16em] select-none self-center ${
              isRunning ? 'animate-pulse' : ''
            }`}
            aria-hidden="true"
          >
            <span className="w-[0.12em] h-[0.12em] rounded-full bg-stone-400 dark:bg-zinc-500 shrink-0" />
            <span className="w-[0.12em] h-[0.12em] rounded-full bg-stone-400 dark:bg-zinc-500 shrink-0" />
          </span>

          {/* Seconds */}
          <span className="flex items-center">
            <span
              data-vc-digit
              className={`inline-block w-[0.6em] text-center transition-opacity duration-200 ${
                isCanvasReady ? 'opacity-0 motion-reduce:opacity-100' : 'opacity-100'
              }`}
            >
              {ss[0]}
            </span>
            <span
              data-vc-digit
              className={`inline-block w-[0.6em] text-center transition-opacity duration-200 ${
                isCanvasReady ? 'opacity-0 motion-reduce:opacity-100' : 'opacity-100'
              }`}
            >
              {ss[1]}
            </span>
          </span>
        </span>
      </time>

      {/* Canvas 2D Particle Overlay */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute motion-reduce:hidden"
        style={{
          left: -PAD_X,
          top: -PAD_TOP,
          width: `calc(100% + ${PAD_X * 2}px)`,
          height: `calc(100% + ${PAD_TOP + PAD_BOTTOM}px)`,
        }}
      />
    </div>
  );
}
