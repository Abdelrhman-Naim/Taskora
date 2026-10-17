'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Project } from '@/types';
import { getProject, updateProject, deleteProjectCascade } from '@/services/projects';
import { addMember, removeMember, countAssignedTasks } from '@/services/members';
import { getDb } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { ProjectForm } from '@/components/projects/ProjectForm';
import { MemberManager } from '@/components/projects/MemberManager';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { AppError } from '@/lib/errors';

export default function ProjectSettingsPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const { user } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    async function load() {
      if (!id) return;
      try {
        const db = getDb();
        const proj = await getProject(db, id);

        // Only owner is allowed on settings page
        if (user && proj.ownerId !== user.uid) {
          router.replace(`/projects/${id}`);
          return;
        }

        if (!ignore) {
          setProject(proj);
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
  }, [id, user, router]);

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    if (!id) return;
    const db = getDb();
    getProject(db, id)
      .then((proj) => {
        if (user && proj.ownerId !== user.uid) {
          router.replace(`/projects/${id}`);
          return;
        }
        setProject(proj);
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

  const handleUpdate = async (data: { name: string; description: string }) => {
    if (!id) return;
    const db = getDb();
    await updateProject(db, id, data);
    setProject((prev) => (prev ? { ...prev, name: data.name, description: data.description } : null));
    router.push(`/projects/${id}`);
  };

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const db = getDb();
      await deleteProjectCascade(db, id);
      router.replace('/dashboard');
    } catch (err) {
      setDeleting(false);
      setShowDeleteConfirm(false);
      if (err instanceof AppError) {
        setDeleteError(err.message);
      } else {
        setDeleteError('Failed to delete project. Please try again.');
      }
    }
  };

  const reloadProject = async () => {
    if (!id) return;
    try {
      const db = getDb();
      const proj = await getProject(db, id);
      setProject(proj);
    } catch (err) {
      if (err instanceof AppError) {
        setError(err);
      }
    }
  };

  const handleAddMember = async (memberEmail: string) => {
    if (!id) return;
    const db = getDb();
    await addMember(db, id, memberEmail);
    await reloadProject();
  };

  const handleRemoveMember = async (uid: string) => {
    if (!id) return;
    const db = getDb();
    await removeMember(db, id, uid);
    await reloadProject();
  };

  const handleGetAssignedCount = async (uid: string): Promise<number> => {
    if (!id) return 0;
    const db = getDb();
    return countAssignedTasks(db, id, uid);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <Spinner size={36} label="Loading settings..." />
      </div>
    );
  }

  if (error || !project) {
    return (
      <ErrorState
        title="Project unavailable"
        message={error?.message || 'Could not load project settings.'}
        onRetry={handleRetry}
      />
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <Link
          href={`/projects/${project.id}`}
          style={{ fontSize: '13px', color: 'var(--text-muted)', textDecoration: 'none', display: 'inline-block', marginBottom: '8px' }}
        >
          &larr; Back to {project.name}
        </Link>
        <h1 style={{ fontSize: '26px', fontWeight: 800 }}>Project Settings</h1>
      </div>

      {deleteError && (
        <div
          role="alert"
          style={{
            padding: '12px 16px',
            marginBottom: '20px',
            backgroundColor: 'var(--danger-bg)',
            border: '1px solid var(--danger-border)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--danger)',
            fontSize: '14px',
          }}
        >
          {deleteError}
        </div>
      )}

      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          padding: '24px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          marginBottom: '32px',
        }}
      >
        <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>General Information</h2>
        <ProjectForm
          initialValues={{ name: project.name, description: project.description }}
          onSubmit={handleUpdate}
          submitLabel="Save Changes"
        />
      </div>

      <div
        style={{
          backgroundColor: 'var(--surface)',
          padding: '24px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border)',
          marginBottom: '32px',
        }}
      >
        <MemberManager
          project={project}
          onAddMember={handleAddMember}
          onRemoveMember={handleRemoveMember}
          getAssignedTaskCount={handleGetAssignedCount}
        />
      </div>

      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          padding: '24px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--danger-border)',
        }}
      >
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--danger)', marginBottom: '8px' }}>
          Danger Zone
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Deleting this project is permanent and will delete all associated tasks.
        </p>
        <button
          type="button"
          onClick={() => setShowDeleteConfirm(true)}
          disabled={deleting}
          style={{
            padding: '10px 18px',
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--primary-fg)',
            backgroundColor: 'var(--danger)',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            cursor: deleting ? 'not-allowed' : 'pointer',
          }}
        >
          {deleting ? 'Deleting...' : 'Delete Project'}
        </button>
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Project?"
        message={`Are you sure you want to permanently delete "${project.name}" and all its tasks? This action cannot be undone.`}
        confirmLabel="Yes, Delete Project"
        cancelLabel="Cancel"
        isDangerous={true}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
