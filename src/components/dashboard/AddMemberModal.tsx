'use client';

// ============================================================================
// ZONE 1: IMPORTS
// ============================================================================
import React, { useState } from 'react';
import { Project, ProjectMemberProfile } from '@/types';
import { addProjectMemberProfile } from '@/services/projects';
import { getDb } from '@/lib/firebase';
import { useI18n } from '@/i18n/I18nProvider';
import { Icon } from '@/components/ui/Icon';

// ============================================================================
// ZONE 2: CONFIG & PRESETS (EASY EDIT ZONE)
// ============================================================================
export const JOB_TITLE_PRESETS = [
  'UI/UX Designer',
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'QA Engineer',
  'DevOps Specialist',
  'Project Manager',
  'Product Owner',
  'Content Writer',
] as const;

const MODAL_STYLES = {
  backdrop: 'fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm',
  container: 'w-full max-w-lg rounded-xl border border-line bg-surface p-6 shadow-2xl flex flex-col gap-4 text-text',
  header: 'flex items-center justify-between border-b border-line pb-3',
  title: 'text-lg font-semibold text-text flex items-center gap-2',
  label: 'text-xs font-semibold uppercase tracking-wider text-text-2 mb-1 block',
  input: 'w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-text placeholder:text-text-3 focus:border-accent focus:outline-none',
  select: 'w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-text focus:border-accent focus:outline-none',
  presetButton: 'text-xs px-2.5 py-1 rounded-full border border-line bg-surface hover:border-accent hover:text-accent transition-colors',
  footer: 'flex items-center justify-end gap-3 pt-3 border-t border-line mt-2',
  cancelBtn: 'px-4 py-2 text-sm font-medium text-text-2 hover:text-text transition-colors',
  submitBtn: 'px-5 py-2 text-sm font-semibold rounded-lg bg-accent text-on-accent hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2',
};

// ============================================================================
// ZONE 3: TYPES & INTERFACES
// ============================================================================
export interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  onMemberAdded?: () => void;
}

interface MemberFormData {
  projectId: string;
  email: string;
  displayName: string;
  jobTitle: string;
}

// ============================================================================
// ZONE 4: HELPER FUNCTIONS
// ============================================================================
function generateMemberUid(email: string): string {
  // Client-side fallback UID based on email hash/prefix until auth sync
  const sanitized = email.toLowerCase().replace(/[^a-z0-9]/g, '_');
  return `uid_${sanitized}_${Date.now().toString(36)}`;
}

// ============================================================================
// ZONE 5: SUB-COMPONENTS
// ============================================================================
function PresetPills({ onSelect }: { onSelect: (title: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-1.5">
      {JOB_TITLE_PRESETS.map((title) => (
        <button
          key={title}
          type="button"
          onClick={() => onSelect(title)}
          className={MODAL_STYLES.presetButton}
        >
          {title}
        </button>
      ))}
    </div>
  );
}

// ============================================================================
// ZONE 6: MAIN COMPONENT
// ============================================================================
export function AddMemberModal({
  isOpen,
  onClose,
  projects,
  onMemberAdded,
}: AddMemberModalProps): React.ReactElement | null {
  const { t, locale } = useI18n();

  const [form, setForm] = useState<MemberFormData>({
    projectId: projects[0]?.id || '',
    email: '',
    displayName: '',
    jobTitle: 'Frontend Developer',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  function updateField<K extends keyof MemberFormData>(field: K, value: MemberFormData[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.projectId) {
      setErrorMessage(locale === 'ar' ? 'يرجى اختيار المشروع' : 'Please select a project');
      return;
    }
    if (!form.email || !form.displayName || !form.jobTitle) {
      setErrorMessage(locale === 'ar' ? 'يرجى تعبئة جميع الحقول' : 'Please fill all fields');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const db = getDb();
      const profile: ProjectMemberProfile = {
        uid: generateMemberUid(form.email),
        email: form.email.trim().toLowerCase(),
        displayName: form.displayName.trim(),
        jobTitle: form.jobTitle.trim(),
        role: 'member',
        addedAt: new Date().toISOString(),
      };

      await addProjectMemberProfile(db, form.projectId, profile);
      onMemberAdded?.();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add member';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={MODAL_STYLES.backdrop} data-testid="add-member-modal">
      <div className={MODAL_STYLES.container} role="dialog" aria-modal="true">
        <div className={MODAL_STYLES.header}>
          <h2 className={MODAL_STYLES.title}>
            <Icon name="users" size={20} />
            <span>{locale === 'ar' ? 'إضافة عضو للفريق والمسمى الوظيفي' : 'Add Team Member & Role'}</span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-text-2 hover:text-text transition-colors"
            aria-label="Close"
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-xs">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {projects.length > 1 && (
            <div>
              <label className={MODAL_STYLES.label}>
                {locale === 'ar' ? 'المشروع' : 'Project'}
              </label>
              <select
                value={form.projectId}
                onChange={(e) => updateField('projectId', e.target.value)}
                className={MODAL_STYLES.select}
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className={MODAL_STYLES.label}>
              {locale === 'ar' ? 'اسم العضو الكامل' : 'Full Name'}
            </label>
            <input
              type="text"
              required
              value={form.displayName}
              onChange={(e) => updateField('displayName', e.target.value)}
              placeholder={locale === 'ar' ? 'مثال: أحمد مصطفى' : 'e.g. John Doe'}
              className={MODAL_STYLES.input}
            />
          </div>

          <div>
            <label className={MODAL_STYLES.label}>
              {locale === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
              placeholder="colleague@example.com"
              className={MODAL_STYLES.input}
            />
          </div>

          <div>
            <label className={MODAL_STYLES.label}>
              {locale === 'ar' ? 'المسمى الوظيفي (يستخدمه الـ AI لتوزيع المهام)' : 'Job Title (Used by AI for task assignments)'}
            </label>
            <input
              type="text"
              required
              value={form.jobTitle}
              onChange={(e) => updateField('jobTitle', e.target.value)}
              placeholder={locale === 'ar' ? 'مثال: UI/UX Designer' : 'e.g. UI/UX Designer'}
              className={MODAL_STYLES.input}
            />
            <PresetPills onSelect={(title) => updateField('jobTitle', title)} />
          </div>

          <div className={MODAL_STYLES.footer}>
            <button type="button" onClick={onClose} className={MODAL_STYLES.cancelBtn}>
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={MODAL_STYLES.submitBtn}
            >
              {isSubmitting ? (
                <span>{locale === 'ar' ? 'جاري الإضافة...' : 'Adding...'}</span>
              ) : (
                <span>{locale === 'ar' ? 'إضافة العضو' : 'Add Member'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
