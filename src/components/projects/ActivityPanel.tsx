'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { ActivityEntry, ActivityType } from '@/types';
import { listActivity } from '@/services/activity';
import { getDb } from '@/lib/firebase';
import { Dialog } from '@/components/ui/Dialog';
import { useI18n } from '@/i18n/I18nProvider';
import { useErrorMessage } from '@/i18n/useErrorMessage';
import { formatDateTime } from '@/lib/dates';
import { MessageKey } from '@/i18n/en';
import styles from './ActivityPanel.module.css';

export interface ActivityPanelProps {
  projectId: string;
  isOpen?: boolean;
  onClose?: () => void;
  currentUserId?: string;
  currentUserName?: string;
  isOwner?: boolean;
}

function renderEventIcon(type: ActivityType) {
  switch (type) {
    case 'task_created':
      return (
        <span className={`${styles.iconWrapper} ${styles.iconTask}`}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </span>
      );
    case 'task_status_changed':
      return (
        <span className={`${styles.iconWrapper} ${styles.iconStatus}`}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>
      );
    case 'task_deleted':
      return (
        <span className={`${styles.iconWrapper} ${styles.iconTask}`}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </span>
      );
    case 'comment_added':
      return (
        <span className={`${styles.iconWrapper} ${styles.iconComment}`}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </span>
      );
    case 'task_assigned':
    case 'member_added':
    case 'member_removed':
    default:
      return (
        <span className={`${styles.iconWrapper} ${styles.iconMember}`}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
          </svg>
        </span>
      );
  }
}

function renderActivityContent(
  entry: ActivityEntry,
  t: (k: MessageKey, params?: Record<string, string | number>) => string
) {
  let templateKey = `activity.${entry.type}` as MessageKey;
  if (entry.type === 'task_assigned' && !entry.detail) {
    templateKey = 'activity.task_unassigned';
  }
  const rawTemplate = t(templateKey);
  const parts = rawTemplate.split(/(\{actor\}|\{task\}|\{from\}|\{to\}|\{assignee\}|\{member\})/g);

  let fromText = '';
  let toText = '';
  if (entry.type === 'task_status_changed' && entry.detail) {
    const [fromS, toS] = entry.detail.split('>');
    fromText = fromS ? t(`task.status.${fromS}` as MessageKey) : fromS;
    toText = toS ? t(`task.status.${toS}` as MessageKey) : toS;
  }

  const taskText = entry.taskTitle || t('activity.unnamedTask');

  return parts.map((part, i) => {
    if (part === '{actor}') {
      return <bdi key={i}>{entry.actorName}</bdi>;
    }
    if (part === '{task}') {
      return <bdi key={i}>{taskText}</bdi>;
    }
    if (part === '{from}') {
      return fromText;
    }
    if (part === '{to}') {
      return toText;
    }
    if (part === '{assignee}') {
      return <bdi key={i}>{entry.detail || ''}</bdi>;
    }
    if (part === '{member}') {
      return <bdi key={i}>{entry.detail || ''}</bdi>;
    }
    return part;
  });
}

export function ActivityPanel({
  projectId,
  isOpen = true,
  onClose,
  currentUserId = '',
  currentUserName = '',
  isOwner = false,
}: ActivityPanelProps): React.ReactElement | null {
  const { t, tp, locale } = useI18n();
  const getErrorMessage = useErrorMessage();
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    setRefreshKey((k) => k + 1);
  };

  useEffect(() => {
    if (!isOpen) return;

    let ignore = false;
    async function fetchActivities() {
      try {
        const db = getDb();
        const list = await listActivity(db, projectId, 50);
        if (!ignore) {
          const sorted = [...list].sort((a, b) => {
            const timeA = a.createdAt ? a.createdAt.getTime() : 0;
            const timeB = b.createdAt ? b.createdAt.getTime() : 0;
            return timeB - timeA;
          });
          setEntries(sorted);
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

    fetchActivities();
    return () => {
      ignore = true;
    };
  }, [isOpen, projectId, refreshKey, getErrorMessage]);

  if (!isOpen) return null;

  // User Instruction:
  // "سجل نشاط المشروع بيظهر للعضو نشاطو فقط اما الادمن بشوف كل الانشطة"
  // Owner/Admin sees ALL activities. Member sees only their own activity!
  const visibleEntries = useMemo(() => {
    if (isOwner || !currentUserId) {
      return entries;
    }
    const myName = (currentUserName || '').trim().toLowerCase();
    return entries.filter((entry) => {
      if (entry.actorId === currentUserId) return true;
      if (myName && entry.detail && typeof entry.detail === 'string') {
        if (entry.detail.toLowerCase().includes(myName)) return true;
      }
      return false;
    });
  }, [entries, isOwner, currentUserId, currentUserName]);

  const panelContent = (
    <div className={styles.container} data-testid="project-activity-panel">
      {loading ? (
        <div className={styles.skeletonList} data-testid="activity-skeleton">
          <div className={styles.skeletonItem} />
          <div className={styles.skeletonItem} />
          <div className={styles.skeletonItem} />
        </div>
      ) : error ? (
        <div className={styles.errorState}>
          <p>{error}</p>
          <button
            type="button"
            className={styles.retryBtn}
            data-testid="activity-retry-btn"
            onClick={handleRetry}
          >
            {t('activity.retry')}
          </button>
        </div>
      ) : visibleEntries.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-6 text-center">
          <div className="flex items-center justify-between w-full pb-2 mb-2 border-b border-line/40 text-xs text-text-2">
            <span className="font-medium text-text">
              {isOwner
                ? (locale === 'ar' ? 'عرض كافة أنشطة الفريق (إدارة المشروع)' : 'All Team Activities (Admin View)')
                : (locale === 'ar' ? 'سجل نشاطك الخاص في المشروع' : 'Your Personal Activity Log')}
            </span>
          </div>
          <p className={styles.emptyState} data-testid="activity-empty-state">
            {isOwner ? t('activity.empty') : (locale === 'ar' ? 'لم تقم بأي أنشطة في هذا المشروع حتى الآن' : 'No personal activity recorded yet in this project')}
          </p>
        </div>
      ) : (
        <ul className={styles.list} data-testid="activity-list">
          <div className="flex items-center justify-between px-2 py-1.5 mb-2 border-b border-line/40 text-xs text-text-2">
            <span className="font-semibold text-text">
              {isOwner
                ? (locale === 'ar' ? 'عرض كافة أنشطة الفريق (إدارة المشروع)' : 'All Team Activities (Admin View)')
                : (locale === 'ar' ? 'سجل نشاطك الخاص في المشروع' : 'Your Personal Activity Log')}
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-surface border border-line">
              {visibleEntries.length} {locale === 'ar' ? 'سجل' : 'events'}
            </span>
          </div>
          {visibleEntries.map((entry) => {
            const timeStr = formatDateTime(entry.createdAt);

            return (
              <li
                key={entry.id}
                className={styles.item}
                data-testid={`activity-item-${entry.id}`}
              >
                {renderEventIcon(entry.type)}
                <div className={styles.content}>
                  <p className={styles.message} dir="auto">
                    {renderActivityContent(entry, t)}
                  </p>
                  {timeStr && (
                    <span className={styles.time} dir="ltr">
                      <svg
                        className={styles.timeIcon}
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      <span className="num">{timeStr}</span>
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );

  if (onClose) {
    return (
      <Dialog
        isOpen={isOpen}
        onClose={onClose}
        title={t('activity.title')}
        size="lg"
      >
        {panelContent}
      </Dialog>
    );
  }

  return panelContent;
}
