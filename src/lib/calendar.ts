import { Task } from '@/types';

/**
 * Generates rows of 7 'YYYY-MM-DD' dates for a given month, padded with adjacent month days.
 * @param year e.g. 2026
 * @param month 1-12
 * @param weekStart 0 (Sunday) | 1 (Monday) | 6 (Saturday)
 */
export function monthGrid(
  year: number,
  month: number,
  weekStart: 0 | 1 | 6
): string[][] {
  const firstOfMonth = new Date(Date.UTC(year, month - 1, 1));
  const firstDayOfWeek = firstOfMonth.getUTCDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat

  // Calculate days before the 1st of month to align with weekStart
  const diff = (firstDayOfWeek - weekStart + 7) % 7;

  // Total days in current month
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  // Total days to display: at least 35 (5 rows) or 42 (6 rows)
  const totalDisplayedDays = diff + daysInMonth;
  const numRows = Math.ceil(totalDisplayedDays / 7);
  const totalCells = numRows * 7;

  const dates: string[] = [];
  for (let i = 0; i < totalCells; i++) {
    const d = new Date(Date.UTC(year, month - 1, 1 - diff + i));
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    dates.push(`${y}-${m}-${day}`);
  }

  const rows: string[][] = [];
  for (let r = 0; r < numRows; r++) {
    rows.push(dates.slice(r * 7, (r + 1) * 7));
  }

  return rows;
}

/**
 * Groups tasks by their dueDate ('YYYY-MM-DD'). Tasks without dueDate are excluded.
 */
export function tasksByDate(tasks: Task[]): Record<string, Task[]> {
  const map: Record<string, Task[]> = {};
  for (const task of tasks) {
    if (!task.dueDate) continue;
    if (!map[task.dueDate]) {
      map[task.dueDate] = [];
    }
    map[task.dueDate].push(task);
  }
  return map;
}
