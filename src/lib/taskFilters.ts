import { Task, TaskPriority, TaskStatus } from '@/types';
import { isOverdue } from './dates';

export interface TaskFilters {
  status: TaskStatus | 'all';
  priority: TaskPriority | 'all';
  assigneeId: string | 'all' | 'unassigned';
  search: string;
  overdueOnly: boolean;
  label: string | 'all';
}

export const DEFAULT_FILTERS: TaskFilters = {
  status: 'all',
  priority: 'all',
  assigneeId: 'all',
  search: '',
  overdueOnly: false,
  label: 'all',
};

/**
 * Filters tasks based on status, priority, assignee, overdue status, search query, and label.
 * Overdue calculation strictly delegates to isOverdue(task, today) from dates.ts.
 */
export function filterTasks(
  tasks: Task[],
  f: TaskFilters,
  today: string
): Task[] {
  const trimmedSearch = f.search.trim().toLowerCase();

  return tasks.filter((t) => {
    // 1. Status filter
    if (f.status !== 'all' && t.status !== f.status) {
      return false;
    }

    // 2. Priority filter
    if (f.priority !== 'all' && t.priority !== f.priority) {
      return false;
    }

    // 3. Assignee filter
    if (f.assigneeId === 'unassigned') {
      if (t.assigneeId !== null && t.assigneeId !== undefined && t.assigneeId !== '') {
        return false;
      }
    } else if (f.assigneeId !== 'all') {
      if (t.assigneeId !== f.assigneeId) {
        return false;
      }
    }

    // 4. Overdue filter (strictly uses isOverdue from dates.ts)
    if (f.overdueOnly && !isOverdue(t, today)) {
      return false;
    }

    // 5. Search filter (case-insensitive substring on title only)
    if (trimmedSearch.length > 0) {
      if (!t.title.toLowerCase().includes(trimmedSearch)) {
        return false;
      }
    }

    // 6. Label filter (case-insensitive match)
    if (f.label && f.label !== 'all') {
      const targetLabel = f.label.trim().toLowerCase();
      const taskLabels = (t.labels || []).map((l) => l.toLowerCase());
      if (!taskLabels.includes(targetLabel)) {
        return false;
      }
    }

    return true;
  });
}
