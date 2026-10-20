export const TASK_STATUSES = ['todo', 'in_progress', 'done'] as const;
export const TASK_PRIORITIES = ['low', 'medium', 'high'] as const;
export const RECURRENCES = ['none', 'daily', 'weekly', 'monthly'] as const;

export type TaskStatus = typeof TASK_STATUSES[number];
export type TaskPriority = typeof TASK_PRIORITIES[number];
export type Recurrence = typeof RECURRENCES[number];

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

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
  checklist: ChecklistItem[];
  labels: string[];
  recurrence: Recurrence;
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
  checklist?: ChecklistItem[];
  labels?: string[];
  recurrence?: Recurrence;
}

export type TaskPatch = Partial<TaskInput & { status: TaskStatus }>;

export interface SessionUser {
  uid: string;
  displayName: string;
  email: string;
}

export const ACTIVITY_TYPES = [
  'task_created',
  'task_status_changed',
  'task_assigned',
  'task_deleted',
  'comment_added',
  'member_added',
  'member_removed',
] as const;

export type ActivityType = typeof ACTIVITY_TYPES[number];

export interface Actor {
  uid: string;
  displayName: string;
}

export interface ActivityEntry {
  id: string;
  projectId: string;
  type: ActivityType;
  actorId: string;
  actorName: string;
  taskId: string | null;
  taskTitle: string | null;
  detail: string | null;
  createdAt: Date | null;
}

export interface TaskWriteContext {
  actor: Actor;
  task: Task;
  assigneeName?: string | null;
}
