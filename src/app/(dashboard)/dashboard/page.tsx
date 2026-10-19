'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/i18n/I18nProvider';
import { useErrorMessage } from '@/i18n/useErrorMessage';
import { useDashboardData } from '@/components/dashboard/useDashboardData';
import { KpiStrip } from '@/components/dashboard/KpiStrip';
import { HeroMetric } from '@/components/dashboard/HeroMetric';
import { NeedsAttention } from '@/components/dashboard/NeedsAttention';
import { MyTasks } from '@/components/dashboard/MyTasks';
import { ProjectsTable } from '@/components/dashboard/ProjectsTable';
import { RecentlyUpdated } from '@/components/dashboard/RecentlyUpdated';
import { OnboardingEmpty } from '@/components/dashboard/OnboardingEmpty';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { ChartPanel } from '@/components/charts/ChartPanel';
import { StackedBars } from '@/components/charts/StackedBars';
import { ColumnChart } from '@/components/charts/ColumnChart';
import { ErrorState } from '@/components/ui/ErrorState';
import { Icon } from '@/components/ui/Icon';
import {
  computeMetrics,
  summarizeProjects,
  topProjectsByOpen,
  dueTimeline,
  needsAttention,
  myTasks,
  recentlyUpdated,
} from '@/lib/dashboardMetrics';
import { todayString, APP_TIME_ZONE } from '@/lib/dates';
import styles from './page.module.css';

export default function DashboardPage(): React.ReactElement {
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const getErrorMessage = useErrorMessage();
  const { projects, tasks, loading, error, reload } = useDashboardData();

  const today = useMemo(() => todayString(), []);

  // Riyadh-based hour for greeting
  const isMorning = useMemo(() => {
    try {
      const hourStr = new Intl.DateTimeFormat('en-US', {
        timeZone: APP_TIME_ZONE,
        hour: 'numeric',
        hourCycle: 'h23',
      }).format(new Date());
      const hour = parseInt(hourStr, 10);
      return hour >= 5 && hour < 12;
    } catch {
      return true;
    }
  }, []);

  const fullDateFormatted = useMemo(() => {
    try {
      return new Intl.DateTimeFormat(`${locale}-u-nu-latn-ca-gregory`, {
        timeZone: APP_TIME_ZONE,
        dateStyle: 'full',
      }).format(new Date());
    } catch {
      return '';
    }
  }, [locale]);

  const projectNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of projects) {
      map.set(p.id, p.name);
    }
    return (id: string) => map.get(id) || 'Unknown';
  }, [projects]);

  const metrics = useMemo(() => computeMetrics(tasks, today), [tasks, today]);

  const summaries = useMemo(
    () => summarizeProjects(projects, tasks, user?.uid || '', today),
    [projects, tasks, user, today]
  );

  const topProjects = useMemo(() => topProjectsByOpen(summaries, 6), [summaries]);
  const timeline = useMemo(() => dueTimeline(tasks, today, 14), [tasks, today]);
  const attentionItems = useMemo(() => needsAttention(tasks, today, 6), [tasks, today]);
  const userTasks = useMemo(() => myTasks(tasks, user?.uid || '', today, 6), [tasks, user, today]);
  const recentTasks = useMemo(() => recentlyUpdated(tasks, 8), [tasks]);

  // Chart configs
  const series = useMemo(
    () => [
      { key: 'todo', label: t('task.status.todo'), color: 'var(--chart-todo)' },
      { key: 'in_progress', label: t('task.status.in_progress'), color: 'var(--chart-progress)' },
      { key: 'done', label: t('task.status.done'), color: 'var(--chart-done)' },
    ],
    [t]
  );

  const stackedRows = useMemo(
    () =>
      topProjects.rows.map((s) => ({
        id: s.project.id,
        label: s.project.name,
        href: `/projects/${s.project.id}`,
        values: {
          todo: s.todo,
          in_progress: s.inProgress,
          done: s.done,
        },
      })),
    [topProjects]
  );

  const stackedTable = useMemo(
    () => ({
      headers: [
        t('dashboard.table.project'),
        t('task.status.todo'),
        t('task.status.in_progress'),
        t('task.status.done'),
        t('dashboard.stats.total'),
      ],
      rows: topProjects.rows.map((s) => [
        s.project.name,
        s.todo,
        s.inProgress,
        s.done,
        s.total,
      ]),
    }),
    [topProjects, t]
  );

  const columnBuckets = useMemo(
    () => [
      ...(timeline.overdue > 0
        ? [
            {
              id: 'overdue',
              label: t('dashboard.stats.overdue'),
              value: timeline.overdue,
              tone: 'overdue' as const,
            },
          ]
        : []),
      ...timeline.buckets.map((b) => ({
        id: b.date,
        label: b.date.slice(5),
        value: b.count,
        highlight: b.isToday,
      })),
    ],
    [timeline, t]
  );

  const columnTable = useMemo(
    () => ({
      headers: [t('task.field.dueDate'), t('dashboard.kpi.open')],
      rows: [
        ...(timeline.overdue > 0 ? [[t('dashboard.stats.overdue'), timeline.overdue]] : []),
        ...timeline.buckets.map((b) => [b.date, b.count]),
      ],
    }),
    [timeline, t]
  );

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return <ErrorState message={getErrorMessage(error)} onRetry={reload} />;
  }

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';

  if (projects.length === 0) {
    return (
      <div className={styles.container} data-testid="page-ready">
        <div className={styles.header}>
          <div className={styles.topRow}>
            <div className={styles.greetingArea}>
              <h1 className={styles.greeting}>
                {isMorning
                  ? t('dashboard.greetingMorning', { name: displayName })
                  : t('dashboard.greetingEvening', { name: displayName })}
              </h1>
              {fullDateFormatted && (
                <span className={styles.dateDisplay}>{fullDateFormatted}</span>
              )}
            </div>

            <Link
              href="/projects/new"
              className={styles.newProjectBtn}
              aria-label={`+ ${t('dashboard.projects.createButton')}`}
            >
              <Icon name="plus" size={16} />
              <span>{t('dashboard.projects.createButton')}</span>
            </Link>
          </div>
          <div className={styles.brassDivider} aria-hidden="true" />
        </div>
        <OnboardingEmpty />
      </div>
    );
  }

  return (
    <div className={styles.container} data-testid="page-ready">
      {/* Top Header */}
      <div className={styles.header}>
        <div className={styles.topRow}>
          <div className={styles.greetingArea}>
            <h1 className={styles.greeting}>
              {isMorning ? (
                <>
                  {t('dashboard.greetingMorning', { name: '' }).replace(/,\s*$/, '')},{' '}
                  <bdi>{displayName}</bdi>
                </>
              ) : (
                <>
                  {t('dashboard.greetingEvening', { name: '' }).replace(/,\s*$/, '')},{' '}
                  <bdi>{displayName}</bdi>
                </>
              )}
            </h1>
            {fullDateFormatted && (
              <span className={styles.dateDisplay}>{fullDateFormatted}</span>
            )}
          </div>

          <Link
            href="/projects/new"
            className={styles.newProjectBtn}
            aria-label={`+ ${t('dashboard.projects.createButton')}`}
          >
            <Icon name="plus" size={16} />
            <span>{t('dashboard.projects.createButton')}</span>
          </Link>
        </div>

        <div className={styles.brassDivider} aria-hidden="true" />
      </div>

      {/* Hero Metric Numeral */}
      <HeroMetric metrics={metrics} />

      {/* KPI Ledger */}
      <KpiStrip metrics={metrics} />

      {/* 12-Column Grid: Charts */}
      <div className={styles.grid}>
        <div className={styles.col7} data-testid="chart-tasks-by-project">
          <ChartPanel
            title={t('dashboard.projectsDistribution')}
            legend={series}
            table={stackedTable}
          >
            <StackedBars
              rows={stackedRows}
              series={series}
              ariaLabel={t('dashboard.projectsDistribution')}
            />
          </ChartPanel>
        </div>

        <div className={styles.col5} data-testid="chart-due-timeline">
          <ChartPanel
            title={t('dashboard.dueTimeline')}
            table={columnTable}
          >
            <ColumnChart
              buckets={columnBuckets}
              ariaLabel={t('dashboard.dueTimeline')}
              valueLabel={t('dashboard.kpi.open')}
            />
          </ChartPanel>
        </div>

        {/* Attention & My Tasks */}
        <div className={styles.col6}>
          <NeedsAttention items={attentionItems} projectName={projectNameMap} />
        </div>

        <div className={styles.col6}>
          <MyTasks tasks={userTasks} projectName={projectNameMap} />
        </div>

        {/* Projects Table */}
        <div className={styles.col12}>
          <ProjectsTable summaries={summaries} />
        </div>

        {/* Recently Updated */}
        <div className={styles.col12}>
          <RecentlyUpdated tasks={recentTasks} projectName={projectNameMap} />
        </div>
      </div>
    </div>
  );
}
