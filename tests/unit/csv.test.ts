import { describe, it, expect } from 'vitest';
import { escapeCsvCell, csvFilename, tasksToCsv } from '@/lib/csv';
import { Task, Project } from '@/types';
import { en, MessageKey } from '@/i18n/en';
import { ar } from '@/i18n/ar';

describe('CSV export utility (Task 61)', () => {
  describe('escapeCsvCell', () => {
    it('escapes cells containing commas by wrapping in double quotes', () => {
      expect(escapeCsvCell('a,b')).toBe('"a,b"');
    });

    it('escapes double quotes by doubling them', () => {
      expect(escapeCsvCell('say "hi"')).toBe('"say ""hi"""');
    });

    it('wraps multiline text in double quotes', () => {
      expect(escapeCsvCell("line 1\nline 2")).toBe('"line 1\nline 2"');
    });

    it('guards against formula injection by prefixing with a single quote', () => {
      // Starts with =
      const formula1 = escapeCsvCell('=HYPERLINK("http://example.com")');
      expect(formula1).toContain("'=HYPERLINK");

      // Starts with +
      const formula2 = escapeCsvCell('+12345');
      expect(formula2.startsWith("'+") || formula2.startsWith("\"'+")).toBe(true);

      // Starts with -
      const formula3 = escapeCsvCell('-cmd');
      expect(formula3.startsWith("'-") || formula3.startsWith("\"'-")).toBe(true);

      // Starts with @
      const formula4 = escapeCsvCell('@SUM(A1)');
      expect(formula4.startsWith("'@") || formula4.startsWith("\"'@")).toBe(true);

      // Starts with tab or CR
      const formula5 = escapeCsvCell('\tmalicious');
      expect(formula5).toContain("'\tmalicious");
      const formula6 = escapeCsvCell('\rmalicious');
      expect(formula6).toContain("'\rmalicious");
    });
  });

  describe('csvFilename', () => {
    it('generates filename with slugified latin project name and date', () => {
      expect(csvFilename('Alpha Project', '2026-10-20')).toBe(
        'taskora-alpha-project-2026-10-20.csv'
      );
    });

    it('falls back to "project" slug when project name has no latin alphanumeric characters', () => {
      expect(csvFilename('مشروع', '2026-10-20')).toBe(
        'taskora-project-2026-10-20.csv'
      );
    });
  });

  describe('tasksToCsv', () => {
    const project: Project = {
      id: 'p-1',
      name: 'Project Alpha',
      description: '',
      ownerId: 'u-owner',
      memberIds: ['u-owner', 'u-assignee'],
      memberNames: {
        'u-owner': 'Alice Owner',
        'u-assignee': 'Bob Assignee',
      },
      createdAt: new Date('2026-10-01T00:00:00.000Z'),
      updatedAt: new Date('2026-10-01T00:00:00.000Z'),
    };

    const tasks: Task[] = [
      {
        id: 't-1',
        projectId: 'p-1',
        title: 'Task With "Quotes" & Commas, Yes',
        description: 'First line\nSecond line',
        status: 'todo',
        priority: 'high',
        assigneeId: 'u-assignee',
        createdBy: 'u-owner',
        dueDate: '2026-10-25',
        checklist: [
          { id: 'c1', text: 'Step 1', done: true },
          { id: 'c2', text: 'Step 2', done: false },
        ],
        labels: ['frontend', 'bug'],
        recurrence: 'none',
        createdAt: new Date('2026-10-05T10:00:00.000Z'),
        updatedAt: new Date('2026-10-06T12:00:00.000Z'),
      },
      {
        id: 't-2',
        projectId: 'p-1',
        title: 'مهمة عربية',
        description: '',
        status: 'done',
        priority: 'low',
        assigneeId: null,
        createdBy: 'u-owner',
        dueDate: null,
        checklist: [],
        labels: [],
        recurrence: 'none',
        createdAt: new Date('2026-10-07T10:00:00.000Z'),
        updatedAt: new Date('2026-10-07T10:00:00.000Z'),
      },
    ];

    it('starts with UTF-8 BOM, uses CRLF line breaks, and exports localized English headers', () => {
      const mockT = (key: MessageKey) => en[key] || key;
      const csv = tasksToCsv(tasks, project, mockT);

      // Must start with BOM
      expect(csv.startsWith('\uFEFF')).toBe(true);

      // Must use CRLF
      expect(csv).toContain('\r\n');

      // Check header
      expect(csv).toContain('Title');
      expect(csv).toContain('Assignee');
      expect(csv).toContain('Checklist');

      // Check row 1
      expect(csv).toContain('Bob Assignee');
      expect(csv).toContain('1/2'); // checklist
      expect(csv).toContain('frontend; bug'); // labels
      expect(csv).toContain('2026-10-25');

      // Check row 2 with Arabic title
      expect(csv).toContain('مهمة عربية');
    });

    it('exports localized Arabic headers and status/priority in ar', () => {
      const mockT = (key: MessageKey) => ar[key] || key;
      const csv = tasksToCsv(tasks, project, mockT);

      expect(csv.startsWith('\uFEFF')).toBe(true);
      expect(csv).toContain('العنوان');
      expect(csv).toContain('المسند إليه');
      expect(csv).toContain('للتنفيذ'); // todo status in ar
      expect(csv).toContain('مكتملة'); // done status in ar
    });
  });
});
