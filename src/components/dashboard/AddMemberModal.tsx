'use client';

// ============================================================================
// ZONE 1: IMPORTS
// ============================================================================
import React, { useState, useMemo } from 'react';
import { Project, ProjectMemberProfile } from '@/types';
import { addProjectMemberProfile } from '@/services/projects';
import { getDb } from '@/lib/firebase';
import { useI18n } from '@/i18n/I18nProvider';
import { useErrorMessage } from '@/i18n/useErrorMessage';
import { Icon } from '@/components/ui/Icon';
import { Select } from '@/components/ui/Select';
import { extractTeamMembers, TeamMemberAccount } from './TeamMembersCard';

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
  container: 'w-full max-w-lg rounded-xl border border-line bg-surface p-5 sm:p-6 shadow-2xl flex flex-col gap-4 text-text max-h-[92vh] overflow-y-auto',
  header: 'flex items-center justify-between border-b border-line pb-3',
  title: 'text-base sm:text-lg font-semibold text-text flex items-center gap-2',
  label: 'text-xs font-semibold uppercase tracking-wider text-text-2 mb-1 block',
  input: 'w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-text placeholder:text-text-3 focus:border-accent focus:outline-none min-h-[42px]',
  select: 'w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-text focus:border-accent focus:outline-none min-h-[42px]',
  presetButton: 'text-xs px-2.5 py-1.5 rounded-full border border-line bg-surface hover:border-accent hover:text-accent transition-colors min-h-[32px] flex items-center cursor-pointer',
  footer: 'flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-3 border-t border-line mt-2',
  cancelBtn: 'px-4 py-2 text-sm font-medium text-text-2 hover:text-text transition-colors min-h-[44px] flex items-center justify-center rounded-lg hover:bg-surface cursor-pointer',
  submitBtn: 'px-5 py-2 text-sm font-semibold rounded-lg bg-accent text-on-accent hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 min-h-[44px] cursor-pointer',
};

// ============================================================================
// ZONE 3: TYPES & INTERFACES
// ============================================================================
export interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  defaultProjectId?: string;
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
  const sanitized = email.toLowerCase().replace(/[^a-z0-9]/g, '_');
  return `uid_${sanitized}`;
}

// ============================================================================
// ZONE 5: SUB-COMPONENTS
// ============================================================================
function PresetPills({
  selectedRoles,
  onToggle,
}: {
  selectedRoles: string[];
  onToggle: (title: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {JOB_TITLE_PRESETS.map((title) => {
        const isSelected = selectedRoles.includes(title);
        return (
          <button
            key={title}
            type="button"
            onClick={() => onToggle(title)}
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
  );
}

// ============================================================================
// ZONE 6: MAIN COMPONENT
// ============================================================================
export function AddMemberModal({
  isOpen,
  onClose,
  projects,
  defaultProjectId,
  onMemberAdded,
}: AddMemberModalProps): React.ReactElement | null {
  const { locale } = useI18n();
  const getErrorMessage = useErrorMessage();
  const isAr = locale === 'ar';

  const [form, setForm] = useState<MemberFormData>(() => ({
    projectId: defaultProjectId || projects[0]?.id || '',
    email: '',
    displayName: '',
    jobTitle: 'Frontend Developer',
  }));
  const [selectedRoles, setSelectedRoles] = useState<string[]>(['Frontend Developer']);
  const [customRoleInput, setCustomRoleInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const effectiveProjectId = form.projectId || defaultProjectId || projects[0]?.id || '';

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === effectiveProjectId) || projects[0],
    [projects, effectiveProjectId]
  );

  // All workspace team members across all projects
  const workspaceMembers: TeamMemberAccount[] = useMemo(
    () => extractTeamMembers(projects),
    [projects]
  );

  // Set of keys (UID and Email) for members currently in selectedProject
  const existingProjectMemberKeys = useMemo(() => {
    if (!selectedProject) return new Set<string>();
    const keys = new Set<string>();
    (selectedProject.memberIds || []).forEach((id) => keys.add(id));
    (selectedProject.memberProfiles || []).forEach((p) => {
      if (p.uid) keys.add(p.uid);
      if (p.email) keys.add(p.email.toLowerCase().trim());
    });
    return keys;
  }, [selectedProject]);

  if (!isOpen) return null;

  function updateField<K extends keyof MemberFormData>(field: K, value: MemberFormData[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

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

  function handleSelectExistingMember(identifier: string) {
    if (!identifier) return;
    const member = workspaceMembers.find(
      (m) => m.uid === identifier || m.email.toLowerCase().trim() === identifier.toLowerCase().trim()
    );
    if (!member) return;

    if (member.jobTitles && member.jobTitles.length > 0) {
      setSelectedRoles(member.jobTitles);
    } else if (member.jobTitle) {
      const parsedRoles = member.jobTitle
        .split(/[,،/]/)
        .map((r) => r.trim())
        .filter(Boolean);
      if (parsedRoles.length > 0) {
        setSelectedRoles(parsedRoles);
      }
    }

    setForm((prev) => ({
      ...prev,
      displayName: member.displayName,
      email: member.email,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!effectiveProjectId) {
      setErrorMessage(isAr ? 'يرجى اختيار المشروع' : 'Please select a project');
      return;
    }
    const joinedRoles = selectedRoles.join(', ').trim();
    if (!form.email || !form.displayName || !joinedRoles) {
      setErrorMessage(
        isAr
          ? 'يرجى تعبئة جميع الحقول واختيار مسمى وظيفي واحد على الأقل'
          : 'Please fill all fields and select at least one role'
      );
      return;
    }

    // Check if member is already in selected project
    const normEmail = form.email.trim().toLowerCase();
    if (existingProjectMemberKeys.has(normEmail)) {
      setErrorMessage(
        isAr
          ? 'هذا العضو منضم بالفعل لهذا المشروع'
          : 'This member is already joined in this project'
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const db = getDb();
      // Match existing workspace member UID if available, else generate UID
      const matchedWorkspaceMember = workspaceMembers.find(
        (m) => m.email.toLowerCase().trim() === normEmail
      );
      const uid = matchedWorkspaceMember ? matchedWorkspaceMember.uid : generateMemberUid(normEmail);

      const profile: ProjectMemberProfile = {
        uid,
        email: normEmail,
        displayName: form.displayName.trim(),
        jobTitle: joinedRoles,
        jobTitles: selectedRoles,
        role: 'member',
        addedAt: new Date().toISOString(),
      };

      await addProjectMemberProfile(db, effectiveProjectId, profile);
      onMemberAdded?.();
      onClose();
    } catch (err: unknown) {
      setErrorMessage(getErrorMessage(err));
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
            <span>{isAr ? 'إضافة عضو للفريق والمسمى الوظيفي' : 'Add Team Member & Role'}</span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-3 hover:text-text hover:bg-surface min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
            aria-label={isAr ? 'إغلاق' : 'Close'}
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {projects.length > 1 && (
            <div>
              <label className={MODAL_STYLES.label}>
                {isAr ? 'المشروع المراد إضافة العضو إليه' : 'Target Project'}
              </label>
              <Select
                value={effectiveProjectId}
                onChange={(e) => updateField('projectId', e.target.value)}
                className="w-full"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </div>
          )}

          {workspaceMembers.length > 0 && (
            <div>
              <label className={MODAL_STYLES.label}>
                {isAr ? 'اختيار من أعضاء الفريق المسجلين (اختياري)' : 'Pick Existing Member (Optional)'}
              </label>
              <Select
                defaultValue=""
                onChange={(e) => handleSelectExistingMember(e.target.value)}
                className="w-full"
              >
                <option value="">
                  {isAr
                    ? '-- أو اكتب بيانات عضو جديد بالأسفل --'
                    : '-- Or fill a new member below --'}
                </option>
                {workspaceMembers.map((m) => {
                  const isAlreadyJoined =
                    existingProjectMemberKeys.has(m.uid) ||
                    (m.email && existingProjectMemberKeys.has(m.email.toLowerCase().trim()));

                  if (isAlreadyJoined) {
                    return (
                      <option key={m.uid || m.email} value="" disabled>
                        ✓ {m.displayName} {m.email ? `(${m.email})` : ''} — {isAr ? '[منضم بالفعل لهذا المشروع]' : '[Already in this project]'}
                      </option>
                    );
                  }

                  const rolesText =
                    m.jobTitles && m.jobTitles.length > 0
                      ? m.jobTitles.join(', ')
                      : m.jobTitle;

                  return (
                    <option key={m.uid || m.email} value={m.uid || m.email}>
                      + {m.displayName} {m.email ? `(${m.email})` : ''} {rolesText ? `— ${rolesText}` : ''}
                    </option>
                  );
                })}
              </Select>
            </div>
          )}

          <div>
            <label className={MODAL_STYLES.label}>
              {isAr ? 'اسم العضو الكامل' : 'Full Name'}
            </label>
            <input
              type="text"
              required
              value={form.displayName}
              onChange={(e) => updateField('displayName', e.target.value)}
              placeholder={isAr ? 'مثال: أحمد مصطفى' : 'e.g. John Doe'}
              className={MODAL_STYLES.input}
            />
          </div>

          <div>
            <label className={MODAL_STYLES.label}>
              {isAr ? 'البريد الإلكتروني' : 'Email Address'}
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
              placeholder={isAr ? 'name@taskora.io' : 'name@taskora.io'}
              className={MODAL_STYLES.input}
            />
          </div>

          <div>
            <label className={MODAL_STYLES.label}>
              {isAr ? 'المسميات الوظيفية (يمكن اختيار أكثر من مسمى)' : 'Job Roles (Multiple Allowed)'}
            </label>

            {selectedRoles.length > 0 && (
              <div className="flex flex-wrap gap-1.5 p-2 rounded-lg border border-line bg-bg min-h-[42px] items-center">
                {selectedRoles.map((role) => (
                  <span
                    key={role}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-accent/20 text-accent border border-accent/30"
                  >
                    <span>{role}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveRole(role)}
                      className="hover:text-red-500 cursor-pointer text-xs font-bold"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            <PresetPills selectedRoles={selectedRoles} onToggle={handleToggleRole} />

            <div className="flex items-center gap-2 mt-2.5">
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
                placeholder={isAr ? 'أو اكتب مسمى وظيفي إضافي مخصص...' : 'Or type a custom role...'}
                className={MODAL_STYLES.input}
              />
              <button
                type="button"
                onClick={handleAddCustomRole}
                className="px-3 py-2 text-xs font-semibold rounded-lg border border-line bg-surface hover:border-accent hover:text-accent transition-colors min-h-[42px] shrink-0 cursor-pointer"
              >
                {isAr ? '+ إضافة مسمى' : '+ Add Role'}
              </button>
            </div>
          </div>

          <div className={MODAL_STYLES.footer}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className={MODAL_STYLES.cancelBtn}
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={MODAL_STYLES.submitBtn}
            >
              <Icon name="plus" size={14} />
              <span>
                {isSubmitting
                  ? (isAr ? 'جاري الإضافة...' : 'Adding...')
                  : (isAr ? 'إضافة العضو للمشروع' : 'Add Member to Project')}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
