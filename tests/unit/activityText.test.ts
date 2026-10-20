import { describe, it, expect } from 'vitest';
import { activityMessage } from '@/lib/activityText';
import { ActivityEntry } from '@/types';
import { en } from '@/i18n/en';
import { ar } from '@/i18n/ar';
import { translate } from '@/i18n/translate';

describe('activityMessage helper (Task 52)', () => {
  const tEn = (key: string, params?: Record<string, string | number>) =>
    translate(en, key, params);
  const tAr = (key: string, params?: Record<string, string | number>) =>
    translate(ar, key, params);

  const base: ActivityEntry = {
    id: 'act-1',
    projectId: 'p-1',
    type: 'task_created',
    actorId: 'u-1',
    actorName: 'Alice',
    taskId: 't-1',
    taskTitle: 'Design logo',
    detail: null,
    createdAt: new Date(),
  };

  it('formats task_created in English and Arabic', () => {
    expect(activityMessage(base, tEn)).toBe('Alice created task "Design logo"');
    expect(activityMessage(base, tAr)).toBe('أنشأ Alice المهمة "Design logo"');
  });

  it('formats task_created when taskTitle is null with fallback', () => {
    const entry = { ...base, taskTitle: null };
    expect(activityMessage(entry, tEn)).toBe('Alice created task "a task"');
    expect(activityMessage(entry, tAr)).toBe('أنشأ Alice المهمة "مهمة"');
  });

  it('formats task_status_changed translating both from and to statuses', () => {
    const entry: ActivityEntry = {
      ...base,
      type: 'task_status_changed',
      detail: 'todo>done',
    };
    expect(activityMessage(entry, tEn)).toBe(
      'Alice changed status of "Design logo" from To do to Done'
    );
    expect(activityMessage(entry, tAr)).toBe(
      'غيّر Alice حالة "Design logo" من للتنفيذ إلى مكتملة'
    );
  });

  it('formats task_assigned when assignee is given', () => {
    const entry: ActivityEntry = {
      ...base,
      type: 'task_assigned',
      detail: 'Bob',
    };
    expect(activityMessage(entry, tEn)).toBe('Alice assigned "Design logo" to Bob');
    expect(activityMessage(entry, tAr)).toBe('أسند Alice المهمة "Design logo" إلى Bob');
  });

  it('formats task_assigned when unassigned (detail is null)', () => {
    const entry: ActivityEntry = {
      ...base,
      type: 'task_assigned',
      detail: null,
    };
    expect(activityMessage(entry, tEn)).toBe('Alice unassigned "Design logo"');
    expect(activityMessage(entry, tAr)).toBe('ألغى Alice إسناد المهمة "Design logo"');
  });

  it('formats task_deleted', () => {
    const entry: ActivityEntry = {
      ...base,
      type: 'task_deleted',
    };
    expect(activityMessage(entry, tEn)).toBe('Alice deleted task "Design logo"');
    expect(activityMessage(entry, tAr)).toBe('حذف Alice المهمة "Design logo"');
  });

  it('formats comment_added', () => {
    const entry: ActivityEntry = {
      ...base,
      type: 'comment_added',
    };
    expect(activityMessage(entry, tEn)).toBe('Alice commented on "Design logo"');
    expect(activityMessage(entry, tAr)).toBe('علّق Alice على "Design logo"');
  });

  it('formats member_added and member_removed', () => {
    const addEntry: ActivityEntry = {
      ...base,
      type: 'member_added',
      taskId: null,
      taskTitle: null,
      detail: 'Charlie',
    };
    expect(activityMessage(addEntry, tEn)).toBe('Alice added Charlie to the project');
    expect(activityMessage(addEntry, tAr)).toBe('أضاف Alice العضو Charlie إلى المشروع');

    const removeEntry: ActivityEntry = {
      ...base,
      type: 'member_removed',
      taskId: null,
      taskTitle: null,
      detail: 'Charlie',
    };
    expect(activityMessage(removeEntry, tEn)).toBe('Alice removed Charlie from the project');
    expect(activityMessage(removeEntry, tAr)).toBe('أزال Alice العضو Charlie من المشروع');
  });
});
