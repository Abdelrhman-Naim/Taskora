'use client';

// ============================================================================
// ZONE 1: IMPORTS
// ============================================================================
import React, { useState } from 'react';
import { Project, ProjectMemberProfile } from '@/types';
import { TeamMemberAccount } from './TeamMembersCard';
import { JOB_TITLE_PRESETS } from './AddMemberModal';
import {
  updateProjectMemberProfile,
  removeProjectMember,
  addProjectMemberProfile,
} from '@/services/projects';
import { getDb } from '@/lib/firebase';
import { useI18n } from '@/i18n/I18nProvider';
import { useErrorMessage } from '@/i18n/useErrorMessage';
import { Icon } from '@/components/ui/Icon';

// ============================================================================
// ZONE 2: CONFIG & STYLES (EASY EDIT ZONE)
// ============================================================================
const MODAL_STYLES = {
  backdrop: 'fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm',
  container: 'w-full max-w-lg rounded-xl border border-line bg-surface p-5 sm:p-6 shadow-2xl flex flex-col gap-4 text-text max-h-[92vh] overflow-y-auto',
  header: 'flex items-center justify-between border-b border-line pb-3',
  title: 'text-base sm:text-lg font-semibold text-text flex items-center gap-2',
  label: 'text-xs font-semibold uppercase tracking-wider text-text-2 mb-1 block',
  input: 'w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-text placeholder:text-text-3 focus:border-accent focus:outline-none min-h-[42px]',
  presetButton: 'text-xs px-2.5 py-1.5 rounded-full border border-line bg-surface hover:border-accent hover:text-accent transition-colors min-h-[32px] flex items-center cursor-pointer',
  footer: 'flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-3 border-t border-line mt-2',
  cancelBtn: 'px-4 py-2 text-sm font-medium text-text-2 hover:text-text transition-colors min-h-[44px] flex items-center justify-center rounded-lg hover:bg-surface cursor-pointer',
  submitBtn: 'px-5 py-2 text-sm font-semibold rounded-lg bg-accent text-on-accent hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 min-h-[44px] cursor-pointer',
};

// ============================================================================
// ZONE 3: TYPES & INTERFACES
// ============================================================================
export interface EditMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: TeamMemberAccount | null;
  allProjects: Project[];
  onMemberUpdated?: () => void;
}

// ============================================================================
// ZONE 4: MAIN COMPONENT
// ============================================================================
export function EditMemberModal({
  isOpen,
  onClose,
  member,
  allProjects,
  onMemberUpdated,
}: EditMemberModalProps): React.ReactElement | null {
  const { locale } = useI18n();
  const getErrorMessage = useErrorMessage();
  const isAr = locale === 'ar';

  const [displayName, setDisplayName] = useState(() => member?.displayName || '');
  const [email, setEmail] = useState(() => member?.email || '');
  const [selectedRoles, setSelectedRoles] = useState<string[]>(() => {
    if (!member) return ['Frontend Developer'];
    if (member.jobTitles && member.jobTitles.length > 0) return member.jobTitles;
    return member.jobTitle
      ? member.jobTitle.split(/[,،;\n]+/).map((t) => t.trim()).filter(Boolean)
      : ['Team Member'];
  });
  const [customRoleInput, setCustomRoleInput] = useState('');
  const [assignedProjectIds, setAssignedProjectIds] = useState<string[]>(() =>
    member ? member.projects.map((p) => p.id) : []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !member) return null;

  function handleToggleRole(role: string) {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  }

  function handleAddCustomRole() {
    const trimmed = customRoleInput.trim();
    if (!trimmed) return;
    if (!selectedRoles.includes(trimmed)) {
      setSelectedRoles((prev) => [...prev, trimmed]);
    }
    setCustomRoleInput('');
  }

  function handleRemoveRole(role: string) {
    setSelectedRoles((prev) => prev.filter((r) => r !== role));
  }

  function handleToggleProject(projectId: string) {
    setAssignedProjectIds((prev) =>
      prev.includes(projectId) ? prev.filter((id) => id !== projectId) : [...prev, projectId]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!member) return;
    const currentMember = member;
    if (!displayName.trim() || !email.trim()) {
      setErrorMessage(isAr ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields');
      return;
    }
    if (assignedProjectIds.length === 0) {
      setErrorMessage(
        isAr
          ? 'يجب تحديد مشروع واحد على الأقل للعضو'
          : 'Please select at least one project for the member'
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const db = getDb();
      const finalRoleString = selectedRoles.join(', ') || 'Team Member';
      const initialProjectIds = currentMember.projects.map((p) => p.id);

      // 1. Projects to remove member from
      const projectsToRemove = initialProjectIds.filter(
        (pid) => !assignedProjectIds.includes(pid)
      );
      for (const pid of projectsToRemove) {
        await removeProjectMember(db, pid, currentMember.uid);
      }

      // 2. Projects to add member to (newly assigned)
      const projectsToAdd = assignedProjectIds.filter(
        (pid) => !initialProjectIds.includes(pid)
      );
      for (const pid of projectsToAdd) {
        const newProfile: ProjectMemberProfile = {
          uid: currentMember.uid,
          email: email.trim().toLowerCase(),
          displayName: displayName.trim(),
          jobTitle: finalRoleString,
          jobTitles: selectedRoles,
          role: 'member',
          addedAt: new Date().toISOString(),
        };
        await addProjectMemberProfile(db, pid, newProfile);
      }

      // 3. Projects that already had the member: update details
      const projectsToUpdate = assignedProjectIds.filter((pid) =>
        initialProjectIds.includes(pid)
      );
      for (const pid of projectsToUpdate) {
        await updateProjectMemberProfile(db, pid, currentMember.uid, {
          displayName: displayName.trim(),
          email: email.trim().toLowerCase(),
          jobTitle: finalRoleString,
          jobTitles: selectedRoles,
        });
      }

      onMemberUpdated?.();
      onClose();
    } catch (err: unknown) {
      setErrorMessage(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className={MODAL_STYLES.backdrop}
      role="dialog"
      aria-modal="true"
      data-testid="edit-member-modal"
    >
      <div className={MODAL_STYLES.container}>
        <div className={MODAL_STYLES.header}>
          <h2 className={MODAL_STYLES.title}>
            <Icon name="edit" size={18} />
            <span>
              {isAr ? `تعديل بيانات العضو: ${member.displayName}` : `Edit Member: ${member.displayName}`}
            </span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-text-2 hover:text-text transition-colors p-1"
            aria-label={isAr ? 'إغلاق' : 'Close'}
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-xs">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className={MODAL_STYLES.label}>
              {isAr ? 'اسم العضو الكامل' : 'Full Name'}
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className={MODAL_STYLES.input}
              required
            />
          </div>

          <div>
            <label className={MODAL_STYLES.label}>
              {isAr ? 'البريد الإلكتروني' : 'Email Address'}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={MODAL_STYLES.input}
              required
            />
          </div>

          {/* Job Titles / Multi-Roles */}
          <div>
            <label className={MODAL_STYLES.label}>
              {isAr
                ? 'المسميات الوظيفية (يمكن اختيار أكثر من مسمى)'
                : 'Job Roles (Select one or more)'}
            </label>

            <div className="flex flex-wrap gap-1.5 mb-2">
              {JOB_TITLE_PRESETS.map((title) => {
                const isSelected = selectedRoles.includes(title);
                return (
                  <button
                    key={title}
                    type="button"
                    onClick={() => handleToggleRole(title)}
                    className={`${MODAL_STYLES.presetButton} ${
                      isSelected
                        ? 'border-accent bg-accent/15 text-accent font-semibold shadow-sm'
                        : 'text-text-2 hover:border-line-hover'
                    }`}
                  >
                    {isSelected ? <span>✓ </span> : null}
                    <span>{title}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom Role Input */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customRoleInput}
                onChange={(e) => setCustomRoleInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomRole();
                  }
                }}
                placeholder={isAr ? 'أضف مسمى وظيفي آخر...' : 'Add custom job title...'}
                className="flex-1 rounded-lg border border-line bg-bg px-3 py-1.5 text-xs text-text placeholder:text-text-3 min-h-[36px]"
              />
              <button
                type="button"
                onClick={handleAddCustomRole}
                className="px-3 py-1.5 rounded-lg border border-line bg-surface text-xs font-semibold hover:border-accent hover:text-accent transition-colors min-h-[36px]"
              >
                {isAr ? 'إضافة' : 'Add'}
              </button>
            </div>

            {/* Selected Roles Chips */}
            {selectedRoles.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {selectedRoles.map((role) => (
                  <span
                    key={role}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-accent/10 border border-accent/20 text-accent font-medium"
                  >
                    <span>{role}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveRole(role)}
                      className="hover:opacity-75"
                      aria-label={isAr ? `إزالة ${role}` : `Remove ${role}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Assigned Projects Selector */}
          <div>
            <label className={MODAL_STYLES.label}>
              {isAr ? 'المشاريع المنضم إليها' : 'Assigned Projects'}
            </label>
            <div className="space-y-2 border border-line rounded-lg p-3 bg-bg max-h-40 overflow-y-auto">
              {allProjects.map((p) => {
                const isChecked = assignedProjectIds.includes(p.id);
                return (
                  <label
                    key={p.id}
                    className="flex items-center gap-2.5 text-xs text-text cursor-pointer hover:text-accent transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleProject(p.id)}
                      className="rounded border-line text-accent focus:ring-accent"
                    />
                    <span className="font-medium">{p.name}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className={MODAL_STYLES.footer}>
            <button type="button" onClick={onClose} className={MODAL_STYLES.cancelBtn}>
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={MODAL_STYLES.submitBtn}
              data-testid="save-edit-member-btn"
            >
              {isSubmitting ? (
                <span>{isAr ? 'جاري الحفظ...' : 'Saving...'}</span>
              ) : (
                <span>{isAr ? 'حفظ التعديلات' : 'Save Changes'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
