'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Project, Task, TaskStatus } from '@/types';
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
import { TaskList } from '@/components/tasks/TaskList';
import { TaskForm } from '@/components/tasks/TaskForm';
import { FilterBar } from '@/components/tasks/FilterBar';
import { TaskFilters, DEFAULT_FILTERS, filterTasks } from '@/lib/taskFilters';
import { todayString } from '@/lib/dates';
import { AppError } from '@/lib/errors';
import styles from './page.module.css';

export default function ProjectPage(): React.ReactElement | null {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const { user } = useAuth();
  const { t } = useI18n();
  const getErrorMessage = useErrorMessage();

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TaskFilters>(DEFAULT_FILTERS);

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

  const handleCreateTask = async (data: {
    title: string;
    description: string;
    priority: Task['priority'];
    assigneeId: string | null;
    dueDate: string | null;
  }) => {
    if (!project || !user) return;
    const db = getDb();
    await createTask(db, project.id, user.uid, data);
    setShowCreateForm(false);
    await reloadTasks();
  };

  const handleUpdateTask = async (data: {
    title: string;
    description: string;
    priority: Task['priority'];
    assigneeId: string | null;
    dueDate: string | null;
    status?: TaskStatus;
  }) => {
    if (!project || !editingTask) return;
    const db = getDb();
    await updateTask(db, project.id, editingTask.id, data);
    setEditingTask(null);
    await reloadTasks();
  };

  const handleStatusChange = async (task: Task, newStatus: TaskStatus) => {
    if (!project) return;
    setActionError(null);
    try {
      const db = getDb();
      await changeTaskStatus(db, project.id, task.id, newStatus);
      await reloadTasks();
    } catch (err) {
      setActionError(getErrorMessage(err));
    }
  };

  const handleConfirmDelete = async () => {
    if (!project || !deletingTask) return;
    setActionError(null);
    try {
      const db = getDb();
      await deleteTask(db, project.id, deletingTask.id);
      setDeletingTask(null);
      await reloadTasks();
    } catch (err) {
      setActionError(getErrorMessage(err));
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minBlockSize: '50vh' }}>
        <Spinner size={36} label={t('common.loading')} />
      </div>
    );
  }

  if (error) {
    if (error.code === 'not-found') {
      return (
        <div style={{ textAlign: 'center', paddingBlock: '60px', paddingInline: '20px' }}>
          <h2 style={{ fontSize: '1.375rem', fontWeight: 700, marginBlockEnd: '12px' }}>
            {t('project.error.notFound')}
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBlockEnd: '24px' }}>
            {t('project.error.notFoundDesc')}
          </p>
          <Button href="/dashboard" variant="primary">{t('common.backToDashboard')}</Button>
        </div>
      );
    }

    if (error.code === 'permission-denied') {
      return (
        <div style={{ textAlign: 'center', paddingBlock: '60px', paddingInline: '20px' }}>
          <h2 style={{ fontSize: '1.375rem', fontWeight: 700, marginBlockEnd: '12px', color: 'var(--st-overdue-fg)' }}>
            {t('project.error.accessDenied')}
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBlockEnd: '24px' }}>
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

  const isOwner = user?.uid === project.ownerId;
  const currentUid = user?.uid || '';
  const filteredTasks = filterTasks(tasks, filters, todayString());

  return (
    <div>
      <div className={styles.header}>
        <Link href="/dashboard" className={styles.backLink}>
          <Icon name="arrow" size={16} />
          <span>{t('common.backToDashboard')}</span>
        </Link>
        <div className={styles.topRow}>
          <div className={styles.titleContainer}>
            <h1 className={styles.projectTitle}>
              <bdi>{project.name}</bdi>
            </h1>
            {project.description && (
              <p dir="auto" className={styles.projectDesc}>
                {project.description}
              </p>
            )}
          </div>

          <div className={styles.actions}>
            {isOwner && (
              <Link href={`/projects/${project.id}/settings`}>
                <Button variant="secondary" icon="settings">
                  {t('project.edit.title')}
                </Button>
              </Link>
            )}

            <Button
              variant="primary"
              icon="plus"
              onClick={() => {
                setEditingTask(null);
                setShowCreateForm(true);
              }}
            >
              {t('task.new.button')}
            </Button>
          </div>
        </div>
        <div className={styles.brassRule} aria-hidden="true" />
      </div>

      {actionError && (
        <div
          role="alert"
          style={{
            paddingBlock: '12px',
            paddingInline: '16px',
            backgroundColor: 'var(--st-overdue-bg)',
            border: '1px solid var(--st-overdue-fg)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--st-overdue-fg)',
            fontSize: '0.875rem',
            marginBlockEnd: '20px',
          }}
        >
          {actionError}
        </div>
      )}

      {/* Task Creation Modal / Panel */}
      {showCreateForm && (
        <div className={styles.panel}>
          <h2 className={styles.panelTitle}>{t('task.new.title')}</h2>
          <TaskForm
            project={project}
            currentUserId={currentUid}
            isOwner={isOwner}
            onSave={handleCreateTask}
            onCancel={() => setShowCreateForm(false)}
          />
        </div>
      )}

      {/* Task Edit Modal / Panel */}
      {editingTask && (
        <div className={styles.panel}>
          <h2 className={styles.panelTitle}>{t('task.edit.title')}</h2>
          <TaskForm
            project={project}
            initialTask={editingTask}
            currentUserId={currentUid}
            isOwner={isOwner}
            onSave={handleUpdateTask}
            onCancel={() => setEditingTask(null)}
          />
        </div>
      )}

      {/* Tasks List */}
      <div>
        <div className={styles.tasksHeader}>
          <h2 className={styles.tasksTitle}>
            {t('task.list.title')}
            <span className={`${styles.tasksCount} num`}>({tasks.length})</span>
          </h2>
        </div>

        {tasks.length > 0 && (
          <div className={styles.filterWrapper}>
            <FilterBar
              filters={filters}
              onChange={setFilters}
              members={project.memberNames || {}}
              onReset={() => setFilters(DEFAULT_FILTERS)}
            />
          </div>
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
        ) : (
          <TaskList
            tasks={filteredTasks}
            project={project}
            currentUserId={currentUid}
            isOwner={isOwner}
            onEdit={(task) => {
              setShowCreateForm(false);
              setEditingTask(task);
            }}
            onDelete={(task) => setDeletingTask(task)}
            onStatusChange={handleStatusChange}
            onNewTask={() => {
              setEditingTask(null);
              setShowCreateForm(true);
            }}
          />
        )}
      </div>

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
    </div>
  );
}
