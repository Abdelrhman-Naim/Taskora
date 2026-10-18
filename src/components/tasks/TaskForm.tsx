'use client';

import React, { useState } from 'react';
import { Project, Task, TaskPriority, TaskStatus } from '@/types';
import { taskInputSchema, fieldErrors } from '@/lib/validation';
import { canChangeStatus, canReassign } from '@/components/tasks/TaskCard';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useI18n } from '@/i18n/I18nProvider';
import { useErrorMessage } from '@/i18n/useErrorMessage';
import { MessageKey } from '@/i18n/en';
import styles from './TaskForm.module.css';

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
}: TaskFormProps): React.ReactElement {
  const { t } = useI18n();
  const getErrorMessage = useErrorMessage();
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

  const translateError = (errKeyOrMsg: string | undefined): string | undefined => {
    if (!errKeyOrMsg) return undefined;
    const translated = t(errKeyOrMsg as MessageKey);
    return translated !== errKeyOrMsg ? translated : errKeyOrMsg;
  };

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
      setSaveError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className={styles.form}
      data-testid="task-form-modal"
    >
      {saveError && (
        <div role="alert" className={styles.errorAlert}>
          {saveError}
        </div>
      )}

      <Field
        id="task-title"
        label={t('task.field.title')}
        error={translateError(errors.title)}
        required
      >
        {(fieldProps) => (
          <Input
            {...fieldProps}
            type="text"
            dir="auto"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={submitting}
            placeholder={t('task.field.titlePlaceholder')}
            data-testid="task-title-input"
          />
        )}
      </Field>

      <Field
        id="task-description"
        label={t('task.field.description')}
        error={translateError(errors.description)}
      >
        {(fieldProps) => (
          <Textarea
            {...fieldProps}
            dir="auto"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={submitting}
            placeholder={t('task.field.descriptionPlaceholder')}
            rows={3}
            data-testid="task-description-input"
          />
        )}
      </Field>

      <div className={styles.row}>
        <Field id="task-priority" label={t('task.field.priority')} error={translateError(errors.priority)}>
          {(fieldProps) => (
            <Select
              {...fieldProps}
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              disabled={submitting}
              data-testid="task-priority-select"
            >
              <option value="low">{t('task.priority.low')}</option>
              <option value="medium">{t('task.priority.medium')}</option>
              <option value="high">{t('task.priority.high')}</option>
            </Select>
          )}
        </Field>

        <Field id="task-due-date" label={t('task.field.dueDate')} error={translateError(errors.dueDate)}>
          {(fieldProps) => (
            <Input
              {...fieldProps}
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              disabled={submitting}
              data-testid="task-due-date-input"
            />
          )}
        </Field>
      </div>

      <div className={styles.row}>
        <Field id="task-assignee" label={t('task.field.assignee')} error={translateError(errors.assigneeId)}>
          {(fieldProps) => (
            <Select
              {...fieldProps}
              value={assigneeId || ''}
              onChange={(e) => setAssigneeId(e.target.value || null)}
              disabled={submitting || !reassignAllowed}
              data-testid="task-assignee-select"
            >
              <option value="">{t('task.assignee.unassigned')}</option>
              {Object.entries(project.memberNames).map(([uid, name]) => (
                <option key={uid} value={uid}>
                  {name}
                </option>
              ))}
            </Select>
          )}
        </Field>

        {isEditing && (
          <Field id="task-status" label={t('task.field.status')} error={translateError(errors.status)}>
            {(fieldProps) => (
              <Select
                {...fieldProps}
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                disabled={submitting || !statusAllowed}
                data-testid="task-status-select"
              >
                <option value="todo">{t('task.status.todo')}</option>
                <option value="in_progress">{t('task.status.in_progress')}</option>
                <option value="done">{t('task.status.done')}</option>
              </Select>
            )}
          </Field>
        )}
      </div>

      <div className={styles.actions}>
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={submitting}
        >
          {t('common.cancel')}
        </Button>
        <Button
          type="submit"
          variant="primary"
          loading={submitting}
          data-testid="save-task-btn"
        >
          {isEditing ? t('common.save') : t('task.new.title')}
        </Button>
      </div>
    </form>
  );
}
