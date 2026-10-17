'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Project } from '@/types';
import { listUserProjects } from '@/services/projects';
import { getDb } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { AppError } from '@/lib/errors';

export default function DashboardPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);
  useEffect(() => {
    let ignore = false;
    async function load() {
      if (!user) return;
      try {
        const db = getDb();
        const list = await listUserProjects(db, user.uid);
        if (!ignore) {
          setProjects(list);
        }
      } catch (err) {
        if (!ignore) {
          if (err instanceof AppError) {
            setError(err);
          } else {
            setError(new AppError('unknown', 'Failed to load projects.'));
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
  }, [user]);

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    if (!user) return;
    const db = getDb();
    listUserProjects(db, user.uid)
      .then((list) => setProjects(list))
      .catch((err) => {
        if (err instanceof AppError) {
          setError(err);
        } else {
          setError(new AppError('unknown', 'Failed to load projects.'));
        }
      })
      .finally(() => setLoading(false));
  };

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '28px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)' }}>Projects</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Manage and organize your team projects
          </p>
        </div>

        <Link
          href="/projects/new"
          style={{
            padding: '10px 18px',
            backgroundColor: 'var(--primary)',
            color: 'var(--primary-fg)',
            borderRadius: 'var(--radius-sm)',
            fontWeight: 600,
            fontSize: '14px',
            textDecoration: 'none',
          }}
        >
          + New Project
        </Link>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
          <Spinner size={36} label="Loading your projects..." />
        </div>
      ) : error ? (
        <ErrorState message={error.message} onRetry={handleRetry} />
      ) : projects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          message="Create your first project to start collaborating and tracking tasks."
          action={{
            label: "Create Project",
            href: "/projects/new",
          }}
        />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '20px',
          }}
        >
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
