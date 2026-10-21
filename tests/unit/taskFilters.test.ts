import { describe, it, expect } from 'vitest';
import { Task } from '@/types';
import { TaskFilters, DEFAULT_FILTERS, filterTasks } from '@/lib/taskFilters';

describe('taskFilters library', () => {
  const today = '2026-10-17';

  const mockTasks: Task[] = [
    {
      id: 'task-1',
      projectId: 'proj-1',
      title: 'Build navbar',
      description: 'Create responsive top navbar component',
      status: 'todo',
      priority: 'high',
      assigneeId: 'user-alice',
      createdBy: 'user-owner',
      dueDate: '2026-10-25',
      checklist: [],
      labels: [],
      recurrence: 'none',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'task-2',
      projectId: 'proj-1',
      title: 'Fix overdue bug',
      description: 'Critical authentication bug in navbar',
      status: 'todo',
      priority: 'high',
      assigneeId: 'user-bob',
      createdBy: 'user-owner',
      dueDate: '2026-10-16', // yesterday -> overdue
      checklist: [],
      labels: [],
      recurrence: 'none',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'task-3',
      projectId: 'proj-1',
      title: 'Setup Database',
      description: 'Configure Firestore collections',
      status: 'in_progress',
      priority: 'medium',
      assigneeId: 'user-alice',
      createdBy: 'user-owner',
      dueDate: '2026-10-30',
      checklist: [],
      labels: [],
      recurrence: 'none',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'task-4',
      projectId: 'proj-1',
      title: 'Write Documentation',
      description: 'API and system architecture docs',
      status: 'done',
      priority: 'low',
      assigneeId: null, // unassigned
      createdBy: 'user-owner',
      dueDate: '2026-10-10', // past date, but DONE -> NOT overdue
      checklist: [],
      labels: [],
      recurrence: 'none',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'task-5',
      projectId: 'proj-1',
      title: 'Triage unassigned backlog',
      description: 'Review pending backlog items',
      status: 'todo',
      priority: 'low',
      assigneeId: null, // unassigned
      createdBy: 'user-owner',
      dueDate: null, // no due date
      checklist: [],
      labels: [],
      recurrence: 'none',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  it('DEFAULT_FILTERS returns all tasks without filtering', () => {
    const result = filterTasks(mockTasks, DEFAULT_FILTERS, today);
    expect(result).toHaveLength(5);
  });

  describe('Priority filtering (TC-11)', () => {
    it('filters by priority: high', () => {
      const filters: TaskFilters = { ...DEFAULT_FILTERS, priority: 'high' };
      const result = filterTasks(mockTasks, filters, today);
      expect(result).toHaveLength(2);
      expect(result.map((t) => t.id)).toEqual(['task-1', 'task-2']);
    });

    it('filters by priority: medium', () => {
      const filters: TaskFilters = { ...DEFAULT_FILTERS, priority: 'medium' };
      const result = filterTasks(mockTasks, filters, today);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('task-3');
    });

    it('filters by priority: low', () => {
      const filters: TaskFilters = { ...DEFAULT_FILTERS, priority: 'low' };
      const result = filterTasks(mockTasks, filters, today);
      expect(result).toHaveLength(2);
      expect(result.map((t) => t.id)).toEqual(['task-4', 'task-5']);
    });
  });

  describe('Status filtering (TC-11)', () => {
    it('filters by status: todo', () => {
      const filters: TaskFilters = { ...DEFAULT_FILTERS, status: 'todo' };
      const result = filterTasks(mockTasks, filters, today);
      expect(result).toHaveLength(3);
      expect(result.map((t) => t.id)).toEqual(['task-1', 'task-2', 'task-5']);
    });

    it('filters by status: in_progress', () => {
      const filters: TaskFilters = { ...DEFAULT_FILTERS, status: 'in_progress' };
      const result = filterTasks(mockTasks, filters, today);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('task-3');
    });

    it('filters by status: done', () => {
      const filters: TaskFilters = { ...DEFAULT_FILTERS, status: 'done' };
      const result = filterTasks(mockTasks, filters, today);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('task-4');
    });
  });

  describe('Assignee filtering (TC-11)', () => {
    it('filters by specific assignee uid', () => {
      const filters: TaskFilters = { ...DEFAULT_FILTERS, assigneeId: 'user-alice' };
      const result = filterTasks(mockTasks, filters, today);
      expect(result).toHaveLength(2);
      expect(result.map((t) => t.id)).toEqual(['task-1', 'task-3']);
    });

    it('filters by unassigned tasks', () => {
      const filters: TaskFilters = { ...DEFAULT_FILTERS, assigneeId: 'unassigned' };
      const result = filterTasks(mockTasks, filters, today);
      expect(result).toHaveLength(2);
      expect(result.map((t) => t.id)).toEqual(['task-4', 'task-5']);
    });
  });

  describe('Search filtering (TC-12)', () => {
    it('filters case-insensitively by title: "navbar"', () => {
      const filters: TaskFilters = { ...DEFAULT_FILTERS, search: 'navbar' };
      const result = filterTasks(mockTasks, filters, today);
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Build navbar');
    });

    it('filters case-insensitively by uppercase: "NAVBAR"', () => {
      const filters: TaskFilters = { ...DEFAULT_FILTERS, search: 'NAVBAR' };
      const result = filterTasks(mockTasks, filters, today);
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Build navbar');
    });

    it('searches on title only, not description', () => {
      // task-2 has "navbar" in description but "Fix overdue bug" as title
      const filters: TaskFilters = { ...DEFAULT_FILTERS, search: 'navbar' };
      const result = filterTasks(mockTasks, filters, today);
      expect(result.some((t) => t.id === 'task-2')).toBe(false);
    });

    it('returns empty array when search yields no matches', () => {
      const filters: TaskFilters = { ...DEFAULT_FILTERS, search: 'nonexistent match xyz' };
      const result = filterTasks(mockTasks, filters, today);
      expect(result).toEqual([]);
    });

    it('treats whitespace-only search string as empty (no search filter)', () => {
      const filters: TaskFilters = { ...DEFAULT_FILTERS, search: '   ' };
      const result = filterTasks(mockTasks, filters, today);
      expect(result).toHaveLength(5);
    });
  });

  describe('Overdue filter', () => {
    it('returns only incomplete overdue tasks matching isOverdue strictly', () => {
      const filters: TaskFilters = { ...DEFAULT_FILTERS, overdueOnly: true };
      const result = filterTasks(mockTasks, filters, today);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('task-2');
      expect(result[0].title).toBe('Fix overdue bug');
    });
  });

  describe('Combined filters (AND logic)', () => {
    it('combines status, priority, and assigneeId correctly', () => {
      const filters: TaskFilters = {
        status: 'todo',
        priority: 'high',
        assigneeId: 'user-alice',
        search: '',
        overdueOnly: false,
        label: 'all',
      };
      const result = filterTasks(mockTasks, filters, today);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('task-1');
    });

    it('combines overdueOnly with search', () => {
      const filters: TaskFilters = {
        ...DEFAULT_FILTERS,
        overdueOnly: true,
        search: 'overdue',
      };
      const result = filterTasks(mockTasks, filters, today);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('task-2');
    });

    it('combines filters that result in no matches', () => {
      const filters: TaskFilters = {
        status: 'done',
        priority: 'high',
        assigneeId: 'all',
        search: '',
        overdueOnly: false,
        label: 'all',
      };
      const result = filterTasks(mockTasks, filters, today);
      expect(result).toHaveLength(0);
    });
  });

  describe('Label filtering (Task 56)', () => {
    const labeledTasks: Task[] = [
      {
        ...mockTasks[0],
        id: 'task-labeled-1',
        labels: ['Urgent', 'Frontend'],
      },
      {
        ...mockTasks[1],
        id: 'task-labeled-2',
        labels: ['backend', 'bug'],
      },
    ];

    it('matches label case-insensitively (Urgent matches urgent)', () => {
      const filters: TaskFilters = {
        ...DEFAULT_FILTERS,
        label: 'urgent',
      };
      const result = filterTasks(labeledTasks, filters, today);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('task-labeled-1');
    });

    it('returns all when label is "all"', () => {
      const filters: TaskFilters = {
        ...DEFAULT_FILTERS,
        label: 'all',
      };
      const result = filterTasks(labeledTasks, filters, today);
      expect(result).toHaveLength(2);
    });
  });
});
