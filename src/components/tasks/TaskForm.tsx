import React, { useState } from 'react';
import { Project, Task, TaskPriority, TaskStatus } from '@/types';
import { taskInputSchema, fieldErrors } from '@/lib/validation';
import { canChangeStatus, canReassign } from '@/components/tasks/TaskCard';
import { Field } from '@/components/ui/Field';

interface TaskFormProps {
  project: Project;
  initialTask?: Task | null;
  currentUserId: string;
  isOwner: boolean;
  onSave: (data: {
    title: string;
    description: string;
    priority: TaskPriority;
    assigneeId: string | null;
    dueDate: string | null;
    status?: TaskStatus;
  }) => Promise<void>;
  onCancel: () => void;
}

export function TaskForm({
  project,
  initialTask,
  currentUserId,
  isOwner,
  onSave,
  onCancel,
}: TaskFormProps) {
  const isEditing = Boolean(initialTask);

  const [title, setTitle] = useState(initialTask?.title || '');
  const [description, setDescription] = useState(initialTask?.description || '');
  const [priority, setPriority] = useState<TaskPriority>(initialTask?.priority || 'medium');
  const [assigneeId, setAssigneeId] = useState<string | null>(initialTask?.assigneeId ?? null);
  const [dueDate, setDueDate] = useState<string>(initialTask?.dueDate || '');
  const [status, setStatus] = useState<TaskStatus>(initialTask?.status || 'todo');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const reassignAllowed = !isEditing || canReassign(initialTask!, currentUserId, isOwner);
  const statusAllowed = !isEditing || canChangeStatus(initialTask!, currentUserId, isOwner);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setErrors({});

    const formData = {
      title,
      description,
      priority,
      assigneeId: assigneeId || null,
      dueDate: dueDate.trim() ? dueDate.trim() : null,
    };

    const parsed = taskInputSchema.safeParse(formData);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }

    setSubmitting(true);
    try {
      await onSave({
        ...parsed.data,
        ...(isEditing ? { status } : {}),
      });
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'message' in err) {
        setSaveError((err as { message: string }).message);
      } else {
        setSaveError('Failed to save task. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        maxWidth: '560px',
        width: '100%',
      }}
    >
      {saveError && (
        <div
          role="alert"
          style={{
            padding: '12px 16px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid var(--danger)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--danger)',
            fontSize: '14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{saveError}</span>
          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: '4px 10px',
              backgroundColor: 'var(--danger)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: submitting ? 'not-allowed' : 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      )}

      <Field id="task-title" label="Title" error={errors.title} required>
        <input
          id="task-title"
          aria-label="Title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Implement authentication"
          style={{
            width: '100%',
            padding: '10px 14px',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-primary)',
            fontSize: '14px',
          }}
        />
      </Field>

      <Field id="task-description" label="Description" error={errors.description}>
        <textarea
          id="task-description"
          aria-label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add more details, acceptance criteria, or links..."
          rows={3}
          style={{
            width: '100%',
            padding: '10px 14px',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-primary)',
            fontSize: '14px',
            resize: 'vertical',
          }}
        />
      </Field>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <Field id="task-priority" label="Priority" error={errors.priority}>
          <select
            id="task-priority"
            aria-label="Priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
            style={{
              width: '100%',
              padding: '10px 14px',
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontSize: '14px',
            }}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </Field>

        <Field id="task-due-date" label="Due Date" error={errors.dueDate}>
          <input
            id="task-due-date"
            aria-label="Due Date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontSize: '14px',
            }}
          />
        </Field>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isEditing ? '1fr 1fr' : '1fr', gap: '16px' }}>
        <Field id="task-assignee" label="Assignee" error={errors.assigneeId}>
          <select
            id="task-assignee"
            aria-label="Assignee"
            value={assigneeId || ''}
            onChange={(e) => setAssigneeId(e.target.value || null)}
            disabled={!reassignAllowed}
            style={{
              width: '100%',
              padding: '10px 14px',
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontSize: '14px',
              opacity: reassignAllowed ? 1 : 0.6,
              cursor: reassignAllowed ? 'pointer' : 'not-allowed',
            }}
          >
            <option value="">Unassigned</option>
            {project.memberIds.map((uid) => (
              <option key={uid} value={uid}>
                {project.memberNames[uid] || uid}
              </option>
            ))}
          </select>
        </Field>

        {isEditing && (
          <Field id="task-status" label="Status" error={errors.status}>
            <select
              id="task-status"
              aria-label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              disabled={!statusAllowed}
              style={{
                width: '100%',
                padding: '10px 14px',
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                fontSize: '14px',
                opacity: statusAllowed ? 1 : 0.6,
                cursor: statusAllowed ? 'pointer' : 'not-allowed',
              }}
            >
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </Field>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          style={{
            padding: '10px 18px',
            backgroundColor: 'transparent',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            fontWeight: 600,
            fontSize: '14px',
            cursor: submitting ? 'not-allowed' : 'pointer',
          }}
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: '10px 22px',
            backgroundColor: 'var(--primary)',
            color: 'var(--primary-fg)',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            fontWeight: 600,
            fontSize: '14px',
            cursor: submitting ? 'not-allowed' : 'pointer',
            opacity: submitting ? 0.7 : 1,
          }}
        >
          {submitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Task'}
        </button>
      </div>
    </form>
  );
}
