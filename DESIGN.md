# LifeOS Design System Tokens

## 1. Landing Page Design Tokens (Reference Design)

The landing page uses a light-only, calm, editorial aesthetic inspired by physical paper, tactile organization, and minimal distraction.

### Color Palette (CSS Variables & Hex)

| Token | Variable | Value | Description |
|---|---|---|---|
| Background | `--bg` | `#F2F0E9` | Main page canvas background (warm paper) |
| Surface | `--surface` | `#FCFBF9` | Card and elevated content container background |
| Text (Primary Ink) | `--ink` | `#1B1917` | Headings, primary titles, emphasized text |
| Muted Text (Secondary Ink) | `--ink-2` | `#6B6862` | Body copy, descriptions, captions, labels |
| Border / Divider | `--line` | `rgba(27, 25, 23, 0.1)` | Subtle structural divider lines and card borders |
| Accent Green | `--accent` | `#347659` | Primary brand accent, active tags, step numbers, progress bars |
| Soft Green | `--accent-soft` | `#E1EEE6` | Accent pill backgrounds, active state containers, CTA card bg |
| Amber / Warm | `--warm` | `#CC7C2E` | Streaks, today's spending chart bar highlight |
| Amber Text | `--warm-ink` | `#8F5B0F` | Text color on amber soft badges |
| Soft Amber | `--warm-soft` | `#FBF1D8` | Background for amber streak and status badges |
| Button Background | `--btn` | `#26332B` | Primary button fill |
| Button Hover | `--btn-hover` | `#34443A` | Button hover state fill |
| Button Text | `--btn-ink` | `#FCFBF9` | Button foreground text |
| Floating Nav Background | `--nav` | `rgba(252, 251, 249, 0.72)` | Frosted glass floating navigation pill |

### Typography

- **Primary Font**: `"Outfit"`, `"Poppins"`, system-ui, -apple-system, "Segoe UI", sans-serif.
- **Weights Used**:
  - `400` (Regular): Body copy, descriptions, secondary values.
  - `500` (Medium): Category labels, tags, captions, metadata.
  - `600` (Semi-bold): Headings (H1, H2, H3), buttons, stat numerals, logo.
- **Rule Constraints**:
  - Light theme only.
  - No italics.
  - Max font weight: 600 (never 700+).
  - No background gradients.

### Scale & Hierarchy

- **H1 (Hero Heading)**: 36px / 40px (Mobile), 48px / 48px (Tablet), 60px / 60px (Desktop), letter-spacing `-0.02em`, weight 600.
- **H2 (Section Heading)**: 30px / 36px (Mobile), 36px / 40px (Tablet), 48px / 48px (Desktop), letter-spacing `-0.02em`, weight 600.
- **H3 (Card / Step Heading)**: 24px / 32px, letter-spacing `-0.01em`, weight 600.
- **Tagline Text**: 36px / 40px (Mobile), 48px / 48px (Tablet), 60px / 60px (Desktop), letter-spacing `-0.02em`, weight 600.
- **Lead / Subtitle**: 18px / 28px, color `--ink-2`, weight 400.
- **Body / FAQ / Card Text**: 16px / 24px, color `--ink-2`, weight 400.
- **Small / Meta**: 14px / 20px, color `--ink-2`, weight 400/500.
- **Overline / Label (`.lab`)**: 12px / 16px, letter-spacing `0.06em`, uppercase, weight 500, color `--ink-2`.
- **Large Stat Numerals**: 36px / 40px, weight 600.
- **Step Numerals**: 48px / 48px, weight 600, color `--accent`, letter-spacing `-0.02em`.

### Border Radii

- `4px` (`rounded`): Progress bars, chart columns, status chips.
- `8px` (`rounded-lg`): Buttons, skip link, dashed badges.
- `16px` (`rounded-2xl`): Floating nav pill, board background, preview cards, comparison panes, benefit cards.
- `24px` (`rounded-3xl`): Outer frame border, final CTA banner.
- `50%` (`rounded-full`): Habit tracker 7-day dot indicators.

### Layout Grid & Breakpoints

- **Max Container Width**: 1040px (`max-w-[1040px]`), centered (`mx-auto`).
- **Responsive Grids**:
  - **Phone (<640px / 390px test)**: 1 column for dashboard preview, benefits, steps, comparison panes.
  - **Tablet (640px - 1023px / 768px test)**: 2 columns for dashboard preview, benefits, comparison; 3 columns for steps.
  - **Desktop (>=1024px / 1280px test)**:
    - **Dashboard Preview**: 6-column zigzag grid:
      - Row 1: 2/4 (Pocket money 2 cols, 7 days spending 4 cols)
      - Row 2: 4/2 (Active projects 4 cols, Today's focus 2 cols)
      - Row 3: 2/4 (Habits 2 cols, Recent ideas 4 cols)
    - **Benefits Section**: 6-column zigzag grid:
      - Row 1: 4/2 (Pocket money 4 cols, Tasks 2 cols)
      - Row 2: 2/4 (Habits 2 cols, Projects 4 cols)
      - Row 3: Full width card (Notes 6 cols / span-full)
    - **How It Works**: 3 columns (Steps 1, 2, 3).

### Motion & Transitions

- **Engine**: `framer-motion` (`motion/react`).
- **Allowed Animated Properties**: Only `opacity` and `transform` (`y`, `scale`).
- **Easing Curve**: `cubic-bezier(0.22, 1, 0.36, 1)`.
- **Scroll Reveals**: Initial `opacity: 0, y: 24` or `y: 32`, animating to `opacity: 1, y: 0` when in viewport (`whileInView` or intersection observer).
- **Stagger Delays**: 60ms increments (`transition: { delay: index * 0.06 }`).
- **Tagline Reveal**: Words start at `opacity: 0.2`, progressively transitioning to `opacity: 1` as user scrolls down.
- **Accessibility (`prefers-reduced-motion: reduce`)**:
  - Instant opacity 1, no `translateY` transforms, animations disabled.
  - TaglineReveal displays all words at 100% opacity without scroll staggering.

---

## 2. Core App Design Tokens (Logged-In Application)

The logged-in application uses the Material Design 3 (MD3) stone/sage palette with user-configurable atmosphere themes (Nordic, Risograph, Crimson, Spatial Glass, TUI).

### MD3 Light Stone/Sage Core

- `background`: `#fbfaf0`
- `surface`: `#fbfaf0`
- `surface-container`: `#efeee4`
- `surface-container-high`: `#eae8df`
- `primary`: `#194426` (Sage dark green)
- `primary-container`: `#315c3b`
- `on-primary`: `#ffffff`
- `secondary`: `#5a6059`
- `outline`: `#727970`
- `outline-variant`: `#c1c9bf`
- `error`: `#ba1a1a`

### Fonts

- `--font-sans`: Inter, Geist, Hanken Grotesk
- `--font-mono`: JetBrains Mono
- `--font-serif` / `--font-display`: Fraunces, Newsreader, Georgia
