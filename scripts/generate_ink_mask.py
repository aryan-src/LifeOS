#!/usr/bin/env python3
"""
generate_ink_mask.py  (v2)
Generates an ink-bleed alpha mask as a GRID sprite sheet (many small frames)
for a View Transitions theme switch.

Alpha 0 = old theme still visible, alpha 1 = new theme revealed.
Every pixel only ever turns on (never off) so the ink never flickers back.

v2 changes:
  - 48 frames (was 20) so the ink advances smoothly, not in visible steps.
  - Frames are packed in a grid (8 x 6) instead of one long strip, so a
    longer, slower animation still has plenty of frames and a sane texture size.
  - No dead tail: the ink is visibly moving right up to the last frame, so
    the animation duration matches what you see.

Requirements:  pip install numpy pillow

Usage:
  python generate_ink_mask.py                      # -> public/ink-mask.webp
  python generate_ink_mask.py --seed 7 --preview   # also writes a contact sheet

Useful flags:
  --frames 48 --cols 8            (rows are computed; --frames must fit the grid)
  --frame-w 512 --frame-h 288     (sheet side must be <= 16383)
  --origin 0.97 0.04    ink start point, fractions of width/height (top-right)
  --tendrils 1.0  --droplets 1.0  --specks 1.0  --edge 0.004  --ease 1.3
"""
import argparse
import os
import numpy as np
from PIL import Image


# ---------- noise helpers (numpy + Pillow only) ----------

def value_noise(rng, h, w, cells_x):
    """Smooth 0..1 noise: random grid upscaled with bicubic interpolation."""
    cells_y = max(2, int(round(cells_x * h / w)))
    grid = rng.random((cells_y + 3, cells_x + 3)).astype(np.float32)
    img = Image.fromarray(grid, mode="F").resize(
        (w + int(w * 3 / cells_x), h + int(h * 3 / cells_y)), Image.BICUBIC
    )
    arr = np.asarray(img, dtype=np.float32)
    ox = int(w / cells_x)
    oy = int(h / cells_y)
    return np.clip(arr[oy:oy + h, ox:ox + w], 0, 1)


def fbm(rng, h, w, base_cells, octaves=5, gain=0.5):
    total = np.zeros((h, w), np.float32)
    amp, norm, cells = 1.0, 0.0, base_cells
    for _ in range(octaves):
        total += amp * value_noise(rng, h, w, cells)
        norm += amp
        amp *= gain
        cells *= 2
    total /= norm
    lo, hi = np.percentile(total, 2), np.percentile(total, 98)
    return np.clip((total - lo) / (hi - lo + 1e-6), 0, 1)


def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a + 1e-9), 0, 1)
    return t * t * (3 - 2 * t)


def warp(field, dx, dy, strength):
    """Displace a field by two other fields (domain warping)."""
    h, w = field.shape
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    sx = np.clip(xx + (dx - 0.5) * strength * w, 0, w - 1).astype(np.int32)
    sy = np.clip(yy + (dy - 0.5) * strength * h, 0, h - 1).astype(np.int32)
    return field[sy, sx]


# ---------- arrival-time field ----------

def build_arrival_field(w, h, origin, seed, tendrils, droplets, specks):
    """
    T(x,y) = the moment (0..1) the ink reaches that pixel.
    Frame at time t shows alpha = 1 where T <= t, so coverage only grows.
    The main body finishes by T = 0.90; leftover specks fill the last 10%,
    so there is no long invisible tail.
    """
    rng = np.random.default_rng(seed)
    aspect = w / h
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    ox, oy = origin
    d = np.hypot((xx / w - ox) * aspect, yy / h - oy)

    wx = fbm(rng, h, w, 3, 3)
    wy = fbm(rng, h, w, 3, 3)
    big = warp(fbm(rng, h, w, 4, 5), wx, wy, 0.35)
    rid = 1.0 - np.abs(2.0 * fbm(rng, h, w, 7, 4) - 1.0)
    rid = warp(rid, wy, wx, 0.25)

    t_field = d / d.max()
    t_field = t_field + tendrils * (0.26 * (big - 0.5) + 0.10 * (rid - 0.5))

    hf = fbm(rng, h, w, 46, 3)
    blob = smoothstep(0.80, 0.84, hf)
    t_field = t_field - droplets * 0.11 * blob

    # main body: normalise to 0..0.90
    t_field -= t_field.min()
    t_field = t_field / t_field.max() * 0.90

    # specks: far-corner islands reached in the last 10% of the animation
    far = smoothstep(0.55, 0.85, d / d.max())
    isl = smoothstep(0.72, 0.76, fbm(rng, h, w, 22, 3))
    t_field = t_field + specks * 0.10 * isl * far

    return np.clip(t_field, 0, 1).astype(np.float32)


def eased_times(n, power):
    """Ease-out baked into frame times: fast start, gentle finish."""
    x = np.linspace(0.0, 1.0, n)
    return 1.0 - (1.0 - x) ** power


def main():
    ap = argparse.ArgumentParser(description="Generate an ink-bleed mask grid sprite.")
    ap.add_argument("--out", default="public/ink-mask.webp")
    ap.add_argument("--frames", type=int, default=48)
    ap.add_argument("--cols", type=int, default=8)
    ap.add_argument("--frame-w", type=int, default=512)
    ap.add_argument("--frame-h", type=int, default=288)
    ap.add_argument("--origin", type=float, nargs=2, default=[0.97, 0.04],
                    metavar=("X", "Y"))
    ap.add_argument("--seed", type=int, default=11)
    ap.add_argument("--ease", type=float, default=1.3, help="ease-out power")
    ap.add_argument("--tendrils", type=float, default=1.0)
    ap.add_argument("--droplets", type=float, default=1.0)
    ap.add_argument("--specks", type=float, default=1.0)
    ap.add_argument("--edge", type=float, default=0.004)
    ap.add_argument("--preview", action="store_true",
                    help="also write a downscaled preview PNG next to the output")
    a = ap.parse_args()

    rows = -(-a.frames // a.cols)  # ceil
    sheet_w, sheet_h = a.cols * a.frame_w, rows * a.frame_h
    if max(sheet_w, sheet_h) > 16383:
        raise SystemExit(f"Sheet is {sheet_w}x{sheet_h}px; max side is 16383.")

    T = build_arrival_field(a.frame_w, a.frame_h, a.origin, a.seed,
                            a.tendrils, a.droplets, a.specks)
    times = eased_times(a.frames, a.ease)

    sheet = np.zeros((sheet_h, sheet_w, 4), np.uint8)  # black RGB, alpha = mask
    for i, t in enumerate(times):
        if i == 0:
            alpha = np.zeros_like(T)
        elif i == a.frames - 1:
            alpha = np.ones_like(T)
        else:
            alpha = smoothstep(-a.edge, a.edge, t - T)
        c, r = i % a.cols, i // a.cols
        sheet[r * a.frame_h:(r + 1) * a.frame_h,
              c * a.frame_w:(c + 1) * a.frame_w, 3] = (alpha * 255).astype(np.uint8)

    img = Image.fromarray(sheet, "RGBA")
    os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
    if a.out.lower().endswith(".webp"):
        img.save(a.out, "WEBP", lossless=True, quality=100, method=6)
    else:
        img.save(a.out, optimize=True)

    kb = os.path.getsize(a.out) / 1024
    print(f"Wrote {a.out}  ({sheet_w}x{sheet_h}, {a.frames} frames, "
          f"{a.cols} cols x {rows} rows, {kb:.0f} KB)")

    if a.preview:
        prev = os.path.splitext(a.out)[0] + "-preview.png"
        alpha_img = Image.fromarray(sheet[:, :, 3], "L")
        alpha_img.resize((sheet_w // 2, sheet_h // 2)).save(prev)
        print(f"Wrote {prev}  (white = new theme revealed)")

    print(f"\nIn the JS use: COLS = {a.cols}, ROWS = {rows}, N = {a.frames}")
    print(f"CSS mask-size: calc({a.cols} * 100%) calc({rows} * 100%)")


if __name__ == "__main__":
    main()
