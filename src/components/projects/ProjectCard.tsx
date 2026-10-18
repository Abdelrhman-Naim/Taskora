'use client';

import React from 'react';
import Link from 'next/link';
import { Project } from '@/types';
import { useI18n } from '@/i18n/I18nProvider';

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps): React.ReactElement {
  const { tp, formatDueDate } = useI18n();
  const memberCount = project.memberIds.length;

  const updatedDateStr = project.updatedAt
    ? formatDueDate(new Date(project.updatedAt).toISOString().split('T')[0])
    : '';

  return (
    <Link
      href={`/projects/${project.id}`}
      style={{
        display: 'block',
        backgroundColor: 'var(--surface)',
        padding: '20px',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
        textDecoration: 'none',
        color: 'inherit',
        transition: 'border-color var(--dur-1) var(--ease), background-color var(--dur-1) var(--ease)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBlockEnd: '8px', gap: '12px' }}>
        <h2 dir="auto" style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text)' }}>
          {project.name}
        </h2>
        <span
          className="num"
          style={{
            fontSize: '0.75rem',
            fontWeight: 500,
            padding: '2px 8px',
            backgroundColor: 'var(--surface-2)',
            color: 'var(--text-muted)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)',
            whiteSpace: 'nowrap',
          }}
        >
          {tp('members.count', memberCount)}
        </span>
      </div>

      <p
        dir="auto"
        style={{
          fontSize: '0.875rem',
          color: 'var(--text-muted)',
          lineHeight: 1.5,
          marginBlockEnd: '16px',
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}
      >
        {project.description}
      </p>

      {updatedDateStr && (
        <div className="num" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {updatedDateStr}
        </div>
      )}
    </Link>
  );
}
