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
import styles from './page.module.css';

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
    <div data-testid="page-ready">
      <div className={styles.header}>
        <Link href="/dashboard" className={styles.backLink}>
          <Icon name="arrow" size={16} />
          <span>{t('common.backToDashboard')}</span>
        </Link>
        <h1 className={styles.title}>
          {t('project.new.title')}
        </h1>
        <p className={styles.subtitle}>
          {t('project.new.subtitle')}
        </p>
        <div className={styles.brassRule} aria-hidden="true" />
      </div>

      <div className={styles.card} data-testid="new-project-card">
        <ProjectForm
          onSubmit={handleCreate}
          submitLabel={t('project.new.button')}
          submitTestId="create-project-btn"
          onCancel={() => router.push('/dashboard')}
        />
      </div>
    </div>
  );
}
