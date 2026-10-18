import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

function getSourceFiles(dir: string, exts: string[]): string[] {
  let results: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(getSourceFiles(fullPath, exts));
    } else if (exts.some((ext) => entry.name.endsWith(ext))) {
      results.push(fullPath);
    }
  }
  return results;
}

describe('CSS & Token Integrity (Task 21)', () => {
  const rootDir = process.cwd();
  const tokensPath = path.join(rootDir, 'src', 'styles', 'tokens.css');
  const tokensContent = fs.readFileSync(tokensPath, 'utf-8');

  // Parse all variables declared in tokens.css
  const declaredTokens = new Set<string>();
  for (const match of tokensContent.matchAll(/--([a-zA-Z0-9_-]+)\s*:/g)) {
    declaredTokens.add(match[1]);
  }

  it('every var(--x) in src/**/*.{css,tsx,ts} must be defined in tokens.css, locally, or be --f-*', () => {
    const srcDir = path.join(rootDir, 'src');
    const files = getSourceFiles(srcDir, ['.css', '.tsx', '.ts']);

    const violations: string[] = [];

    for (const file of files) {
      if (file.endsWith('tokens.css')) continue;

      const relPath = path.relative(rootDir, file).replace(/\\/g, '/');
      const content = fs.readFileSync(file, 'utf-8');

      // Check if file has local custom properties defined
      const localVars = new Set<string>();
      for (const m of content.matchAll(/--([a-zA-Z0-9_-]+)\s*:/g)) {
        localVars.add(m[1]);
      }

      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        // Find all var(--name) calls
        for (const m of line.matchAll(/var\(--([a-zA-Z0-9_-]+)\)/g)) {
          const varName = m[1];
          // Allow next/font variables (--f-*)
          if (varName.startsWith('f-')) continue;

          if (!declaredTokens.has(varName) && !localVars.has(varName)) {
            violations.push(`${relPath}:${idx + 1} uses undefined var(--${varName})`);
          }
        }
      });
    }

    expect(violations, `Found undefined CSS variables:\n${violations.join('\n')}`).toEqual([]);
  });

  it('no solid colors (#hex, rgb, rgba, hsl) outside tokens.css and design-system documentation', () => {
    const srcDir = path.join(rootDir, 'src');
    const files = getSourceFiles(srcDir, ['.css', '.tsx']);

    const violations: string[] = [];
    const colorRegex = /(#[0-9a-fA-F]{3,8}\b|rgba?\([^)]+\)|hsla?\([^)]+\))/g;

    for (const file of files) {
      const relPath = path.relative(rootDir, file).replace(/\\/g, '/');

      // Allowed exceptions: tokens.css, design-system showcase documentation, and layout.tsx viewport themeColor
      if (
        relPath === 'src/styles/tokens.css' ||
        relPath.startsWith('src/app/design-system/') ||
        relPath === 'src/app/layout.tsx'
      ) {
        continue;
      }

      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        // Skip comment lines or URLs
        if (line.trim().startsWith('/*') || line.trim().startsWith('//') || line.includes('http://') || line.includes('https://')) {
          return;
        }

        const matches = line.match(colorRegex);
        if (matches) {
          // Filter out SVG clipPath, ID references or false positives if any
          for (const match of matches) {
            // If it's a hex ID reference like href="#id", ignore
            if (line.includes(`href="${match}"`) || line.includes(`id="${match.slice(1)}"`)) {
              continue;
            }
            violations.push(`${relPath}:${idx + 1} has raw color "${match}"`);
          }
        }
      });
    }

    expect(violations, `Found hardcoded raw colors:\n${violations.join('\n')}`).toEqual([]);
  });

  it('dark theme blocks in tokens.css are completely identical in variable declarations', () => {
    const mediaDarkMatch = tokensContent.match(/@media\s*\(prefers-color-scheme:\s*dark\)\s*\{\s*:root:not\(\[data-theme="light"\]\)\s*\{([^}]+)\}/);
    const dataDarkMatch = tokensContent.match(/:root\[data-theme="dark"\]\s*\{([^}]+)\}/);

    expect(mediaDarkMatch, 'Could not find prefers-color-scheme dark block in tokens.css').not.toBeNull();
    expect(dataDarkMatch, 'Could not find :root[data-theme="dark"] block in tokens.css').not.toBeNull();

    const parseVars = (block: string) => {
      const map: Record<string, string> = {};
      const matches = block.matchAll(/--([a-zA-Z0-9_-]+)\s*:\s*([^;]+);/g);
      for (const m of matches) {
        map[m[1]] = m[2].trim();
      }
      return map;
    };

    const mediaVars = parseVars(mediaDarkMatch![1]);
    const dataVars = parseVars(dataDarkMatch![1]);

    expect(mediaVars).toEqual(dataVars);
  });
});
