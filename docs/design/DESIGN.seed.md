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
  on-surface-variant: '#475569'
  inverse-surface: '#0f172a'
  inverse-on-surface: '#f8fafc'
  outline: '#cbd5e1'
  outline-variant: '#e2e8f0'
  primary: '#0d5c5a'
  on-primary: '#ffffff'
  primary-container: '#e6f4f2'
  on-primary-container: '#063837'
  secondary: '#334155'
  on-secondary: '#ffffff'
  secondary-container: '#f1f5f9'
  on-secondary-container: '#1e293b'
  error: '#b91c1c'
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
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  headline-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
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
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
---

# Taskora Seed Design System

## Brand Identity & Feeling
- **Product Name:** Taskora
- **Feeling:** Calm, executive, high-order, uncluttered, and soothing to the eyes. A dense, high-utility operational tool without playful cartoonishness or gamification noise.
- **Bilingual & Bi-directional:** Engineered from day one for symmetric dual-script support: English (LTR) and Arabic (RTL). All layout structures utilize CSS logical properties (`margin-inline`, `padding-inline`, `inset-inline-start`, `text-align: start`).
- **Dual Themes:** Light and Dark modes. Dark mode maintains soothing deep neutral surfaces (`#0f172a`, `#1e293b`) without blinding neon contrasts.

## Foundational Rules
1. **Single Primary Brand Accent:** An authoritative, deep architectural accent (such as deep teal `#0d5c5a` or refined indigo) for primary triggers and focus indicators.
2. **Neutral Functional Surfaces:** Layered neutral planes (pure surface resting upon subtle tinted canvas) to communicate elevation without heavy, dirty drop shadows.
3. **Semantic Status Colors:**
   - `todo`: Neutral slate with circular icon
   - `in_progress`: Focused amber/blue with spinner/progress glyph
   - `done`: Fresh emerald with checkmark icon
   - `overdue`: Controlled crimson/rose with alert warning triangle
   *(Always pair color with semantic label and SVG icon; never rely on color alone).*
4. **Hierarchical Radii:** Micro radii (4px) for controls, inputs, and checkboxes; medium radii (8px-12px) for cards, sheets, and dialogs; full pill for status badges.
5. **Typographic Pairings:** Inter or Alexandria for Latin; Cairo or Alexandria for Arabic.
