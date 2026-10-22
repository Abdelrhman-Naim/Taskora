'use client';

// ============================================================================
// ZONE 1: IMPORTS
// ============================================================================
import React, { useId, useState } from 'react';
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

// ============================================================================
// ZONE 2: CONFIG & CONSTANTS
// ============================================================================
const MAX_TASK_LABELS = 5;
const DEFAULT_PRIORITY: TaskPriority = 'medium';
const DEFAULT_STATUS: TaskStatus = 'todo';
const DEFAULT_RECURRENCE: Recurrence = 'none';

// ============================================================================
// ZONE 3: TYPES & INTERFACES
// ============================================================================
export type AssignmentMode = 'single' | 'shared' | 'individual';

export interface TaskSavePayload {
  title: string;
  description: string;
  priority: TaskPriority;
  assigneeId: string | null;
  dueDate: string | null;
  status?: TaskStatus;
  labels?: string[];
  recurrence?: Recurrence;
  checklist?: ChecklistItem[];
  multiAssigneeMode?: AssignmentMode;
  selectedMemberIds?: string[];
}

export interface TaskFormProps {
  project: Project;
  initialTask?: Task | null;
  currentUserId: string;
  isOwner: boolean;
  onSave: (data: TaskSavePayload) => Promise<void>;
  onCancel: () => void;
}

interface AssigneeSelectProps {
  value: string | null;
  onChange: (value: string | null) => void;
  memberEntries: [string, string][];
  disabled: boolean;
  error?: string;
  label: string;
  unassignedLabel: string;
}

interface MultiAssigneePickerProps {
  mode: AssignmentMode;
  onModeChange: (mode: AssignmentMode) => void;
  selectedIds: string[];
  onToggleMember: (id: string, checked: boolean) => void;
  onSelectAll: () => void;
  onSelectNone: () => void;
  memberEntries: [string, string][];
  disabled: boolean;
  assigneeError?: string;
  modeLabel: string;
  singleLabel: string;
  sharedLabel: string;
  individualLabel: string;
  selectedMembersCountLabel: string;
  selectAllLabel: string;
  selectNoneLabel: string;
  singleAssigneeSlot: React.ReactNode;
}

// ============================================================================
// ZONE 4: HELPERS & HOOKS
// ============================================================================
function buildSharedChecklist(
  memberIds: string[],
  memberNames: Record<string, string>
): ChecklistItem[] {
  return memberIds.map((uid) => ({
    id: uid,
    text: memberNames[uid] || uid,
    done: false,
  }));
}

function resolveErrorMessage(
  translator: (key: MessageKey) => string,
  keyOrMsg?: string
): string | undefined {
  if (!keyOrMsg) return undefined;
  const translated = translator(keyOrMsg as MessageKey);
  return translated !== keyOrMsg ? translated : keyOrMsg;
}

// ============================================================================
// ZONE 5: SUB-COMPONENTS
// ============================================================================
function AssigneeSelectField({
  value,
  onChange,
  memberEntries,
  disabled,
  error,
  label,
  unassignedLabel,
}: AssigneeSelectProps): React.ReactElement {
  return (
    <Field id="task-assignee" label={label} error={error}>
      {(fieldProps) => (
        <Select
          {...fieldProps}
          value={value || ''}
          onChange={(e) => onChange(e.target.value || null)}
          disabled={disabled}
          data-testid="task-assignee-select"
        >
          <option value="">{unassignedLabel}</option>
          {memberEntries.map(([uid, name]) => (
            <option key={uid} value={uid}>
              {name}
            </option>
          ))}
        </Select>
      )}
    </Field>
  );
}

function MultiAssigneePicker({
  mode,
  onModeChange,
  selectedIds,
  onToggleMember,
  onSelectAll,
  onSelectNone,
  memberEntries,
  disabled,
  assigneeError,
  modeLabel,
  singleLabel,
  sharedLabel,
  individualLabel,
  selectedMembersCountLabel,
  selectAllLabel,
  selectNoneLabel,
  singleAssigneeSlot,
}: MultiAssigneePickerProps): React.ReactElement {
  return (
    <div className={styles.modeContainer}>
      <Field id="task-assignee-mode" label={modeLabel} error={assigneeError}>
        {() => (
          <div
            className={styles.modeSelector}
            role="radiogroup"
            aria-label={modeLabel}
          >
            <button
              type="button"
              role="radio"
              aria-checked={mode === 'single'}
              className={`${styles.modeBtn} ${mode === 'single' ? styles.modeBtnActive : ''}`}
              onClick={() => onModeChange('single')}
              disabled={disabled}
            >
              👤 {singleLabel}
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={mode === 'shared'}
              className={`${styles.modeBtn} ${mode === 'shared' ? styles.modeBtnActive : ''}`}
              onClick={() => onModeChange('shared')}
              disabled={disabled}
            >
              👥 {sharedLabel}
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={mode === 'individual'}
              className={`${styles.modeBtn} ${mode === 'individual' ? styles.modeBtnActive : ''}`}
              onClick={() => onModeChange('individual')}
              disabled={disabled}
            >
              📋 {individualLabel}
            </button>
          </div>
        )}
      </Field>

      {mode === 'single' ? (
        singleAssigneeSlot
      ) : (
        <div className={styles.membersBox}>
          <div className={styles.membersHeader}>
            <span className={styles.membersCount}>{selectedMembersCountLabel}</span>
            <div className={styles.quickActions}>
              <button
                type="button"
                className={styles.quickBtn}
                onClick={onSelectAll}
                disabled={disabled}
              >
                {selectAllLabel}
              </button>
              <span>·</span>
              <button
                type="button"
                className={styles.quickBtn}
                onClick={onSelectNone}
                disabled={disabled}
              >
                {selectNoneLabel}
              </button>
            </div>
          </div>

          <div className={styles.memberCheckboxList}>
            {memberEntries.map(([uid, name]) => {
              const isChecked = selectedIds.includes(uid);
              return (
                <label key={uid} className={styles.memberCheckboxItem}>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    disabled={disabled}
                    onChange={(e) => onToggleMember(uid, e.target.checked)}
                  />
                  <span className={styles.memberCheckboxName}>{name}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// ZONE 6: MAIN COMPONENT
// ============================================================================
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

  // Form Fields
  const [title, setTitle] = useState(initialTask?.title || '');
  const [description, setDescription] = useState(initialTask?.description || '');
  const [priority, setPriority] = useState<TaskPriority>(initialTask?.priority || DEFAULT_PRIORITY);
  const [assigneeId, setAssigneeId] = useState<string | null>(initialTask?.assigneeId ?? null);
  const [dueDate, setDueDate] = useState<string>(initialTask?.dueDate || '');
  const [status, setStatus] = useState<TaskStatus>(initialTask?.status || DEFAULT_STATUS);
  const [labels, setLabels] = useState<string[]>(initialTask?.labels || []);
  const [recurrence, setRecurrence] = useState<Recurrence>(initialTask?.recurrence || DEFAULT_RECURRENCE);

  // Multi-assignee mode for new tasks
  const [assignmentMode, setAssignmentMode] = useState<AssignmentMode>('single');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(memberUids);

  // UI state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const reassignAllowed = !isEditing || canReassign(initialTask!, currentUserId, isOwner);
  const statusAllowed = !isEditing || canChangeStatus(initialTask!, currentUserId, isOwner);

  const translate = (keyOrMsg?: string) => resolveErrorMessage(t, keyOrMsg);

  const handleToggleMember = (uid: string, checked: boolean) => {
    setSelectedMemberIds((prev) =>
      checked ? [...prev, uid] : prev.filter((id) => id !== uid)
    );
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
      finalChecklist = buildSharedChecklist(selectedMemberIds, project.memberNames || {});
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

  const assigneeSelectElement = (
    <AssigneeSelectField
      value={assigneeId}
      onChange={setAssigneeId}
      memberEntries={memberEntries}
      disabled={submitting || !reassignAllowed}
      error={translate(errors.assigneeId)}
      label={t('task.field.assignee')}
      unassignedLabel={t('task.assignee.unassigned')}
    />
  );

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

      {/* Title */}
      <Field
        id="task-title"
        label={t('task.field.title')}
        error={translate(errors.title)}
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

      {/* Description */}
      <Field
        id="task-description"
        label={t('task.field.description')}
        error={translate(errors.description)}
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

      {/* Priority & Due Date */}
      <div className={styles.row}>
        <Field id="task-priority" label={t('task.field.priority')} error={translate(errors.priority)}>
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

        <Field id="task-due-date" label={t('task.field.dueDate')} error={translate(errors.dueDate)}>
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

      {/* Assignee / Multi-assignee */}
      <div className={styles.row}>
        {!isEditing ? (
          <MultiAssigneePicker
            mode={assignmentMode}
            onModeChange={setAssignmentMode}
            selectedIds={selectedMemberIds}
            onToggleMember={handleToggleMember}
            onSelectAll={() => setSelectedMemberIds(memberUids)}
            onSelectNone={() => setSelectedMemberIds([])}
            memberEntries={memberEntries}
            disabled={submitting}
            assigneeError={translate(errors.assigneeId)}
            modeLabel={t('task.assignee.mode')}
            singleLabel={t('task.assignee.modeSingle')}
            sharedLabel={t('task.assignee.modeShared')}
            individualLabel={t('task.assignee.modeIndividual')}
            selectedMembersCountLabel={t('task.assignee.selectedMembers', { count: selectedMemberIds.length })}
            selectAllLabel={t('task.assignee.selectAll')}
            selectNoneLabel={t('task.assignee.selectNone')}
            singleAssigneeSlot={assigneeSelectElement}
          />
        ) : (
          assigneeSelectElement
        )}

        {isEditing && (
          <Field id="task-status" label={t('task.field.status')} error={translate(errors.status)}>
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

      {/* Recurrence */}
      <div className={styles.row}>
        <Field id="task-recurrence" label={t('task.field.recurrence')} error={translate(errors.recurrence)}>
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

      {/* Labels */}
      <div className={styles.row}>
        <Field id="task-labels" label={t('task.field.labels')} error={translate(errors.labels)}>
          {() => (
            <LabelsInput
              value={labels}
              onChange={setLabels}
              max={MAX_TASK_LABELS}
            />
          )}
        </Field>
      </div>

      {/* Actions */}
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
