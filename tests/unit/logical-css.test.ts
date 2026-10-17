import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

function findCssFiles(dir: string): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);

  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat && stat.isDirectory()) {
      results = results.concat(findCssFiles(fullPath));
    } else if (file.endsWith('.css')) {
      results.push(fullPath);
    }
  }

  return results;
}

describe('Logical CSS Enforcement (No Physical Directional Properties)', () => {
  const srcDir = path.resolve(process.cwd(), 'src');
  const cssFiles = findCssFiles(srcDir);

  const forbiddenPatterns: { pattern: RegExp; description: string }[] = [
    { pattern: /\bmargin-(left|right)\s*:/i, description: 'Use margin-inline-start/end instead of margin-left/right' },
    { pattern: /\bpadding-(left|right)\s*:/i, description: 'Use padding-inline-start/end instead of padding-left/right' },
    { pattern: /\bborder-(left|right)\b/i, description: 'Use border-inline-start/end instead of border-left/right' },
    { pattern: /(?<!-)\b(left|right)\s*:[^;]+;/i, description: 'Use inset-inline-start/end instead of left/right' },
    { pattern: /\btext-align\s*:\s*(left|right)\b/i, description: 'Use text-align: start/end instead of left/right' },
    { pattern: /\bfloat\s*:\s*(left|right)\b/i, description: 'Use float: inline-start/end or flex/grid instead of float: left/right' },
  ];

  it('contains zero forbidden physical CSS properties across all src/**/*.css', () => {
    const violations: string[] = [];

    for (const filePath of cssFiles) {
      const relativePath = path.relative(process.cwd(), filePath);
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        // Skip comment lines
        const trimmed = line.trim();
        if (trimmed.startsWith('/*') || trimmed.startsWith('*') || trimmed.startsWith('//')) {
          return;
        }

        for (const { pattern, description } of forbiddenPatterns) {
          if (pattern.test(line)) {
            violations.push(`${relativePath}:${index + 1} - ${line.trim()} (${description})`);
          }
        }
      });
    }

    if (violations.length > 0) {
      const message = `Found ${violations.length} physical CSS violations:\n` + violations.join('\n');
      expect(violations, message).toEqual([]);
    }
  });
});
