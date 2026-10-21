import { Task, Project } from '@/types';
import { MessageKey } from '@/i18n/en';

/**
 * Escapes a cell value for CSV output.
 * Protects against CSV formula injection by prepending a single quote (')
 * if the text begins with =, +, -, @, tab (\t), or CR (\r).
 * Wraps values containing commas, quotes, newlines, or formula markers in double quotes.
 */
export function escapeCsvCell(v: string | null | undefined): string {
  if (v === null || v === undefined) return '';
  const str = String(v);
  if (str.length === 0) return '';

  const isFormula = /^[=+\-@\t\r]/.test(str);
  const safeVal = isFormula ? `'${str}` : str;

  const needsQuotes = isFormula || /[",\n\r]/.test(safeVal);
  if (needsQuotes) {
    return `"${safeVal.replace(/"/g, '""')}"`;
  }

  return safeVal;
}

/**
 * Generates standard filename for task CSV export:
 * 'taskora-<slug>-YYYY-MM-DD.csv', falling back to 'project' slug if name has no latin characters.
 */
export function csvFilename(projectName: string, today: string): string {
  const slug = projectName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const safeSlug = slug.length > 0 ? slug : 'project';
  return `taskora-${safeSlug}-${today}.csv`;
}

/**
 * Converts tasks to CSV string starting with UTF-8 BOM (\uFEFF) and CRLF line breaks.
 */
export function tasksToCsv(
  tasks: Task[],
  project: Project,
  t: (key: MessageKey, params?: Record<string, string | number>) => string
): string {
  const headers = [
    t('csv.col.title'),
    t('csv.col.description'),
    t('csv.col.status'),
    t('csv.col.priority'),
    t('csv.col.assignee'),
    t('csv.col.dueDate'),
    t('csv.col.labels'),
    t('csv.col.checklist'),
    t('csv.col.createdAt'),
    t('csv.col.updatedAt'),
  ];

  const headerRow = headers.map(escapeCsvCell).join(',');

  const rows = tasks.map((task) => {
    const checklistStr =
      task.checklist && task.checklist.length > 0
        ? `${task.checklist.filter((c) => c.done).length}/${task.checklist.length}`
        : '';
    const labelsStr = (task.labels || []).join('; ');
    const assigneeStr = task.assigneeId
      ? project.memberNames[task.assigneeId] || task.assigneeId
      : '';
    const createdStr = task.createdAt instanceof Date ? task.createdAt.toISOString() : '';
    const updatedStr = task.updatedAt instanceof Date ? task.updatedAt.toISOString() : '';

    return [
      escapeCsvCell(task.title),
      escapeCsvCell(task.description || ''),
      escapeCsvCell(t(`task.status.${task.status}` as MessageKey)),
      escapeCsvCell(t(`task.priority.${task.priority}` as MessageKey)),
      escapeCsvCell(assigneeStr),
      escapeCsvCell(task.dueDate || ''),
      escapeCsvCell(labelsStr),
      escapeCsvCell(checklistStr),
      escapeCsvCell(createdStr),
      escapeCsvCell(updatedStr),
    ].join(',');
  });

  return '\uFEFF' + [headerRow, ...rows].join('\r\n');
}
