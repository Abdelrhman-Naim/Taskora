import React from 'react';
import Link from 'next/link';
import { Project } from '@/types';

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const memberCount = project.memberIds.length;

  return (
    <Link
      href={`/projects/${project.id}`}
      style={{
        display: 'block',
        backgroundColor: 'var(--bg-card)',
        padding: '20px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-color)',
        textDecoration: 'none',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>
          {project.name}
        </h2>
        <span
          style={{
            fontSize: '12px',
            fontWeight: 500,
            padding: '2px 8px',
            backgroundColor: 'var(--bg-primary)',
            color: 'var(--text-muted)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)',
          }}
        >
          {memberCount} {memberCount === 1 ? 'member' : 'members'}
        </span>
      </div>

      <p
        style={{
          fontSize: '14px',
          color: 'var(--text-secondary)',
          lineHeight: 1.5,
          marginBottom: '16px',
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}
      >
        {project.description || 'No description provided.'}
      </p>

      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
        Updated {project.updatedAt ? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(project.updatedAt) : 'recently'}
      </div>
    </Link>
  );
}
