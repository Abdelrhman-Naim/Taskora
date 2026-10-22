'use client';

// ============================================================================
// 1. IMPORTS
// ============================================================================
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

// Types & Services
import { Project, Task, TaskStatus, TaskInput, TaskPatch } from '@/types';
import { getProject } from '@/services/projects';
import {
  listTasks,
  createTask,
  updateTask,
  changeTaskStatus,
  deleteTask,
} from '@/services/tasks';
import { getDb } from '@/lib/firebase';
import { AppError } from '@/lib/errors';
import { todayString } from '@/lib/dates';
import { TaskFilters, DEFAULT_FILTERS, filterTasks } from '@/lib/taskFilters';
import { tasksToExcelBlob, excelFilename } from '@/lib/excel';

// Hooks & i18n
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/i18n/I18nProvider';
import { useErrorMessage } from '@/i18n/useErrorMessage';
import { useViewPreference } from '@/hooks/useViewPreference';
import { useHotkeys } from '@/hooks/useHotkeys';

// UI Components
import { Spinner } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Avatar } from '@/components/ui/Avatar';
import { ShortcutsDialog } from '@/components/shell/ShortcutsDialog';

// Task Views & Modals
import { TaskList } from '@/components/tasks/TaskList';
import { TaskBoard } from '@/components/tasks/TaskBoard';
import { TaskCalendar } from '@/components/tasks/TaskCalendar';
import { TaskForm } from '@/components/tasks/TaskForm';
import { TaskDetailDialog } from '@/components/tasks/TaskDetailDialog';
import { ActivityPanel } from '@/components/projects/ActivityPanel';
import { FilterBar } from '@/components/tasks/FilterBar';

// ============================================================================
// 2. CONFIGURATION & CONSTANTS (EASY EDIT ZONE)
// ============================================================================
const MAX_STACKED_AVATARS = 5;
const SEARCH_INPUT_ID = 'filter-search';

// ============================================================================
// 3. TYPES & INTERFACES
// ============================================================================
type ViewScope = 'my_tasks' | 'all';

interface ActorInfo {
  uid: string;
  displayName: string;
}

// ============================================================================
// 4. HELPER FUNCTIONS
// ============================================================================
function computeActor(user: { uid: string; displayName?: string | null; email?: string | null } | null, project: Project | null): ActorInfo {
  const uid = user?.uid || '';
  const displayName =
    (uid && project?.memberNames?.[uid]) ||
    user?.displayName ||
    user?.email?.split('@')[0] ||
    'User';
  return { uid, displayName };
}

function filterScopedTasks(tasks: Task[], scope: ViewScope, currentUid: string, isOwner: boolean): Task[] {
  if (scope === 'all') {
    return tasks;
  }
  return tasks.filter((task) => {
    // 1. Task assigned directly to current user
    if (task.assigneeId) {
      return task.assigneeId === currentUid;
    }
    // 2. Shared checklist task containing current user
    if (task.checklist && task.checklist.length > 0) {
      return task.checklist.some((item) => item.id === currentUid);
    }
    // 3. Unassigned tasks (visible to project owner or creator)
    return isOwner || task.createdBy === currentUid;
  });
}

// ============================================================================
// 5. SUB-COMPONENTS
// ============================================================================
interface TasksViewRendererProps {
  tasks: Task[];
  filteredTasks: Task[];
  view: 'list' | 'board' | 'calendar';
  project: Project;
  currentUserId: string;
  isOwner: boolean;
  locale: string;
  onClearFilters: () => void;
  onOpenTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onStatusChange: (task: Task, newStatus: TaskStatus) => void;
  onNewTask?: () => void;
  t: (key: any) => string;
}

function TasksViewRenderer({
  tasks,
  filteredTasks,
  view,
  project,
  currentUserId,
  isOwner,
  locale,
  onClearFilters,
  onOpenTask,
  onEditTask,
  onDeleteTask,
  onStatusChange,
  onNewTask,
  t,
}: TasksViewRendererProps): React.ReactElement {
  if (tasks.length > 0 && filteredTasks.length === 0) {
    return (
      <EmptyState
        title={t('task.empty.title')}
        message={t('task.empty.description')}
        action={{
          label: t('filter.clear'),
          onClick: onClearFilters,
        }}
      />
    );
  }

  if (view === 'board') {
    return (
      <TaskBoard
        tasks={filteredTasks}
        project={project}
        currentUserId={currentUserId}
        isOwner={isOwner}
        onStatusChange={onStatusChange}
        onOpen={onOpenTask}
      />
    );
  }

  if (view === 'calendar') {
    return (
      <TaskCalendar
        tasks={filteredTasks}
        locale={locale as any}
        onOpen={onOpenTask}
      />
    );
  }

  return (
    <TaskList
      tasks={filteredTasks}
      project={project}
      currentUserId={currentUserId}
      isOwner={isOwner}
      onOpen={onOpenTask}
      onEdit={onEditTask}
      onDelete={onDeleteTask}
      onStatusChange={onStatusChange}
      onNewTask={onNewTask}
    />
  );
}

// ============================================================================
// 6. MAIN COMPONENT
// ============================================================================
export default function ProjectPage(): React.ReactElement | null {
  const params = useParams<{ id: string }>();
  const projectId = params?.id;
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const getErrorMessage = useErrorMessage();

  // Core Data State
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);

  // View & Scope State
  const [view, setView] = useViewPreference();
  const [filters, setFilters] = useState<TaskFilters>(DEFAULT_FILTERS);
  const [userSelectedScope, setUserSelectedScope] = useState<ViewScope | null>(null);

  // Modals & Panels State
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [activeDetailTask, setActiveDetailTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [showActivity, setShowActivity] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  // Derived Values
  const currentUid = user?.uid || '';
  const isOwner = Boolean(project && user && project.ownerId === user.uid);
  const viewScope: ViewScope = userSelectedScope !== null ? userSelectedScope : (isOwner ? 'all' : 'my_tasks');
  const actor = useMemo(() => computeActor(user, project), [user, project]);

  // Scoped & Filtered Tasks
  const scopedTasks = useMemo(
    () => filterScopedTasks(tasks, viewScope, currentUid, isOwner),
    [tasks, viewScope, currentUid, isOwner]
  );

  const filteredTasks = useMemo(
    () => filterTasks(scopedTasks, filters, todayString()),
    [scopedTasks, filters]
  );

  const progressMetrics = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((task) => task.status === 'done').length;
    const percent = total === 0 ? 0 : Math.round((done / total) * 100);
    return { total, done, percent };
  }, [tasks]);

  // Data Fetching
  const loadProjectAndTasks = useCallback(
    async (showLoadingSpinner = true) => {
      if (!projectId) return;
      if (showLoadingSpinner) setLoading(true);
      setError(null);
      try {
        const db = getDb();
        const [proj, taskList] = await Promise.all([
          getProject(db, projectId),
          listTasks(db, projectId),
        ]);
        setProject(proj);
        setTasks(taskList);
      } catch (err: unknown) {
        if (err instanceof AppError) {
          setError(err);
        } else {
          setError(new AppError('unknown', 'Failed to load project details'));
        }
      } finally {
        if (showLoadingSpinner) setLoading(false);
      }
    },
    [projectId]
  );

  useEffect(() => {
    loadProjectAndTasks(true);
  }, [loadProjectAndTasks]);

  const reloadTasks = useCallback(async () => {
    if (!projectId) return;
    try {
      const db = getDb();
      const taskList = await listTasks(db, projectId);
      setTasks(taskList);
    } catch (err: unknown) {
      if (err instanceof AppError) {
        setActionError(getErrorMessage(err));
      }
    }
  }, [projectId, getErrorMessage]);

  // Keyboard Shortcuts
  useHotkeys({
    KeyN: () => {
      if (!isOwner) return;
      setEditingTask(null);
      setShowCreateForm(true);
    },
    Slash: (e) => {
      e.preventDefault();
      document.getElementById(SEARCH_INPUT_ID)?.focus();
    },
    'Shift+Slash': () => {
      setShowShortcuts(true);
    },
    Digit1: () => setView('list'),
    Digit2: () => setView('board'),
    Digit3: () => setView('calendar'),
  });

  // Task Action Handlers
  const handleCreateTask = async (data: {
    title: string;
    description: string;
    priority: any;
    assigneeId: string | null;
    dueDate: string | null;
    status?: TaskStatus;
    labels?: string[];
    recurrence?: any;
    checklist?: any[];
    multiAssigneeMode?: 'single' | 'shared' | 'individual';
    selectedMemberIds?: string[];
  }) => {
    if (!project) return;
    setActionError(null);
    try {
      const db = getDb();

      // Case 1: Individual tasks creation
      if (data.multiAssigneeMode === 'individual' && data.selectedMemberIds && data.selectedMemberIds.length > 0) {
        for (const memberId of data.selectedMemberIds) {
          const singleTaskInput: TaskInput = {
            title: data.title,
            description: data.description,
            priority: data.priority,
            assigneeId: memberId,
            dueDate: data.dueDate,
            labels: data.labels,
            recurrence: data.recurrence,
            checklist: data.checklist,
          };
          await createTask(db, project.id, currentUid, singleTaskInput, {
            actor,
            projectName: project.name,
          });
        }
      } else {
        // Case 2: Single task or shared checklist task
        const taskInput: TaskInput = {
          title: data.title,
          description: data.description,
          priority: data.priority,
          assigneeId: data.assigneeId,
          dueDate: data.dueDate,
          labels: data.labels,
          recurrence: data.recurrence,
          checklist: data.checklist,
        };
        await createTask(db, project.id, currentUid, taskInput, {
          actor,
          projectName: project.name,
        });
      }

      setShowCreateForm(false);
      await reloadTasks();
    } catch (err) {
      setActionError(getErrorMessage(err));
      throw err;
    }
  };

  const handleUpdateTask = async (data: {
    title: string;
    description: string;
    priority: any;
    assigneeId: string | null;
    dueDate: string | null;
    status?: TaskStatus;
    labels?: string[];
    recurrence?: any;
    checklist?: any[];
  }) => {
    if (!project || !editingTask) return;
    setActionError(null);
    try {
      const db = getDb();
      const patch: TaskPatch = {
        title: data.title,
        description: data.description,
        priority: data.priority,
        assigneeId: data.assigneeId,
        dueDate: data.dueDate,
        status: data.status,
        labels: data.labels,
        recurrence: data.recurrence,
        checklist: data.checklist,
      };
      await updateTask(db, project.id, editingTask.id, patch, {
        actor,
        task: editingTask,
        projectName: project.name,
        assigneeName: data.assigneeId ? project.memberNames[data.assigneeId] : null,
      });
      setEditingTask(null);
      await reloadTasks();
    } catch (err) {
      setActionError(getErrorMessage(err));
      throw err;
    }
  };

  const handleStatusChange = async (task: Task, newStatus: TaskStatus) => {
    if (!project) return;
    setActionError(null);
    try {
      const db = getDb();
      await changeTaskStatus(db, project.id, task.id, newStatus, {
        actor,
        task,
        projectName: project.name,
      });
      await reloadTasks();
      if (activeDetailTask && activeDetailTask.id === task.id) {
        setActiveDetailTask((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } catch (err) {
      setActionError(getErrorMessage(err));
    }
  };

  const handleDetailTaskChange = async (patch: TaskPatch) => {
    if (!project || !activeDetailTask) return;
    setActionError(null);
    try {
      const db = getDb();
      if (patch.status !== undefined && patch.status !== activeDetailTask.status) {
        await changeTaskStatus(db, project.id, activeDetailTask.id, patch.status, {
          actor,
          task: activeDetailTask,
          projectName: project.name,
        });
      } else {
        await updateTask(db, project.id, activeDetailTask.id, patch, {
          actor,
          task: activeDetailTask,
          projectName: project.name,
          assigneeName: patch.assigneeId ? project.memberNames[patch.assigneeId] : null,
        });
      }
      await reloadTasks();
      setActiveDetailTask((prev) => (prev ? { ...prev, ...patch } : null));
    } catch (err) {
      setActionError(getErrorMessage(err));
      throw err;
    }
  };

  const handleConfirmDelete = async () => {
    if (!project || !deletingTask) return;
    setActionError(null);
    try {
      const db = getDb();
      await deleteTask(db, project.id, deletingTask.id, {
        actor,
        task: deletingTask,
      });
      setDeletingTask(null);
      await reloadTasks();
    } catch (err) {
      setActionError(getErrorMessage(err));
    }
  };

  const handleExportExcel = async () => {
    if (!project || isExportingExcel) return;
    try {
      setIsExportingExcel(true);
      const blob = await tasksToExcelBlob(filteredTasks, project, t, locale);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', excelFilename(project.name, todayString()));
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export Excel:', err);
    } finally {
      setIsExportingExcel(false);
    }
  };

  // --- Guard Clauses: Loading & Error States ---
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Spinner size={36} label={t('common.loading')} />
      </div>
    );
  }

  if (error) {
    if (error.code === 'not-found') {
      return (
        <div className="text-center py-15 px-5" role="alert" data-testid="project-not-found">
          <h2 className="font-[family-name:var(--font-display)] text-xl sm:text-2xl font-semibold text-text mb-3" data-testid="project-not-found-heading">
            {t('project.error.notFound')}
          </h2>
          <p className="text-text-2 mb-6">
            {t('project.error.notFoundDesc')}
          </p>
          <Button href="/dashboard" variant="primary">{t('common.backToDashboard')}</Button>
        </div>
      );
    }

    if (error.code === 'permission-denied') {
      return (
        <div className="text-center py-15 px-5">
          <h2 className="font-[family-name:var(--font-display)] text-xl sm:text-2xl font-semibold mb-3 text-st-overdue-fg">
            {t('project.error.accessDenied')}
          </h2>
          <p className="text-text-2 mb-6">
            {t('project.error.accessDeniedDesc')}
          </p>
          <Button href="/dashboard" variant="primary">{t('common.backToDashboard')}</Button>
        </div>
      );
    }

    return (
      <ErrorState
        title={t('error.unexpected')}
        message={getErrorMessage(error)}
        onRetry={() => loadProjectAndTasks(false)}
      />
    );
  }

  if (!project) return null;

  return (
    <div data-testid="page-ready">
      {/* Project Top Header */}
      <div className="mb-7" data-testid="project-header">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-xs text-text-2 no-underline mb-3 hover:text-text transition-colors">
          <Icon name="arrow" size={16} />
          <span>{t('common.backToDashboard')}</span>
        </Link>
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-start flex-wrap gap-3 sm:gap-4 mb-4">
          <div className="flex-1 min-w-0 sm:min-w-[260px]">
            <h1 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-semibold text-text m-0 leading-tight" data-testid="project-name">
              <bdi>{project.name}</bdi>
            </h1>
            {project.description && (
              <p dir="auto" className="text-text-2 text-sm sm:text-base mt-2 mb-0 max-w-[720px] leading-relaxed" data-testid="project-description">
                {project.description}
              </p>
            )}
          </div>

          <div className="flex gap-2.5 items-center flex-wrap w-full sm:w-auto [&>*]:flex-1 sm:[&>*]:flex-initial [&>*]:justify-center [&>*]:min-h-[40px] sm:[&>*]:min-h-0">
            <Button
              variant="secondary"
              data-testid="project-activity-btn"
              onClick={() => setShowActivity(true)}
            >
              {t('activity.button')}
            </Button>

            {isOwner && tasks.length > 0 && (
              <Button
                variant="secondary"
                data-testid="project-export-excel-btn"
                onClick={handleExportExcel}
                loading={isExportingExcel}
              >
                {t('excel.export', { count: filteredTasks.length })}
              </Button>
            )}

            {isOwner && (
              <Link href={`/projects/${project.id}/settings`}>
                <Button variant="secondary" icon="settings" data-testid="project-settings-btn">
                  {t('project.edit.title')}
                </Button>
              </Link>
            )}

            {isOwner && (
              <Button
                variant="primary"
                icon="plus"
                data-testid="project-new-task-btn"
                aria-label={`+ ${t('task.new.button')}`}
                onClick={() => {
                  setEditingTask(null);
                  setShowCreateForm(true);
                }}
              >
                {t('task.new.button')}
              </Button>
            )}
          </div>
        </div>

        {/* Project Summary: Progress Bar & Team Members */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between flex-wrap gap-3 sm:gap-5 mt-4 p-3 sm:py-3.5 sm:px-4.5 bg-surface border border-line rounded-lg">
          <div className="flex flex-col gap-1.5 w-full sm:w-auto sm:min-w-[220px] flex-1 max-w-full sm:max-w-[420px]" data-testid="project-metrics">
            <div className="flex justify-between text-xs sm:text-sm text-text-2 font-[family-name:var(--font-display)] tabular-nums">
              <span>{t('dashboard.table.progress')}</span>
              <strong className="num">
                {progressMetrics.percent}% ({progressMetrics.done}/{progressMetrics.total})
              </strong>
            </div>
            <ProgressBar
              value={progressMetrics.done}
              max={progressMetrics.total}
              label={t('dashboard.table.progress')}
            />
          </div>

          <div className="flex items-center gap-2.5" data-testid="project-members">
            <span className="text-xs text-text-2 font-medium">{t('dashboard.table.members')}:</span>
            <div className="inline-flex items-center">
              {project.memberIds.slice(0, MAX_STACKED_AVATARS).map((uid) => (
                <Avatar
                  key={uid}
                  name={project.memberNames[uid] || 'Member'}
                  size="sm"
                  className="border-2 border-surface -ms-2 first:ms-0"
                />
              ))}
              {project.memberIds.length > MAX_STACKED_AVATARS && (
                <span
                  className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-surface-raised border-2 border-surface text-text-2 text-xs font-semibold -ms-2"
                  aria-label={`${project.memberIds.length - MAX_STACKED_AVATARS} more`}
                >
                  +{project.memberIds.length - MAX_STACKED_AVATARS}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="h-px bg-accent w-full mt-5 opacity-40" aria-hidden="true" />
      </div>

      {actionError && (
        <div role="alert" className="py-3 px-4 bg-st-overdue-bg border border-st-overdue-fg rounded-md text-st-overdue-fg text-sm mb-5">
          {actionError}
        </div>
      )}

      {/* Task Creation Popup Modal */}
      <Dialog
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        title={t('task.new.title')}
        size="md"
      >
        <TaskForm
          project={project}
          currentUserId={currentUid}
          isOwner={isOwner}
          onSave={handleCreateTask}
          onCancel={() => setShowCreateForm(false)}
        />
      </Dialog>

      {/* Task Edit Popup Modal */}
      <Dialog
        isOpen={Boolean(editingTask)}
        onClose={() => setEditingTask(null)}
        title={t('task.edit.title')}
        size="md"
      >
        {editingTask && (
          <TaskForm
            project={project}
            initialTask={editingTask}
            currentUserId={currentUid}
            isOwner={isOwner}
            onSave={handleUpdateTask}
            onCancel={() => setEditingTask(null)}
          />
        )}
      </Dialog>

      {/* Tasks Section & Controls */}
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center flex-wrap gap-3 mb-4">
          <div className="flex items-center justify-between sm:justify-start gap-2">
            <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-text m-0">
              {t('task.list.title')}
              <span className="text-sm sm:text-base text-text-2 font-medium ms-1.5 tabular-nums">
                ({filteredTasks.length}
                {isOwner && viewScope === 'my_tasks' && tasks.length !== filteredTasks.length
                  ? ` / ${tasks.length}`
                  : ''}
                )
              </span>
            </h2>
          </div>

          {isOwner && (
            <div
              className="flex sm:inline-flex items-center p-[3px] bg-surface-2 border border-line rounded-md gap-0.5 w-full sm:w-auto"
              role="radiogroup"
              aria-label={t('task.scope.title')}
            >
              <button
                type="button"
                role="radio"
                aria-checked={viewScope === 'my_tasks'}
                className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-medium text-text-muted bg-transparent border-0 rounded-sm cursor-pointer transition-all hover:text-text hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${viewScope === 'my_tasks' ? '!bg-surface !text-text font-semibold shadow-sm' : ''}`}
                onClick={() => setUserSelectedScope('my_tasks')}
                data-testid="scope-switch-my-tasks"
              >
                👤 {t('task.scope.myTasks')}
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={viewScope === 'all'}
                className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-medium text-text-muted bg-transparent border-0 rounded-sm cursor-pointer transition-all hover:text-text hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${viewScope === 'all' ? '!bg-surface !text-text font-semibold shadow-sm' : ''}`}
                onClick={() => setUserSelectedScope('all')}
                data-testid="scope-switch-all"
              >
                🌐 {t('task.scope.allTasks')}
              </button>
            </div>
          )}
        </div>

        {tasks.length > 0 && (
          <>
            <div className="flex items-center justify-stretch sm:justify-start mb-4">
              <div
                className="flex sm:inline-flex items-center p-[3px] bg-surface-2 border border-line rounded-md gap-0.5 w-full sm:w-auto"
                role="radiogroup"
                aria-label={t('view.switcher')}
              >
                <button
                  type="button"
                  role="radio"
                  aria-checked={view === 'list'}
                  className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-medium text-text-muted bg-transparent border-0 rounded-sm cursor-pointer transition-all hover:text-text hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${view === 'list' ? '!bg-surface !text-text font-semibold shadow-sm' : ''}`}
                  onClick={() => setView('list')}
                  data-testid="view-switch-list"
                >
                  {t('view.list')}
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={view === 'board'}
                  className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-medium text-text-muted bg-transparent border-0 rounded-sm cursor-pointer transition-all hover:text-text hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${view === 'board' ? '!bg-surface !text-text font-semibold shadow-sm' : ''}`}
                  onClick={() => setView('board')}
                  data-testid="view-switch-board"
                >
                  {t('view.board')}
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={view === 'calendar'}
                  className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-medium text-text-muted bg-transparent border-0 rounded-sm cursor-pointer transition-all hover:text-text hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${view === 'calendar' ? '!bg-surface !text-text font-semibold shadow-sm' : ''}`}
                  onClick={() => setView('calendar')}
                  data-testid="view-switch-calendar"
                >
                  {t('view.calendar')}
                </button>
              </div>
            </div>

            <div className="w-full mb-6">
              <FilterBar
                filters={filters}
                onChange={setFilters}
                members={project.memberNames || {}}
                onReset={() => setFilters(DEFAULT_FILTERS)}
              />
            </div>
          </>
        )}

        <TasksViewRenderer
          tasks={tasks}
          filteredTasks={filteredTasks}
          view={view}
          project={project}
          currentUserId={currentUid}
          isOwner={isOwner}
          locale={locale}
          onClearFilters={() => setFilters(DEFAULT_FILTERS)}
          onOpenTask={(task) => setActiveDetailTask(task)}
          onEditTask={(task) => {
            setShowCreateForm(false);
            setEditingTask(task);
          }}
          onDeleteTask={(task) => setDeletingTask(task)}
          onStatusChange={handleStatusChange}
          onNewTask={isOwner ? () => {
            setEditingTask(null);
            setShowCreateForm(true);
          } : undefined}
          t={t}
        />
      </div>

      {/* Task Detail Modal */}
      {activeDetailTask && (
        <TaskDetailDialog
          task={activeDetailTask}
          project={project}
          currentUserId={currentUid}
          isOwner={isOwner}
          onClose={() => setActiveDetailTask(null)}
          onEdit={(task) => {
            setActiveDetailTask(null);
            setEditingTask(task);
          }}
          onTaskChange={handleDetailTaskChange}
        />
      )}

      {/* Confirm Task Deletion Modal */}
      {deletingTask && (
        <Dialog
          isOpen={true}
          title={t('task.delete.confirmTitle')}
          message={t('task.delete.confirmMessage', { title: deletingTask.title })}
          confirmLabel={t('common.delete')}
          cancelLabel={t('common.cancel')}
          isDangerous={true}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingTask(null)}
        />
      )}

      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <ShortcutsDialog
          isOpen={showShortcuts}
          onClose={() => setShowShortcuts(false)}
        />
      )}

      {/* Project Activity Panel */}
      {showActivity && projectId && (
        <ActivityPanel
          projectId={projectId}
          isOpen={showActivity}
          onClose={() => setShowActivity(false)}
        />
      )}
    </div>
  );
}
