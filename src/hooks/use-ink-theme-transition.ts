"use client";

import { useCallback } from "react";
import { flushSync } from "react-dom";

export interface InkTransitionOptions {
  duration?: number;   // ms (default: 750)
  noiseScale?: number; // frequency of ink tendrils (default: 4.5)
  turbulence?: number; // splatter & droplet spread (default: 0.28)
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

export function useInkThemeTransition() {
  const triggerThemeTransition = useCallback(
    (
      event: React.MouseEvent | React.KeyboardEvent | null,
      applyTheme: () => void,
      options: InkTransitionOptions = {}
    ) => {
      const { duration = 750, noiseScale = 4.5, turbulence = 0.28 } = options;

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

      const canvas = document.createElement("canvas");
      canvas.width = 480;
      canvas.height = Math.max(270, Math.round(480 / aspect));

      const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: false });
      if (!gl) {
        doc.startViewTransition(() => flushSync(() => applyTheme()));
        return;
      }

      const compile = (type: number, src: string) => {
        const shader = gl.createShader(type)!;
        gl.shaderSource(shader, src);
        gl.compileShader(shader);
        return shader;
      };

      const program = gl.createProgram()!;
      gl.attachShader(program, compile(gl.VERTEX_SHADER, VERTEX_SHADER));
      gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAGMENT_SHADER));
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

      gl.uniform2f(gl.getUniformLocation(program, "u_origin"), originX, originY);
      gl.uniform1f(gl.getUniformLocation(program, "u_aspect"), aspect);
      gl.uniform1f(gl.getUniformLocation(program, "u_noiseScale"), noiseScale);
      gl.uniform1f(gl.getUniformLocation(program, "u_turbulence"), turbulence);
      gl.uniform1f(gl.getUniformLocation(program, "u_seed"), Math.random() * 100);
      const progressLoc = gl.getUniformLocation(program, "u_progress");

      // Pre-render initial frame (-0.03 progress) so ::view-transition-new is masked from frame 0
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(progressLoc, -0.03);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      document.documentElement.style.setProperty(
        "--ink-mask",
        `url(${canvas.toDataURL("image/png")})`
      );

      let animId: number | null = null;

      const transition = doc.startViewTransition(() => {
        flushSync(() => {
          applyTheme();
        });
      });

      transition.ready
        .then(() => {
          const start = performance.now();

          const renderFrame = (now: number) => {
            const rawT = Math.min((now - start) / duration, 1);
            const eased = easeInOutCubic(rawT);
            // Map [-0.03, 1.05] so frame 0 is completely hidden and frame 1 covers 100%
            const progress = -0.03 + eased * 1.08;

            gl.viewport(0, 0, canvas.width, canvas.height);
            gl.clearColor(0, 0, 0, 0);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.uniform1f(progressLoc, progress);
            gl.drawArrays(gl.TRIANGLES, 0, 6);

            document.documentElement.style.setProperty(
              "--ink-mask",
              `url(${canvas.toDataURL("image/png")})`
            );

            if (rawT < 1) {
              animId = requestAnimationFrame(renderFrame);
            }
          };

          animId = requestAnimationFrame(renderFrame);
        })
        .catch(() => {});

      transition.finished
        .catch(() => {})
        .finally(() => {
          if (animId !== null) {
            cancelAnimationFrame(animId);
          }
          document.documentElement.style.removeProperty("--ink-mask");
          gl.getExtension("WEBGL_lose_context")?.loseContext();
        });
    },
    []
  );

  return { triggerThemeTransition };
}
