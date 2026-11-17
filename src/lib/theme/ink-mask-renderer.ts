/**
 * WebGL 2 Ink Mask Generator for Native View Transitions.
 *
 * Ports the organic liquid-ink mathematics from Codemure:
 * - Domain-warped fractional Brownian motion (FBM)
 * - Direction-dependent anisotropic lobes
 * - Capillary ridged tendril filaments that curl and branch
 * - High-frequency paper-fiber edge grain
 * - Detached satellite droplets / speckles ahead of the advancing front
 *
 * Outputs a pure binary alpha mask (alpha = 1 inside ink, alpha = 0 outside ink)
 * rendered to an optimized 360px canvas and encoded via fast `canvas.toDataURL("image/webp", 0.8)`.
 */

export const NOISE_SIZE = 256;
export const NOISE_CELLS = 32;

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateNoiseChannel(rand: () => number): Float32Array {
  const gx = new Float32Array(NOISE_CELLS * NOISE_CELLS);
  const gy = new Float32Array(NOISE_CELLS * NOISE_CELLS);
  for (let i = 0; i < gx.length; i++) {
    const a = rand() * Math.PI * 2;
    gx[i] = Math.cos(a);
    gy[i] = Math.sin(a);
  }
  const texelsPerCell = NOISE_SIZE / NOISE_CELLS;
  const out = new Float32Array(NOISE_SIZE * NOISE_SIZE);
  const fade = (t: number): number => t * t * t * (t * (t * 6 - 15) + 10);
  const at = (cx: number, cy: number): number =>
    ((cy + NOISE_CELLS) % NOISE_CELLS) * NOISE_CELLS + ((cx + NOISE_CELLS) % NOISE_CELLS);

  for (let y = 0; y < NOISE_SIZE; y++) {
    const py = (y + 0.5) / texelsPerCell;
    const cy = Math.floor(py);
    const fy = py - cy;
    const v = fade(fy);
    for (let x = 0; x < NOISE_SIZE; x++) {
      const px = (x + 0.5) / texelsPerCell;
      const cx = Math.floor(px);
      const fx = px - cx;
      const u = fade(fx);
      const i00 = at(cx, cy);
      const i10 = at(cx + 1, cy);
      const i01 = at(cx, cy + 1);
      const i11 = at(cx + 1, cy + 1);
      const n00 = gx[i00] * fx + gy[i00] * fy;
      const n10 = gx[i10] * (fx - 1) + gy[i10] * fy;
      const n01 = gx[i01] * fx + gy[i01] * (fy - 1);
      const n11 = gx[i11] * (fx - 1) + gy[i11] * (fy - 1);
      const nx0 = n00 + (n10 - n00) * u;
      const nx1 = n01 + (n11 - n01) * u;
      out[y * NOISE_SIZE + x] = nx0 + (nx1 - nx0) * v;
    }
  }
  for (let i = 0; i < out.length; i++) {
    out[i] = Math.max(-1, Math.min(1, out[i] * 1.45));
  }
  return out;
}

function createNoiseTexture(gl: WebGL2RenderingContext): WebGLTexture {
  const rand = mulberry32(0x1b1eed);
  const channels = [
    generateNoiseChannel(rand),
    generateNoiseChannel(rand),
    generateNoiseChannel(rand),
    generateNoiseChannel(rand),
  ];
  const data = new Uint8Array(NOISE_SIZE * NOISE_SIZE * 4);
  for (let i = 0; i < NOISE_SIZE * NOISE_SIZE; i++) {
    for (let c = 0; c < 4; c++) {
      data[i * 4 + c] = Math.round((channels[c][i] * 0.5 + 0.5) * 255);
    }
  }
  const tex = gl.createTexture();
  if (!tex) throw new Error('createTexture failed');
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, NOISE_SIZE, NOISE_SIZE, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
  return tex;
}

const FULLSCREEN_VERT = /* glsl */ `#version 300 es
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}
`;

const INK_MASK_FRAG = /* glsl */ `#version 300 es
precision highp float;
precision highp int;

uniform sampler2D uNoise;
uniform float uCanvasScale;
uniform vec2 uRes;
uniform vec2 uCenter;
uniform float uRadius;
uniform float uCleanup;
uniform float uTime;
uniform float uRef;
uniform vec2 uSeed;
uniform mat2 uSeedRot;
uniform float uTendril;
uniform float uNoiseScale;
uniform float uSoftness;
uniform float uDrift;

out vec4 outColor;

const float INV_CELLS = 1.0 / 32.0;

float gnoise(vec2 p) {
  return textureLod(uNoise, p * INV_CELLS, 0.0).r * 2.0 - 1.0;
}

float gnoise2(vec2 p) {
  return textureLod(uNoise, p * INV_CELLS, 0.0).g * 2.0 - 1.0;
}

const mat2 OCT = mat2(0.8, 0.6, -0.6, 0.8) * 2.03;

float fbm3(vec2 p) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 3; i++) { s += a * gnoise(p); p = OCT * p + 17.13; a *= 0.5; }
  return s / 0.875;
}

float fbm4(vec2 p) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { s += a * gnoise(p); p = OCT * p + 17.13; a *= 0.5; }
  return s / 0.9375;
}

float fbm5(vec2 p) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { s += a * gnoise(p); p = OCT * p + 17.13; a *= 0.5; }
  return s / 0.96875;
}

const float A_LOBE = 0.22;
const float A_BLOB = 0.20;
const float A_SUM = A_LOBE + A_BLOB;
const float TENDRIL_REACH = 0.32;
const float FIBRE_PX = 1.8;
const float SPECK_PX = 18.0;

void main() {
  vec2 devPx = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  vec2 css = devPx / uCanvasScale;
  vec2 rel = css - uCenter;
  float d = length(rel);
  float R = uRadius;
  float cleanup = uCleanup;

  float inner = R * (1.0 - A_SUM) + cleanup - FIBRE_PX - 26.0 - uSoftness * 2.0;
  float outer = R * (1.0 + A_SUM) * (1.0 + TENDRIL_REACH * uTendril) + cleanup + FIBRE_PX + SPECK_PX + uSoftness * 2.0;

  if (d < inner) {
    outColor = vec4(1.0, 1.0, 1.0, 1.0);
    return;
  }
  if (d > outer) {
    outColor = vec4(1.0, 1.0, 1.0, 0.0);
    return;
  }

  float t = uTime * uDrift;
  vec2 p = rel / uRef;
  vec2 dir = uSeedRot * (rel / max(d, 1e-3));
  float ns = uNoiseScale;

  vec2 q = p * (2.4 * ns) + uSeed;
  vec2 w = vec2(
    fbm3(q + vec2(0.0, 0.31 * t)),
    fbm3(q + vec2(5.2, 1.3) - vec2(0.27 * t, 0.0))
  );

  float blob = fbm5(q + 2.3 * w + vec2(0.12 * t, -0.08 * t));
  vec2 lq = dir * 0.9 + uSeed.yx * 0.37 + vec2(0.06 * t);
  float lobes = gnoise(lq) * 0.75 + gnoise(lq * 2.1 + 9.1) * 0.25;
  float reach = clamp(1.0 + A_LOBE * 1.6 * lobes + A_BLOB * 1.5 * blob, 1.0 - A_SUM, 1.0 + A_SUM);
  float f = d - R * reach;

  float gate = smoothstep(-0.35, 0.4, fbm3(dir * 1.6 + uSeed * 0.61 + 3.7));
  vec2 tq = dir * (2.2 * ns) + (d / uRef) * vec2(2.6, -1.9) * ns + 1.2 * w + uSeed * 1.7 + vec2(0.0, 0.18 * t);
  float n = fbm4(tq);
  float ridgePx = abs(n) * max(d, 24.0) / (4.0 * ns);
  float lenN = gnoise(dir * 3.1 + uSeed * 0.43 + vec2(0.1 * t)) * 0.5 + 0.5;
  float L = uTendril * TENDRIL_REACH * R * gate * (0.35 + 0.65 * lenN);
  float along = clamp(f / max(L, 1.0), 0.0, 1.0);
  float width = clamp(R * 0.024, 1.5, 9.5) * (1.0 - along * along) * gate;
  float ft = max(f - L, ridgePx - width);

  float k = 6.0;
  float hh = clamp(0.5 + 0.5 * (ft - f) / k, 0.0, 1.0);
  f = mix(ft, f, hh) - k * hh * (1.0 - hh);

  vec2 fq = css * 0.34 + uSeed * 13.0;
  float fibre = gnoise2(fq) * 0.65 + gnoise2(OCT * fq + 5.3) * 0.35;
  f += fibre * FIBRE_PX;
  f -= cleanup;

  float soft = max(uSoftness, 0.75);
  float inked = 1.0 - smoothstep(-soft, soft, f);
  float cov = inked;

  float ahead = clamp(f / SPECK_PX, 0.0, 1.0);
  if (f > 0.0 && ahead < 1.0) {
    float sn = gnoise2(css * 0.55 + uSeed * 7.0 + 41.0) * 0.5 + 0.5;
    float th = mix(0.80, 0.96, ahead);
    cov = max(cov, smoothstep(th, th + 0.04, sn) * (1.0 - ahead));
  }

  outColor = vec4(1.0, 1.0, 1.0, clamp(cov, 0.0, 1.0));
}
`;

function compileShader(gl: WebGL2RenderingContext, type: GLenum, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('createShader failed');
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS) && !gl.isContextLost()) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader compile error: ${info}`);
  }
  return shader;
}

export function createCubicBezier(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;

  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;

  function sampleCurveX(t: number) {
    return ((ax * t + bx) * t + cx) * t;
  }
  function sampleCurveY(t: number) {
    return ((ay * t + by) * t + cy) * t;
  }
  function sampleCurveDerivativeX(t: number) {
    return (3 * ax * t + 2 * bx) * t + cx;
  }

  return function solve(x: number): number {
    if (x <= 0) return 0;
    if (x >= 1) return 1;

    let t = x;
    for (let i = 0; i < 8; i++) {
      const currentX = sampleCurveX(t) - x;
      if (Math.abs(currentX) < 1e-5) return sampleCurveY(t);
      const d2 = sampleCurveDerivativeX(t);
      if (Math.abs(d2) < 1e-5) break;
      t -= currentX / d2;
    }

    let t0 = 0.0;
    let t1 = 1.0;
    t = x;

    while (t0 < t1) {
      const currentX = sampleCurveX(t);
      if (Math.abs(currentX - x) < 1e-5) return sampleCurveY(t);
      if (x > currentX) t0 = t;
      else t1 = t;
      t = (t1 + t0) * 0.5;
    }

    return sampleCurveY(t);
  };
}

export const easeInk = createCubicBezier(0.22, 1, 0.36, 1);

export interface InkSeed {
  x: number;
  y: number;
  angle: number;
}

export class InkMaskRenderer {
  private static instance: InkMaskRenderer | null = null;

  private canvas: HTMLCanvasElement | null = null;
  private gl: WebGL2RenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private vao: WebGLVertexArrayObject | null = null;
  private noiseTexture: WebGLTexture | null = null;
  private uniformLocations = new Map<string, WebGLUniformLocation | null>();
  private isInitialized = false;

  static getInstance(): InkMaskRenderer {
    if (!InkMaskRenderer.instance) {
      InkMaskRenderer.instance = new InkMaskRenderer();
    }
    return InkMaskRenderer.instance;
  }

  private constructor() {}

  prewarm(): boolean {
    if (
      typeof window === 'undefined' ||
      typeof document === 'undefined' ||
      typeof document.createElement !== 'function'
    ) {
      return false;
    }
    if (this.isInitialized) return true;

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 360;
      canvas.height = 202;

      const gl = canvas.getContext('webgl2', {
        alpha: true,
        antialias: false,
        depth: false,
        stencil: false,
        premultipliedAlpha: false,
        preserveDrawingBuffer: true,
        powerPreference: 'high-performance',
      });

      if (!gl) {
        return false;
      }

      const program = gl.createProgram();
      if (!program) return false;

      const vs = compileShader(gl, gl.VERTEX_SHADER, FULLSCREEN_VERT);
      const fs = compileShader(gl, gl.FRAGMENT_SHADER, INK_MASK_FRAG);
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Shader link failed:', gl.getProgramInfoLog(program));
        return false;
      }

      const vao = gl.createVertexArray();
      if (!vao) return false;

      this.noiseTexture = createNoiseTexture(gl);

      this.canvas = canvas;
      this.gl = gl;
      this.program = program;
      this.vao = vao;
      this.isInitialized = true;
      return true;
    } catch (err) {
      console.warn('Failed to pre-warm ink mask WebGL renderer:', err);
      return false;
    }
  }

  private uniform(name: string): WebGLUniformLocation | null {
    if (!this.gl || !this.program) return null;
    if (!this.uniformLocations.has(name)) {
      this.uniformLocations.set(name, this.gl.getUniformLocation(this.program, name));
    }
    return this.uniformLocations.get(name) ?? null;
  }

  renderMask(
    radius: number,
    cleanup: number,
    timeSeconds: number,
    center: { x: number; y: number },
    seed: InkSeed,
    viewportW: number,
    viewportH: number
  ): string | null {
    if (!this.isInitialized && !this.prewarm()) {
      return null;
    }

    const gl = this.gl;
    const canvas = this.canvas;
    const program = this.program;
    const vao = this.vao;

    if (!gl || !canvas || !program || !vao) return null;

    const targetWidth = 360;
    const aspect = Math.max(0.1, viewportH / Math.max(1, viewportW));
    const targetHeight = Math.max(1, Math.round(targetWidth * aspect));

    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
    }

    const canvasScale = targetWidth / Math.max(1, viewportW);

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(program);
    gl.bindVertexArray(vao);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.noiseTexture);
    gl.uniform1i(this.uniform('uNoise'), 0);

    gl.uniform1f(this.uniform('uCanvasScale'), canvasScale);
    gl.uniform2f(this.uniform('uRes'), canvas.width, canvas.height);
    gl.uniform2f(this.uniform('uCenter'), center.x, center.y);
    gl.uniform1f(this.uniform('uRadius'), radius);
    gl.uniform1f(this.uniform('uCleanup'), cleanup);
    gl.uniform1f(this.uniform('uTime'), timeSeconds);
    gl.uniform1f(this.uniform('uRef'), Math.max(viewportW, viewportH));
    gl.uniform2f(this.uniform('uSeed'), seed.x, seed.y);

    const cos = Math.cos(seed.angle);
    const sin = Math.sin(seed.angle);
    gl.uniformMatrix2fv(this.uniform('uSeedRot'), false, [cos, sin, -sin, cos]);

    gl.uniform1f(this.uniform('uTendril'), 1.15);
    gl.uniform1f(this.uniform('uNoiseScale'), 1.0);
    gl.uniform1f(this.uniform('uSoftness'), 1.4);
    gl.uniform1f(this.uniform('uDrift'), 1.0);

    gl.drawArrays(gl.TRIANGLES, 0, 3);

    try {
      return canvas.toDataURL('image/webp', 0.85);
    } catch {
      return canvas.toDataURL('image/png');
    }
  }
}
