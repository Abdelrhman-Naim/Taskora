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

import styles from './page.module.css';

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
  const [actionError, setActionError] = useState<string | null>(null);

  // View Preferences & Filters
  const [view, setView] = useViewPreference();
  const [filters, setFilters] = useState<TaskFilters>(DEFAULT_FILTERS);
  const [userSelectedScope, setUserSelectedScope] = useState<ViewScope | null>(null);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  // Modal / Dialog States
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [activeDetailTask, setActiveDetailTask] = useState<Task | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showActivity, setShowActivity] = useState(false);

  // User and Ownership Context
  const currentUid = user?.uid || '';
  const isOwner = Boolean(project && user?.uid === project.ownerId);
  const viewScope: ViewScope = isOwner ? (userSelectedScope ?? 'all') : 'my_tasks';

  const actor = useMemo(() => computeActor(user, project), [user, project]);

  // Keyboard Shortcuts Hook
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

  // --- Data Loading ---
  const reloadTasks = useCallback(async () => {
    if (!projectId) return;
    try {
      const db = getDb();
      const list = await listTasks(db, projectId);
      setTasks(list);
    } catch (err) {
      setActionError(getErrorMessage(err));
    }
  }, [projectId, getErrorMessage]);

  const loadProjectAndTasks = useCallback(async (isInitial = false) => {
    if (!projectId) return;
    if (!isInitial) setLoading(true);
    setError(null);
    try {
      const db = getDb();
      const [proj, taskList] = await Promise.all([
        getProject(db, projectId),
        listTasks(db, projectId),
      ]);
      setProject(proj);
      setTasks(taskList);
    } catch (err) {
      if (err instanceof AppError) {
        setError(err);
      } else {
        setError(new AppError('unknown', 'Failed to load project'));
      }
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    let ignore = false;
    async function load() {
      if (!projectId) return;
      try {
        const db = getDb();
        const proj = await getProject(db, projectId);
        if (!ignore) setProject(proj);
        const taskList = await listTasks(db, projectId);
        if (!ignore) setTasks(taskList);
      } catch (err) {
        if (!ignore) {
          if (err instanceof AppError) {
            setError(err);
          } else {
            setError(new AppError('unknown', 'Failed to load project'));
          }
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [projectId]);

  // --- Derived State ---
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
    const done = tasks.filter((t) => t.status === 'done').length;
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;
    return { total, done, percent };
  }, [tasks]);

  // --- Task Action Handlers ---
  const handleCreateTask = async (data: TaskInput) => {
    if (!project || !user || !isOwner) return;
    const db = getDb();

    // Individual tasks mode: create one task per selected member
    if (data.multiAssigneeMode === 'individual' && data.selectedMemberIds && data.selectedMemberIds.length > 0) {
      for (const memberId of data.selectedMemberIds) {
        await createTask(
          db,
          project.id,
          user.uid,
          { ...data, assigneeId: memberId },
          { actor, projectName: project.name }
        );
      }
    } else {
      await createTask(
        db,
        project.id,
        user.uid,
        data,
        { actor, projectName: project.name }
      );
    }

    setShowCreateForm(false);
    await reloadTasks();
  };

  const handleUpdateTask = async (data: TaskPatch) => {
    if (!project || !editingTask) return;
    const db = getDb();
    await updateTask(db, project.id, editingTask.id, data, {
      actor,
      task: editingTask,
      projectName: project.name,
      assigneeName: data.assigneeId ? project.memberNames[data.assigneeId] : null,
    });
    setEditingTask(null);
    await reloadTasks();
  };

  const handleStatusChange = async (task: Task, newStatus: TaskStatus) => {
    if (!project) return;
    const oldStatus = task.status;
    setActionError(null);

    // Optimistic status update
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t))
    );
    if (activeDetailTask && activeDetailTask.id === task.id) {
      setActiveDetailTask((prev) => (prev ? { ...prev, status: newStatus } : null));
    }

    try {
      const db = getDb();
      await changeTaskStatus(db, project.id, task.id, newStatus, {
        actor,
        task,
        projectName: project.name,
      });
      await reloadTasks();
    } catch (err) {
      // Revert optimistic update
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: oldStatus } : t))
      );
      if (activeDetailTask && activeDetailTask.id === task.id) {
        setActiveDetailTask((prev) => (prev ? { ...prev, status: oldStatus } : null));
      }
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
      <div className={styles.loadingWrapper}>
        <Spinner size={36} label={t('common.loading')} />
      </div>
    );
  }

  if (error) {
    if (error.code === 'not-found') {
      return (
        <div className={styles.errorStateWrapper} role="alert" data-testid="project-not-found">
          <h2 className={styles.errorStateTitle}>
            {t('project.error.notFound')}
          </h2>
          <p className={styles.errorStateDesc}>
            {t('project.error.notFoundDesc')}
          </p>
          <Button href="/dashboard" variant="primary">{t('common.backToDashboard')}</Button>
        </div>
      );
    }

    if (error.code === 'permission-denied') {
      return (
        <div className={styles.errorStateWrapper}>
          <h2 className={styles.errorStateTitle} style={{ color: 'var(--st-overdue-fg)' }}>
            {t('project.error.accessDenied')}
          </h2>
          <p className={styles.errorStateDesc}>
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
      <div className={styles.header} data-testid="project-header">
        <Link href="/dashboard" className={styles.backLink}>
          <Icon name="arrow" size={16} />
          <span>{t('common.backToDashboard')}</span>
        </Link>
        <div className={styles.topRow}>
          <div className={styles.titleContainer}>
            <h1 className={styles.projectTitle} data-testid="project-name">
              <bdi>{project.name}</bdi>
            </h1>
            {project.description && (
              <p dir="auto" className={styles.projectDesc} data-testid="project-description">
                {project.description}
              </p>
            )}
          </div>

          <div className={styles.actions}>
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
        <div className={styles.summaryRow}>
          <div className={styles.progressSummary} data-testid="project-metrics">
            <div className={styles.progressLabelRow}>
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

          <div className={styles.membersRow} data-testid="project-members">
            <span className={styles.membersLabel}>{t('dashboard.table.members')}:</span>
            <div className={styles.avatarStack}>
              {project.memberIds.slice(0, MAX_STACKED_AVATARS).map((uid) => (
                <Avatar
                  key={uid}
                  name={project.memberNames[uid] || 'Member'}
                  size="sm"
                  className={styles.stackedAvatar}
                />
              ))}
              {project.memberIds.length > MAX_STACKED_AVATARS && (
                <span
                  className={styles.moreMembers}
                  aria-label={`${project.memberIds.length - MAX_STACKED_AVATARS} more`}
                >
                  +{project.memberIds.length - MAX_STACKED_AVATARS}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className={styles.brassRule} aria-hidden="true" />
      </div>

      {actionError && (
        <div role="alert" className={styles.actionError}>
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
        <div className={styles.tasksHeader}>
          <div className={styles.tasksHeaderLeft}>
            <h2 className={styles.tasksTitle}>
              {t('task.list.title')}
              <span className={`${styles.tasksCount} num`}>
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
              className={styles.scopeSwitcher}
              role="radiogroup"
              aria-label={t('task.scope.title')}
            >
              <button
                type="button"
                role="radio"
                aria-checked={viewScope === 'my_tasks'}
                className={`${styles.scopeBtn} ${viewScope === 'my_tasks' ? styles.scopeBtnActive : ''}`}
                onClick={() => setUserSelectedScope('my_tasks')}
                data-testid="scope-switch-my-tasks"
              >
                👤 {t('task.scope.myTasks')}
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={viewScope === 'all'}
                className={`${styles.scopeBtn} ${viewScope === 'all' ? styles.scopeBtnActive : ''}`}
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
            <div className={styles.viewControlsRow}>
              <div
                className={styles.viewSwitcher}
                role="radiogroup"
                aria-label={t('view.switcher')}
              >
                <button
                  type="button"
                  role="radio"
                  aria-checked={view === 'list'}
                  className={`${styles.viewBtn} ${view === 'list' ? styles.viewBtnActive : ''}`}
                  onClick={() => setView('list')}
                  data-testid="view-switch-list"
                >
                  {t('view.list')}
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={view === 'board'}
                  className={`${styles.viewBtn} ${view === 'board' ? styles.viewBtnActive : ''}`}
                  onClick={() => setView('board')}
                  data-testid="view-switch-board"
                >
                  {t('view.board')}
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={view === 'calendar'}
                  className={`${styles.viewBtn} ${view === 'calendar' ? styles.viewBtnActive : ''}`}
                  onClick={() => setView('calendar')}
                  data-testid="view-switch-calendar"
                >
                  {t('view.calendar')}
                </button>
              </div>
            </div>

            <div className={styles.filterWrapper}>
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
