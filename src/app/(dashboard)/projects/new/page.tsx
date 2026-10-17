'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProjectForm } from '@/components/projects/ProjectForm';
import { createProject } from '@/services/projects';
import { getDb } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';

export default function NewProjectPage() {
  const router = useRouter();
  const { user } = useAuth();

  const handleCreate = async (data: { name: string; description: string }) => {
    if (!user) return;
    const db = getDb();
    const newId = await createProject(
      db,
      { uid: user.uid, displayName: user.displayName || user.email },
      data
    );
    router.push(`/projects/${newId}`);
  };

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <Link
          href="/dashboard"
          style={{ fontSize: '14px', color: 'var(--text-muted)', textDecoration: 'none' }}
        >
          &larr; Back to Dashboard
        </Link>
        <h1 style={{ fontSize: '24px', fontWeight: 700, marginTop: '8px' }}>Create New Project</h1>
      </div>

      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          padding: '24px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
        }}
      >
        <ProjectForm onSubmit={handleCreate} submitLabel="Create Project" />
      </div>
    </div>
  );
}
