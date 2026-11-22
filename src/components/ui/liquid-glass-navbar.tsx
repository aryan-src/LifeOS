'use client';

/**
 * Nimbus UI - Liquid Glass Navbar ("Waterline")
 * Author: Guglielmo Giannattasio (https://guglielmogiannattasio.it)
 * Origin: https://21st.dev/@gughigug/components/liquid-glass-navbar
 * License: Check licence on 21st.dev component page before publishing.
 */

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

export interface LiquidNavItem {
  label: string;
  icon?: React.ReactNode;
  href?: string;
  fx?: 'pop' | 'plane' | 'drop' | 'spin' | 'glow' | 'wave' | 'none';
}

export type LiquidNavbarItem = LiquidNavItem;

export interface LiquidNavbarProps {
  items?: LiquidNavItem[];
  defaultActive?: number;
  active?: number;
  activeIndex?: number;
  onChange?: (index: number, item: LiquidNavItem) => void;
  tone?: 'light' | 'dark';
  compact?: boolean;
  sound?: boolean;
  className?: string;
  style?: React.CSSProperties;
  ariaLabel?: string;
  ambient?: boolean;
  linkComponent?: React.ComponentType<any> | 'a';
  variant?: 'default' | 'docked';
}

const PADDING = 14;

const NAVBAR_STYLES = `
.nimbus-nav {
  --n-tint: rgb(var(--color-surface) / 0.6);
  --n-fg: #1F5D4A;
  --n-fg-soft: #5F6F63;
  --n-rim: #CBD3BE;
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 6px;
  border-radius: 999px;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  isolation: isolate;
  font-family: inherit;
  -webkit-font-smoothing: antialiased;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}
.nimbus-nav[data-tone="dark"] {
  --n-tint: rgb(var(--color-surface) / 0.6);
  --n-fg: rgb(var(--color-secondary-fixed, 79 219 200));
  --n-fg-soft: rgb(var(--color-on-surface-variant, 187 202 198));
  --n-rim: rgba(255, 255, 255, 0.2);
}
.nimbus-glass {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  z-index: -2;
  overflow: hidden;
  background: var(--n-tint);
  -webkit-backdrop-filter: blur(10px) saturate(1.2) brightness(1.08);
  backdrop-filter: blur(10px) saturate(1.2) brightness(1.08);
  box-shadow: inset 0 1px 1px var(--n-rim), inset 0 0 0 1px rgba(255, 255, 255, 0.2), 0 12px 32px -14px rgba(31, 93, 74, 0.25), 0 2px 6px rgba(31, 93, 74, 0.08);
}
@media (prefers-reduced-transparency: reduce) {
  .nimbus-glass {
    background: rgb(var(--color-surface)) !important;
    -webkit-backdrop-filter: none !important;
    backdrop-filter: none !important;
  }
}
.nimbus-nav[data-refract="on"] .nimbus-glass {
  -webkit-backdrop-filter: url(#nimbus-refract) blur(2px) saturate(1.2) brightness(1.08);
  backdrop-filter: url(#nimbus-refract) blur(2px) saturate(1.2) brightness(1.08);
}
.nimbus-water {
  position: absolute;
  left: -14px;
  top: -14px;
  z-index: -1;
  pointer-events: none;
}
.nimbus-nav[data-gl="off"] .nimbus-water {
  display: none;
}
.nimbus-drop {
  display: none;
  position: absolute;
  top: 6px;
  bottom: 6px;
  left: 0;
  border-radius: 999px;
  z-index: -1;
  pointer-events: none;
  will-change: transform, width;
  background: radial-gradient(120% 140% at 30% 0%, rgba(255, 255, 255, 0.75), rgba(255, 255, 255, 0) 55%), rgba(255, 255, 255, 0.38);
  box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.95), inset 0 -2px 6px rgba(31, 93, 74, 0.2), inset 0 0 0 1px rgba(255, 255, 255, 0.55), 0 6px 16px -6px rgba(31, 93, 74, 0.3);
}
.nimbus-nav[data-gl="off"] .nimbus-drop {
  display: block;
}
.nimbus-nav[data-variant="docked"] {
  padding: 0;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}
.nimbus-nav[data-variant="docked"] .nimbus-glass {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}
@media (prefers-reduced-transparency: reduce) {
  .nimbus-nav[data-variant="docked"] .nimbus-glass {
    background: transparent !important;
  }
}
.nimbus-nav[data-variant="docked"] .nimbus-water {
  display: block;
}
.nimbus-nav[data-variant="docked"] .nimbus-drop {
  display: block !important;
  top: 0;
  bottom: 0;
  border-radius: 999px;
  background: rgba(var(--color-secondary, 0 108 73), 0.14);
  border: 1px solid rgba(var(--color-secondary, 0 108 73), 0.28);
  box-shadow: 0 2px 8px -1px rgba(var(--color-secondary, 0 108 73), 0.18),
              inset 0 1px 1px rgba(255, 255, 255, 0.45);
}
.nimbus-nav[data-variant="docked"][data-tone="dark"] .nimbus-drop {
  background: rgba(var(--color-secondary-fixed, var(--color-secondary, 79 219 200)), 0.18);
  border: 1px solid rgba(var(--color-secondary-fixed, var(--color-secondary, 79 219 200)), 0.35);
  box-shadow: 0 0 12px rgba(var(--color-secondary-fixed, var(--color-secondary, 79 219 200)), 0.25),
              inset 0 1px 1px rgba(255, 255, 255, 0.12);
}
.nimbus-item {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-width: 44px;
  min-height: 44px;
  height: 44px;
  padding: 0 16px;
  border: 0;
  border-radius: 999px;
  background: none;
  color: var(--n-fg-soft);
  font-family: inherit;
  font-weight: 500;
  font-size: 14px;
  line-height: 1;
  letter-spacing: -0.01em;
  text-decoration: none;
  cursor: pointer;
  transition: color 0.25s;
}
.nimbus-item:hover,
.nimbus-item[aria-current="page"] {
  color: var(--n-fg);
}
.nimbus-item:focus-visible {
  outline: 2px solid rgb(var(--color-secondary, 0 108 73));
  outline-offset: 2px;
  border-radius: 999px;
}
.nimbus-nav[data-tone="dark"] .nimbus-item:focus-visible {
  outline-color: rgb(var(--color-secondary-fixed, 79 219 200));
}
.nimbus-tooltip {
  position: absolute;
  bottom: calc(100% + 10px);
  left: 50%;
  transform: translateX(-50%) translateY(4px);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 8px;
  border-radius: 6px;
  font-family: inherit;
  font-size: 11px;
  font-weight: 500;
  line-height: 1;
  letter-spacing: 0.01em;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.15s ease, transform 0.15s ease, visibility 0.15s ease;
  z-index: 60;
  background-color: rgb(var(--color-surface-container-highest, 40 40 40));
  color: rgb(var(--color-on-surface, 240 240 240));
  border: 1px solid rgba(var(--color-outline-variant, 140 147 143), 0.4);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
.nimbus-item:hover .nimbus-tooltip,
.nimbus-item:focus-visible .nimbus-tooltip {
  opacity: 1;
  visibility: visible;
  transform: translateX(-50%) translateY(0);
}
.nv-ico {
  position: relative;
  display: inline-flex;
  flex: none;
}
.nv-ico svg {
  transition: transform 0.45s cubic-bezier(0.3, 1.6, 0.5, 1);
}
.nimbus-item[aria-current="page"] .nv-ico svg {
  transform: translateY(-1px) scale(1.08);
}
.nv-door {
  fill: transparent;
}
.nv-ico[data-fx="pop"] svg {
  animation: nvPop 0.5s cubic-bezier(0.3, 1.6, 0.5, 1) both;
}
@keyframes nvPop {
  0% { transform: scale(0.72); }
  60% { transform: scale(1.2); }
  100% { transform: translateY(-1px) scale(1.08); }
}
.nv-ico[data-fx="plane"] svg {
  animation: nvPlane 1.15s cubic-bezier(0.55, 0, 0.3, 1) both;
}
@keyframes nvPlane {
  0% { transform: none; }
  12% { transform: translate(-3px, 2px) rotate(7deg); }
  42% { transform: translate(64px, -26px) rotate(-24deg) scale(0.9); opacity: 0; }
  43% { transform: translate(-60px, 16px) rotate(-12deg) scale(0.9); opacity: 0; }
  58% { opacity: 1; }
  80% { transform: translate(3px, -1px) rotate(2deg); }
  100% { transform: translateY(-1px) scale(1.08); }
}
.nv-ico[data-fx="plane"]::after {
  content: "";
  position: absolute;
  left: 55%;
  top: 48%;
  height: 2px;
  width: 46px;
  border-radius: 2px;
  transform-origin: 0 50%;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.95));
  animation: nvTrail 1.15s ease-out both;
  pointer-events: none;
}
@keyframes nvTrail {
  0%, 8% { opacity: 0; transform: rotate(-22deg) scaleX(0); }
  30% { opacity: 0.9; transform: rotate(-22deg) scaleX(1); }
  55%, 100% { opacity: 0; transform: rotate(-22deg) translateX(30px) scaleX(0.2); }
}
.nv-ico[data-fx="drop"] svg {
  animation: nvDrop 0.95s cubic-bezier(0.4, 0, 0.3, 1) both;
  transform-origin: 50% 100%;
}
@keyframes nvDrop {
  0% { transform: translateY(-1px); }
  26% { transform: translateY(-13px) scale(0.88, 1.12); }
  46% { transform: translateY(3px) scale(1.3, 0.68); }
  62% { transform: translateY(-3px) scale(0.92, 1.08); }
  80% { transform: translateY(0) scale(1.04, 0.97); }
  100% { transform: translateY(-1px) scale(1.08); }
}
.nv-ico[data-fx="drop"]::before,
.nv-ico[data-fx="drop"]::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 4px;
  height: 4px;
  margin-left: -2px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0;
  pointer-events: none;
}
.nv-ico[data-fx="drop"]::before {
  animation: nvSplashL 0.95s ease-out both;
}
.nv-ico[data-fx="drop"]::after {
  animation: nvSplashR 0.95s ease-out both;
}
@keyframes nvSplashL {
  0%, 44% { opacity: 0; transform: none; }
  50% { opacity: 0.9; transform: translate(-5px, -6px); }
  75%, 100% { opacity: 0; transform: translate(-11px, 1px) scale(0.4); }
}
@keyframes nvSplashR {
  0%, 44% { opacity: 0; transform: none; }
  50% { opacity: 0.9; transform: translate(5px, -7px); }
  75%, 100% { opacity: 0; transform: translate(12px, 1px) scale(0.4); }
}
.nv-ico[data-fx="spin"] svg {
  animation: nvSpin 1s cubic-bezier(0.2, 0.75, 0.25, 1) both;
}
@keyframes nvSpin {
  0% { transform: perspective(80px) rotateY(0); }
  100% { transform: perspective(80px) rotateY(360deg) translateY(-1px) scale(1.08); }
}
.nv-ico[data-fx="glow"] svg {
  animation: nvHop 0.8s cubic-bezier(0.3, 1.4, 0.5, 1) both;
  transform-origin: 50% 100%;
}
@keyframes nvHop {
  0% { transform: none; }
  30% { transform: translateY(-5px) scale(1.04, 0.96); }
  55% { transform: translateY(0) scale(1.12, 0.88); }
  75% { transform: translateY(-2px) scale(0.98, 1.04); }
  100% { transform: translateY(-1px) scale(1.08); }
}
.nv-ico[data-fx="glow"] .nv-door {
  animation: nvDoor 1.3s ease both;
}
@keyframes nvDoor {
  0% { fill: transparent; }
  30% { fill: #FFF3A8; }
  100% { fill: rgba(62, 142, 126, 0.6); }
}
.nv-ico[data-fx="wave"] svg {
  animation: nvWave 0.9s ease-in-out both;
  transform-origin: 50% 92%;
}
@keyframes nvWave {
  0% { transform: none; }
  20% { transform: rotate(-15deg); }
  40% { transform: rotate(12deg); }
  60% { transform: rotate(-8deg); }
  80% { transform: rotate(4deg); }
  100% { transform: translateY(-1px) scale(1.08); }
}
.nimbus-nav[data-compact="true"] .nimbus-item {
  padding: 0;
  width: 44px;
  min-width: 44px;
  height: 44px;
  min-height: 44px;
}
.nimbus-nav[data-compact="true"] .nimbus-label {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
@media (max-width: 520px) {
  .nimbus-nav:not([data-compact="false"]) .nimbus-item {
    padding: 0;
    width: 44px;
    min-width: 44px;
    height: 44px;
    min-height: 44px;
  }
  .nimbus-nav:not([data-compact="false"]) .nimbus-label {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }
}
@media (prefers-reduced-motion: reduce) {
  .nv-ico svg,
  .nv-ico::before,
  .nv-ico::after,
  .nv-door {
    animation: none !important;
    transition: none;
  }
  .nimbus-tooltip {
    transition: none !important;
  }
}
`;

const VERTEX_SHADER = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';

const FRAGMENT_SHADER = `precision highp float;
uniform vec2 uRes;uniform float uDpr;uniform float uTime;uniform vec4 uPill;
uniform vec4 uBlob[6];uniform float uSy[6];uniform vec4 uRip[6];uniform vec3 uMouse;uniform float uDark;uniform float uAmb;
float sdRB(vec2 p,vec2 b,float r){vec2 q=abs(p)-b+r;return length(max(q,0.))+min(max(q.x,q.y),0.)-r;}
float sdCap(vec2 p,vec4 B,float sy){p-=B.xy;p.y/=sy;p.x=max(abs(p.x)-B.z,0.);return(length(p)-B.w)*min(1.,sy);}
float smin(float a,float b,float k){float h=clamp(.5+.5*(b-a)/k,0.,1.);return mix(b,a,h)-k*h*(1.-h);}
float dropD(vec2 p){float d=1e4;for(int i=0;i<6;i++){if(uBlob[i].w>.5){d=smin(d,sdCap(p,uBlob[i],uSy[i]),13.);}}return d;}
float pillD(vec2 p){vec2 h=uPill.zw*.5;return sdRB(p-uPill.xy-h,h,h.y);}
float lens(float d,float w){float t=clamp(-d/w,0.,1.);return sqrt(1.-(1.-t)*(1.-t));}
float waves(vec2 p){float w=0.;
 for(int i=0;i<6;i++){vec4 R=uRip[i];if(R.w>0.){float x=length(p-R.xy)-R.z*240.;w+=R.w*exp(-R.z*1.7)*sin(x*.3)*exp(-x*x/700.);}}
 vec2 m=p-uMouse.xy;w+=uMouse.z*3.6*exp(-dot(m,m)/1000.);
 w+=uAmb*(sin(p.x*.05+uTime*1.2)*.45+sin(p.x*.13-uTime*.85+p.y*.2)*.25);return w;}
float H(vec2 p){float dp=pillD(p);return lens(dp,uPill.w*.36)*2.4+lens(dropD(p),11.)*7.5+waves(p)*smoothstep(0.,7.,-dp);}
float caus(vec2 p,float t){vec2 q=p;float c=0.;for(int i=0;i<3;i++){q+=vec2(sin(q.y*1.1+t),cos(q.x*1.3-t*.7))*.6;c+=1./(1.+16.*abs(sin(q.x)*sin(q.y)));}return c/3.;}
void main(){
 vec2 p=vec2(gl_FragCoord.x,uRes.y*uDpr-gl_FragCoord.y)/uDpr;
 float dp=pillD(p);float dd=dropD(p);
 float h0=H(p);vec3 n=normalize(vec3(h0-H(p+vec2(1.,0.)),h0-H(p+vec2(0.,1.)),1.));
 vec3 V=vec3(0.,0.,1.);
 float spec=pow(max(dot(reflect(-normalize(vec3(-.45,-.8,.85)),n),V),0.),70.);
 float spec2=pow(max(dot(reflect(-normalize(vec3(.6,.75,.7)),n),V),0.),22.)*.3;
 float fres=clamp((1.-n.z)*4.,0.,1.);
 vec3 irid=.5+.5*cos(6.2831*(vec3(0.,.33,.67)+fres*.85+p.x*.0028+uTime*.035));
 float pm=smoothstep(1.,-1.,dp);float dm=smoothstep(1.,-1.,dd)*smoothstep(1.,-2.,dp);
 float sh=smoothstep(9.,-9.,dropD(p-vec2(0.,5.)))*(1.-dm)*pm*(.11+.07*uDark);
 vec3 c=vec3(0.08,0.22,0.18)*sh;float a=sh;
 float pa=clamp(pm*(fres*.5+spec*.9+spec2),0.,1.);
 c=mix(vec3(1.),irid,0.2*fres)*pa+c*(1.-pa);a=pa+a*(1.-pa);
 float th=lens(dd,11.);
 float cs=caus((p+n.xy*th*18.)*.085,uTime*.9);
 vec3 tint=mix(vec3(0.80,0.92,0.86),vec3(0.45,0.75,0.65),uDark);
 float rim=dm*(1.-smoothstep(0.,8.,-dd));
 float cres=dm*smoothstep(.12,.55,dot(n.xy,normalize(vec2(.55,.85))))*smoothstep(0.,3.,-dd);
 float body=.5+.5*clamp(-n.y*3.,-1.,1.);
 float da=dm*(.26+.14*body)*(1.-.35*uDark);vec3 dc=mix(tint,vec3(1.),body*.6);
 float la=rim*.22;vec3 lc=mix(vec3(0.12,0.36,0.29),vec3(0.24,0.55,0.49),uDark);dc=lc*la+dc*da*(1.-la);da=la+da*(1.-la);
 la=clamp(cres*.7+smoothstep(.6,1.,cs)*.28*th*dm,0.,1.);dc=vec3(1.)*la+dc*(1.-la);da=la+da*(1.-la);
 la=clamp(dm*(spec*1.2+spec2*.5),0.,1.);dc=vec3(1.)*la+dc*(1.-la);da=la+da*(1.-la);
 la=dm*smoothstep(-2.,0.,dd)*.4;dc=mix(vec3(1.),irid,0.14)*la+dc*(1.-la);da=la+da*(1.-la);
 c=dc+c*(1.-da);a=da+a*(1.-da);
 gl_FragColor=vec4(c,a);
}`;

interface BlobPoint {
  x: number;
  v: number;
}
interface Satellite {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  k: number;
}
interface Ripple {
  x: number;
  y: number;
  age: number;
  amp: number;
}
interface TargetState {
  x: number;
  cy: number;
  q: number;
  r: number;
}
interface NavState {
  a: BlobPoint;
  b: BlobPoint;
  sy: { s: number; v: number };
  lead: number;
  lagFrom: number;
  sats: Satellite[];
  rips: Ripple[];
  t: TargetState;
  q: number;
  mouse: { x: number; y: number; s: number; on: boolean };
  moving: boolean;
  split: boolean;
  ready: boolean;
  w: number;
  h: number;
  visible: boolean;
  reduce: boolean;
  raf: number;
  last: number;
  time: number;
  glc: { gl: WebGLRenderingContext; u: Record<string, WebGLUniformLocation | null> } | null;
}

function makeState(): NavState {
  return {
    a: { x: 0, v: 0 },
    b: { x: 0, v: 0 },
    sy: { s: 1, v: 0 },
    lead: 0,
    lagFrom: 0,
    sats: [],
    rips: [],
    t: { x: 0, cy: 0, q: 0, r: 21 },
    q: 0,
    mouse: { x: 0, y: 0, s: 0, on: false },
    moving: false,
    split: false,
    ready: false,
    w: 0,
    h: 0,
    visible: true,
    reduce: false,
    raf: 0,
    last: 0,
    time: 0,
    glc: null,
  };
}

function initGL(canvas: HTMLCanvasElement): NavState['glc'] {
  try {
    const gl = canvas.getContext('webgl', {
      premultipliedAlpha: true,
      alpha: true,
      antialias: false,
    });
    if (!gl) return null;

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type);
      if (!s) return null;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
    };

    const vs = compile(gl.VERTEX_SHADER, VERTEX_SHADER);
    const fs = compile(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vs || !fs) return null;

    const prog = gl.createProgram();
    if (!prog) return null;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;

    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW
    );
    const loc = gl.getAttribLocation(prog, 'a');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const u: Record<string, WebGLUniformLocation | null> = {};
    for (const name of [
      'uRes',
      'uDpr',
      'uTime',
      'uPill',
      'uBlob',
      'uSy',
      'uRip',
      'uMouse',
      'uDark',
      'uAmb',
    ]) {
      u[name] = gl.getUniformLocation(prog, name);
    }
    return { gl, u };
  } catch {
    return null;
  }
}

function supportsRefraction(): boolean {
  if (typeof window === 'undefined' || typeof CSS === 'undefined') return false;
  const ua = navigator.userAgent;
  const isChromium =
    (/Chrome\/|Chromium\/|Edg\//.test(ua) && !/Firefox\//.test(ua));
  return Boolean(isChromium && CSS.supports?.('backdrop-filter', 'url(#a)'));
}

export function LiquidNavbar({
  items = [],
  defaultActive = 0,
  active,
  activeIndex: activeIndexProp,
  onChange,
  tone = 'light',
  compact,
  sound = false,
  className,
  style,
  ariaLabel = 'Main',
  ambient = true,
  linkComponent = 'a',
  variant = 'default',
}: LiquidNavbarProps) {
  const [internalActive, setInternalActive] = useState<number>(defaultActive);
  const activeIndex = activeIndexProp ?? active ?? internalActive;

  const navRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fallbackDropRef = useRef<HTMLSpanElement>(null);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);
  const iconRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const stateRef = useRef<NavState>(makeState());

  const [glStatus, setGlStatus] = useState<'on' | 'off'>('on');
  const [refractSupport, setRefractSupport] = useState<boolean>(false);
  const [fxTrigger, setFxTrigger] = useState<{ i: number; n: number }>({ i: -1, n: 0 });

  const isDarkTone = tone === 'dark' ? 1 : 0;
  const toneRef = useRef<number>(isDarkTone);
  toneRef.current = isDarkTone;

  const renderFrame = useCallback(() => {
    const s = stateRef.current;
    const t = s.t;
    const dist = Math.abs(s.a.x - s.b.x);
    const z = Math.min(dist / (2 * (s.q + t.r) || 1), 1);
    const rad = t.r * (1 - 0.3 * z);

    if (s.glc) {
      const { gl, u } = s.glc;
      const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.uniform2f(u.uRes, s.w + PADDING * 2, s.h + PADDING * 2);
      gl.uniform1f(u.uDpr, dpr);
      gl.uniform1f(u.uTime, s.time);
      gl.uniform4f(u.uPill, PADDING, PADDING, s.w, s.h);

      const blobs = new Float32Array(24);
      const syArr = new Float32Array(6).fill(1);
      const leadBlob = s.lead === 0 ? s.a : s.b;
      const trailBlob = s.lead === 0 ? s.b : s.a;

      blobs.set(
        [
          leadBlob.x,
          t.cy,
          s.q * (1 - 0.25 * z),
          t.r * (1 - 0.12 * z),
          trailBlob.x,
          t.cy,
          s.q * (1 - 0.8 * z),
          t.r * (1 - 0.5 * z),
        ],
        0
      );
      syArr[0] = syArr[1] = s.sy.s;

      s.sats.slice(0, 4).forEach((sat, idx) => {
        blobs.set([sat.x, sat.y, 0, sat.r], 8 + idx * 4);
      });
      gl.uniform4fv(u.uBlob, blobs);
      gl.uniform1fv(u.uSy, syArr);

      const rips = new Float32Array(24);
      s.rips.slice(-6).forEach((rip, idx) => {
        rips.set([rip.x, rip.y, rip.age, rip.amp], idx * 4);
      });
      gl.uniform4fv(u.uRip, rips);
      gl.uniform3f(u.uMouse, s.mouse.x, s.mouse.y, s.mouse.s);
      gl.uniform1f(u.uDark, toneRef.current);
      // Set uAmb uniform to 0 when ambient is false or reduced motion is on
      gl.uniform1f(u.uAmb, s.reduce || !ambient ? 0 : 1);

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    if (fallbackDropRef.current) {
      const left = Math.min(s.a.x, s.b.x) - s.q - rad - PADDING;
      const width = dist + 2 * (s.q + rad);
      fallbackDropRef.current.style.width = `${width}px`;
      fallbackDropRef.current.style.transform = `translateX(${left}px) scaleY(${s.sy.s})`;
    }
  }, [ambient, variant]);

  const stepSimulation = useCallback(
    (dt: number, now: number) => {
      const s = stateRef.current;
      const t = s.t;
      s.time += dt;
      s.q += (t.q - s.q) * Math.min(1, dt * 12);

      const pts = [s.a, s.b];
      let settled = true;

      if (s.reduce) {
        s.a.x = s.b.x = t.x;
        s.a.v = s.b.v = 0;
        s.sy.s = 1;
        s.sats = [];
      } else {
        pts.forEach((pt, idx) => {
          const isLead = idx === s.lead;
          const k = isLead ? 210 : 72;
          const damp = isLead ? 25 : 13;
          const lagFactor = !isLead && now < s.lagFrom ? 0.08 : 1;

          pt.v += (k * (t.x - pt.x) - damp * pt.v) * dt * lagFactor;
          pt.x += pt.v * dt;

          const minX = PADDING + 6 + s.q + t.r - 3;
          const maxX = PADDING + s.w - 6 - s.q - t.r + 3;
          if (pt.x < minX || pt.x > maxX) {
            s.sy.v -= Math.min(Math.abs(pt.v), 900) * 0.0016;
            pt.x = Math.max(minX, Math.min(maxX, pt.x));
            pt.v *= -0.25;
          }

          if (Math.abs(t.x - pt.x) > 0.3 || Math.abs(pt.v) > 3) {
            settled = false;
          }
        });

        const leadPt = pts[s.lead];
        const stretchTarget = 1 - 0.2 * Math.min(Math.abs(leadPt.v) / 1500, 1);
        s.sy.v += (280 * (stretchTarget - s.sy.s) - 9 * s.sy.v) * dt;
        s.sy.s += s.sy.v * dt;

        if (Math.abs(s.sy.s - 1) > 0.002 || Math.abs(s.sy.v) > 0.02) {
          settled = false;
        }

        const dist = Math.abs(s.a.x - s.b.x);
        const rad = t.r * (1 - 0.3 * Math.min(dist / (2 * (t.q + t.r) || 1), 1));
        if (!s.split && s.moving && dist - 2 * t.q - 2 * rad > -6) {
          s.split = true;
          const trailPt = pts[1 - s.lead];
          const leadPtNode = pts[s.lead];
          [0.3, 0.5, 0.72].forEach((fraction, satIdx) => {
            s.sats.push({
              x: trailPt.x + (leadPtNode.x - trailPt.x) * fraction + (Math.random() - 0.5) * 6,
              y: t.cy + (Math.random() - 0.5) * 10,
              vx: (trailPt.v + leadPtNode.v) * 0.45,
              vy: (Math.random() - 0.5) * 60,
              r: 5 + Math.random() * 3 - satIdx * 0.5,
              k: 70 + Math.random() * 90,
            });
          });
        }

        s.sats = s.sats.filter((sat) => {
          sat.vx += (sat.k * (t.x - sat.x) - 9 * sat.vx) * dt;
          sat.vy += (90 * (t.cy - sat.y) - 7 * sat.vy) * dt;
          sat.x += sat.vx * dt;
          sat.y += sat.vy * dt;
          sat.x = Math.max(PADDING + 8 + sat.r, Math.min(PADDING + s.w - 8 - sat.r, sat.x));
          sat.y = Math.max(t.cy - t.r + sat.r, Math.min(t.cy + t.r - sat.r, sat.y));
          if (Math.abs(t.x - sat.x) < s.q + t.r * 0.5) {
            sat.r -= dt * 26;
          }
          return sat.r > 0.6;
        });

        if (s.sats.length > 0) {
          settled = false;
        }
      }

      if (s.moving && settled) {
        s.moving = false;
        if (s.split || !s.reduce) {
          s.rips.push({ x: t.x, y: t.cy, age: 0, amp: s.split ? 1.2 : 0.7 });
        }
      }

      s.rips.forEach((r) => {
        r.age += dt;
      });
      s.rips = s.rips.filter((r) => r.age < 2.4);

      const targetMouseStrength = s.mouse.on ? 1 : 0;
      s.mouse.s += (targetMouseStrength - s.mouse.s) * Math.min(1, dt * 7);
    },
    []
  );

  const requestTick = useCallback(() => {
    const s = stateRef.current;
    if (s.raf) return;
    s.last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min((now - s.last) / 1000, 0.03333333333333333);
      s.last = now;
      stepSimulation(dt, now);
      renderFrame();

      // Only run RAF continuously if ambient is enabled and not reduced motion.
      // When ambient is false, stop loop when idle (no continuous requestAnimationFrame).
      const isBusy =
        s.moving || s.rips.length > 0 || s.sats.length > 0 || s.mouse.s > 0.01;
      const shouldAnimate = s.visible && (ambient && !s.reduce ? true : isBusy);

      if (shouldAnimate) {
        s.raf = requestAnimationFrame(tick);
      } else {
        s.raf = 0;
      }
    };

    s.raf = requestAnimationFrame(tick);
  }, [ambient, renderFrame, stepSimulation]);

  const updateTargetPosition = useCallback(() => {
    const navEl = navRef.current;
    const activeItemEl = itemRefs.current[activeIndex];
    if (!navEl || !activeItemEl) return;

    const s = stateRef.current;
    s.w = navEl.offsetWidth;
    s.h = navEl.offsetHeight;

    const t = s.t;
    t.r = activeItemEl.offsetHeight / 2;
    t.q = Math.max(0, activeItemEl.offsetWidth / 2 - t.r);
    t.cy = PADDING + activeItemEl.offsetTop + activeItemEl.offsetHeight / 2;
    const targetX = PADDING + activeItemEl.offsetLeft + activeItemEl.offsetWidth / 2;

    if (s.ready) {
      if (Math.abs(targetX - t.x) > 0.5) {
        s.lead = Math.abs(targetX - s.a.x) <= Math.abs(targetX - s.b.x) ? 0 : 1;
        s.lagFrom = performance.now() + 70;
        s.moving = true;
        s.split = false;
      }
    } else {
      s.a.x = s.b.x = targetX;
      s.q = t.q;
      s.ready = true;
    }
    t.x = targetX;

    const canvas = canvasRef.current;
    if (canvas) {
      const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;
      const totalWidth = s.w + PADDING * 2;
      const totalHeight = s.h + PADDING * 2;
      const targetPxW = Math.round(totalWidth * dpr);
      const targetPxH = Math.round(totalHeight * dpr);

      if (canvas.width !== targetPxW || canvas.height !== targetPxH) {
        canvas.width = targetPxW;
        canvas.height = targetPxH;
        canvas.style.width = `${totalWidth}px`;
        canvas.style.height = `${totalHeight}px`;
      }
    }

    requestTick();
  }, [activeIndex, requestTick]);

  useEffect(() => {
    setRefractSupport(supportsRefraction());
    const s = stateRef.current;
    if (typeof window !== 'undefined' && window.matchMedia) {
      s.reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    const canvas = canvasRef.current;
    s.glc = canvas ? initGL(canvas) : null;
    if (!s.glc) {
      setGlStatus('off');
    }

    const onContextLost = (e: Event) => {
      e.preventDefault();
      s.glc = null;
      setGlStatus('off');
    };
    canvas?.addEventListener('webglcontextlost', onContextLost);

    let observer: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== 'undefined' && navRef.current) {
      observer = new IntersectionObserver(([entry]) => {
        s.visible = entry.isIntersecting;
        if (s.visible) requestTick();
      });
      observer.observe(navRef.current);
    }

    const onVisibilityChange = () => {
      s.visible = typeof document !== 'undefined' && document.visibilityState === 'visible';
      if (s.visible) requestTick();
    };
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisibilityChange);
    }

    return () => {
      canvas?.removeEventListener('webglcontextlost', onContextLost);
      observer?.disconnect();
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVisibilityChange);
      }
      if (s.raf) {
        cancelAnimationFrame(s.raf);
        s.raf = 0;
      }
    };
  }, [requestTick]);

  useLayoutEffect(() => {
    updateTargetPosition();
  }, [updateTargetPosition, items.length, compact]);

  const updateTargetPosRef = useRef(updateTargetPosition);
  updateTargetPosRef.current = updateTargetPosition;

  useEffect(() => {
    let lastWidth = -1;
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && navRef.current) {
      ro = new ResizeObserver(() => {
        const currentWidth = navRef.current?.offsetWidth ?? 0;
        if (currentWidth !== lastWidth) {
          lastWidth = currentWidth;
          stateRef.current.ready = false;
          updateTargetPosRef.current();
        }
      });
      ro.observe(navRef.current);
    }
    return () => {
      ro?.disconnect();
    };
  }, []);

  useEffect(() => {
    requestTick();
  }, [tone, requestTick]);

  const toLocalCoords = (clientX: number, clientY: number) => {
    if (!navRef.current) return { x: 0, y: 0 };
    const rect = navRef.current.getBoundingClientRect();
    return {
      x: clientX - rect.left + PADDING,
      y: clientY - rect.top + PADDING,
    };
  };

  const addRipple = (x: number, y: number, amp: number) => {
    const s = stateRef.current;
    if (!s.reduce) {
      s.rips.push({ x, y, age: 0, amp });
      requestTick();
    }
  };

  const select = (idx: number) => {
    const item = items[idx];
    const fx = item?.fx ?? (item?.icon ? 'pop' : 'none');
    setFxTrigger((prev) => ({ i: idx, n: prev.n + 1 }));

    if (active === undefined) {
      setInternalActive(idx);
    }
    onChange?.(idx, item);

    requestTick();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    // Arrow keys only move focus between items, not select or navigate
    const focused = document.activeElement;
    const currentIdx = itemRefs.current.findIndex((el) => el === focused);
    const startIdx = currentIdx !== -1 ? currentIdx : activeIndex;
    const nextIdx =
      (startIdx + (e.key === 'ArrowRight' ? 1 : -1) + items.length) % items.length;
    itemRefs.current[nextIdx]?.focus();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType !== 'mouse') return;
    const local = toLocalCoords(e.clientX, e.clientY);
    const s = stateRef.current;
    s.mouse.x = local.x;
    s.mouse.y = local.y;
    s.mouse.on = true;
    requestTick();
  };

  const handlePointerLeave = () => {
    stateRef.current.mouse.on = false;
    requestTick();
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLElement>) => {
    const local = toLocalCoords(e.clientX, e.clientY);
    addRipple(local.x, local.y, 0.8);
  };

  return (
    <nav
      ref={navRef}
      className={['nimbus-nav', className].filter(Boolean).join(' ')}
      data-tone={tone}
      data-gl={glStatus}
      data-compact={compact === undefined ? undefined : String(compact)}
      data-refract={refractSupport ? 'on' : 'off'}
      data-variant={variant === 'docked' ? 'docked' : undefined}
      aria-label={ariaLabel}
      onKeyDown={handleKeyDown}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onPointerDown={handlePointerDown}
      style={style}
    >
      <style dangerouslySetInnerHTML={{ __html: NAVBAR_STYLES }} />
      <svg
        width="0"
        height="0"
        style={{ position: 'absolute' }}
        aria-hidden="true"
      >
        <filter
          id="nimbus-refract"
          x="0"
          y="0"
          width="100%"
          height="100%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.006 0.02"
            numOctaves="2"
            seed="7"
            result="noise"
          />
          <feGaussianBlur in="noise" stdDeviation="2" result="soft" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="soft"
            scale="60"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </svg>
      <span className="nimbus-glass" aria-hidden="true" />
      <canvas className="nimbus-water" ref={canvasRef} aria-hidden="true" />
      <span className="nimbus-drop" ref={fallbackDropRef} aria-hidden="true" />

      {items.map((item, index) => {
        const fx = item.fx ?? 'pop';
        const isFxActive = fxTrigger.i === index && fx !== 'none';
        const isPage = index === activeIndex;

        const Component = (item.href ? linkComponent : 'button') as React.ElementType;
        const linkProps = item.href ? { href: item.href } : { type: 'button' as const };

        return (
          <Component
            key={item.label + index}
            {...linkProps}
            ref={(el: HTMLElement | null) => {
              itemRefs.current[index] = el;
            }}
            className="nimbus-item"
            aria-current={isPage ? 'page' : undefined}
            aria-label={item.label}
            onClick={() => select(index)}
          >
            {item.icon && (
              <span
                className="nv-ico"
                data-fx={isFxActive ? fx : undefined}
                ref={(el) => {
                  iconRefs.current[index] = el;
                }}
                key={isFxActive ? fxTrigger.n : 0}
              >
                {item.icon}
              </span>
            )}
            <span className="nimbus-label">{item.label}</span>
            {compact && (
              <span className="nimbus-tooltip" role="tooltip" aria-hidden="true">
                {item.label}
              </span>
            )}
          </Component>
        );
      })}
    </nav>
  );
}

export default LiquidNavbar;
