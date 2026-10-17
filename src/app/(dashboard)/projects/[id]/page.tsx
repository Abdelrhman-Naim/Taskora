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
import { Spinner } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { TaskList } from '@/components/tasks/TaskList';
import { TaskForm } from '@/components/tasks/TaskForm';
import { FilterBar } from '@/components/tasks/FilterBar';
import { TaskFilters, DEFAULT_FILTERS, filterTasks } from '@/lib/taskFilters';
import { todayString } from '@/lib/dates';
import { AppError } from '@/lib/errors';

export default function ProjectPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const { user } = useAuth();

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
      if (err instanceof AppError) {
        setActionError(err.message);
      }
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
      if (err instanceof AppError) {
        setActionError(err.message);
      } else {
        setActionError('Failed to change task status');
      }
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
      if (err instanceof AppError) {
        setActionError(err.message);
      } else {
        setActionError('Failed to delete task');
      }
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <Spinner size={36} label="Loading project..." />
      </div>
    );
  }

  if (error) {
    if (error.code === 'not-found') {
      return (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '12px' }}>Project not found</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            The project you are looking for does not exist or has been deleted.
          </p>
          <Link
            href="/dashboard"
            style={{
              padding: '8px 16px',
              backgroundColor: 'var(--primary)',
              color: 'var(--primary-fg)',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Back to Dashboard
          </Link>
        </div>
      );
    }

    if (error.code === 'permission-denied') {
      return (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '12px', color: 'var(--danger)' }}>
            Access Denied
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            You don&apos;t have access to this project.
          </p>
          <Link
            href="/dashboard"
            style={{
              padding: '8px 16px',
              backgroundColor: 'var(--primary)',
              color: 'var(--primary-fg)',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Back to Dashboard
          </Link>
        </div>
      );
    }

    return (
      <ErrorState
        title="Failed to load project"
        message={error.message}
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
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <Link
              href="/dashboard"
              style={{ fontSize: '13px', color: 'var(--text-muted)', textDecoration: 'none', display: 'inline-block', marginBottom: '8px' }}
            >
              &larr; Back to Dashboard
            </Link>
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)' }}>
              {project.name}
            </h1>
            {project.description && (
              <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginTop: '6px', maxWidth: '700px' }}>
                {project.description}
              </p>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {isOwner && (
              <Link
                href={`/projects/${project.id}/settings`}
                style={{
                  padding: '8px 14px',
                  backgroundColor: 'var(--surface)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '14px',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                Project Settings
              </Link>
            )}

            <button
              type="button"
              onClick={() => {
                setEditingTask(null);
                setShowCreateForm(true);
              }}
              style={{
                padding: '8px 18px',
                backgroundColor: 'var(--primary)',
                color: 'var(--primary-fg)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              + New Task
            </button>
          </div>
        </div>
      </div>

      {actionError && (
        <div
          role="alert"
          style={{
            padding: '12px 16px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid var(--danger)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--danger)',
            fontSize: '14px',
            marginBottom: '20px',
          }}
        >
          {actionError}
        </div>
      )}

      {/* Task Creation Modal / Panel */}
      {showCreateForm && (
        <div
          style={{
            marginBottom: '28px',
            padding: '24px',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px' }}>New Task</h2>
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
        <div
          style={{
            marginBottom: '28px',
            padding: '24px',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px' }}>Edit Task</h2>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700 }}>
            Tasks <span style={{ fontSize: '15px', color: 'var(--text-muted)', fontWeight: 500 }}>({tasks.length})</span>
          </h2>
        </div>

        {tasks.length > 0 && (
          <FilterBar
            filters={filters}
            onChange={setFilters}
            members={project.memberNames || {}}
            onReset={() => setFilters(DEFAULT_FILTERS)}
          />
        )}

        {tasks.length > 0 && filteredTasks.length === 0 ? (
          <EmptyState
            title="No tasks match your filters"
            message="Try adjusting or clearing your filters to see tasks."
            action={{
              label: 'Reset Filters',
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
        <ConfirmDialog
          isOpen={true}
          title="Delete Task"
          message={`Are you sure you want to delete "${deletingTask.title}"? This action cannot be undone.`}
          confirmLabel="Delete Task"
          isDangerous={true}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingTask(null)}
        />
      )}
    </div>
  );
}
