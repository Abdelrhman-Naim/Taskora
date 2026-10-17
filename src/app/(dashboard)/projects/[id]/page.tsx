'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Project } from '@/types';
import { getProject } from '@/services/projects';
import { getDb } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { AppError } from '@/lib/errors';

export default function ProjectPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const { user } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);

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

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    if (!id) return;
    const db = getDb();
    getProject(db, id)
      .then((proj) => setProject(proj))
      .catch((err) => {
        if (err instanceof AppError) {
          setError(err);
        } else {
          setError(new AppError('unknown', 'Failed to load project'));
        }
      })
      .finally(() => setLoading(false));
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

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
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
                  backgroundColor: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '14px',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                Project Settings
              </Link>
            )}
          </div>
        </div>
      </div>

      <div style={{ padding: '24px', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700 }}>Tasks</h2>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Task management will be active here.</p>
      </div>
    </div>
  );
}
