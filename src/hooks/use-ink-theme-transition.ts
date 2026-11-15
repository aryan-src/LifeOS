"use client";

import { useCallback } from "react";
import { flushSync } from "react-dom";

export interface InkTransitionOptions {
  duration?: number;   // ms (default: 1500)
  noiseScale?: number; // frequency of ink tendrils (default: 4.5)
  turbulence?: number; // splatter & droplet spread (default: 0.28)
  targetTheme?: string;
  ignoreReducedMotion?: boolean;
}

const VERTEX_SHADER = `
  attribute vec2 a_position;
  varying vec2 v_uv;
  void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  precision highp float;
  varying vec2 v_uv;

  uniform vec2 u_origin;
  uniform float u_aspect;
  uniform float u_progress;
  uniform float u_noiseScale;
  uniform float u_turbulence;
  uniform float u_seed;

  // 2D Simplex Noise
  vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                       -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                     + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy),
                            dot(x12.zw, x12.zw)), 0.0);
    m = m * m;
    m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  // 4-Octave Fractal Brownian Motion
  float fbm(vec2 p) {
    float value = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 4; i++) {
      value += amp * (snoise(p) * 0.5 + 0.5);
      p *= 2.05;
      amp *= 0.5;
    }
    return value;
  }

  void main() {
    vec2 uv = vec2(v_uv.x, 1.0 - v_uv.y);
    vec2 delta = (uv - u_origin) * vec2(u_aspect, 1.0);

    // Normalize distance against the farthest screen corner from click origin
    float d0 = length((vec2(0.0, 0.0) - u_origin) * vec2(u_aspect, 1.0));
    float d1 = length((vec2(1.0, 0.0) - u_origin) * vec2(u_aspect, 1.0));
    float d2 = length((vec2(0.0, 1.0) - u_origin) * vec2(u_aspect, 1.0));
    float d3 = length((vec2(1.0, 1.0) - u_origin) * vec2(u_aspect, 1.0));
    float maxDist = max(max(d0, d1), max(d2, d3));
    maxDist = max(maxDist, 0.0001);

    float dist = length(delta) / maxDist;

    // Domain-warped fBm for organic tendrils & detached ink droplets
    vec2 p = uv * vec2(u_aspect, 1.0) * u_noiseScale + vec2(u_seed);
    float warp = fbm(p);
    float noise = fbm(p + warp * 0.65);

    float edge = dist - u_progress * (1.0 + u_turbulence) + (noise * u_turbulence);
    float alpha = 1.0 - smoothstep(-0.008, 0.008, edge);

    gl_FragColor = vec4(1.0, 1.0, 1.0, alpha);
  }
`;

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function getCanvasDataUrl(canvas: HTMLCanvasElement): string {
  try {
    const url = canvas.toDataURL("image/webp", 0.92);
    if (url.startsWith("data:image/webp")) return url;
  } catch {}
  return canvas.toDataURL("image/png");
}

let cachedGlContext: {
  canvas: HTMLCanvasElement;
  gl: WebGLRenderingContext;
  program: WebGLProgram;
  progressLoc: WebGLUniformLocation;
  originLoc: WebGLUniformLocation;
  aspectLoc: WebGLUniformLocation;
  noiseScaleLoc: WebGLUniformLocation;
  turbulenceLoc: WebGLUniformLocation;
  seedLoc: WebGLUniformLocation;
} | null = null;

function getOrCreateGl(): typeof cachedGlContext {
  if (typeof window === "undefined" || typeof document === "undefined") return null;
  if (cachedGlContext && !cachedGlContext.gl.isContextLost()) {
    return cachedGlContext;
  }

  try {
    const canvas = document.createElement("canvas");
    canvas.width = 960;
    canvas.height = 540;

    const gl = canvas.getContext("webgl", {
      alpha: true,
      premultipliedAlpha: false,
      preserveDrawingBuffer: true,
    });
    if (!gl) return null;

    const compile = (type: number, src: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, src);
      gl.compileShader(shader);
      return shader;
    };

    const vert = compile(gl.VERTEX_SHADER, VERTEX_SHADER);
    const frag = compile(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vert || !frag) return null;

    const program = gl.createProgram();
    if (!program) return null;
    gl.attachShader(program, vert);
    gl.attachShader(program, frag);
    gl.linkProgram(program);
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const posLoc = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const progressLoc = gl.getUniformLocation(program, "u_progress")!;
    const originLoc = gl.getUniformLocation(program, "u_origin")!;
    const aspectLoc = gl.getUniformLocation(program, "u_aspect")!;
    const noiseScaleLoc = gl.getUniformLocation(program, "u_noiseScale")!;
    const turbulenceLoc = gl.getUniformLocation(program, "u_turbulence")!;
    const seedLoc = gl.getUniformLocation(program, "u_seed")!;

    cachedGlContext = {
      canvas,
      gl,
      program,
      progressLoc,
      originLoc,
      aspectLoc,
      noiseScaleLoc,
      turbulenceLoc,
      seedLoc,
    };
    return cachedGlContext;
  } catch {
    return null;
  }
}

/**
 * Ink Bleed Theme Transition Hook
 * Uses native Document View Transitions API with real-time Simplex fBm WebGL mask
 * for an organic, tendril-spreading theme wipe with zero blank screens and crisp text.
 */
export function useInkThemeTransition() {
  const triggerThemeTransition = useCallback(
    (
      event: React.MouseEvent | React.KeyboardEvent | null,
      applyTheme: () => void,
      options: InkTransitionOptions = {}
    ) => {
      const {
        duration = 1500,
        noiseScale = 4.5,
        turbulence = 0.28,
        ignoreReducedMotion = false,
      } = options;

      const prefersReducedMotion =
        !ignoreReducedMotion &&
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

      // Freeze all element CSS transitions to snapshot 100% crisp text
      document.documentElement.setAttribute("data-theme-transitioning", "true");

      // Resolve origin coordinates (click point or viewport center)
      let clientX = window.innerWidth / 2;
      let clientY = window.innerHeight / 2;
      if (
        event &&
        "clientX" in event &&
        typeof (event as React.MouseEvent).clientX === "number" &&
        (event as React.MouseEvent).clientX > 0
      ) {
        clientX = (event as React.MouseEvent).clientX;
        clientY = (event as React.MouseEvent).clientY;
      }

      const originX = clientX / window.innerWidth;
      const originY = clientY / window.innerHeight;
      const aspect = window.innerWidth / window.innerHeight;

      const glContext = getOrCreateGl();

      // If WebGL is not available, fallback to hardware-accelerated circular clip-path transition
      if (!glContext) {
        const d0 = Math.hypot(clientX, clientY);
        const d1 = Math.hypot(window.innerWidth - clientX, clientY);
        const d2 = Math.hypot(clientX, window.innerHeight - clientY);
        const d3 = Math.hypot(window.innerWidth - clientX, window.innerHeight - clientY);
        const endRadius = Math.max(d0, d1, d2, d3) + 60;

        const transition = doc.startViewTransition(() => {
          if (options.targetTheme) {
            const isTargetDark =
              options.targetTheme.includes("dark") ||
              options.targetTheme === "tui" ||
              options.targetTheme === "spatial-glass";
            document.documentElement.classList.toggle("dark", isTargetDark);
            document.documentElement.setAttribute("data-theme", options.targetTheme);
          } else {
            const isCurrentDark = document.documentElement.classList.contains("dark");
            const nextIsDark = !isCurrentDark;
            document.documentElement.classList.toggle("dark", nextIsDark);
            const nextTheme = nextIsDark ? "crimson-dark" : "nordic";
            document.documentElement.setAttribute("data-theme", nextTheme);
          }
          flushSync(() => {
            applyTheme();
          });
        });

        transition.ready.then(() => {
          if (typeof document.documentElement.animate === "function") {
            document.documentElement.animate(
              {
                clipPath: [
                  `circle(0px at ${clientX}px ${clientY}px)`,
                  `circle(${endRadius}px at ${clientX}px ${clientY}px)`,
                ],
              },
              {
                duration,
                easing: "cubic-bezier(0.4, 0, 0.2, 1)",
                pseudoElement: "::view-transition-new(root)",
              }
            );
          }
        });

        transition.finished.finally(() => {
          document.documentElement.removeAttribute("data-theme-transitioning");
        });
        return;
      }

      const {
        canvas,
        gl,
        program,
        progressLoc,
        originLoc,
        aspectLoc,
        noiseScaleLoc,
        turbulenceLoc,
        seedLoc,
      } = glContext;

      // Adjust canvas resolution dynamically to match aspect ratio up to 1280px wide
      const targetWidth = Math.min(window.innerWidth || 960, 1280);
      const targetHeight = Math.max(360, Math.round(targetWidth / aspect));
      if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
      }

      gl.useProgram(program);
      gl.uniform2f(originLoc, originX, originY);
      gl.uniform1f(aspectLoc, aspect);
      gl.uniform1f(noiseScaleLoc, noiseScale);
      gl.uniform1f(turbulenceLoc, turbulence);
      gl.uniform1f(seedLoc, Math.random() * 100);

      // Set hold duration so the pseudo-elements stay active for the whole animation
      document.documentElement.style.setProperty("--ink-duration", `${duration}ms`);

      // Pre-render initial frame (-0.03 progress) so ::view-transition-new is masked from frame 0
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(progressLoc, -0.03);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      const initialMaskUrl = `url(${getCanvasDataUrl(canvas)})`;
      document.documentElement.style.setProperty("--ink-mask", initialMaskUrl);

      let styleEl = document.getElementById("ink-transition-runtime-style") as HTMLStyleElement | null;
      if (!styleEl) {
        styleEl = document.createElement("style");
        styleEl.id = "ink-transition-runtime-style";
        document.head.appendChild(styleEl);
      }
      styleEl.textContent = `
        ::view-transition-new(root) {
          mask-image: ${initialMaskUrl} !important;
          -webkit-mask-image: ${initialMaskUrl} !important;
          mask-size: 100% 100% !important;
          -webkit-mask-size: 100% 100% !important;
        }
      `;

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
        document.documentElement.style.removeProperty("--ink-mask");
        document.documentElement.style.removeProperty("--ink-duration");
        const el = document.getElementById("ink-transition-runtime-style");
        if (el) el.remove();
      };

      const transition = doc.startViewTransition(() => {
        if (options.targetTheme) {
          const isTargetDark =
            options.targetTheme.includes("dark") ||
            options.targetTheme === "tui" ||
            options.targetTheme === "spatial-glass";
          document.documentElement.classList.toggle("dark", isTargetDark);
          document.documentElement.setAttribute("data-theme", options.targetTheme);
        } else {
          const isCurrentDark = document.documentElement.classList.contains("dark");
          const nextIsDark = !isCurrentDark;
          document.documentElement.classList.toggle("dark", nextIsDark);
          const nextTheme = nextIsDark ? "crimson-dark" : "nordic";
          document.documentElement.setAttribute("data-theme", nextTheme);
        }

        flushSync(() => {
          applyTheme();
        });
      });

      transition.ready
        .then(() => {
          const start = performance.now();

          const renderFrame = (now: number) => {
            if (isCleanedUp) return;

            const elapsed = now - start;
            const rawT = Math.min(elapsed / duration, 1);
            const eased = easeInOutCubic(rawT);
            const progress = -0.03 + eased * 1.08;

            gl.viewport(0, 0, canvas.width, canvas.height);
            gl.clearColor(0, 0, 0, 0);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.uniform1f(progressLoc, progress);
            gl.drawArrays(gl.TRIANGLES, 0, 6);

            const frameUrl = `url(${getCanvasDataUrl(canvas)})`;
            document.documentElement.style.setProperty("--ink-mask", frameUrl);

            const el = document.getElementById("ink-transition-runtime-style");
            if (el) {
              el.textContent = `
                ::view-transition-new(root) {
                  mask-image: ${frameUrl} !important;
                  -webkit-mask-image: ${frameUrl} !important;
                  mask-size: 100% 100% !important;
                  -webkit-mask-size: 100% 100% !important;
                }
              `;
            }

            if (rawT < 1) {
              animId = requestAnimationFrame(renderFrame);
            } else {
              cleanup();
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
