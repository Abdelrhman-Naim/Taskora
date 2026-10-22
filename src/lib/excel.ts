import ExcelJS from 'exceljs';
import { Task, Project } from '@/types';
import { MessageKey } from '@/i18n/en';
import { Locale } from '@/i18n/config';
import { todayString } from '@/lib/dates';

/**
 * Generates standard filename for task Excel export:
 * 'taskora-<slug>-YYYY-MM-DD.xlsx', falling back to 'project' slug if name has no latin characters.
 */
export function excelFilename(projectName: string, today: string): string {
  const slug = projectName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const safeSlug = slug.length > 0 ? slug : 'project';
  return `taskora-${safeSlug}-${today}.xlsx`;
}

/**
 * Formats a Date/Timestamp into readable numbers (YYYY-MM-DD HH:mm) or (YYYY-MM-DD).
 */
export function formatExportDateTime(d: unknown): string {
  if (!d) return '—';
  let dateObj: Date | null = null;

  if (d instanceof Date) {
    dateObj = isNaN(d.getTime()) ? null : d;
  } else if (
    typeof d === 'object' &&
    d !== null &&
    'toDate' in d &&
    typeof (d as { toDate: () => unknown }).toDate === 'function'
  ) {
    try {
      const res = (d as { toDate: () => unknown }).toDate();
      if (res instanceof Date && !isNaN(res.getTime())) {
        dateObj = res;
      }
    } catch {
      dateObj = null;
    }
  } else if (typeof d === 'string' || typeof d === 'number') {
    const parsed = new Date(d);
    if (!isNaN(parsed.getTime())) {
      dateObj = parsed;
    }
  }

  if (!dateObj) return '—';

  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  const h = String(dateObj.getHours()).padStart(2, '0');
  const min = String(dateObj.getMinutes()).padStart(2, '0');

  return `${y}-${m}-${day} ${h}:${min}`;
}

/**
 * Creates an elegant, styled Excel workbook from tasks and project data.
 * Includes:
 * - RTL mode for Arabic locale
 * - Hero Project Banner with Title and Description
 * - KPI Summary Cards Strip (Totals, Completed, In Progress, To Do, Members)
 * - Beautiful Table Header with Brand Blue theme
 * - Color-coded Status Badges (Green for Done, Blue for In Progress, Amber for Todo)
 * - Color-coded Priority Badges (Red for High, Orange for Medium, Slate for Low)
 * - Clean grid borders and zebra striping
 * - Double-underline Accounting Summary row at the bottom
 */
export async function tasksToExcelBlob(
  tasks: Task[],
  project: Project,
  t: (key: MessageKey, params?: Record<string, string | number>) => string,
  locale: Locale = 'ar'
): Promise<Blob> {
  const isRTL = locale === 'ar';
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Taskora';
  wb.lastModifiedBy = 'Taskora';
  wb.created = new Date();
  wb.modified = new Date();

  const sheetName = (t('excel.sheetName') || 'Tasks').slice(0, 31);
  const ws = wb.addWorksheet(sheetName, {
    views: [{ rightToLeft: isRTL }],
    properties: { tabColor: { argb: 'FF2563EB' } },
  });

  // 1. Column Definitions and Proportions
  ws.columns = [
    { key: 'index', width: 6 },
    { key: 'title', width: 34 },
    { key: 'status', width: 18 },
    { key: 'priority', width: 16 },
    { key: 'assignee', width: 22 },
    { key: 'dueDate', width: 16 },
    { key: 'labels', width: 22 },
    { key: 'checklist', width: 18 },
    { key: 'createdAt', width: 20 },
    { key: 'updatedAt', width: 20 },
    { key: 'description', width: 38 },
  ];

  // Row 1: Top spacing
  ws.getRow(1).height = 12;

  // Row 2: Hero Project Title Banner
  ws.mergeCells('A2:K2');
  const titleCell = ws.getCell('A2');
  titleCell.value = `📋  ${project.name}`;
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0F172A' }, // Deep Slate 900
  };
  titleCell.font = {
    name: 'Segoe UI',
    size: 16,
    bold: true,
    color: { argb: 'FFFFFFFF' },
  };
  titleCell.alignment = {
    vertical: 'middle',
    horizontal: 'center',
  };
  ws.getRow(2).height = 42;

  // Row 3: Subtitle / Project Description & Export Metadata
  ws.mergeCells('A3:K3');
  const subtitleCell = ws.getCell('A3');
  const descPart = project.description ? `${project.description}   •   ` : '';
  subtitleCell.value = `${descPart}${t('excel.exportDate')}: ${todayString()}`;
  subtitleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E293B' }, // Slate 800
  };
  subtitleCell.font = {
    name: 'Segoe UI',
    size: 10,
    italic: true,
    color: { argb: 'FFCBD5E1' }, // Slate 300
  };
  subtitleCell.alignment = {
    vertical: 'middle',
    horizontal: 'center',
  };
  ws.getRow(3).height = 24;

  // Row 4: KPI Summary Cards Strip
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.status === 'done').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress').length;
  const todoTasks = tasks.filter((t) => t.status === 'todo').length;
  const donePercent = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const memberCount = project.memberIds?.length || 1;

  ws.mergeCells('A4:B4');
  const kpiTotal = ws.getCell('A4');
  kpiTotal.value = `📊 ${t('excel.totalTasks')}: ${totalTasks}`;
  kpiTotal.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
  kpiTotal.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF0F172A' } };
  kpiTotal.alignment = { vertical: 'middle', horizontal: 'center' };

  ws.mergeCells('C4:D4');
  const kpiDone = ws.getCell('C4');
  kpiDone.value = `✅ ${t('excel.doneTasks')}: ${doneTasks} (${donePercent}%)`;
  kpiDone.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFECFDF5' } };
  kpiDone.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF065F46' } };
  kpiDone.alignment = { vertical: 'middle', horizontal: 'center' };

  ws.mergeCells('E4:F4');
  const kpiProg = ws.getCell('E4');
  kpiProg.value = `⏳ ${t('excel.inProgressTasks')}: ${inProgressTasks}`;
  kpiProg.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF6FF' } };
  kpiProg.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF1E40AF' } };
  kpiProg.alignment = { vertical: 'middle', horizontal: 'center' };

  ws.mergeCells('G4:H4');
  const kpiTodo = ws.getCell('G4');
  kpiTodo.value = `📌 ${t('excel.todoTasks')}: ${todoTasks}`;
  kpiTodo.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFBEB' } };
  kpiTodo.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF92400E' } };
  kpiTodo.alignment = { vertical: 'middle', horizontal: 'center' };

  ws.mergeCells('I4:K4');
  const kpiMembers = ws.getCell('I4');
  kpiMembers.value = `👥 ${t('excel.membersCount')}: ${memberCount}`;
  kpiMembers.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
  kpiMembers.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF0F172A' } };
  kpiMembers.alignment = { vertical: 'middle', horizontal: 'center' };

  ws.getRow(4).height = 28;
  const kpiColLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'];
  kpiColLetters.forEach((col) => {
    ws.getCell(`${col}4`).border = {
      top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    };
  });

  // Row 5: Blank separator
  ws.getRow(5).height = 12;

  // Row 6: Table Header
  const headers = [
    t('excel.col.index'),
    t('excel.col.title'),
    t('excel.col.status'),
    t('excel.col.priority'),
    t('excel.col.assignee'),
    t('excel.col.dueDate'),
    t('excel.col.labels'),
    t('excel.col.checklist'),
    t('excel.col.createdAt'),
    t('excel.col.updatedAt'),
    t('excel.col.description'),
  ];

  const headerRow = ws.getRow(6);
  headerRow.height = 32;
  headers.forEach((label, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = label;
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1D4ED8' }, // Brand Royal Blue
    };
    cell.font = {
      name: 'Segoe UI',
      size: 11,
      bold: true,
      color: { argb: 'FFFFFFFF' },
    };
    cell.alignment = {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: true,
    };
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF1E40AF' } },
      bottom: { style: 'medium', color: { argb: 'FF1E3A8A' } },
      left: { style: 'thin', color: { argb: 'FF3B82F6' } },
      right: { style: 'thin', color: { argb: 'FF3B82F6' } },
    };
  });

  // Rows 7+: Tasks Data
  const textStartAlign = isRTL ? 'right' : 'left';
  const startRowIndex = 7;

  tasks.forEach((task, idx) => {
    const rowNum = startRowIndex + idx;
    const row = ws.getRow(rowNum);
    row.height = 28;

    const isEven = idx % 2 === 0;
    const baseRowColor = isEven ? 'FFFFFFFF' : 'FFF8FAFC';

    // 1. Index
    const c1 = row.getCell(1);
    c1.value = idx + 1;
    c1.alignment = { vertical: 'middle', horizontal: 'center' };
    c1.font = { name: 'Segoe UI', size: 10, color: { argb: 'FF64748B' } };
    c1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: baseRowColor } };

    // 2. Title
    const c2 = row.getCell(2);
    c2.value = task.title;
    c2.alignment = { vertical: 'middle', horizontal: textStartAlign, wrapText: true };
    c2.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF0F172A' } };
    c2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: baseRowColor } };

    // 3. Status (Color Coded Badge)
    const c3 = row.getCell(3);
    const statusLabel = t(`task.status.${task.status}` as MessageKey);
    c3.value = statusLabel;
    c3.alignment = { vertical: 'middle', horizontal: 'center' };
    if (task.status === 'done') {
      c3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } }; // Emerald 100
      c3.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF166534' } }; // Emerald 800
    } else if (task.status === 'in_progress') {
      c3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } }; // Blue 100
      c3.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF1E40AF' } }; // Blue 800
    } else {
      c3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } }; // Amber 100
      c3.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF92400E' } }; // Amber 800
    }

    // 4. Priority (Color Coded Badge)
    const c4 = row.getCell(4);
    const priorityLabel = t(`task.priority.${task.priority}` as MessageKey);
    c4.value = priorityLabel;
    c4.alignment = { vertical: 'middle', horizontal: 'center' };
    if (task.priority === 'high') {
      c4.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } }; // Red 100
      c4.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF991B1B' } }; // Red 800
    } else if (task.priority === 'medium') {
      c4.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEDD5' } }; // Orange 100
      c4.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF9A3412' } }; // Orange 800
    } else {
      c4.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }; // Slate 100
      c4.font = { name: 'Segoe UI', size: 10, color: { argb: 'FF475569' } }; // Slate 600
    }

    // 5. Assignee
    const c5 = row.getCell(5);
    const assigneeName = task.assigneeId
      ? project.memberNames[task.assigneeId] || task.assigneeId
      : '—';
    c5.value = assigneeName;
    c5.alignment = { vertical: 'middle', horizontal: 'center' };
    c5.font = { name: 'Segoe UI', size: 10, color: { argb: 'FF1E293B' } };
    c5.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: baseRowColor } };

    // 6. Due Date
    const c6 = row.getCell(6);
    c6.value = task.dueDate || '—';
    c6.alignment = { vertical: 'middle', horizontal: 'center' };
    c6.font = { name: 'Segoe UI', size: 10, color: { argb: 'FF0F172A' } };
    c6.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: baseRowColor } };

    // 7. Labels
    const c7 = row.getCell(7);
    const labelsText = task.labels && task.labels.length > 0 ? task.labels.join('، ') : '—';
    c7.value = labelsText;
    c7.alignment = { vertical: 'middle', horizontal: 'center' };
    c7.font = { name: 'Segoe UI', size: 10, color: { argb: 'FF475569' } };
    c7.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: baseRowColor } };

    // 8. Checklist Progress
    const c8 = row.getCell(8);
    if (task.checklist && task.checklist.length > 0) {
      const doneSub = task.checklist.filter((item) => item.done).length;
      const totalSub = task.checklist.length;
      const subPct = Math.round((doneSub / totalSub) * 100);
      c8.value = `${doneSub}/${totalSub} (${subPct}%)`;
    } else {
      c8.value = '—';
    }
    c8.alignment = { vertical: 'middle', horizontal: 'center' };
    c8.font = { name: 'Segoe UI', size: 10, color: { argb: 'FF0F172A' } };
    c8.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: baseRowColor } };

    // 9. Created At
    const c9 = row.getCell(9);
    c9.value = formatExportDateTime(task.createdAt);
    c9.alignment = { vertical: 'middle', horizontal: 'center' };
    c9.font = { name: 'Segoe UI', size: 9, color: { argb: 'FF64748B' } };
    c9.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: baseRowColor } };

    // 10. Updated At
    const c10 = row.getCell(10);
    c10.value = formatExportDateTime(task.updatedAt);
    c10.alignment = { vertical: 'middle', horizontal: 'center' };
    c10.font = { name: 'Segoe UI', size: 9, color: { argb: 'FF64748B' } };
    c10.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: baseRowColor } };

    // 11. Description
    const c11 = row.getCell(11);
    c11.value = task.description || '—';
    c11.alignment = { vertical: 'middle', horizontal: textStartAlign, wrapText: true };
    c11.font = { name: 'Segoe UI', size: 10, color: { argb: 'FF334155' } };
    c11.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: baseRowColor } };

    // Borders for row cells
    for (let c = 1; c <= 11; c++) {
      row.getCell(c).border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };
    }
  });

  // Summary / Footer Row
  const footerRowNum = startRowIndex + tasks.length;
  const footerRow = ws.getRow(footerRowNum);
  footerRow.height = 28;

  ws.mergeCells(`A${footerRowNum}:B${footerRowNum}`);
  const summaryCell = ws.getCell(`A${footerRowNum}`);
  summaryCell.value = `${t('excel.totalLabel')}: ${tasks.length} ${t('excel.sheetName')}`;
  summaryCell.alignment = { vertical: 'middle', horizontal: textStartAlign };
  summaryCell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FF0F172A' } };

  for (let c = 1; c <= 11; c++) {
    const cell = footerRow.getCell(c);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF94A3B8' } },
      bottom: { style: 'double', color: { argb: 'FF0F172A' } },
      left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    };
  }

  const buffer = await wb.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}
