'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Project, Task } from '@/types';
import { getDb } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { AppError } from '@/lib/errors';
import { computeStats, loadDashboardData, DashboardStatsData } from '@/lib/stats';
import { todayString } from '@/lib/dates';
import { useI18n } from '@/i18n/I18nProvider';
import { useErrorMessage } from '@/i18n/useErrorMessage';
import styles from './page.module.css';

export default function DashboardPage(): React.ReactElement {
  const { user } = useAuth();
  const { t, tp, formatDueDate } = useI18n();
  const getErrorMessage = useErrorMessage();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);

  useEffect(() => {
    let ignore = false;
    async function load() {
      if (!user) return;
      try {
        const db = getDb();
        const data = await loadDashboardData(db, user.uid);
        if (!ignore) {
          setProjects(data.projects);
          setTasks(data.tasks);
        }
      } catch (err) {
        if (!ignore) {
          if (err instanceof AppError) {
            setError(err);
          } else {
            setError(new AppError('unknown', 'Failed to load dashboard data.'));
          }
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [user]);

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    if (!user) return;
    const db = getDb();
    loadDashboardData(db, user.uid)
      .then((data) => {
        setProjects(data.projects);
        setTasks(data.tasks);
      })
      .catch((err) => {
        if (err instanceof AppError) {
          setError(err);
        } else {
          setError(new AppError('unknown', 'Failed to load dashboard data.'));
        }
      })
      .finally(() => setLoading(false));
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minBlockSize: '40vh' }}>
        <Spinner size={36} label={t('common.loading')} />
      </div>
    );
  }

  if (error) {
    return <ErrorState message={getErrorMessage(error)} onRetry={handleRetry} />;
  }

  const stats: DashboardStatsData = computeStats(tasks, todayString());

  return (
    <div>
      {/* Header with Brass Hairline Rule */}
      <div className={styles.header}>
        <div className={styles.topRow}>
          <div>
            <h1 className={styles.greeting}>
              {(() => {
                const template = t('dashboard.welcome', { name: '___NAME___' });
                const [pre, post] = template.split('___NAME___');
                return (
                  <>
                    {pre}
                    <bdi>{user?.displayName || user?.email || ''}</bdi>
                    {post}
                  </>
                );
              })()}
            </h1>
          </div>

          <Button href="/projects/new" variant="primary" icon="plus">
            {t('dashboard.projects.createButton')}
          </Button>
        </div>

        {/* The Bold Brass Rule */}
        <div className={styles.brassRule} />
      </div>

      {/* Dashboard Statistics & Overdue List */}
      <DashboardStats
        stats={stats}
        projects={projects}
        hasProjects={projects.length > 0}
      />

      {/* Projects List as Rows */}
      {projects.length > 0 && (
        <section className={styles.projectsSection}>
          <div className={styles.projectsHeader}>
            <h2 className={styles.projectsTitle}>
              {t('dashboard.projects.title')}{' '}
              <span className="num" style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                ({projects.length})
              </span>
            </h2>
          </div>

          <div className={styles.projectsList}>
            {projects.map((project) => {
              const projTasks = tasks.filter((task) => task.projectId === project.id);
              const doneTasks = projTasks.filter((task) => task.status === 'done').length;
              const totalTasks = projTasks.length;
              const isoDate = project.updatedAt instanceof Date
                ? project.updatedAt.toISOString().slice(0, 10)
                : null;

              return (
                <div key={project.id} className={styles.projectRow}>
                  <div className={styles.projectInfo}>
                    <Link href={`/projects/${project.id}`} className={styles.projectName} dir="auto">
                      {project.name}
                    </Link>
                    <div className={styles.projectMeta}>
                      <span>{tp('members.count', project.memberIds.length)}</span>
                      {isoDate && (
                        <>
                          <span>&bull;</span>
                          <span>{t('project.card.updated', { date: formatDueDate(isoDate) })}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className={styles.progressContainer}>
                    <ProgressBar
                      value={doneTasks}
                      max={totalTasks}
                      label={`${doneTasks} / ${totalTasks}`}
                    />
                    <span className={styles.progressLabel}>
                      {doneTasks}/{totalTasks} {t('dashboard.stats.done')}
                    </span>
                  </div>

                  <div className={styles.rowActions}>
                    <Link href={`/projects/${project.id}/settings`}>
                      <IconButton
                        icon="settings"
                        label={t('project.card.settings')}
                        variant="ghost"
                        size="sm"
                      />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
