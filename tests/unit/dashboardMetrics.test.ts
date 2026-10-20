import { describe, it, expect } from 'vitest';
import { Project, Task } from '@/types';
import {
  computeMetrics,
  summarizeProjects,
  topProjectsByOpen,
  dueTimeline,
  priorityBreakdown,
  needsAttention,
  myTasks,
  recentlyUpdated,
} from '@/lib/dashboardMetrics';

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 't-1',
    projectId: 'p-1',
    title: 'Task 1',
    description: '',
    status: 'todo',
    priority: 'medium',
    assigneeId: null,
    createdBy: 'u-1',
    dueDate: null,
    checklist: [],
    labels: [],
    recurrence: 'none',
    createdAt: new Date('2026-10-01T10:00:00Z'),
    updatedAt: new Date('2026-10-02T10:00:00Z'),
    ...overrides,
  };
}

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 'p-1',
    name: 'Project Alpha',
    description: 'Alpha description',
    ownerId: 'u-owner',
    memberIds: ['u-owner', 'u-member'],
    memberNames: { 'u-owner': 'Owner', 'u-member': 'Member' },
    createdAt: new Date('2026-09-01T10:00:00Z'),
    updatedAt: new Date('2026-09-02T10:00:00Z'),
    ...overrides,
  };
}

describe('dashboardMetrics (Task 23 TDD)', () => {
  const TODAY = '2026-10-18';

  describe('computeMetrics', () => {
    it('returns all zeros and 0 completionRate when tasks list is empty', () => {
      const m = computeMetrics([], TODAY);
      expect(m).toEqual({
        total: 0,
        open: 0,
        inProgress: 0,
        completed: 0,
        completionRate: 0,
        overdue: 0,
        dueThisWeek: 0,
      });
      expect(Number.isNaN(m.completionRate)).toBe(false);
    });

    it('calculates 1 completed out of 3 as 33% completionRate', () => {
      const tasks = [
        makeTask({ id: '1', status: 'done' }),
        makeTask({ id: '2', status: 'in_progress' }),
        makeTask({ id: '3', status: 'todo' }),
      ];
      const m = computeMetrics(tasks, TODAY);
      expect(m.total).toBe(3);
      expect(m.completed).toBe(1);
      expect(m.inProgress).toBe(1);
      expect(m.open).toBe(2);
      expect(m.completionRate).toBe(33);
    });

    it('does NOT count done tasks as overdue or dueThisWeek even if dueDate is in the past', () => {
      const tasks = [
        makeTask({ id: '1', status: 'done', dueDate: '2026-10-10' }),
        makeTask({ id: '2', status: 'done', dueDate: '2026-10-18' }),
      ];
      const m = computeMetrics(tasks, TODAY);
      expect(m.overdue).toBe(0);
      expect(m.dueThisWeek).toBe(0);
      expect(m.completed).toBe(2);
      expect(m.open).toBe(0);
    });

    it('counts today dueDate in dueThisWeek and NOT in overdue', () => {
      const tasks = [
        makeTask({ id: '1', status: 'todo', dueDate: TODAY }),
      ];
      const m = computeMetrics(tasks, TODAY);
      expect(m.overdue).toBe(0);
      expect(m.dueThisWeek).toBe(1);
    });

    it('includes today+6 in dueThisWeek but excludes today+7', () => {
      const tasks = [
        makeTask({ id: '1', status: 'todo', dueDate: '2026-10-24' }), // 18 + 6 = 24
        makeTask({ id: '2', status: 'todo', dueDate: '2026-10-25' }), // 18 + 7 = 25
      ];
      const m = computeMetrics(tasks, TODAY);
      expect(m.dueThisWeek).toBe(1);
    });
  });

  describe('summarizeProjects', () => {
    it('summarizes projects with role, counts, and progress', () => {
      const projects = [
        makeProject({ id: 'p-1', ownerId: 'u-1', name: 'Project 1' }),
        makeProject({ id: 'p-2', ownerId: 'u-2', name: 'Project 2' }),
      ];
      const tasks = [
        makeTask({ id: 't-1', projectId: 'p-1', status: 'done' }),
        makeTask({ id: 't-2', projectId: 'p-1', status: 'todo', dueDate: '2026-10-15' }), // overdue
        makeTask({ id: 't-3', projectId: 'p-1', status: 'in_progress' }),
      ];

      const summaries = summarizeProjects(projects, tasks, 'u-1', TODAY);
      expect(summaries).toHaveLength(2);

      const p1 = summaries.find((s) => s.project.id === 'p-1')!;
      expect(p1.role).toBe('owner');
      expect(p1.total).toBe(3);
      expect(p1.done).toBe(1);
      expect(p1.inProgress).toBe(1);
      expect(p1.todo).toBe(1);
      expect(p1.open).toBe(2);
      expect(p1.overdue).toBe(1);
      expect(p1.progress).toBe(33);

      const p2 = summaries.find((s) => s.project.id === 'p-2')!;
      expect(p2.role).toBe('member');
      expect(p2.total).toBe(0);
      expect(p2.progress).toBe(0);
    });

    it('preserves total task count sum across all project summaries', () => {
      const p1 = makeProject({ id: 'p-1' });
      const p2 = makeProject({ id: 'p-2' });
      const tasks = [
        makeTask({ id: 't-1', projectId: 'p-1' }),
        makeTask({ id: 't-2', projectId: 'p-2' }),
        makeTask({ id: 't-3', projectId: 'p-2' }),
      ];
      const summaries = summarizeProjects([p1, p2], tasks, 'u-owner', TODAY);
      const sum = summaries.reduce((acc, s) => acc + s.total, 0);
      expect(sum).toBe(tasks.length);
    });
  });

  describe('topProjectsByOpen', () => {
    it('limits rows to limit (default 6) and counts othersCount, sorted by open desc then name asc', () => {
      const summaries = Array.from({ length: 9 }, (_, i) => ({
        project: makeProject({ id: `p-${i}`, name: `Project ${String.fromCharCode(65 + i)}` }),
        role: 'owner' as const,
        total: 10,
        done: 10 - i,
        inProgress: 0,
        todo: i,
        open: i, // 0 to 8 open tasks
        overdue: 0,
        progress: 50,
      }));

      const result = topProjectsByOpen(summaries, 6);
      expect(result.rows).toHaveLength(6);
      expect(result.othersCount).toBe(3);

      // open desc: 8, 7, 6, 5, 4, 3
      expect(result.rows[0].open).toBe(8);
      expect(result.rows[5].open).toBe(3);
    });

    it('breaks ties in open count by project name alphabetically', () => {
      const summaries = [
        {
          project: makeProject({ id: 'p-z', name: 'Zeta' }),
          role: 'owner' as const,
          total: 5,
          done: 2,
          inProgress: 1,
          todo: 2,
          open: 3,
          overdue: 0,
          progress: 40,
        },
        {
          project: makeProject({ id: 'p-a', name: 'Alpha' }),
          role: 'owner' as const,
          total: 5,
          done: 2,
          inProgress: 1,
          todo: 2,
          open: 3,
          overdue: 0,
          progress: 40,
        },
      ];

      const result = topProjectsByOpen(summaries, 6);
      expect(result.rows[0].project.name).toBe('Alpha');
      expect(result.rows[1].project.name).toBe('Zeta');
    });
  });

  describe('dueTimeline', () => {
    it('creates 14 daily buckets with overdue count for earlier open tasks', () => {
      const tasks = [
        makeTask({ id: 't-overdue-1', status: 'todo', dueDate: '2026-10-15' }),
        makeTask({ id: 't-overdue-2', status: 'in_progress', dueDate: '2026-10-17' }),
        makeTask({ id: 't-done-overdue', status: 'done', dueDate: '2026-10-16' }), // excluded from overdue
        makeTask({ id: 't-today', status: 'todo', dueDate: '2026-10-18' }),
        makeTask({ id: 't-tomorrow', status: 'todo', dueDate: '2026-10-19' }),
        makeTask({ id: 't-far', status: 'todo', dueDate: '2026-11-20' }), // > 14 days excluded
        makeTask({ id: 't-no-date', status: 'todo', dueDate: null }), // excluded
      ];

      const result = dueTimeline(tasks, TODAY, 14);
      expect(result.overdue).toBe(2);
      expect(result.buckets).toHaveLength(14);
      expect(result.buckets[0].isToday).toBe(true);
      expect(result.buckets[0].date).toBe('2026-10-18');
      expect(result.buckets[0].count).toBe(1);

      expect(result.buckets[1].isToday).toBe(false);
      expect(result.buckets[1].date).toBe('2026-10-19');
      expect(result.buckets[1].count).toBe(1);
    });

    it('crosses month boundary correctly', () => {
      const result = dueTimeline([], '2026-10-30', 5);
      expect(result.buckets).toHaveLength(5);
      expect(result.buckets.map((b) => b.date)).toEqual([
        '2026-10-30',
        '2026-10-31',
        '2026-11-01',
        '2026-11-02',
        '2026-11-03',
      ]);
    });
  });

  describe('priorityBreakdown', () => {
    it('breaks down only open tasks by priority', () => {
      const tasks = [
        makeTask({ id: '1', priority: 'high', status: 'todo' }),
        makeTask({ id: '2', priority: 'high', status: 'in_progress' }),
        makeTask({ id: '3', priority: 'high', status: 'done' }), // excluded
        makeTask({ id: '4', priority: 'medium', status: 'todo' }),
        makeTask({ id: '5', priority: 'low', status: 'in_progress' }),
      ];
      const counts = priorityBreakdown(tasks);
      expect(counts).toEqual({
        high: 2,
        medium: 1,
        low: 1,
      });
    });
  });

  describe('needsAttention', () => {
    it('returns overdue (oldest first), then today, then tomorrow, capped at limit', () => {
      const tasks = [
        makeTask({ id: 't-done', status: 'done', dueDate: '2026-10-10' }), // excluded
        makeTask({ id: 't-future', status: 'todo', dueDate: '2026-10-25' }), // excluded
        makeTask({ id: 't-tomorrow', status: 'todo', dueDate: '2026-10-19' }),
        makeTask({ id: 't-overdue-2', status: 'todo', dueDate: '2026-10-16' }), // 2 days overdue
        makeTask({ id: 't-today', status: 'in_progress', dueDate: '2026-10-18' }),
        makeTask({ id: 't-overdue-5', status: 'todo', dueDate: '2026-10-13' }), // 5 days overdue (oldest)
      ];

      const list = needsAttention(tasks, TODAY, 6);
      expect(list).toHaveLength(4);

      expect(list[0].task.id).toBe('t-overdue-5');
      expect(list[0].kind).toBe('overdue');
      expect(list[0].days).toBe(5);

      expect(list[1].task.id).toBe('t-overdue-2');
      expect(list[1].kind).toBe('overdue');
      expect(list[1].days).toBe(2);

      expect(list[2].task.id).toBe('t-today');
      expect(list[2].kind).toBe('today');
      expect(list[2].days).toBe(0);

      expect(list[3].task.id).toBe('t-tomorrow');
      expect(list[3].kind).toBe('tomorrow');
      expect(list[3].days).toBe(1);
    });
  });

  describe('myTasks', () => {
    it('returns open tasks assigned to uid, ordered: overdue, nearest due, then null due', () => {
      const tasks = [
        makeTask({ id: 't-other', assigneeId: 'u-other', status: 'todo' }),
        makeTask({ id: 't-done', assigneeId: 'u-me', status: 'done', dueDate: '2026-10-10' }),
        makeTask({ id: 't-null', assigneeId: 'u-me', status: 'todo', dueDate: null }),
        makeTask({ id: 't-soon', assigneeId: 'u-me', status: 'todo', dueDate: '2026-10-22' }),
        makeTask({ id: 't-overdue', assigneeId: 'u-me', status: 'in_progress', dueDate: '2026-10-12' }),
        makeTask({ id: 't-today', assigneeId: 'u-me', status: 'todo', dueDate: '2026-10-18' }),
      ];

      const list = myTasks(tasks, 'u-me', TODAY, 6);
      expect(list.map((t) => t.id)).toEqual([
        't-overdue',
        't-today',
        't-soon',
        't-null',
      ]);
    });
  });

  describe('recentlyUpdated', () => {
    it('returns tasks ordered by updatedAt descending with nulls at the end', () => {
      const tasks = [
        makeTask({ id: 't-null', updatedAt: null }),
        makeTask({ id: 't-1', updatedAt: new Date('2026-10-10T12:00:00Z') }),
        makeTask({ id: 't-3', updatedAt: new Date('2026-10-15T12:00:00Z') }),
        makeTask({ id: 't-2', updatedAt: new Date('2026-10-12T12:00:00Z') }),
      ];

      const list = recentlyUpdated(tasks, 10);
      expect(list.map((t) => t.id)).toEqual(['t-3', 't-2', 't-1', 't-null']);
    });
  });
});
