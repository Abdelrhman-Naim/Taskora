'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProjectForm } from '@/components/projects/ProjectForm';
import { createProject } from '@/services/projects';
import { getDb } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/i18n/I18nProvider';
import { Icon } from '@/components/ui/Icon';

export default function NewProjectPage(): React.ReactElement {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useI18n();

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
      <div style={{ marginBlockEnd: '28px' }}>
        <Link
          href="/dashboard"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.8125rem',
            color: 'var(--text-muted)',
            textDecoration: 'none',
            marginBlockEnd: '12px',
          }}
        >
          <Icon name="arrow" size={16} />
          <span>{t('common.backToDashboard')}</span>
        </Link>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, margin: 0, color: 'var(--text)' }}>
          {t('project.new.title')}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem', marginBlockStart: '6px', marginBlockEnd: 0 }}>
          {t('project.new.subtitle')}
        </p>
        <div
          style={{
            blockSize: '1px',
            backgroundColor: 'var(--brass)',
            inlineSize: '100%',
            marginBlockStart: '16px',
          }}
          aria-hidden="true"
        />
      </div>

      <div
        style={{
          backgroundColor: 'var(--surface)',
          padding: '24px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)',
          maxInlineSize: '640px',
        }}
      >
        <ProjectForm onSubmit={handleCreate} submitLabel={t('project.new.button')} />
      </div>
    </div>
  );
}
