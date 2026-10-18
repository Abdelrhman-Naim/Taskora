import { Project, Task, TaskPriority } from '@/types';
import { addDays, daysBetween, isOverdue } from './dates';

export interface Metrics {
  total: number;
  open: number;
  inProgress: number;
  completed: number;
  completionRate: number; /* 0..100 integer, 0 if total === 0 */
  overdue: number;
  dueThisWeek: number; /* open && due date in [today, today+6] */
}

export function computeMetrics(tasks: Task[], today: string): Metrics {
  const total = tasks.length;
  let open = 0;
  let inProgress = 0;
  let completed = 0;
  let overdue = 0;
  let dueThisWeek = 0;

  const weekEnd = addDays(today, 6);

  for (const t of tasks) {
    if (t.status === 'done') {
      completed++;
    } else {
      open++;
      if (t.status === 'in_progress') {
        inProgress++;
      }
      if (isOverdue(t, today)) {
        overdue++;
      } else if (t.dueDate && t.dueDate >= today && t.dueDate <= weekEnd) {
        dueThisWeek++;
      }
    }
  }

  const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100);

  return {
    total,
    open,
    inProgress,
    completed,
    completionRate,
    overdue,
    dueThisWeek,
  };
}

export interface ProjectSummary {
  project: Project;
  role: 'owner' | 'member';
  total: number;
  done: number;
  inProgress: number;
  todo: number;
  open: number;
  overdue: number;
  progress: number; /* 0..100, 0 if total === 0 */
}

export function summarizeProjects(
  projects: Project[],
  tasks: Task[],
  uid: string,
  today: string
): ProjectSummary[] {
  const tasksByProject = new Map<string, Task[]>();
  for (const t of tasks) {
    const list = tasksByProject.get(t.projectId) || [];
    list.push(t);
    tasksByProject.set(t.projectId, list);
  }

  return projects.map((p) => {
    const pTasks = tasksByProject.get(p.id) || [];
    const total = pTasks.length;
    let done = 0;
    let inProgress = 0;
    let todo = 0;
    let overdue = 0;

    for (const t of pTasks) {
      if (t.status === 'done') {
        done++;
      } else {
        if (t.status === 'in_progress') {
          inProgress++;
        } else if (t.status === 'todo') {
          todo++;
        }
        if (isOverdue(t, today)) {
          overdue++;
        }
      }
    }

    const open = total - done;
    const progress = total === 0 ? 0 : Math.round((done / total) * 100);
    const role: 'owner' | 'member' = p.ownerId === uid ? 'owner' : 'member';

    return {
      project: p,
      role,
      total,
      done,
      inProgress,
      todo,
      open,
      overdue,
      progress,
    };
  });
}

export function topProjectsByOpen(
  s: ProjectSummary[],
  limit = 6
): { rows: ProjectSummary[]; othersCount: number } {
  const sorted = [...s].sort((a, b) => {
    if (b.open !== a.open) {
      return b.open - a.open;
    }
    return a.project.name.localeCompare(b.project.name);
  });

  return {
    rows: sorted.slice(0, limit),
    othersCount: Math.max(0, sorted.length - limit),
  };
}

export interface TimelineBucket {
  date: string;
  count: number;
  isToday: boolean;
}

export function dueTimeline(
  tasks: Task[],
  today: string,
  days = 14
): { overdue: number; buckets: TimelineBucket[] } {
  const buckets: TimelineBucket[] = [];
  const openTasks = tasks.filter((t) => t.status !== 'done' && t.dueDate !== null);

  let overdue = 0;
  const countByDate = new Map<string, number>();

  for (const t of openTasks) {
    const due = t.dueDate!;
    if (due < today) {
      overdue++;
    } else {
      countByDate.set(due, (countByDate.get(due) || 0) + 1);
    }
  }

  for (let i = 0; i < days; i++) {
    const date = addDays(today, i);
    buckets.push({
      date,
      count: countByDate.get(date) || 0,
      isToday: i === 0,
    });
  }

  return {
    overdue,
    buckets,
  };
}

export function priorityBreakdown(tasks: Task[]): Record<TaskPriority, number> {
  const counts: Record<TaskPriority, number> = {
    low: 0,
    medium: 0,
    high: 0,
  };

  for (const t of tasks) {
    if (t.status !== 'done') {
      counts[t.priority] = (counts[t.priority] || 0) + 1;
    }
  }

  return counts;
}

export type AttentionKind = 'overdue' | 'today' | 'tomorrow';

export function needsAttention(
  tasks: Task[],
  today: string,
  limit = 6
): { task: Task; kind: AttentionKind; days: number }[] {
  const tomorrow = addDays(today, 1);
  const openTasks = tasks.filter((t) => t.status !== 'done' && t.dueDate !== null);

  const overdueList: { task: Task; kind: AttentionKind; days: number }[] = [];
  const todayList: { task: Task; kind: AttentionKind; days: number }[] = [];
  const tomorrowList: { task: Task; kind: AttentionKind; days: number }[] = [];

  for (const t of openTasks) {
    const due = t.dueDate!;
    if (due < today) {
      overdueList.push({
        task: t,
        kind: 'overdue',
        days: Math.abs(daysBetween(today, due)),
      });
    } else if (due === today) {
      todayList.push({
        task: t,
        kind: 'today',
        days: 0,
      });
    } else if (due === tomorrow) {
      tomorrowList.push({
        task: t,
        kind: 'tomorrow',
        days: 1,
      });
    }
  }

  // Oldest overdue first (earliest due date)
  overdueList.sort((a, b) => a.task.dueDate!.localeCompare(b.task.dueDate!));

  return [...overdueList, ...todayList, ...tomorrowList].slice(0, limit);
}

export function myTasks(
  tasks: Task[],
  uid: string,
  today: string,
  limit = 6
): Task[] {
  const userOpen = tasks.filter((t) => t.assigneeId === uid && t.status !== 'done');

  userOpen.sort((a, b) => {
    const aOverdue = isOverdue(a, today);
    const bOverdue = isOverdue(b, today);

    // 1. Overdue first
    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;
    if (aOverdue && bOverdue) {
      return a.dueDate!.localeCompare(b.dueDate!);
    }

    // 2. Both not overdue: with due date before null due date
    if (a.dueDate && !b.dueDate) return -1;
    if (!a.dueDate && b.dueDate) return 1;
    if (a.dueDate && b.dueDate) {
      return a.dueDate.localeCompare(b.dueDate);
    }

    return 0;
  });

  return userOpen.slice(0, limit);
}

export function recentlyUpdated(tasks: Task[], limit = 8): Task[] {
  const sorted = [...tasks].sort((a, b) => {
    if (a.updatedAt && b.updatedAt) {
      return b.updatedAt.getTime() - a.updatedAt.getTime();
    }
    if (a.updatedAt && !b.updatedAt) return -1;
    if (!a.updatedAt && b.updatedAt) return 1;
    return 0;
  });

  return sorted.slice(0, limit);
}
