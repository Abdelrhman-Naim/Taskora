'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ProjectForm } from '@/components/projects/ProjectForm';
import { createProject } from '@/services/projects';
import { getDb } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/i18n/I18nProvider';
import { Dialog } from '@/components/ui/Dialog';

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
      <Dialog
        isOpen={true}
        onClose={() => router.push('/dashboard')}
        title={t('project.new.title')}
        description={t('project.new.subtitle')}
        size="md"
      >
        <div data-testid="new-project-card">
          <ProjectForm
            onSubmit={handleCreate}
            submitLabel={t('project.new.button')}
            submitTestId="create-project-btn"
            onCancel={() => router.push('/dashboard')}
          />
        </div>
      </Dialog>
    </div>
  );
}
