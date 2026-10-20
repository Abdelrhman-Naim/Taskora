'use client';

import React from 'react';
import { DashboardStatsData } from '@/lib/stats';
import { Project } from '@/types';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useI18n } from '@/i18n/I18nProvider';
import styles from './DashboardStats.module.css';

export interface DashboardStatsProps {
  stats: DashboardStatsData;
  projects: Project[];
  hasProjects: boolean;
}

export function DashboardStats({
  stats,
  projects,
  hasProjects,
}: DashboardStatsProps): React.ReactElement {
  const { t } = useI18n();

  if (!hasProjects) {
    return (
      <EmptyState
        title={t('dashboard.projects.emptyTitle')}
        message={t('dashboard.projects.emptyDescription')}
        action={{
          label: t('dashboard.projects.createButton'),
          href: '/projects/new',
        }}
      />
    );
  }

  const projectMap = new Map<string, string>();
  for (const p of projects) {
    projectMap.set(p.id, p.name);
  }

  return (
    <div className={styles.container}>
      {/* Ledger Bar (The One Bold Thing) */}
      <div className={styles.ledger} data-testid="dashboard-ledger">
        <div className={styles.ledgerItem}>
          <span className={`${styles.statNum} num`}>{stats.totalTasks}</span>
          <span className={styles.statLabel}>{t('dashboard.stats.total')}</span>
        </div>

        <div className={styles.ledgerItem}>
          <span className={`${styles.statNum} num`}>{stats.byStatus.todo}</span>
          <span className={styles.statLabel}>{t('dashboard.stats.todo')}</span>
        </div>

        <div className={styles.ledgerItem}>
          <span className={`${styles.statNum} num`}>{stats.byStatus.in_progress}</span>
          <span className={styles.statLabel}>{t('dashboard.stats.in_progress')}</span>
        </div>

        <div className={styles.ledgerItem}>
          <span className={`${styles.statNum} num`}>{stats.byStatus.done}</span>
          <span className={styles.statLabel}>{t('dashboard.stats.done')}</span>
        </div>

        <div className={styles.ledgerItem}>
          <span className={`${styles.statNum} ${styles.overdue} num`}>
            {stats.overdue.length}
          </span>
          <span className={styles.statLabel}>{t('dashboard.stats.overdue')}</span>
        </div>
      </div>

      {/* Overdue Tasks Section */}
      <div className={styles.overdueSection}>
        <div className={styles.overdueHeader}>
          <h2 className={styles.overdueTitle}>
            {t('dashboard.overdue.title')}
            {stats.overdue.length > 0 && <Badge kind="overdue" />}
          </h2>
        </div>

        {stats.overdue.length === 0 ? (
          <div className={styles.noOverdue}>
            <p>{t('dashboard.overdue.empty')}</p>
          </div>
        ) : (
          <div className={styles.overdueList}>
            {stats.overdue.map((task) => {
              const projName = projectMap.get(task.projectId) || 'Project';
              return (
                <div key={task.id} className={styles.overdueItem}>
                  <div className={styles.itemInfo}>
                    <span className={styles.itemTitle} dir="auto">
                      {task.title}
                    </span>
                    <div className={styles.itemMeta}>
                      <span dir="auto">{projName}</span>
                      <span>&bull;</span>
                      <span>{t('task.dueOn', { date: task.dueDate ? task.dueDate.replace(/-/g, '/') : '' })}</span>
                    </div>
                  </div>

                  <Button href={`/projects/${task.projectId}`} variant="secondary" size="sm">
                    {t('common.details')}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
