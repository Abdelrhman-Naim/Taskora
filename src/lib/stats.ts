import { Firestore } from 'firebase/firestore';
import { Project, Task, TaskStatus } from '@/types';
import { isOverdue } from './dates';
import { listUserProjects } from '@/services/projects';
import { listTasks } from '@/services/tasks';

export interface DashboardStatsData {
  totalTasks: number;
  byStatus: Record<TaskStatus, number>;
  overdue: Task[];
}

/**
 * Computes dashboard statistics from a flat list of tasks.
 * Overdue determination uses isOverdue strictly from dates.ts.
 */
export function computeStats(tasks: Task[], today: string): DashboardStatsData {
  const byStatus: Record<TaskStatus, number> = {
    todo: 0,
    in_progress: 0,
    done: 0,
  };

  const overdue: Task[] = [];

  for (const t of tasks) {
    if (byStatus[t.status] !== undefined) {
      byStatus[t.status] += 1;
    }
    if (isOverdue(t, today)) {
      overdue.push(t);
    }
  }

  return {
    totalTasks: tasks.length,
    byStatus,
    overdue,
  };
}

/**
 * Loads all projects for a user and fetches tasks across all projects using Promise.all,
 * avoiding unauthenticated or broad collectionGroup queries.
 */
export async function loadDashboardData(
  db: Firestore,
  uid: string
): Promise<{ projects: Project[]; tasks: Task[] }> {
  const projects = await listUserProjects(db, uid);
  if (projects.length === 0) {
    return { projects: [], tasks: [] };
  }

  const tasksPerProject = await Promise.all(
    projects.map((p) => listTasks(db, p.id))
  );

  const tasks = tasksPerProject.flat();
  return { projects, tasks };
}
