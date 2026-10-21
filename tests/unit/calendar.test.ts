import { describe, it, expect } from 'vitest';
import { monthGrid, tasksByDate } from '@/lib/calendar';
import { Task } from '@/types';

describe('calendar utility (Task 60)', () => {
  it('monthGrid(2028, 2, 0) includes leap year date 2028-02-29', () => {
    const grid = monthGrid(2028, 2, 0);
    const flattened = grid.flat();
    expect(flattened).toContain('2028-02-29');
  });

  it('monthGrid(2026, 10, 0) starts with Sunday 2026-09-27', () => {
    const grid = monthGrid(2026, 10, 0);
    expect(grid[0][0]).toBe('2026-09-27');
  });

  it('monthGrid(2026, 10, 6) starts with Saturday 2026-09-26', () => {
    const grid = monthGrid(2026, 10, 6);
    expect(grid[0][0]).toBe('2026-09-26');
  });

  it('every row has 7 cells and total rows are 5 or 6', () => {
    const gridSunday = monthGrid(2026, 10, 0);
    expect(gridSunday.length).toBeGreaterThanOrEqual(5);
    expect(gridSunday.length).toBeLessThanOrEqual(6);
    gridSunday.forEach((row) => {
      expect(row.length).toBe(7);
    });

    const gridSaturday = monthGrid(2026, 10, 6);
    expect(gridSaturday.length).toBeGreaterThanOrEqual(5);
    expect(gridSaturday.length).toBeLessThanOrEqual(6);
    gridSaturday.forEach((row) => {
      expect(row.length).toBe(7);
    });
  });

  it('monthGrid(2026, 12, 0) extends into January 2027', () => {
    const grid = monthGrid(2026, 12, 0);
    const flattened = grid.flat();
    expect(flattened).toContain('2027-01-01');
    expect(flattened).toContain('2027-01-02');
  });

  it('tasksByDate groups tasks by dueDate and excludes tasks without dueDate', () => {
    const mockTasks: Task[] = [
      {
        id: 't-1',
        projectId: 'p-1',
        title: 'Task 1',
        description: '',
        status: 'todo',
        priority: 'high',
        assigneeId: null,
        createdBy: 'u-1',
        dueDate: '2026-10-15',
        checklist: [],
        labels: [],
        recurrence: 'none',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 't-2',
        projectId: 'p-1',
        title: 'Task 2',
        description: '',
        status: 'done',
        priority: 'low',
        assigneeId: null,
        createdBy: 'u-1',
        dueDate: '2026-10-15',
        checklist: [],
        labels: [],
        recurrence: 'none',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 't-3',
        projectId: 'p-1',
        title: 'Task 3',
        description: '',
        status: 'in_progress',
        priority: 'medium',
        assigneeId: null,
        createdBy: 'u-1',
        dueDate: '2026-10-20',
        checklist: [],
        labels: [],
        recurrence: 'none',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 't-4',
        projectId: 'p-1',
        title: 'No Due Date Task',
        description: '',
        status: 'todo',
        priority: 'medium',
        assigneeId: null,
        createdBy: 'u-1',
        dueDate: null,
        checklist: [],
        labels: [],
        recurrence: 'none',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const result = tasksByDate(mockTasks);
    expect(Object.keys(result)).toEqual(['2026-10-15', '2026-10-20']);
    expect(result['2026-10-15']).toHaveLength(2);
    expect(result['2026-10-20']).toHaveLength(1);
    expect(result['2026-10-15'].map((t) => t.id)).toEqual(['t-1', 't-2']);
  });
});
