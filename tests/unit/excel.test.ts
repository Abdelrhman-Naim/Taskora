import { describe, it, expect } from 'vitest';
import ExcelJS from 'exceljs';
import { excelFilename, formatExportDateTime, tasksToExcelBlob } from '@/lib/excel';
import { Task, Project } from '@/types';
import { en, MessageKey } from '@/i18n/en';
import { ar } from '@/i18n/ar';

describe('Excel Export Utility', () => {
  describe('excelFilename', () => {
    it('generates filename with slugified latin project name and date', () => {
      expect(excelFilename('Alpha Project', '2026-10-22')).toBe(
        'taskora-alpha-project-2026-10-22.xlsx'
      );
    });

    it('falls back to "project" slug when project name has no latin characters', () => {
      expect(excelFilename('مشروع إدارة المهام', '2026-10-22')).toBe(
        'taskora-project-2026-10-22.xlsx'
      );
    });
  });

  describe('formatExportDateTime', () => {
    it('formats valid Date into YYYY-MM-DD HH:mm', () => {
      const d = new Date(2026, 9, 21, 14, 30); // Month is 0-indexed (9 = Oct)
      expect(formatExportDateTime(d)).toBe('2026-10-21 14:30');
    });

    it('returns dash for null or undefined', () => {
      expect(formatExportDateTime(null)).toBe('—');
      expect(formatExportDateTime(undefined)).toBe('—');
    });

    it('formats Firestore-like Timestamp objects with toDate()', () => {
      const fakeTimestamp = {
        toDate: () => new Date(2026, 9, 22, 9, 15),
      };
      expect(formatExportDateTime(fakeTimestamp)).toBe('2026-10-22 09:15');
    });
  });

  describe('tasksToExcelBlob', () => {
    const project: Project = {
      id: 'p-101',
      name: 'Taskora Platform',
      description: 'Main project tracking',
      ownerId: 'u-owner',
      memberIds: ['u-owner', 'u-dev1', 'u-dev2'],
      memberNames: {
        'u-owner': 'Sarah Owner',
        'u-dev1': 'Omar Dev',
        'u-dev2': 'Layla Dev',
      },
      createdAt: new Date('2026-10-01T00:00:00.000Z'),
      updatedAt: new Date('2026-10-01T00:00:00.000Z'),
    };

    const tasks: Task[] = [
      {
        id: 't-1',
        projectId: 'p-101',
        title: 'Design high-end export spreadsheet',
        description: 'Ensure color-coding and KPI header',
        status: 'done',
        priority: 'high',
        assigneeId: 'u-dev1',
        createdBy: 'u-owner',
        dueDate: '2026-10-25',
        checklist: [
          { id: 'c1', text: 'Define theme', done: true },
          { id: 'c2', text: 'Implement ExcelJS', done: true },
        ],
        labels: ['ui', 'export'],
        recurrence: 'none',
        createdAt: new Date('2026-10-10T08:00:00.000Z'),
        updatedAt: new Date('2026-10-12T10:00:00.000Z'),
      },
      {
        id: 't-2',
        projectId: 'p-101',
        title: 'Build automated tests',
        description: 'Verify parity and integrity',
        status: 'in_progress',
        priority: 'medium',
        assigneeId: 'u-dev2',
        createdBy: 'u-owner',
        dueDate: '2026-10-28',
        checklist: [],
        labels: ['qa'],
        recurrence: 'none',
        createdAt: new Date('2026-10-11T09:00:00.000Z'),
        updatedAt: new Date('2026-10-11T09:00:00.000Z'),
      },
    ];

    it('generates a valid Blob and Excel workbook with RTL and stylized cells in Arabic', async () => {
      const mockT = (key: MessageKey) => ar[key] || key;
      const blob = await tasksToExcelBlob(tasks, project, mockT, 'ar');

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      expect(blob.size).toBeGreaterThan(1000);

      // Verify workbook structure using ExcelJS
      const arrayBuffer = await blob.arrayBuffer();
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(Buffer.from(arrayBuffer) as any);

      const sheet = wb.worksheets[0];
      expect(sheet).toBeDefined();
      expect(sheet.views?.[0]?.rightToLeft).toBe(true);

      // Row 2: Hero title
      const titleCell = sheet.getCell('A2');
      expect(titleCell.value?.toString()).toContain('Taskora Platform');

      // Row 4: KPI strip
      const kpiTotalCell = sheet.getCell('A4');
      expect(kpiTotalCell.value?.toString()).toContain('2'); // total tasks count

      // Row 6: Table headers
      const colTitle = sheet.getRow(6).getCell(2).value?.toString();
      expect(colTitle).toBe(ar['excel.col.title']);

      // Row 7: First task row
      const task1Title = sheet.getRow(7).getCell(2).value?.toString();
      expect(task1Title).toBe('Design high-end export spreadsheet');

      // First task status is 'done' -> should have green fill
      const task1StatusCell = sheet.getRow(7).getCell(3);
      expect(task1StatusCell.value?.toString()).toBe(ar['task.status.done']);
      expect((task1StatusCell.fill as any)?.fgColor?.argb).toBe('FFDCFCE7');

      // First task priority is 'high' -> should have red fill
      const task1PriorityCell = sheet.getRow(7).getCell(4);
      expect(task1PriorityCell.value?.toString()).toBe(ar['task.priority.high']);
      expect((task1PriorityCell.fill as any)?.fgColor?.argb).toBe('FFFEE2E2');
    });

    it('generates LTR workbook in English locale', async () => {
      const mockT = (key: MessageKey) => en[key] || key;
      const blob = await tasksToExcelBlob(tasks, project, mockT, 'en');

      const arrayBuffer = await blob.arrayBuffer();
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(Buffer.from(arrayBuffer) as any);

      const sheet = wb.worksheets[0];
      expect(sheet.views?.[0]?.rightToLeft).toBe(false);

      const colTitle = sheet.getRow(6).getCell(2).value?.toString();
      expect(colTitle).toBe('Title');
    });
  });
});
