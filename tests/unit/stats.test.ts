import { describe, it, expect, vi } from 'vitest';
import { Task, Project } from '@/types';
import { computeStats, loadDashboardData } from '@/lib/stats';
import * as projectServices from '@/services/projects';
import * as taskServices from '@/services/tasks';
import { Firestore } from 'firebase/firestore';

describe('stats library', () => {
  const today = '2026-10-17';

  // Appendix A data setup
  const appendixTasks: Task[] = [
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
      assigneeId: null,
      createdBy: 'user-owner',
      dueDate: '2026-10-10', // past date, but status is DONE -> NOT overdue
      checklist: [],
      labels: [],
      recurrence: 'none',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  describe('computeStats', () => {
    it('computes correct statistics on Appendix A data', () => {
      const stats = computeStats(appendixTasks, today);

      expect(stats.totalTasks).toBe(4);
      expect(stats.byStatus).toEqual({
        todo: 2,
        in_progress: 1,
        done: 1,
      });

      expect(stats.overdue).toHaveLength(1);
      expect(stats.overdue[0].id).toBe('task-2');
      expect(stats.overdue[0].title).toBe('Fix overdue bug');
    });

    it('returns zeroed counts and empty overdue array when tasks are empty', () => {
      const stats = computeStats([], today);

      expect(stats.totalTasks).toBe(0);
      expect(stats.byStatus).toEqual({
        todo: 0,
        in_progress: 0,
        done: 0,
      });
      expect(stats.overdue).toEqual([]);
    });

    it('does NOT count done tasks as overdue even if dueDate is before today', () => {
      const doneOverdueTask: Task = {
        id: 'task-done',
        projectId: 'proj-1',
        title: 'Old done task',
        description: '',
        status: 'done',
        priority: 'high',
        assigneeId: null,
        createdBy: 'user-owner',
        dueDate: '2020-01-01',
        checklist: [],
        labels: [],
        recurrence: 'none',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const stats = computeStats([doneOverdueTask], today);
      expect(stats.totalTasks).toBe(1);
      expect(stats.byStatus.done).toBe(1);
      expect(stats.overdue).toEqual([]);
    });
  });

  describe('loadDashboardData', () => {
    it('loads projects and all tasks across projects using Promise.all without collectionGroup', async () => {
      const mockDb = {} as Firestore;
      const mockProjects: Project[] = [
        {
          id: 'proj-1',
          name: 'Project 1',
          description: '',
          ownerId: 'user-1',
          memberIds: ['user-1'],
          memberNames: { 'user-1': 'User One' },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'proj-2',
          name: 'Project 2',
          description: '',
          ownerId: 'user-1',
          memberIds: ['user-1'],
          memberNames: { 'user-1': 'User One' },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const listProjectsSpy = vi
        .spyOn(projectServices, 'listUserProjects')
        .mockResolvedValueOnce(mockProjects);

      const listTasksSpy = vi
        .spyOn(taskServices, 'listTasks')
        .mockImplementation(async (_db, projId) => {
          if (projId === 'proj-1') return [appendixTasks[0], appendixTasks[1]];
          if (projId === 'proj-2') return [appendixTasks[2], appendixTasks[3]];
          return [];
        });

      const data = await loadDashboardData(mockDb, 'user-1');

      expect(listProjectsSpy).toHaveBeenCalledWith(mockDb, 'user-1');
      expect(listTasksSpy).toHaveBeenCalledTimes(2);
      expect(listTasksSpy).toHaveBeenCalledWith(mockDb, 'proj-1');
      expect(listTasksSpy).toHaveBeenCalledWith(mockDb, 'proj-2');

      expect(data.projects).toEqual(mockProjects);
      expect(data.tasks).toHaveLength(4);
      expect(data.tasks.map((t) => t.id)).toEqual(['task-1', 'task-2', 'task-3', 'task-4']);

      listProjectsSpy.mockRestore();
      listTasksSpy.mockRestore();
    });

    it('returns empty tasks if user has no projects', async () => {
      const mockDb = {} as Firestore;
      const listProjectsSpy = vi
        .spyOn(projectServices, 'listUserProjects')
        .mockResolvedValueOnce([]);

      const data = await loadDashboardData(mockDb, 'user-1');
      expect(data.projects).toEqual([]);
      expect(data.tasks).toEqual([]);

      listProjectsSpy.mockRestore();
    });
  });
});
