import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { en } from '@/i18n/en';
import { ar } from '@/i18n/ar';
import { AppErrorCode } from '@/lib/errors';

const errorCodes: AppErrorCode[] = [
  'validation',
  'permission-denied',
  'not-found',
  'network',
  'unauthenticated',
  'email-in-use',
  'invalid-credentials',
  'weak-password',
  'unknown-user',
  'duplicate-member',
  'too-many-tasks',
  'unknown',
];

function getAllFiles(dir: string, ext: string): string[] {
  const result: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      result.push(...getAllFiles(full, ext));
    } else if (entry.isFile() && entry.name.endsWith(ext)) {
      result.push(full);
    }
  }
  return result;
}

describe('i18n Hygiene (Task 22 Step 1)', () => {
  it('(a) no string in en or ar dictionaries starts with +, ->, <-, or •', () => {
    const forbiddenPrefixes = ['+', '→', '←', '•'];
    const violations: string[] = [];

    for (const [key, val] of Object.entries(en)) {
      if (typeof val === 'string') {
        const trimmed = val.trimStart();
        if (forbiddenPrefixes.some((p) => trimmed.startsWith(p))) {
          violations.push(`en.${key} starts with forbidden symbol: "${val}"`);
        }
      }
    }

    for (const [key, val] of Object.entries(ar)) {
      if (typeof val === 'string') {
        const trimmed = val.trimStart();
        if (forbiddenPrefixes.some((p) => trimmed.startsWith(p))) {
          violations.push(`ar.${key} starts with forbidden symbol: "${val}"`);
        }
      }
    }

    expect(violations, `Dictionary strings must not prefix icons:\n${violations.join('\n')}`).toEqual([]);
  });

  it('(b) every AppErrorCode has an error.<code> key in both en and ar', () => {
    for (const code of errorCodes) {
      const key = `error.${code}` as const;
      expect((en as Record<string, string>)[key], `en missing ${key}`).toBeDefined();
      expect((ar as Record<string, string>)[key], `ar missing ${key}`).toBeDefined();
    }
  });

  it('(c) no literal aria-label, title, or placeholder with 3+ Latin letters in src/**/*.tsx', () => {
    const tsxFiles = getAllFiles(path.resolve(process.cwd(), 'src'), '.tsx');
    const violations: string[] = [];
    const attrRegex = /\b(aria-label|title|placeholder)=["']([^"']+)["']/g;

    for (const file of tsxFiles) {
      const rel = path.relative(process.cwd(), file).replace(/\\/g, '/');
      // Allowed exceptions: design-system documentation showcase
      if (rel.startsWith('src/app/design-system/')) {
        continue;
      }

      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, idx) => {
        // Skip comment lines
        if (line.trim().startsWith('//') || line.trim().startsWith('{/*')) return;

        let match: RegExpExecArray | null;
        while ((match = attrRegex.exec(line)) !== null) {
          const attr = match[1];
          const val = match[2];

          // Allow purely technical strings, App branding like Taskora / TaskFlow, or dates/symbols
          const cleanVal = val.replace(/Taskora|TaskFlow/gi, '').trim();
          const latinMatches = cleanVal.match(/[a-zA-Z]{3,}/);
          if (latinMatches) {
            violations.push(`${rel}:${idx + 1} has literal ${attr}="${val}" with Latin text`);
          }
        }
      });
    }

    expect(violations, `Untranslated literal attributes found:\n${violations.join('\n')}`).toEqual([]);
  });

  it('(d) no usage of .message from AppError or err.message in any src/**/*.tsx', () => {
    const tsxFiles = getAllFiles(path.resolve(process.cwd(), 'src'), '.tsx');
    const violations: string[] = [];

    for (const file of tsxFiles) {
      const rel = path.relative(process.cwd(), file).replace(/\\/g, '/');
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, idx) => {
        if (line.trim().startsWith('//') || line.trim().startsWith('{/*')) return;

        // Catch error.message or err.message or e.message
        if (/\b(err|error|e|appError)\.message\b/.test(line)) {
          violations.push(`${rel}:${idx + 1} accesses .message on error object: ${line.trim()}`);
        }
      });
    }

    expect(violations, `Raw error.message usage in UI:\n${violations.join('\n')}`).toEqual([]);
  });
});
