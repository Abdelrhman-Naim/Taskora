export const TASK_STATUSES = ['todo', 'in_progress', 'done'] as const;
export const TASK_PRIORITIES = ['low', 'medium', 'high'] as const;

export type TaskStatus = typeof TASK_STATUSES[number];
export type TaskPriority = typeof TASK_PRIORITIES[number];

export interface Project {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  memberIds: string[];
  memberNames: Record<string, string>;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string | null;
  createdBy: string;
  dueDate: string | null; /* 'YYYY-MM-DD' */
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface ProjectInput {
  name: string;
  description: string;
}

export interface TaskInput {
  title: string;
  description: string;
  priority: TaskPriority;
  assigneeId: string | null;
  dueDate: string | null;
}

export type TaskPatch = Partial<TaskInput & { status: TaskStatus }>;

export interface SessionUser {
  uid: string;
  displayName: string;
  email: string;
}
