'use client';

// ============================================================================
// 1. IMPORTS
// ============================================================================
import React, { useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/i18n/I18nProvider';
import { useErrorMessage } from '@/i18n/useErrorMessage';
import { createTask } from '@/services/tasks';
import { getDb } from '@/lib/firebase';
import { Project, TaskPriority, TaskInput } from '@/types';
import { ChatMessage } from '@/types/chat';

// ============================================================================
// 2. CONFIGURATION & STYLES (EASY EDIT ZONE)
// ============================================================================
const MODAL_STYLES = {
  form: 'flex flex-col gap-4 text-text',
  field: 'flex flex-col gap-1.5',
  label: 'text-xs font-medium text-text-2',
  input: 'w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-text placeholder:text-text-3 focus:border-accent focus:outline-none transition-colors min-h-[44px]',
  textarea: 'w-full rounded-lg border border-line bg-bg p-3 text-sm text-text placeholder:text-text-3 focus:border-accent focus:outline-none transition-colors min-h-[90px] resize-y',
  actions: 'flex items-center justify-end gap-2 pt-3 border-t border-line',
  errorAlert: 'p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs',
};

// ============================================================================
// 3. TYPES & INTERFACES
// ============================================================================
export interface MessageToTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: ChatMessage | null;
  project: Project;
  currentUserId?: string;
  onTaskCreated?: () => void;
}

// ============================================================================
// 4. MAIN COMPONENT
// ============================================================================
export function MessageToTaskModal({
  isOpen,
  onClose,
  message,
  project,
  currentUserId,
  onTaskCreated,
}: MessageToTaskModalProps): React.ReactElement {
  const { user } = useAuth();
  const effectiveUid = currentUserId || user?.uid;
  const { locale } = useI18n();
  const getErrorMessage = useErrorMessage();
  const isAr = locale === 'ar';

  const [prevMessageId, setPrevMessageId] = useState<string | null>(null);
  const [title, setTitle] = useState(() => (message ? message.text.split('\n')[0].slice(0, 80) : ''));
  const [description, setDescription] = useState(() =>
    message
      ? isAr
        ? `تم إنشاؤها من محادثة المشروع بواسطة [${message.senderName}]:\n"${message.text}"`
        : `Created from project chat by [${message.senderName}]:\n"${message.text}"`
      : ''
  );
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [assigneeId, setAssigneeId] = useState<string>(() => message?.senderId || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state during render when message prop changes
  if (message && message.id !== prevMessageId) {
    setPrevMessageId(message.id);
    setTitle(message.text.split('\n')[0].slice(0, 80));
    setDescription(
      isAr
        ? `تم إنشاؤها من محادثة المشروع بواسطة [${message.senderName}]:\n"${message.text}"`
        : `Created from project chat by [${message.senderName}]:\n"${message.text}"`
    );
    setAssigneeId(message.senderId || '');
    setPriority('medium');
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !effectiveUid || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const db = getDb();
      const taskInput: TaskInput = {
        title: title.trim(),
        description: description.trim(),
        priority,
        assigneeId: assigneeId || null,
        dueDate: null,
      };

      await createTask(db, project.id, effectiveUid, taskInput);
      onTaskCreated?.();
      onClose();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  const membersList = project.memberProfiles && project.memberProfiles.length > 0
    ? project.memberProfiles.map((p) => ({ uid: p.uid, name: p.displayName, role: p.jobTitle }))
    : project.memberIds.map((uid) => ({
        uid,
        name: project.memberNames[uid] || 'Member',
        role: uid === project.ownerId ? 'Project Manager' : 'Team Member',
      }));

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={isAr ? 'تحويل الرسالة إلى مهمة' : 'Convert Message to Task'}
      size="md"
    >
      <div data-testid="message-to-task-dialog">
        <form onSubmit={handleSubmit} className={MODAL_STYLES.form}>
          {error && <div className={MODAL_STYLES.errorAlert}>{error}</div>}

          {/* Title */}
          <div className={MODAL_STYLES.field}>
            <label htmlFor="task-title-input" className={MODAL_STYLES.label}>
              {isAr ? 'عنوان المهمة *' : 'Task Title *'}
            </label>
            <input
              id="task-title-input"
              data-testid="task-title-input"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={MODAL_STYLES.input}
              placeholder={isAr ? 'اكتب عنوان المهمة...' : 'Enter task title...'}
            />
          </div>

          {/* Description */}
          <div className={MODAL_STYLES.field}>
            <label htmlFor="task-desc-input" className={MODAL_STYLES.label}>
              {isAr ? 'الوصف والتفاصيل' : 'Description & Context'}
            </label>
            <textarea
              id="task-desc-input"
              data-testid="task-desc-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={MODAL_STYLES.textarea}
              rows={3}
            />
          </div>

          {/* Priority & Assignee Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className={MODAL_STYLES.field}>
              <label className={MODAL_STYLES.label}>
                {isAr ? 'الأولوية' : 'Priority'}
              </label>
              <Select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full"
              >
                <option value="low">{isAr ? 'منخفضة' : 'Low'}</option>
                <option value="medium">{isAr ? 'متوسطة' : 'Medium'}</option>
                <option value="high">{isAr ? 'عالية' : 'High'}</option>
              </Select>
            </div>

            <div className={MODAL_STYLES.field}>
              <label className={MODAL_STYLES.label}>
                {isAr ? 'المكلّف' : 'Assignee'}
              </label>
              <Select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full"
              >
                <option value="">{isAr ? 'بدون مكلّف' : 'Unassigned'}</option>
                {membersList.map((m) => (
                  <option key={m.uid} value={m.uid}>
                    {m.name} ({m.role})
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {/* Actions */}
          <div className={MODAL_STYLES.actions}>
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </Button>

            <Button
              type="submit"
              variant="primary"
              data-testid="create-task-from-msg-btn"
              loading={isSubmitting}
              disabled={isSubmitting || !title.trim()}
            >
              {isAr ? 'إنشاء المهمة' : 'Create Task'}
            </Button>
          </div>
        </form>
      </div>
    </Dialog>
  );
}
