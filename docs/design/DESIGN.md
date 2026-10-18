---
name: Taskora Executive Precision
colors:
  surface: '#ffffff'
  surface-dim: '#f8fafc'
  surface-bright: '#ffffff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f8fafc'
  surface-container: '#f1f5f9'
  surface-container-high: '#e2e8f0'
  surface-container-highest: '#cbd5e1'
  on-surface: '#0f172a'
  on-surface-variant: '#334155'
  inverse-surface: '#0b1118'
  inverse-on-surface: '#f8fafc'
  outline: '#cbd5e1'
  outline-variant: '#e2e8f0'
  surface-tint: '#0d5c5a'
  primary: '#0d5c5a'
  on-primary: '#ffffff'
  primary-container: '#e6f4f2'
  on-primary-container: '#063837'
  secondary: '#334155'
  on-secondary: '#ffffff'
  secondary-container: '#f1f5f9'
  on-secondary-container: '#1e293b'
  tertiary: '#0284c7'
  on-tertiary: '#ffffff'
  tertiary-container: '#e0f2fe'
  on-tertiary-container: '#0369a1'
  error: '#dc2626'
  on-error: '#ffffff'
  error-container: '#fee2e2'
  on-error-container: '#7f1d1d'
  background: '#f8fafc'
  on-background: '#0f172a'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.025em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: -0.005em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0.005em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.375rem
  md: 0.5rem
  lg: 0.75rem
  xl: 1rem
  full: 9999px
spacing:
  space-2xs: 0.25rem
  space-xs: 0.5rem
  space-sm: 0.75rem
  space-md: 1rem
  space-base: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
---

# Taskora Design System Specification

## 1. Brand & Aesthetic Principles

Taskora is an executive-grade, high-order collaborative task management workspace built for operators and product leads. The design philosophy embodies **Quiet Luxury** and **Architectural Precision**:
- High spatial density with calm, soothing whitespace intervals.
- Calibrated slate neutrals over harsh pure black or stark eye-straining whites.
- Deep architectural teal (`#0D5C5A`) primary accent communicating stability and intentionality.
- Total bidirectional balance: natively symmetric LTR (English) and RTL (Arabic) interfaces via CSS logical properties.
- **Zero Phantom Features:** No noisy notifications bells, unbacked search bars, or fake growth trends.

---

## 2. Color Palettes & Contrast (WCAG 2.1 AA)

### Light Theme
| Token Name | Hex Value | Semantic Role | Contrast vs Canvas/Surface |
|------------|-----------|---------------|---------------------------|
| `--bg-canvas` | `#f8fafc` | Main application background | 1.05:1 vs Surface |
| `--bg-surface` | `#ffffff` | Primary elevated card/panel surface | Base surface |
| `--bg-subtle` | `#f1f5f9` | Wells, input backgrounds, table headers | 1.15:1 |
| `--color-primary` | `#0d5c5a` | Dominant CTA, active indicators | 7.42:1 vs White (AAA) |
| `--color-primary-hover` | `#063837` | Hovered state for primary button | 11.2:1 vs White |
| `--color-primary-wash` | `#e6f4f2` | Primary badge wash / active tint | 1.12:1 vs White |
| `--border-subtle` | `#e2e8f0` | Dividers, card boundaries | 1.25:1 |
| `--border-interactive` | `#cbd5e1` | Inputs, interactive buttons borders | 1.54:1 |
| `--text-primary` | `#0f172a` | High-contrast headings and numerals | 15.6:1 (AAA) |
| `--text-secondary` | `#334155` | Body labels, navigation text | 9.6:1 (AAA) |
| `--text-muted` | `#64748b` | Captions, metadata, inactive items | 4.8:1 (AA) |

### Dark Theme
| Token Name | Hex Value | Semantic Role | Contrast vs Surface |
|------------|-----------|---------------|---------------------|
| `--bg-canvas` | `#0b1118` | Main dark background canvas | Base |
| `--bg-surface` | `#131f2d` | Elevated dark card and panel surface | 1.15:1 vs Canvas |
| `--bg-subtle` | `#162536` | Subdued wells and headers | 1.25:1 vs Canvas |
| `--color-primary` | `#14b8a6` | High-contrast luminous primary accent | 6.8:1 vs Dark Surface (AA) |
| `--color-primary-hover` | `#2dd4bf` | Active/hover teal accent | 8.9:1 vs Dark Surface |
| `--color-primary-wash` | `rgba(20, 184, 166, 0.15)` | Soft active tint fill | - |
| `--border-subtle` | `#233549` | Subtle dark boundary lines | 1.5:1 |
| `--border-interactive` | `#334b66` | Form input and card interactive borders | 2.1:1 |
| `--text-primary` | `#f8fafc` | Crisp headings and values | 13.8:1 (AAA) |
| `--text-secondary` | `#cbd5e1` | Secondary text and labels | 9.1:1 (AAA) |
| `--text-muted` | `#94a3b8` | Timestamps and secondary metadata | 5.2:1 (AA) |

### Semantic Status Colors (Light / Dark)
- **`todo`**: Slate (`#475569` / `#94a3b8`) + Circle icon
- **`in_progress`**: Blue/Sky (`#0284c7` / `#38bdf8`) + Spinner icon
- **`done`**: Emerald (`#16a34a` / `#4ade80`) + Checkmark icon
- **`overdue`**: Crimson (`#dc2626` / `#f87171`) + Alert icon

---

## 3. Typography & Font Families

- **Latin Family:** Inter (`font-sans`, weights 400, 500, 600)
- **Arabic Family:** Cairo / Alexandria (`font-arabic`, weights 400, 500, 600, 700)
- **Scale:**
  - `Display Lg`: 32px / line-height 40px / letter-spacing -0.025em
  - `Headline Lg`: 24px / line-height 32px / letter-spacing -0.02em
  - `Headline Md`: 20px / line-height 28px / letter-spacing -0.015em
  - `Headline Sm`: 16px / line-height 24px / letter-spacing -0.01em
  - `Body Lg`: 16px / line-height 24px
  - `Body Md`: 14px / line-height 20px
  - `Body Sm`: 13px / line-height 18px
  - `Label Md`: 12px / line-height 16px / font-weight 500
  - `Label Sm`: 11px / line-height 14px / font-weight 600 / uppercase letter-spacing 0.04em

---

## 4. Spacing, Elevation & Corner Radii

- **Spacing Scale:**
  - `space-2xs`: 4px (`0.25rem`)
  - `space-xs`: 8px (`0.5rem`)
  - `space-sm`: 12px (`0.75rem`)
  - `space-md` / `space-base`: 16px (`1rem`)
  - `space-lg`: 24px (`1.5rem`)
  - `space-xl`: 32px (`2rem`)
  - `space-2xl`: 48px (`3rem`)
- **Corner Radii:**
  - `4px` (`rounded-sm`): Checkboxes, badge tags, status dots
  - `6px` (`rounded-md`): Buttons, inputs, select triggers, table rows
  - `8px` (`rounded-lg`): Cards, analytical panels, dialog containers
  - `9999px` (`rounded-full`): Avatars, pill badges, segmented control sliders
- **Elevation Layers:**
  - Flat Level 0: Background canvas
  - Level 1: Cards with hairline 1px border and 1px micro-shadow
  - Level 2: Hovered cards with `box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05)`
  - Level 3: Dropdowns and popovers with `box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.08)`
  - Level 4: Modals with backdrop blur scrim and `box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.12)`

---

## 5. Component Style Specifications

### Buttons
- **Primary:** Solid teal (`--color-primary`), text white, font-weight 500, radius 6px, hover to `--color-primary-hover`. Focus outline: 2px offset ring.
- **Secondary / Outline:** Background white (light) / surface (dark), border `--border-interactive`, text `--text-secondary`.
- **Destructive:** Border and text `--color-error`, subtle red wash on hover.

### Inputs & Form Fields
- Height 38px (desktop) / 44px (touch mobile).
- Border `--border-interactive`, background `--bg-surface`.
- Focus state: border `--color-primary`, subtle teal aura box-shadow.

### Table & List Rows
- Height 44px minimum. Hairline divider `--border-subtle`.
- Hover trigger subtle background shift (`--bg-subtle`).
- Status indicators combine semantic badge pill + distinct SVG icon.
