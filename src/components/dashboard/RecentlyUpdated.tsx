import React from 'react';
import Link from 'next/link';
import { Task } from '@/types';
import { useI18n } from '@/i18n/I18nProvider';
import { Icon } from '@/components/ui/Icon';
import { toDate } from '@/lib/dates';
import styles from './RecentlyUpdated.module.css';

export interface RecentlyUpdatedProps {
  tasks: Task[];
  projectName: (id: string) => string;
}

export function RecentlyUpdated({ tasks, projectName }: RecentlyUpdatedProps): React.ReactElement {
  const { t, locale } = useI18n();

  return (
    <div className={styles.panel} role="region" aria-label={t('dashboard.recent.title')}>
      <div className={styles.header}>
        <div className={styles.title}>
          <Icon name="clock" size={18} />
          <span>{t('dashboard.recent.title')}</span>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className={styles.empty}>{t('dashboard.recent.empty')}</div>
      ) : (
        <ul className={styles.list}>
          {tasks.map((task) => {
            const updatedDate = toDate(task.updatedAt);
            const dateFormatted = updatedDate
              ? new Intl.DateTimeFormat(locale, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                }).format(updatedDate)
              : '';

            return (
              <li key={task.id}>
                <Link
                  href={`/projects/${task.projectId}`}
                  className={styles.item}
                >
                  <span className={styles.taskTitle}>
                    <bdi dir="auto">{task.title}</bdi>
                  </span>
                  <div className={styles.meta}>
                    <span className={styles.projectName}>
                      <bdi>{projectName(task.projectId)}</bdi>
                    </span>
                    {dateFormatted && (
                      <span className="num" title={updatedDate?.toISOString() || ''}>
                        {dateFormatted}
                      </span>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
