/**
 * Ink Bleed Alpha Mask Sprite-Sheet Generator
 * Generates a 32-frame horizontal strip (16000x500) with crisp domain-warped ink tendrils and droplets.
 */
const sharp = require('/Users/aryan/Projects/log/node_modules/sharp');
const fs = require('fs');
const path = require('path');

// 2D Simplex Noise implementation
const F2 = 0.5 * (Math.sqrt(3.0) - 1.0);
const G2 = (3.0 - Math.sqrt(3.0)) / 6.0;

const p = new Uint8Array(256);
for (let i = 0; i < 256; i++) p[i] = i;
let seed = 1337;
function rand() {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
}
for (let i = 255; i > 0; i--) {
  const j = Math.floor(rand() * (i + 1));
  const t = p[i]; p[i] = p[j]; p[j] = t;
}
const perm = new Uint8Array(512);
const permMod12 = new Uint8Array(512);
for (let i = 0; i < 512; i++) {
  perm[i] = p[i & 255];
  permMod12[i] = perm[i] % 12;
}

const grad3 = new Float32Array([
  1, 1, -1, 1, 1, -1, -1, -1,
  1, 0, -1, 0, 1, 0, -1, 0,
  0, 1, 0, -1, 0, 1, 0, -1
]);

function snoise2D(xin, yin) {
  let n0 = 0, n1 = 0, n2 = 0;
  const s = (xin + yin) * F2;
  const i = Math.floor(xin + s);
  const j = Math.floor(yin + s);
  const t = (i + j) * G2;
  const X0 = i - t;
  const Y0 = j - t;
  const x0 = xin - X0;
  const y0 = yin - Y0;

  let i1 = 0, j1 = 0;
  if (x0 > y0) { i1 = 1; j1 = 0; } else { i1 = 0; j1 = 1; }

  const x1 = x0 - i1 + G2;
  const y1 = y0 - j1 + G2;
  const x2 = x0 - 1.0 + 2.0 * G2;
  const y2 = y0 - 1.0 + 2.0 * G2;

  const ii = i & 255;
  const jj = j & 255;

  let t0 = 0.5 - x0 * x0 - y0 * y0;
  if (t0 >= 0) {
    const gi0 = permMod12[ii + perm[jj]] * 2;
    t0 *= t0;
    n0 = t0 * t0 * (grad3[gi0] * x0 + grad3[gi0 + 1] * y0);
  }

  let t1 = 0.5 - x1 * x1 - y1 * y1;
  if (t1 >= 0) {
    const gi1 = permMod12[ii + i1 + perm[jj + j1]] * 2;
    t1 *= t1;
    n1 = t1 * t1 * (grad3[gi1] * x1 + grad3[gi1 + 1] * y1);
  }

  let t2 = 0.5 - x2 * x2 - y2 * y2;
  if (t2 >= 0) {
    const gi2 = permMod12[ii + 1 + perm[jj + 1]] * 2;
    t2 *= t2;
    n2 = t2 * t2 * (grad3[gi2] * x2 + grad3[gi2 + 1] * y2);
  }

  return 70.0 * (n0 + n1 + n2);
}

function fbm(x, y, octaves = 4) {
  let total = 0, amp = 0.5, freq = 1;
  for (let i = 0; i < octaves; i++) {
    total += amp * snoise2D(x * freq, y * freq);
    freq *= 2.03;
    amp *= 0.5;
  }
  return total;
}

const NUM_FRAMES = 32;
const FRAME_SIZE = 500;
const TOTAL_WIDTH = NUM_FRAMES * FRAME_SIZE;
const TOTAL_HEIGHT = FRAME_SIZE;

async function generateSpriteSheet() {
  console.log(`Generating ink-bleed sprite sheet: ${NUM_FRAMES} frames of ${FRAME_SIZE}x${FRAME_SIZE} (${TOTAL_WIDTH}x${TOTAL_HEIGHT}px)...`);
  const t0 = Date.now();

  const buffer = Buffer.alloc(TOTAL_WIDTH * TOTAL_HEIGHT * 4);

  for (let k = 0; k < NUM_FRAMES; k++) {
    const u = k / (NUM_FRAMES - 1);
    const eased = 1.0 - Math.pow(1.0 - u, 2.7);
    const isFirst = k === 0;
    const isLast = k === NUM_FRAMES - 1;

    const R = isFirst ? 0.012 : 0.02 + eased * 0.76;
    const cleanup = u > 0.55 ? Math.pow((u - 0.55) / 0.45, 2.2) * 0.35 : 0;

    const frameOffset = k * FRAME_SIZE;

    for (let y = 0; y < FRAME_SIZE; y++) {
      const dy = (y + 0.5) / FRAME_SIZE - 0.5;
      const rowOffset = y * TOTAL_WIDTH * 4;

      for (let x = 0; x < FRAME_SIZE; x++) {
        const dx = (x + 0.5) / FRAME_SIZE - 0.5;
        const r = Math.hypot(dx, dy);

        let alpha = 0;

        if (isLast) {
          // Final frame is 100% full coverage
          alpha = 255;
        } else if (isFirst) {
          // Frame 0 is a tiny pinprick dot at the center
          if (r < R) {
            const edgeVal = (1.0 - r / R) * 2.0;
            alpha = Math.max(0, Math.min(255, Math.round(edgeVal * 255)));
          }
        } else {
          const theta = Math.atan2(dy, dx);
          const cosT = Math.cos(theta);
          const sinT = Math.sin(theta);

          // Anisotropic directional lobes
          const lobes = 0.65 * snoise2D(cosT * 1.8, sinT * 1.8) +
                        0.35 * snoise2D(cosT * 3.6 + 4.2, sinT * 3.6 + 1.7);

          // Domain warped organic body
          const px = dx * 3.2;
          const py = dy * 3.2;
          const wx = fbm(px, py, 3);
          const wy = fbm(px + 5.2, py + 1.3, 3);
          const blob = fbm(px + 1.8 * wx, py + 1.8 * wy, 4);

          const reach = 1.0 + 0.26 * lobes + 0.22 * blob;
          let f = r - R * reach;

          // Tendril filaments
          const tqx = cosT * 2.2 + r * 2.4 + 1.0 * wx;
          const tqy = sinT * 2.2 - r * 1.8 + 1.0 * wy;
          const nTendril = fbm(tqx, tqy, 4);
          const gate = Math.max(0, snoise2D(cosT * 1.5, sinT * 1.5) + 0.25);
          const L = 0.24 * R * gate;
          const ridge = Math.abs(nTendril) * (r * 2.5) - 0.02;
          const ft = Math.max(f - L, ridge);

          // Smooth union into body
          const kBlend = 0.04;
          const hh = Math.max(0, Math.min(1, 0.5 + 0.5 * (ft - f) / kBlend));
          f = (1 - hh) * ft + hh * f - kBlend * hh * (1 - hh);

          f -= cleanup;

          // Splatter droplets ahead of frontier
          let isDroplet = false;
          if (f > 0 && f < 0.055) {
            const sn = snoise2D(dx * 26.0 + 17.0, dy * 26.0 + 43.0);
            const threshold = 0.65 + (f / 0.055) * 0.28;
            if (sn > threshold) {
              isDroplet = true;
            }
          }

          // Corner ink specks near the far corners at the end
          if (u > 0.85 && f > 0 && r > 0.42) {
            const snCorner = snoise2D(dx * 45.0 + 89.0, dy * 45.0 + 103.0);
            if (snCorner > 0.75) {
              isDroplet = true;
            }
          }

          // Crisp 1px antialiased edge
          if (isDroplet) {
            alpha = 255;
          } else {
            const val = (0.5 - f * FRAME_SIZE) * 1.5;
            alpha = Math.max(0, Math.min(255, Math.round(val * 255)));
          }
        }

        const pixelIndex = rowOffset + (frameOffset + x) * 4;
        buffer[pixelIndex] = 255;     // R
        buffer[pixelIndex + 1] = 255; // G
        buffer[pixelIndex + 2] = 255; // B
        buffer[pixelIndex + 3] = alpha; // Alpha
      }
    }
  }

  const imagesDir = path.join('/Users/aryan/Projects/log/public/images');
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }

  const webpPath = path.join(imagesDir, 'ink-mask-spritesheet.webp');
  const pngPath = path.join(imagesDir, 'ink-mask-spritesheet.png');

  console.log('Encoding WebP...');
  await sharp(buffer, { raw: { width: TOTAL_WIDTH, height: TOTAL_HEIGHT, channels: 4 } })
    .webp({ lossless: true, effort: 4 })
    .toFile(webpPath);

  console.log('Encoding PNG...');
  await sharp(buffer, { raw: { width: TOTAL_WIDTH, height: TOTAL_HEIGHT, channels: 4 } })
    .png({ compressionLevel: 8 })
    .toFile(pngPath);

  const webpStat = fs.statSync(webpPath);
  const pngStat = fs.statSync(pngPath);

  console.log(`Generated in ${(Date.now() - t0) / 1000}s:`);
  console.log(`  WebP: ${webpPath} (${Math.round(webpStat.size / 1024)} KB)`);
  console.log(`  PNG:  ${pngPath} (${Math.round(pngStat.size / 1024)} KB)`);
}

generateSpriteSheet().catch(console.error);
