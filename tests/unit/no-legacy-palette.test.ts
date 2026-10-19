import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('No Legacy Palette, Fonts, or Brand Tokens Guard (Task 44)', () => {
  const rootDir = process.cwd();
  const srcDir = path.resolve(rootDir, 'src');
  const designSystemDoc = path.resolve(rootDir, 'docs', 'design-system.md');

  const bannedHexes = ['#0d5c5a', '#13966f', '#22a67f'];
  const bannedTokenNames = ['petrol', 'jade', 'teal'];
  const bannedFonts = ['Inter', 'Newsreader', 'Hanken'];
  const bannedGeist = ['--font-geist'];

  function getAllFiles(dir: string, fileList: string[] = []): string[] {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        getAllFiles(filePath, fileList);
      } else if (
        /\.(ts|tsx|css|js|jsx|json|md)$/.test(file) &&
        !file.endsWith('.test.ts') &&
        !file.endsWith('.test.tsx') &&
        !file.includes('no-legacy-palette')
      ) {
        fileList.push(filePath);
      }
    }
    return fileList;
  }

  const filesToCheck = getAllFiles(srcDir);
  if (fs.existsSync(designSystemDoc)) {
    filesToCheck.push(designSystemDoc);
  }

  it('verifies src/** and docs/design-system.md are completely free of legacy colors (#0d5c5a, #13966F, #22A67F)', () => {
    const violations: { file: string; line: number; hex: string; match: string }[] = [];

    for (const filePath of filesToCheck) {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        const lower = line.toLowerCase();
        for (const hex of bannedHexes) {
          if (lower.includes(hex)) {
            violations.push({
              file: path.relative(rootDir, filePath),
              line: index + 1,
              hex,
              match: line.trim(),
            });
          }
        }
      });
    }

    expect(
      violations,
      `Found legacy hex colors in codebase:\n${JSON.stringify(violations, null, 2)}`
    ).toEqual([]);
  });

  it('verifies src/** and docs/design-system.md have no petrol/jade/teal token references', () => {
    const violations: { file: string; line: number; token: string; match: string }[] = [];

    for (const filePath of filesToCheck) {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        // Match CSS var names or token identifiers
        for (const token of bannedTokenNames) {
          const regex = new RegExp(`(--[a-zA-Z0-9_-]*${token}[a-zA-Z0-9_-]*)|(color-${token})`, 'i');
          if (regex.test(line)) {
            violations.push({
              file: path.relative(rootDir, filePath),
              line: index + 1,
              token,
              match: line.trim(),
            });
          }
        }
      });
    }

    expect(
      violations,
      `Found banned color tokens (petrol/jade/teal) in codebase:\n${JSON.stringify(violations, null, 2)}`
    ).toEqual([]);
  });

  it('verifies src/** and docs/design-system.md do not reference legacy fonts (Inter, Newsreader, Hanken) or --font-geist', () => {
    const violations: { file: string; line: number; font: string; match: string }[] = [];

    for (const filePath of filesToCheck) {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        for (const font of [...bannedFonts, ...bannedGeist]) {
          const fontRegex = font.startsWith('--') ? new RegExp(font) : new RegExp(`\\b${font}\\b`);
          if (fontRegex.test(line)) {
            violations.push({
              file: path.relative(rootDir, filePath),
              line: index + 1,
              font,
              match: line.trim(),
            });
          }
        }
      });
    }

    expect(
      violations,
      `Found banned legacy fonts or geist tokens in codebase:\n${JSON.stringify(violations, null, 2)}`
    ).toEqual([]);
  });
});
