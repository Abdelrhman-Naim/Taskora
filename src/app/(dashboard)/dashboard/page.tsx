'use client';

// ============================================================================
// ZONE 1: IMPORTS
// ============================================================================
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

// ============================================================================
// ZONE 2: CONFIG & CONSTANTS
// ============================================================================
const MAX_TOP_PROJECTS = 6;
const MAX_TIMELINE_DAYS = 14;
const MAX_ATTENTION_ITEMS = 6;
const MAX_MY_TASKS = 6;
const MAX_RECENT_TASKS = 8;

// ============================================================================
// ZONE 3: TYPES & INTERFACES
// ============================================================================
interface DashboardHeaderProps {
  displayName: string;
  isMorning: boolean;
  fullDateFormatted: string;
  createButtonLabel: string;
  morningGreetingPrefix: string;
  eveningGreetingPrefix: string;
}

// ============================================================================
// ZONE 4: HELPERS & HOOKS
// ============================================================================
function checkIsMorningRiyadh(): boolean {
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
}

function formatDashboardFullDate(locale: string): string {
  try {
    return new Intl.DateTimeFormat(`${locale}-u-nu-latn-ca-gregory`, {
      timeZone: APP_TIME_ZONE,
      dateStyle: 'full',
    }).format(new Date());
  } catch {
    return '';
  }
}

// ============================================================================
// ZONE 5: SUB-COMPONENTS
// ============================================================================
function DashboardHeader({
  displayName,
  isMorning,
  fullDateFormatted,
  createButtonLabel,
  morningGreetingPrefix,
  eveningGreetingPrefix,
}: DashboardHeaderProps): React.ReactElement {
  const greetingPrefix = isMorning ? morningGreetingPrefix : eveningGreetingPrefix;

  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center flex-wrap gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-[family-name:var(--font-display)] text-2xl md:text-3xl font-semibold text-text m-0 leading-tight">
            {greetingPrefix},{' '}
            <bdi>{displayName}</bdi>
          </h1>
          {fullDateFormatted && (
            <span className="text-sm text-text-2">{fullDateFormatted}</span>
          )}
        </div>

        <Link
          href="/projects/new"
          className="inline-flex items-center justify-center gap-2 py-2.5 px-5 bg-accent text-on-accent rounded-md text-sm font-semibold no-underline hover:opacity-90 transition-opacity"
          aria-label={`+ ${createButtonLabel}`}
        >
          <Icon name="plus" size={16} />
          <span>{createButtonLabel}</span>
        </Link>
      </div>

      <div className="w-full h-px bg-line my-4" aria-hidden="true" />
    </div>
  );
}

// ============================================================================
// ZONE 6: MAIN COMPONENT
// ============================================================================
export default function DashboardPage(): React.ReactElement {
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const getErrorMessage = useErrorMessage();
  const { projects, tasks, loading, error, reload } = useDashboardData();

  const today = useMemo(() => todayString(), []);
  const isMorning = useMemo(() => checkIsMorningRiyadh(), []);
  const fullDateFormatted = useMemo(() => formatDashboardFullDate(locale), [locale]);

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

  const topProjects = useMemo(() => topProjectsByOpen(summaries, MAX_TOP_PROJECTS), [summaries]);
  const timeline = useMemo(() => dueTimeline(tasks, today, MAX_TIMELINE_DAYS), [tasks, today]);
  const attentionItems = useMemo(() => needsAttention(tasks, today, MAX_ATTENTION_ITEMS), [tasks, today]);
  const userTasks = useMemo(() => myTasks(tasks, user?.uid || '', today, MAX_MY_TASKS), [tasks, user, today]);
  const recentTasks = useMemo(() => recentlyUpdated(tasks, MAX_RECENT_TASKS), [tasks]);

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

  // Early return guards
  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return <ErrorState message={getErrorMessage(error)} onRetry={reload} />;
  }

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';
  const morningGreetingPrefix = t('dashboard.greetingMorning', { name: '' }).replace(/,\s*$/, '');
  const eveningGreetingPrefix = t('dashboard.greetingEvening', { name: '' }).replace(/,\s*$/, '');
  const createButtonLabel = t('dashboard.projects.createButton');

  const headerElement = (
    <DashboardHeader
      displayName={displayName}
      isMorning={isMorning}
      fullDateFormatted={fullDateFormatted}
      createButtonLabel={createButtonLabel}
      morningGreetingPrefix={morningGreetingPrefix}
      eveningGreetingPrefix={eveningGreetingPrefix}
    />
  );

  if (projects.length === 0) {
    return (
      <div className="flex flex-col w-full max-w-[80rem] mx-auto" data-testid="page-ready">
        {headerElement}
        <OnboardingEmpty />
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full max-w-[80rem] mx-auto" data-testid="page-ready">
      {headerElement}

      {/* Hero Metric Numeral */}
      <HeroMetric metrics={metrics} />

      {/* KPI Ledger */}
      <KpiStrip metrics={metrics} />

      {/* 12-Column Grid: Charts & Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        <div className="lg:col-span-7" data-testid="chart-tasks-by-project">
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

        <div className="lg:col-span-5" data-testid="chart-due-timeline">
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
        <div className="lg:col-span-6">
          <NeedsAttention items={attentionItems} projectName={projectNameMap} />
        </div>

        <div className="lg:col-span-6">
          <MyTasks tasks={userTasks} projectName={projectNameMap} />
        </div>

        {/* Projects Table */}
        <div className="lg:col-span-12">
          <ProjectsTable summaries={summaries} />
        </div>

        {/* Recently Updated */}
        <div className="lg:col-span-12">
          <RecentlyUpdated tasks={recentTasks} projectName={projectNameMap} />
        </div>
      </div>
    </div>
  );
}
