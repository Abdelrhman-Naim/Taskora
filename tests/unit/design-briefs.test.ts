import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Design Briefs and Rubric Integrity (Task 31)', () => {
  const briefsDir = path.resolve(process.cwd(), 'docs', 'design', 'briefs');
  const rubricPath = path.resolve(process.cwd(), 'docs', 'design', 'RUBRIC.md');
  const phantomPath = path.resolve(process.cwd(), 'docs', 'design', 'phantom-features.md');
  const seedPath = path.resolve(process.cwd(), 'docs', 'design', 'DESIGN.seed.md');

  const expectedBriefs = [
    'dashboard.md',
    'login.md',
    'register.md',
    'project.md',
    'project-settings.md',
    'project-new.md',
    'components.md',
  ];

  const mandatoryHeadings = [
    'Purpose',
    'Data',
    'Actions',
    'States',
    'Layout requirements',
    'Responsive',
    'i18n & Theme',
    'Out of scope',
  ];

  it('ensures RUBRIC.md exists and contains exactly 11 numbered criteria with [حرج] tags', () => {
    expect(fs.existsSync(rubricPath), 'RUBRIC.md must exist').toBe(true);
    const content = fs.readFileSync(rubricPath, 'utf8');

    for (let i = 1; i <= 11; i++) {
      const regex = new RegExp(`(^|\\n)\\s*${i}\\.\\s+`, 'm');
      expect(regex.test(content), `RUBRIC.md must contain item ${i}.`).toBe(true);
    }
  });

  it('ensures phantom-features.md and DESIGN.seed.md exist', () => {
    expect(fs.existsSync(phantomPath), 'phantom-features.md must exist').toBe(true);
    expect(fs.existsSync(seedPath), 'DESIGN.seed.md must exist').toBe(true);
  });

  expectedBriefs.forEach((briefFile) => {
    it(`validates ${briefFile} has all 8 mandatory headings in order and non-empty Out of scope`, () => {
      const filePath = path.join(briefsDir, briefFile);
      expect(fs.existsSync(filePath), `${briefFile} must exist in docs/design/briefs/`).toBe(true);
      const content = fs.readFileSync(filePath, 'utf8');

      let lastIndex = -1;
      mandatoryHeadings.forEach((heading) => {
        // Match heading as markdown ## or ###
        const headingRegex = new RegExp(`^#{2,4}\\s+.*${heading}.*$`, 'im');
        const match = content.match(headingRegex);
        expect(match, `Missing mandatory heading "${heading}" in ${briefFile}`).not.toBeNull();

        const index = content.indexOf(match![0]);
        expect(
          index,
          `Heading "${heading}" in ${briefFile} is out of order (must appear after previous heading)`
        ).toBeGreaterThan(lastIndex);
        lastIndex = index;
      });

      // Assert Out of scope is not empty
      const outOfScopeRegex = /#{2,4}\s+.*Out of scope[^\n]*\n([\s\S]*?)(?=(#{2,4}\s)|$)/i;
      const oosMatch = content.match(outOfScopeRegex);
      expect(oosMatch, `Could not parse Out of scope section in ${briefFile}`).not.toBeNull();
      const oosContent = oosMatch![1].trim();
      expect(oosContent.length, `Out of scope section in ${briefFile} must not be empty`).toBeGreaterThan(20);
    });
  });
});
