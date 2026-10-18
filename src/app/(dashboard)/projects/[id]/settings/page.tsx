'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Project } from '@/types';
import { getProject, updateProject, deleteProjectCascade } from '@/services/projects';
import { addMember, removeMember, countAssignedTasks } from '@/services/members';
import { getDb } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/i18n/I18nProvider';
import { useErrorMessage } from '@/i18n/useErrorMessage';
import { ProjectForm } from '@/components/projects/ProjectForm';
import { MemberManager } from '@/components/projects/MemberManager';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { AppError } from '@/lib/errors';
import styles from './page.module.css';

export default function ProjectSettingsPage(): React.ReactElement | null {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useI18n();
  const getErrorMessage = useErrorMessage();

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
      setDeleteError(getErrorMessage(err));
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
      <div className={styles.loadingWrapper}>
        <Spinner size={36} label={t('common.loading')} />
      </div>
    );
  }

  if (error || !project) {
    return (
      <ErrorState
        title={t('project.error.notFound')}
        message={error ? getErrorMessage(error) : t('project.error.notFoundDesc')}
        onRetry={handleRetry}
      />
    );
  }

  return (
    <div data-testid="page-ready">
      <div className={styles.header} data-testid="project-settings-header">
        <Link
          href={`/projects/${project.id}`}
          className={styles.backLink}
        >
          <Icon name="arrow" size={16} />
          <span>{t('common.back')}</span>: <span><bdi>{project.name}</bdi></span>
        </Link>
        <h1 className={styles.title}>
          {t('project.edit.title')}
        </h1>
        <div className={styles.brassRule} aria-hidden="true" />
      </div>

      {deleteError && (
        <div role="alert" className={styles.deleteErrorAlert}>
          {deleteError}
        </div>
      )}

      {/* General Settings */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>
          {t('project.edit.title')}
        </h2>
        <ProjectForm
          initialValues={{ name: project.name, description: project.description }}
          onSubmit={handleUpdate}
          submitLabel={t('common.save')}
        />
      </div>

      {/* Members Management */}
      <div className={styles.card}>
        <MemberManager
          project={project}
          onAddMember={handleAddMember}
          onRemoveMember={handleRemoveMember}
          getAssignedTaskCount={handleGetAssignedCount}
        />
      </div>

      {/* Danger Zone */}
      <div className={styles.dangerCard} data-testid="danger-zone">
        <h2 className={styles.dangerTitle}>
          {t('project.settings.dangerZone')}
        </h2>
        <p className={styles.dangerDesc}>
          {t('project.settings.deleteWarning')}
        </p>
        <Button
          variant="danger"
          data-testid="delete-project-btn"
          onClick={() => setShowDeleteConfirm(true)}
          disabled={deleting}
          loading={deleting}
        >
          {t('project.settings.deleteButton')}
        </Button>
      </div>

      <Dialog
        isOpen={showDeleteConfirm}
        title={t('project.delete.confirmTitle')}
        message={t('project.delete.confirmMessage', { name: project.name })}
        confirmLabel={t('project.settings.deleteButton')}
        cancelLabel={t('common.cancel')}
        isDangerous={true}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
