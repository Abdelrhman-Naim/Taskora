'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
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
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/i18n/I18nProvider';
import { useErrorMessage } from '@/i18n/useErrorMessage';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Avatar } from '@/components/ui/Avatar';
import { TaskList } from '@/components/tasks/TaskList';
import { TaskBoard } from '@/components/tasks/TaskBoard';
import { TaskCalendar } from '@/components/tasks/TaskCalendar';
import { TaskForm } from '@/components/tasks/TaskForm';
import { TaskDetailDialog } from '@/components/tasks/TaskDetailDialog';
import { ActivityPanel } from '@/components/projects/ActivityPanel';
import { FilterBar } from '@/components/tasks/FilterBar';
import { useViewPreference } from '@/hooks/useViewPreference';
import { useHotkeys } from '@/hooks/useHotkeys';
import { ShortcutsDialog } from '@/components/shell/ShortcutsDialog';
import { tasksToCsv, csvFilename } from '@/lib/csv';
import { TaskFilters, DEFAULT_FILTERS, filterTasks } from '@/lib/taskFilters';
import { todayString } from '@/lib/dates';
import { AppError } from '@/lib/errors';
import styles from './page.module.css';

export default function ProjectPage(): React.ReactElement | null {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const getErrorMessage = useErrorMessage();

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [activeDetailTask, setActiveDetailTask] = useState<Task | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TaskFilters>(DEFAULT_FILTERS);
  const [view, setView] = useViewPreference();
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  type ViewScope = 'my_tasks' | 'all';
  const [userSelectedScope, setUserSelectedScope] = useState<ViewScope | null>(null);

  useHotkeys({
    KeyN: () => {
      if (!isOwner) return;
      setEditingTask(null);
      setShowCreateForm(true);
    },
    Slash: (e) => {
      e.preventDefault();
      document.getElementById('filter-search')?.focus();
    },
    'Shift+Slash': () => {
      setShowShortcuts(true);
    },
    Digit1: () => setView('list'),
    Digit2: () => setView('board'),
    Digit3: () => setView('calendar'),
  });

  useEffect(() => {
    let ignore = false;
    async function load() {
      if (!id) return;
      try {
        const db = getDb();
        const proj = await getProject(db, id);
        if (!ignore) {
          setProject(proj);
        }
        const taskList = await listTasks(db, id);
        if (!ignore) {
          setTasks(taskList);
        }
      } catch (err) {
        if (!ignore) {
          if (err instanceof AppError) {
            setError(err);
          } else {
            setError(new AppError('unknown', 'Failed to load project'));
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
  }, [id]);

  const reloadTasks = async () => {
    if (!id) return;
    try {
      const db = getDb();
      const list = await listTasks(db, id);
      setTasks(list);
    } catch (err) {
      setActionError(getErrorMessage(err));
    }
  };

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    if (!id) return;
    const db = getDb();
    Promise.all([getProject(db, id), listTasks(db, id)])
      .then(([proj, taskList]) => {
        setProject(proj);
        setTasks(taskList);
      })
      .catch((err) => {
        if (err instanceof AppError) {
          setError(err);
        } else {
          setError(new AppError('unknown', 'Failed to load project'));
        }
      })
      .finally(() => setLoading(false));
  };

  const getActor = () => ({
    uid: user?.uid || '',
    displayName: (user?.uid && project?.memberNames?.[user.uid]) || user?.displayName || user?.email?.split('@')[0] || 'User',
  });

  const handleCreateTask = async (data: TaskInput) => {
    if (!project || !user || !isOwner) return;
    const db = getDb();

    if (data.multiAssigneeMode === 'individual' && data.selectedMemberIds && data.selectedMemberIds.length > 0) {
      for (const memberId of data.selectedMemberIds) {
        await createTask(
          db,
          project.id,
          user.uid,
          {
            ...data,
            assigneeId: memberId,
          },
          {
            actor: getActor(),
            projectName: project.name,
          }
        );
      }
    } else {
      await createTask(
        db,
        project.id,
        user.uid,
        data,
        {
          actor: getActor(),
          projectName: project.name,
        }
      );
    }

    setShowCreateForm(false);
    await reloadTasks();
  };

  const handleUpdateTask = async (data: TaskPatch) => {
    if (!project || !editingTask) return;
    const db = getDb();
    await updateTask(db, project.id, editingTask.id, data, {
      actor: getActor(),
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
        actor: getActor(),
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
          actor: getActor(),
          task: activeDetailTask,
          projectName: project.name,
        });
      } else {
        await updateTask(db, project.id, activeDetailTask.id, patch, {
          actor: getActor(),
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
        actor: getActor(),
        task: deletingTask,
      });
      setDeletingTask(null);
      await reloadTasks();
    } catch (err) {
      setActionError(getErrorMessage(err));
    }
  };

  const currentUid = user?.uid || '';
  const isOwner = Boolean(project && user?.uid === project.ownerId);
  // Non-owners can NEVER view all tasks; only owners have the choice
  const viewScope: ViewScope = isOwner ? (userSelectedScope ?? 'all') : 'my_tasks';

  const scopedTasks = useMemo(() => {
    if (viewScope === 'all') {
      return tasks;
    }
    return tasks.filter((t) => {
      // 1. Task assigned to a specific user -> ONLY show if assigned to current user
      if (t.assigneeId) {
        return t.assigneeId === currentUid;
      }
      // 2. Shared task with checklist items for members
      if (t.checklist && t.checklist.length > 0) {
        return t.checklist.some((c) => c.id === currentUid);
      }
      // 3. Unassigned task without checklist
      return isOwner || t.createdBy === currentUid;
    });
  }, [tasks, viewScope, currentUid, isOwner]);

  const filteredTasks = useMemo(() => {
    return filterTasks(scopedTasks, filters, todayString());
  }, [scopedTasks, filters]);

  const handleExportCsv = () => {
    if (!project) return;
    const csvContent = tasksToCsv(filteredTasks, project, t);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', csvFilename(project.name, todayString()));
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

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
        onRetry={handleRetry}
      />
    );
  }

  if (!project) return null;

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.status === 'done').length;
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <div data-testid="page-ready">
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

            {tasks.length > 0 && (
              <Button
                variant="secondary"
                data-testid="project-export-csv-btn"
                onClick={handleExportCsv}
              >
                {t('csv.export', { count: filteredTasks.length })}
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
              <strong className="num">{progress}% ({doneTasks}/{totalTasks})</strong>
            </div>
            <ProgressBar
              value={doneTasks}
              max={totalTasks}
              label={t('dashboard.table.progress')}
            />
          </div>

          <div className={styles.membersRow} data-testid="project-members">
            <span className={styles.membersLabel}>{t('dashboard.table.members')}:</span>
            <div className={styles.avatarStack}>
              {project.memberIds.slice(0, 5).map((uid) => (
                <Avatar
                  key={uid}
                  name={project.memberNames[uid] || 'Member'}
                  size="sm"
                  className={styles.stackedAvatar}
                />
              ))}
              {project.memberIds.length > 5 && (
                <span className={styles.moreMembers} aria-label={`${project.memberIds.length - 5} more`}>
                  +{project.memberIds.length - 5}
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

      {/* Tasks List */}
      <div>
        <div className={styles.tasksHeader}>
          <div className={styles.tasksHeaderLeft}>
            <h2 className={styles.tasksTitle}>
              {t('task.list.title')}
              <span className={`${styles.tasksCount} num`}>
                ({filteredTasks.length}{isOwner && viewScope === 'my_tasks' && tasks.length !== filteredTasks.length ? ` / ${tasks.length}` : ''})
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

        {tasks.length > 0 && filteredTasks.length === 0 ? (
          <EmptyState
            title={t('task.empty.title')}
            message={t('task.empty.description')}
            action={{
              label: t('filter.clear'),
              onClick: () => setFilters(DEFAULT_FILTERS),
            }}
          />
        ) : view === 'board' ? (
          <TaskBoard
            tasks={filteredTasks}
            project={project}
            currentUserId={currentUid}
            isOwner={isOwner}
            onStatusChange={handleStatusChange}
            onOpen={(task) => setActiveDetailTask(task)}
          />
        ) : view === 'calendar' ? (
          <TaskCalendar
            tasks={filteredTasks}
            locale={locale}
            onOpen={(task) => setActiveDetailTask(task)}
          />
        ) : (
          <TaskList
            tasks={filteredTasks}
            project={project}
            currentUserId={currentUid}
            isOwner={isOwner}
            onOpen={(task) => setActiveDetailTask(task)}
            onEdit={(task) => {
              setShowCreateForm(false);
              setEditingTask(task);
            }}
            onDelete={(task) => setDeletingTask(task)}
            onStatusChange={handleStatusChange}
            onNewTask={isOwner ? () => {
              setEditingTask(null);
              setShowCreateForm(true);
            } : undefined}
          />
        )}
      </div>

      {/* Task Detail Dialog */}
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

      {/* Confirm Task Deletion Dialog */}
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
      {/* Keyboard Shortcuts Dialog */}
      {showShortcuts && (
        <ShortcutsDialog
          isOpen={showShortcuts}
          onClose={() => setShowShortcuts(false)}
        />
      )}

      {/* Project Activity Panel */}
      {showActivity && id && (
        <ActivityPanel
          projectId={id}
          isOpen={showActivity}
          onClose={() => setShowActivity(false)}
        />
      )}
    </div>
  );
}
