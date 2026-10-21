'use client';

import React, { useState } from 'react';
import { Project, Task, TaskPriority, TaskStatus, Recurrence, ChecklistItem } from '@/types';
import { taskInputSchema, fieldErrors } from '@/lib/validation';
import { canChangeStatus, canReassign } from '@/components/tasks/TaskCard';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { DatePicker } from '@/components/ui/DatePicker';
import { Button } from '@/components/ui/Button';
import { LabelsInput } from '@/components/tasks/LabelsInput';
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
    labels?: string[];
    recurrence?: Recurrence;
    checklist?: ChecklistItem[];
    multiAssigneeMode?: 'single' | 'shared' | 'individual';
    selectedMemberIds?: string[];
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

  const memberEntries = Object.entries(project.memberNames || {});
  const memberUids = Object.keys(project.memberNames || {});

  const [title, setTitle] = useState(initialTask?.title || '');
  const [description, setDescription] = useState(initialTask?.description || '');
  const [priority, setPriority] = useState<TaskPriority>(initialTask?.priority || 'medium');
  const [assigneeId, setAssigneeId] = useState<string | null>(initialTask?.assigneeId ?? null);
  const [dueDate, setDueDate] = useState<string>(initialTask?.dueDate || '');
  const [status, setStatus] = useState<TaskStatus>(initialTask?.status || 'todo');
  const [labels, setLabels] = useState<string[]>(initialTask?.labels || []);
  const [recurrence, setRecurrence] = useState<Recurrence>(initialTask?.recurrence || 'none');

  // Multi-assignee mode for new tasks
  const [assignmentMode, setAssignmentMode] = useState<'single' | 'shared' | 'individual'>('single');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(memberUids);

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

    if (!isEditing && assignmentMode !== 'single' && selectedMemberIds.length === 0) {
      setErrors({ assigneeId: 'validation.assignee.required' });
      return;
    }

    let finalChecklist: ChecklistItem[] = initialTask?.checklist || [];
    let finalAssigneeId: string | null = assigneeId || null;

    if (!isEditing && assignmentMode === 'shared') {
      finalAssigneeId = null;
      finalChecklist = selectedMemberIds.map((uid) => ({
        id: uid,
        text: project.memberNames[uid] || uid,
        done: false,
      }));
    }

    const formData = {
      title,
      description,
      priority,
      assigneeId: finalAssigneeId,
      dueDate: dueDate.trim() ? dueDate.trim() : null,
      labels,
      recurrence,
      checklist: finalChecklist,
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
        multiAssigneeMode: isEditing ? 'single' : assignmentMode,
        selectedMemberIds: assignmentMode !== 'single' ? selectedMemberIds : undefined,
        checklist: finalChecklist,
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
            <DatePicker
              {...fieldProps}
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              disabled={submitting}
              data-testid="task-due-date-input"
            />
          )}
        </Field>
      </div>

      <div className={styles.row}>
        {!isEditing ? (
          <div className={styles.modeContainer}>
            <Field
              id="task-assignee-mode"
              label={t('task.assignee.mode')}
              error={translateError(errors.assigneeId)}
            >
              {() => (
                <div
                  className={styles.modeSelector}
                  role="radiogroup"
                  aria-label={t('task.assignee.mode')}
                >
                  <button
                    type="button"
                    role="radio"
                    aria-checked={assignmentMode === 'single'}
                    className={`${styles.modeBtn} ${assignmentMode === 'single' ? styles.modeBtnActive : ''}`}
                    onClick={() => setAssignmentMode('single')}
                    disabled={submitting}
                  >
                    👤 {t('task.assignee.modeSingle')}
                  </button>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={assignmentMode === 'shared'}
                    className={`${styles.modeBtn} ${assignmentMode === 'shared' ? styles.modeBtnActive : ''}`}
                    onClick={() => setAssignmentMode('shared')}
                    disabled={submitting}
                  >
                    👥 {t('task.assignee.modeShared')}
                  </button>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={assignmentMode === 'individual'}
                    className={`${styles.modeBtn} ${assignmentMode === 'individual' ? styles.modeBtnActive : ''}`}
                    onClick={() => setAssignmentMode('individual')}
                    disabled={submitting}
                  >
                    📋 {t('task.assignee.modeIndividual')}
                  </button>
                </div>
              )}
            </Field>

            {assignmentMode === 'single' ? (
              <Field
                id="task-assignee"
                label={t('task.field.assignee')}
                error={translateError(errors.assigneeId)}
              >
                {(fieldProps) => (
                  <Select
                    {...fieldProps}
                    value={assigneeId || ''}
                    onChange={(e) => setAssigneeId(e.target.value || null)}
                    disabled={submitting || !reassignAllowed}
                    data-testid="task-assignee-select"
                  >
                    <option value="">{t('task.assignee.unassigned')}</option>
                    {memberEntries.map(([uid, name]) => (
                      <option key={uid} value={uid}>
                        {name}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
            ) : (
              <div className={styles.membersBox}>
                <div className={styles.membersHeader}>
                  <span className={styles.membersCount}>
                    {t('task.assignee.selectedMembers', { count: selectedMemberIds.length })}
                  </span>
                  <div className={styles.quickActions}>
                    <button
                      type="button"
                      className={styles.quickBtn}
                      onClick={() => setSelectedMemberIds(memberUids)}
                      disabled={submitting}
                    >
                      {t('task.assignee.selectAll')}
                    </button>
                    <span>·</span>
                    <button
                      type="button"
                      className={styles.quickBtn}
                      onClick={() => setSelectedMemberIds([])}
                      disabled={submitting}
                    >
                      {t('task.assignee.selectNone')}
                    </button>
                  </div>
                </div>

                <div className={styles.memberCheckboxList}>
                  {memberEntries.map(([uid, name]) => {
                    const isChecked = selectedMemberIds.includes(uid);
                    return (
                      <label key={uid} className={styles.memberCheckboxItem}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={submitting}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedMemberIds((prev) => [...prev, uid]);
                            } else {
                              setSelectedMemberIds((prev) => prev.filter((id) => id !== uid));
                            }
                          }}
                        />
                        <span className={styles.memberCheckboxName}>{name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
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
                {memberEntries.map(([uid, name]) => (
                  <option key={uid} value={uid}>
                    {name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        )}

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

      <div className={styles.row}>
        <Field id="task-recurrence" label={t('task.field.recurrence')} error={translateError(errors.recurrence)}>
          {(fieldProps) => (
            <Select
              {...fieldProps}
              value={recurrence}
              onChange={(e) => setRecurrence(e.target.value as Recurrence)}
              disabled={submitting}
              data-testid="task-recurrence-select"
            >
              <option value="none">{t('task.recurrence.none')}</option>
              <option value="daily">{t('task.recurrence.daily')}</option>
              <option value="weekly">{t('task.recurrence.weekly')}</option>
              <option value="monthly">{t('task.recurrence.monthly')}</option>
            </Select>
          )}
        </Field>
      </div>

      <div className={styles.row}>
        <Field id="task-labels" label={t('task.field.labels')} error={translateError(errors.labels)}>
          {() => (
            <LabelsInput
              value={labels}
              onChange={setLabels}
              max={5}
            />
          )}
        </Field>
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
