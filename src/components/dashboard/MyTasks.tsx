import React from 'react';
import Link from 'next/link';
import { Task } from '@/types';
import { useI18n } from '@/i18n/I18nProvider';
import { Icon } from '@/components/ui/Icon';
import styles from './MyTasks.module.css';

export interface MyTasksProps {
  tasks: Task[];
  projectName: (id: string) => string;
}

export function MyTasks({ tasks, projectName }: MyTasksProps): React.ReactElement {
  const { t } = useI18n();

  return (
    <div
      data-testid="my-tasks"
      className={styles.panel}
      role="region"
      aria-label={t('dashboard.myTasks.title')}
    >
      <div className={styles.header}>
        <div className={styles.title}>
          <Icon name="check" size={18} />
          <span>{t('dashboard.myTasks.title')}</span>
          {tasks.length > 0 && (
            <span className={`${styles.countBadge} num`}>{tasks.length}</span>
          )}
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className={styles.empty}>{t('dashboard.myTasks.empty')}</div>
      ) : (
        <ul className={styles.list}>
          {tasks.map((task) => {
            const isTodo = task.status === 'todo';
            const isProgress = task.status === 'in_progress';
            const statusDotClass = isTodo
              ? styles.statusTodo
              : isProgress
              ? styles.statusProgress
              : styles.statusDone;

            const statusText = isTodo
              ? t('task.status.todo')
              : isProgress
              ? t('task.status.in_progress')
              : t('task.status.done');

            return (
              <li key={task.id}>
                <Link
                  href={`/projects/${task.projectId}`}
                  className={styles.item}
                >
                  <div className={styles.itemMain}>
                    <span className={styles.taskTitle}>
                      <bdi dir="auto">{task.title}</bdi>
                    </span>
                    <div className={styles.taskMeta}>
                      <span className={styles.projectName}>
                        <bdi>{projectName(task.projectId)}</bdi>
                      </span>
                    </div>
                  </div>

                  <div className={styles.badges}>
                    <span className={styles.statusLabel}>
                      <span
                        className={`${styles.statusDot} ${statusDotClass}`}
                        aria-hidden="true"
                      />
                      <span>{statusText}</span>
                    </span>
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
