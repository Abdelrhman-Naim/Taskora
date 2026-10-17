'use client';

import React from 'react';
import Link from 'next/link';
import { DashboardStatsData } from '@/lib/stats';
import { Project } from '@/types';
import { formatDueDate } from '@/lib/dates';
import { EmptyState } from '@/components/ui/EmptyState';
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
}: DashboardStatsProps) {
  if (!hasProjects) {
    return (
      <EmptyState
        title="No projects yet"
        message="Create your first project to start organizing tasks and tracking progress."
        action={{
          label: 'Create Project',
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
      {/* Overview Stat Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Total Tasks</span>
          <span className={styles.statValue}>{stats.totalTasks}</span>
        </div>

        <div className={styles.statCard}>
          <span className={styles.statLabel}>To Do</span>
          <span className={styles.statValue}>{stats.byStatus.todo}</span>
        </div>

        <div className={styles.statCard}>
          <span className={styles.statLabel}>In Progress</span>
          <span className={styles.statValue}>{stats.byStatus.in_progress}</span>
        </div>

        <div className={styles.statCard}>
          <span className={styles.statLabel}>Done</span>
          <span className={styles.statValue}>{stats.byStatus.done}</span>
        </div>
      </div>

      {/* Overdue Tasks Section */}
      <div className={styles.overdueSection}>
        <div className={styles.overdueHeader}>
          <h2 className={styles.overdueTitle}>
            Overdue Tasks
            {stats.overdue.length > 0 && (
              <span className={styles.overdueBadge}>{stats.overdue.length}</span>
            )}
          </h2>
        </div>

        {stats.overdue.length === 0 ? (
          <div className={styles.noOverdue}>
            <p>No overdue tasks. All caught up!</p>
          </div>
        ) : (
          <div className={styles.overdueList}>
            {stats.overdue.map((task) => {
              const projName = projectMap.get(task.projectId) || 'Project';
              return (
                <div key={task.id} className={styles.overdueItem}>
                  <div className={styles.itemInfo}>
                    <span className={styles.itemTitle}>{task.title}</span>
                    <div className={styles.itemMeta}>
                      <span>{projName}</span>
                      <span>&bull;</span>
                      <span className={styles.itemDue}>
                        Due: {formatDueDate(task.dueDate)}
                      </span>
                    </div>
                  </div>

                  <Link
                    href={`/projects/${task.projectId}`}
                    className={styles.viewLink}
                  >
                    View Project
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
