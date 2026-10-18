import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    return [
      parseInt(clean[0] + clean[0], 16),
      parseInt(clean[1] + clean[1], 16),
      parseInt(clean[2] + clean[2], 16),
    ];
  }
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

function sRgbToLinear(c: number): number {
  const norm = c / 255;
  return norm <= 0.03928 ? norm / 12.92 : Math.pow((norm + 0.055) / 1.055, 2.4);
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * sRgbToLinear(r) + 0.7152 * sRgbToLinear(g) + 0.0722 * sRgbToLinear(b);
}

function contrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function parseTokensBlock(blockContent: string): Record<string, string> {
  const vars: Record<string, string> = {};
  const matches = blockContent.matchAll(/--([a-zA-Z0-9_-]+)\s*:\s*([^;]+);/g);
  for (const m of matches) {
    const key = `--${m[1].trim()}`;
    const val = m[2].trim();
    if (val.startsWith('#')) {
      vars[key] = val;
    }
  }
  return vars;
}

describe('Design Tokens Contrast and Consistency (WCAG AA)', () => {
  const tokensPath = path.resolve(process.cwd(), 'src/styles/tokens.css');

  it('tokens.css file exists', () => {
    expect(fs.existsSync(tokensPath)).toBe(true);
  });

  it('verifies dark mode blocks are identical in token definitions', () => {
    const css = fs.readFileSync(tokensPath, 'utf8');

    // Extract prefers-color-scheme dark block
    const mediaMatch = css.match(/@media\s*\(\s*prefers-color-scheme\s*:\s*dark\s*\)\s*\{([\s\S]*?\}\s*\})/);
    expect(mediaMatch).not.toBeNull();
    const mediaBlock = mediaMatch![1];

    // Extract :root[data-theme="dark"] block
    const explicitDarkMatch = css.match(/:root\[data-theme=["']dark["']\]\s*\{([\s\S]*?)\}/);
    expect(explicitDarkMatch).not.toBeNull();
    const explicitDarkBlock = explicitDarkMatch![1];

    const mediaVars = parseTokensBlock(mediaBlock);
    const explicitVars = parseTokensBlock(explicitDarkBlock);

    expect(Object.keys(mediaVars).sort()).toEqual(Object.keys(explicitVars).sort());
    for (const key of Object.keys(mediaVars)) {
      expect(mediaVars[key].toLowerCase()).toBe(explicitVars[key].toLowerCase());
    }
  });

  it('meets WCAG AA contrast in light theme', () => {
    const css = fs.readFileSync(tokensPath, 'utf8');
    const lightMatch = css.match(/:root\s*,\s*:root\[data-theme=["']light["']\]\s*\{([\s\S]*?)\}/);
    expect(lightMatch).not.toBeNull();
    const vars = parseTokensBlock(lightMatch![1]);

    const backgrounds = [vars['--bg'], vars['--surface'], vars['--surface-2']];
    const texts = [vars['--text'], vars['--text-muted'], vars['--accent-text'], vars['--brass-text']];

    // Text on backgrounds >= 4.5:1
    for (const bg of backgrounds) {
      for (const text of texts) {
        const ratio = contrastRatio(text, bg);
        expect(ratio, `Text ${text} on bg ${bg} must be >= 4.5`).toBeGreaterThanOrEqual(4.5);
      }
    }

    // on-accent on accent >= 4.5:1
    expect(contrastRatio(vars['--on-accent'], vars['--accent'])).toBeGreaterThanOrEqual(4.5);

    // Status badges fg on bg >= 4.5:1
    expect(contrastRatio(vars['--st-todo-fg'], vars['--st-todo-bg'])).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(vars['--st-progress-fg'], vars['--st-progress-bg'])).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(vars['--st-done-fg'], vars['--st-done-bg'])).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(vars['--st-overdue-fg'], vars['--st-overdue-bg'])).toBeGreaterThanOrEqual(4.5);

    // Priority badges fg on surface and surface-2 >= 4.5:1
    const priorityFgs = [vars['--pr-low-fg'], vars['--pr-medium-fg'], vars['--pr-high-fg']];
    for (const prFg of priorityFgs) {
      expect(contrastRatio(prFg, vars['--surface']), `Priority fg ${prFg} on surface must be >= 4.5`).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(prFg, vars['--surface-2']), `Priority fg ${prFg} on surface-2 must be >= 4.5`).toBeGreaterThanOrEqual(4.5);
    }

    // on-accent on accent-hover >= 4.5:1
    expect(contrastRatio(vars['--on-accent'], vars['--accent-hover'])).toBeGreaterThanOrEqual(4.5);

    // text on surface-hover >= 4.5:1
    expect(contrastRatio(vars['--text'], vars['--surface-hover'])).toBeGreaterThanOrEqual(4.5);

    // Charts on surface >= 3:1
    const chartColors = [vars['--chart-todo'], vars['--chart-progress'], vars['--chart-done'], vars['--chart-neutral']];
    for (const c of chartColors) {
      expect(contrastRatio(c, vars['--surface']), `Chart color ${c} on surface must be >= 3`).toBeGreaterThanOrEqual(3.0);
    }

    // Overdue on surface >= 3:1
    expect(contrastRatio(vars['--st-overdue-fg'], vars['--surface'])).toBeGreaterThanOrEqual(3.0);

    // Control border on backgrounds >= 3:1
    for (const bg of backgrounds) {
      expect(contrastRatio(vars['--control-border'], bg), `Control border on ${bg} must be >= 3`).toBeGreaterThanOrEqual(3.0);
    }

    // Focus ring on surface >= 3:1
    expect(contrastRatio(vars['--focus'], vars['--surface'])).toBeGreaterThanOrEqual(3.0);

    // Sidebar & Topbar tokens in light theme
    if (vars['--sidebar-bg']) {
      expect(contrastRatio(vars['--sidebar-text'], vars['--sidebar-bg'])).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(vars['--sidebar-active-text'], vars['--sidebar-active-bg'])).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('meets WCAG AA contrast in dark theme', () => {
    const css = fs.readFileSync(tokensPath, 'utf8');
    const darkMatch = css.match(/:root\[data-theme=["']dark["']\]\s*\{([\s\S]*?)\}/);
    expect(darkMatch).not.toBeNull();
    const vars = parseTokensBlock(darkMatch![1]);

    const backgrounds = [vars['--bg'], vars['--surface'], vars['--surface-2']];
    const texts = [vars['--text'], vars['--text-muted'], vars['--accent-text'], vars['--brass-text']];

    for (const bg of backgrounds) {
      for (const text of texts) {
        const ratio = contrastRatio(text, bg);
        expect(ratio, `Dark text ${text} on bg ${bg} must be >= 4.5`).toBeGreaterThanOrEqual(4.5);
      }
    }

    expect(contrastRatio(vars['--on-accent'], vars['--accent'])).toBeGreaterThanOrEqual(4.5);

    expect(contrastRatio(vars['--st-todo-fg'], vars['--st-todo-bg'])).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(vars['--st-progress-fg'], vars['--st-progress-bg'])).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(vars['--st-done-fg'], vars['--st-done-bg'])).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(vars['--st-overdue-fg'], vars['--st-overdue-bg'])).toBeGreaterThanOrEqual(4.5);

    // Priority badges fg on surface and surface-2 >= 4.5:1
    const priorityFgs = [vars['--pr-low-fg'], vars['--pr-medium-fg'], vars['--pr-high-fg']];
    for (const prFg of priorityFgs) {
      expect(contrastRatio(prFg, vars['--surface']), `Dark priority fg ${prFg} on surface must be >= 4.5`).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(prFg, vars['--surface-2']), `Dark priority fg ${prFg} on surface-2 must be >= 4.5`).toBeGreaterThanOrEqual(4.5);
    }

    // on-accent on accent-hover >= 4.5:1
    expect(contrastRatio(vars['--on-accent'], vars['--accent-hover'])).toBeGreaterThanOrEqual(4.5);

    // text on surface-hover >= 4.5:1
    expect(contrastRatio(vars['--text'], vars['--surface-hover'])).toBeGreaterThanOrEqual(4.5);

    // Charts on surface >= 3:1
    const chartColors = [vars['--chart-todo'], vars['--chart-progress'], vars['--chart-done'], vars['--chart-neutral']];
    for (const c of chartColors) {
      expect(contrastRatio(c, vars['--surface']), `Dark chart color ${c} on surface must be >= 3`).toBeGreaterThanOrEqual(3.0);
    }

    // Overdue on surface >= 3:1
    expect(contrastRatio(vars['--st-overdue-fg'], vars['--surface'])).toBeGreaterThanOrEqual(3.0);

    for (const bg of backgrounds) {
      expect(contrastRatio(vars['--control-border'], bg), `Dark control border on ${bg} must be >= 3`).toBeGreaterThanOrEqual(3.0);
    }

    expect(contrastRatio(vars['--focus'], vars['--surface'])).toBeGreaterThanOrEqual(3.0);

    // Sidebar & Topbar tokens in dark theme
    if (vars['--sidebar-bg']) {
      expect(contrastRatio(vars['--sidebar-text'], vars['--sidebar-bg'])).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(vars['--sidebar-active-text'], vars['--sidebar-active-bg'])).toBeGreaterThanOrEqual(4.5);
    }
  });
});
