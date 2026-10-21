'use client';

import React, { useState, useEffect } from 'react';
import { TaskComment, Project, Task } from '@/types';
import { listComments, addComment, deleteComment } from '@/services/comments';
import { getDb } from '@/lib/firebase';
import { Avatar } from '@/components/ui/Avatar';
import { useI18n } from '@/i18n/I18nProvider';
import { useErrorMessage } from '@/i18n/useErrorMessage';
import styles from './CommentThread.module.css';

export interface CommentThreadProps {
  project: Project;
  task: Task;
  currentUserId: string;
  currentUserName: string;
  isOwner: boolean;
}

export function CommentThread({
  project,
  task,
  currentUserId,
  currentUserName,
  isOwner,
}: CommentThreadProps): React.ReactElement {
  const { t } = useI18n();
  const getErrorMessage = useErrorMessage();

  const [comments, setComments] = useState<TaskComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    async function fetchComments() {
      try {
        const db = getDb();
        const res = await listComments(db, project.id, task.id);
        if (!ignore) {
          // Ensure oldest first
          const sorted = [...res].sort((a, b) => {
            const timeA = a.createdAt ? a.createdAt.getTime() : 0;
            const timeB = b.createdAt ? b.createdAt.getTime() : 0;
            return timeA - timeB;
          });
          setComments(sorted);
        }
      } catch (err) {
        if (!ignore) {
          setError(getErrorMessage(err));
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    fetchComments();
    return () => {
      ignore = true;
    };
  }, [project.id, task.id, getErrorMessage]);

  const handleSend = async (customText?: string) => {
    const raw = typeof customText === 'string' ? customText : inputText;
    const trimmed = raw.trim();
    if (!trimmed || submitting) return;

    setError(null);
    setSubmitting(true);

    const tempId = `temp-${Date.now()}`;
    const optimisticComment: TaskComment = {
      id: tempId,
      projectId: project.id,
      taskId: task.id,
      authorId: currentUserId,
      authorName: currentUserName,
      text: trimmed,
      createdAt: new Date(),
    };

    // Optimistic update
    setComments((prev) => [...prev, optimisticComment]);
    setInputText('');

    try {
      const db = getDb();
      const actualId = await addComment(
        db,
        project.id,
        task.id,
        {
          actor: { uid: currentUserId, displayName: currentUserName },
          task,
          projectName: project.name,
        },
        trimmed
      );

      setComments((prev) =>
        prev.map((c) => (c.id === tempId ? { ...c, id: actualId } : c))
      );
    } catch (err) {
      // Rollback on failure
      setComments((prev) => prev.filter((c) => c.id !== tempId));
      setInputText(trimmed);
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    const prevComments = [...comments];
    setComments((prev) => prev.filter((c) => c.id !== commentId));

    try {
      const db = getDb();
      await deleteComment(db, project.id, task.id, commentId);
    } catch (err) {
      // Rollback
      setComments(prevComments);
      setError(getErrorMessage(err));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSend(e.currentTarget.value);
    }
  };

  return (
    <div className={styles.threadContainer} data-testid="task-comments-thread">
      <div className={styles.header}>
        <h4 className={styles.title}>{t('task.comments.title')}</h4>
        <span className={styles.counter} dir="ltr">
          {comments.length}
        </span>
      </div>

      {comments.length === 0 && !loading ? (
        <p className={styles.emptyState}>{t('task.comments.empty')}</p>
      ) : (
        <ul className={styles.commentsList}>
          {comments.map((comment) => {
            const canDelete =
              isOwner ||
              comment.authorId === currentUserId ||
              task.createdBy === currentUserId;

            return (
              <li
                key={comment.id}
                className={styles.commentItem}
                data-testid={`comment-item-${comment.id}`}
              >
                <div className={styles.commentHeader}>
                  <div className={styles.authorBox}>
                    <Avatar name={comment.authorName} size="sm" />
                    <bdi className={styles.authorName}>{comment.authorName}</bdi>
                  </div>
                  {canDelete && (
                    <button
                      type="button"
                      data-testid={`comment-delete-${comment.id}`}
                      onClick={() => handleDelete(comment.id)}
                      className={styles.deleteBtn}
                      aria-label={t('task.comments.delete')}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="6" />
                      </svg>
                    </button>
                  )}
                </div>
                <p className={styles.commentText} dir="auto">
                  {comment.text}
                </p>
              </li>
            );
          })}
        </ul>
      )}

      <div className={styles.inputBox}>
        <textarea
          data-testid="comment-input"
          placeholder={t('task.comments.placeholder')}
          value={inputText}
          disabled={submitting}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          className={styles.textarea}
          rows={3}
          maxLength={1000}
        />
        {error && (
          <p role="alert" className={styles.errorMessage}>
            {error}
          </p>
        )}
        <div className={styles.inputFooter}>
          <button
            type="button"
            data-testid="comment-submit-btn"
            disabled={!inputText.trim() || submitting}
            onClick={() => handleSend()}
            className={styles.submitBtn}
          >
            {t('task.comments.send')}
          </button>
        </div>
      </div>
    </div>
  );
}
