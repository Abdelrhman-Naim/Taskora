'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Project, Task } from '@/types';
import { getDb } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { AppError } from '@/lib/errors';
import { computeStats, loadDashboardData, DashboardStatsData } from '@/lib/stats';
import { todayString } from '@/lib/dates';

export default function DashboardPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);

  useEffect(() => {
    let ignore = false;
    async function load() {
      if (!user) return;
      try {
        const db = getDb();
        const data = await loadDashboardData(db, user.uid);
        if (!ignore) {
          setProjects(data.projects);
          setTasks(data.tasks);
        }
      } catch (err) {
        if (!ignore) {
          if (err instanceof AppError) {
            setError(err);
          } else {
            setError(new AppError('unknown', 'Failed to load dashboard data.'));
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
    loadDashboardData(db, user.uid)
      .then((data) => {
        setProjects(data.projects);
        setTasks(data.tasks);
      })
      .catch((err) => {
        if (err instanceof AppError) {
          setError(err);
        } else {
          setError(new AppError('unknown', 'Failed to load dashboard data.'));
        }
      })
      .finally(() => setLoading(false));
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
        <Spinner size={36} label="Loading your dashboard..." />
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error.message} onRetry={handleRetry} />;
  }

  const stats: DashboardStatsData = computeStats(tasks, todayString());

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
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)' }}>Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Overview of your team&apos;s activity, overdue tasks, and projects
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

      {/* Dashboard Statistics & Overdue List */}
      <DashboardStats
        stats={stats}
        projects={projects}
        hasProjects={projects.length > 0}
      />

      {/* Projects List Grid */}
      {projects.length > 0 && (
        <div style={{ marginTop: '36px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700 }}>
              Projects <span style={{ fontSize: '15px', color: 'var(--text-muted)', fontWeight: 500 }}>({projects.length})</span>
            </h2>
          </div>

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
        </div>
      )}
    </div>
  );
}
