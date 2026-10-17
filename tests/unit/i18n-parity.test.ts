import { describe, it, expect } from 'vitest';
import { en } from '@/i18n/en';
import { ar } from '@/i18n/ar';

describe('i18n Parity and Consistency between English and Arabic', () => {
  it('has identical message keys in en and ar', () => {
    const enKeys = Object.keys(en).sort();
    const arKeys = Object.keys(ar).sort();
    expect(arKeys).toEqual(enKeys);
  });

  it('has no empty string values in either dictionary', () => {
    for (const [key, val] of Object.entries(en)) {
      expect(val.trim().length, `en key ${key} should not be empty`).toBeGreaterThan(0);
    }
    for (const [key, val] of Object.entries(ar)) {
      expect(val.trim().length, `ar key ${key} should not be empty`).toBeGreaterThan(0);
    }
  });

  it('has matching placeholder tokens {param} between en and ar', () => {
    const getPlaceholders = (str: string): string[] => {
      const matches = str.match(/\{([a-zA-Z0-9_-]+)\}/g) || [];
      return matches.map((m) => m.slice(1, -1)).sort();
    };

    for (const key of Object.keys(en) as (keyof typeof en)[]) {
      const enPlaceholders = getPlaceholders(en[key]);
      const arPlaceholders = getPlaceholders(ar[key]);
      expect(
        arPlaceholders,
        `Placeholder mismatch for key "${key}": en=${enPlaceholders}, ar=${arPlaceholders}`
      ).toEqual(enPlaceholders);
    }
  });

  it('covers all Arabic plural forms for plural keys', () => {
    // Collect all base plural keys from keys ending in .one or .other
    const pluralBases = new Set<string>();
    for (const key of Object.keys(en)) {
      const match = key.match(/^(.*)\.(zero|one|two|few|many|other)$/);
      if (match) {
        pluralBases.add(match[1]);
      }
    }

    const requiredArabicForms = ['zero', 'one', 'two', 'few', 'many', 'other'];
    for (const base of pluralBases) {
      for (const form of requiredArabicForms) {
        const fullKey = `${base}.${form}` as keyof typeof ar;
        expect(ar[fullKey], `ar should define plural form "${fullKey}"`).toBeDefined();
        expect(ar[fullKey].trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('contains no untranslated Latin sequences in Arabic values outside allowlist', () => {
    const allowlisted = ['Taskora', 'TaskFlow', 'Firebase', 'Zod', 'UTC', 'GMT'];

    for (const [key, val] of Object.entries(ar)) {
      // Strip placeholders like {count}, {name}
      const stripped = val.replace(/\{[a-zA-Z0-9_-]+\}/g, '');

      // Find any sequences of 3 or more Latin letters
      const latinMatches = stripped.match(/[a-zA-Z]{3,}/g) || [];
      for (const word of latinMatches) {
        const isAllowed = allowlisted.some((allowed) => word.toLowerCase() === allowed.toLowerCase());
        expect(
          isAllowed,
          `Key "${key}" contains unexpected Latin word "${word}" in Arabic text: "${val}"`
        ).toBe(true);
      }
    }
  });
});
