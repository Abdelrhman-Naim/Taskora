'use client';

// ============================================================================
// ZONE 1: IMPORTS
// ============================================================================
import React, { useState, useMemo } from 'react';
import { Project } from '@/types';
import { useI18n } from '@/i18n/I18nProvider';
import { useErrorMessage } from '@/i18n/useErrorMessage';
import { Icon } from '@/components/ui/Icon';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { AddMemberModal } from './AddMemberModal';
import { EditMemberModal } from './EditMemberModal';
import { removeMemberAcrossProjects } from '@/services/projects';
import { getDb } from '@/lib/firebase';

// ============================================================================
// ZONE 2: CONFIGURATION & STYLES (EASY EDIT ZONE)
// ============================================================================
const CARD_STYLES = {
  container: 'w-full rounded-xl border border-line bg-surface p-4 sm:p-5 shadow-sm text-text flex flex-col gap-4',
  header: 'flex items-center justify-between border-b border-line pb-3 flex-wrap gap-2',
  title: 'text-sm sm:text-base font-semibold text-text flex items-center gap-2',
  addButton: 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-on-accent text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer min-h-[36px]',
  memberRow: 'flex items-center justify-between p-3 rounded-lg border border-line bg-bg hover:border-line-hover transition-colors flex-wrap gap-2.5',
  avatar: 'w-9 h-9 rounded-full bg-accent/20 text-accent font-bold text-xs flex items-center justify-center shrink-0 border border-accent/30',
  jobBadge: 'inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-surface border border-line text-text-2',
  emptyState: 'flex flex-col items-center justify-center py-6 text-center text-text-3 gap-2',
  actionBtn: 'p-1.5 rounded-md hover:bg-surface text-text-3 hover:text-text transition-colors cursor-pointer min-w-[32px] min-h-[32px] flex items-center justify-center border border-line/50',
};

// ============================================================================
// ZONE 3: TYPES & INTERFACES
// ============================================================================
export interface TeamMembersCardProps {
  projects: Project[];
  onMemberAdded?: () => void;
  onMemberUpdated?: () => void;
  currentUserId?: string;
  currentUserEmail?: string;
  isOwner?: boolean;
}

export interface TeamMemberAccount {
  uid: string;
  displayName: string;
  email: string;
  jobTitle: string;
  jobTitles?: string[];
  role: 'owner' | 'member';
  projects: Array<{ id: string; name: string }>;
}

// ============================================================================
// ZONE 4: HELPERS & DERIVED STATE (DEDUPLICATION ENGINE)
// ============================================================================
export function extractTeamMembers(projects: Project[]): TeamMemberAccount[] {
  const accountsByEmail = new Map<string, TeamMemberAccount>();
  const accountsByUid = new Map<string, TeamMemberAccount>();
  const accountsByName = new Map<string, TeamMemberAccount>();

  for (const proj of projects) {
    const profiles = Array.isArray(proj.memberProfiles) ? proj.memberProfiles : [];
    const memberIds = Array.isArray(proj.memberIds) ? proj.memberIds : [];

    const allUids = new Set<string>();
    profiles.forEach((p) => {
      if (p.uid) allUids.add(p.uid);
    });
    memberIds.forEach((id) => {
      if (id) allUids.add(id);
    });

    for (const uid of allUids) {
      const prof = profiles.find((p) => p.uid === uid);
      const isOwner = uid === proj.ownerId;
      const rawName =
        prof?.displayName?.trim() ||
        proj.memberNames?.[uid]?.trim() ||
        (isOwner ? 'Owner User' : 'Team Member');
      const normName = rawName.toLowerCase().trim();
      const rawEmail =
        prof?.email?.trim().toLowerCase() ||
        (isOwner
          ? 'owner.user@taskora.io'
          : `${normName.replace(/\s+/g, '.')}@taskora.io`);
      const normEmail = rawEmail.toLowerCase().trim();
      const jobTitle = prof?.jobTitle || (isOwner ? 'Project Manager' : 'Team Member');
      const jobTitles =
        prof?.jobTitles && prof.jobTitles.length > 0
          ? prof.jobTitles
          : prof?.jobTitle
          ? prof.jobTitle.split(/[,،;\n]+/).map((t) => t.trim()).filter(Boolean)
          : [jobTitle];

      let existing =
        (normEmail ? accountsByEmail.get(normEmail) : null) ||
        (uid ? accountsByUid.get(uid) : null) ||
        (normName ? accountsByName.get(normName) : null);

      if (existing) {
        if (!existing.projects.some((p) => p.id === proj.id)) {
          existing.projects.push({ id: proj.id, name: proj.name });
        }
        if (prof?.jobTitle && prof.jobTitle !== 'Team Member') {
          existing.jobTitle = prof.jobTitle;
        }
        if (jobTitles && jobTitles.length > 0) {
          const combined = Array.from(new Set([...(existing.jobTitles || []), ...jobTitles]));
          existing.jobTitles = combined;
        }
        if (isOwner || prof?.role === 'owner') {
          existing.role = 'owner';
        }
        if (rawEmail && !existing.email.includes('@taskora.io') && rawEmail.includes('@')) {
          existing.email = rawEmail;
        }
        if (existing.email) accountsByEmail.set(existing.email.toLowerCase().trim(), existing);
        if (existing.uid) accountsByUid.set(existing.uid, existing);
        if (uid) accountsByUid.set(uid, existing);
        if (normName) accountsByName.set(normName, existing);
      } else {
        const account: TeamMemberAccount = {
          uid,
          displayName: rawName,
          email: rawEmail,
          jobTitle,
          jobTitles,
          role: isOwner || prof?.role === 'owner' ? 'owner' : 'member',
          projects: [{ id: proj.id, name: proj.name }],
        };
        if (normEmail) accountsByEmail.set(normEmail, account);
        if (uid) accountsByUid.set(uid, account);
        if (normName) accountsByName.set(normName, account);
      }
    }
  }

  return Array.from(new Set(accountsByEmail.values()));
}

// ============================================================================
// ZONE 5: SUB-COMPONENTS
// ============================================================================
function MemberItemRow({
  member,
  isAr,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: {
  member: TeamMemberAccount;
  isAr: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (m: TeamMemberAccount) => void;
  onDelete: (m: TeamMemberAccount) => void;
}) {
  const initials = member.displayName
    ? member.displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
    : 'TM';

  const projectsCount = member.projects.length;
  const projectSummary =
    projectsCount === 1
      ? member.projects[0].name
      : isAr
      ? `${projectsCount} مشاريع`
      : `${projectsCount} projects`;

  return (
    <div className={CARD_STYLES.memberRow} data-testid={`member-row-${member.uid}`}>
      <div className="flex items-center gap-3 min-w-0">
        <div className={CARD_STYLES.avatar}>{initials}</div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-text truncate">{member.displayName}</span>
            {member.role === 'owner' && (
              <span className="text-[10px] uppercase font-bold text-accent bg-accent/15 px-1.5 py-0.5 rounded">
                Owner
              </span>
            )}
          </div>
          <span className="text-xs text-text-3 truncate">{member.email}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap shrink-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          {(member.jobTitles && member.jobTitles.length > 0
            ? member.jobTitles
            : member.jobTitle
            ? member.jobTitle.split(/[,،;\n]+/).map((t: string) => t.trim()).filter(Boolean)
            : ['Team Member']
          ).map((role: string) => (
            <span key={role} className={CARD_STYLES.jobBadge}>
              {role}
            </span>
          ))}
        </div>
        <span
          className="text-xs text-text-3 bg-surface px-2 py-0.5 rounded border border-line/60"
          title={member.projects.map((p) => p.name).join(', ')}
        >
          {projectSummary}
        </span>

        {(canEdit || canDelete) && (
          <div className="flex items-center gap-1 ms-1">
            {canEdit && (
              <button
                type="button"
                onClick={() => onEdit(member)}
                className={CARD_STYLES.actionBtn}
                title={isAr ? 'تعديل بيانات العضو' : 'Edit Member'}
                aria-label={isAr ? 'تعديل' : 'Edit'}
                data-testid={`edit-member-${member.uid}`}
              >
                <Icon name="edit" size={14} />
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                onClick={() => onDelete(member)}
                className={`${CARD_STYLES.actionBtn} hover:text-red-500 hover:border-red-500/40`}
                title={isAr ? 'حذف العضو من الفريق' : 'Remove Member'}
                aria-label={isAr ? 'حذف' : 'Delete'}
                data-testid={`delete-member-${member.uid}`}
              >
                <Icon name="trash" size={14} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// ZONE 6: MAIN COMPONENT
// ============================================================================
export function TeamMembersCard({
  projects,
  onMemberAdded,
  onMemberUpdated,
  currentUserId = '',
  currentUserEmail = '',
  isOwner = true,
}: TeamMembersCardProps): React.ReactElement {
  const { locale } = useI18n();
  const getErrorMessage = useErrorMessage();
  const isAr = locale === 'ar';

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMemberAccount | null>(null);
  const [deletingMember, setDeletingMember] = useState<TeamMemberAccount | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Derived state of unique team members (1 person = 1 row)
  const members = useMemo(() => extractTeamMembers(projects), [projects]);

  async function handleConfirmDelete() {
    if (!deletingMember) return;
    setIsDeleting(true);
    setActionError(null);

    try {
      const db = getDb();
      const projectIds = deletingMember.projects.map((p) => p.id);
      await removeMemberAcrossProjects(db, projectIds, deletingMember.uid);

      setDeletingMember(null);
      onMemberUpdated?.();
      onMemberAdded?.();
    } catch (err: unknown) {
      setActionError(getErrorMessage(err));
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className={CARD_STYLES.container} data-testid="team-members-card">
      <div className={CARD_STYLES.header}>
        <div className="flex items-center gap-2">
          <Icon name="users" size={18} />
          <h3 className={CARD_STYLES.title}>
            {isAr ? 'دليل أعضاء الفريق والمسميات الوظيفية' : 'Team Directory & Job Roles'}
          </h3>
          <span className="text-xs text-text-3">({members.length})</span>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className={CARD_STYLES.addButton}
          data-testid="add-team-member-btn"
        >
          <Icon name="plus" size={14} />
          <span>{isAr ? 'إضافة عضو بمسمى وظيفي' : 'Add Team Member'}</span>
        </button>
      </div>

      {actionError && (
        <div className="p-2.5 rounded bg-red-500/10 border border-red-500/20 text-red-500 text-xs">
          {actionError}
        </div>
      )}

      <div className="flex flex-col gap-2">
        {members.length === 0 ? (
          <div className={CARD_STYLES.emptyState}>
            <Icon name="users" size={28} />
            <span>{isAr ? 'لا يوجد أعضاء مضافين حتى الآن' : 'No team members added yet'}</span>
          </div>
        ) : (
          members.map((m) => {
            const isSelf = Boolean(
              (currentUserId && m.uid === currentUserId) ||
              (currentUserEmail && m.email && m.email.toLowerCase() === currentUserEmail.toLowerCase())
            );
            const canEdit = isOwner || isSelf;
            const canDelete = isOwner && !isSelf;
            return (
              <MemberItemRow
                key={m.email || m.uid}
                member={m}
                isAr={isAr}
                canEdit={canEdit}
                canDelete={canDelete}
                onEdit={(target) => setEditingMember(target)}
                onDelete={(target) => setDeletingMember(target)}
              />
            );
          })
        )}
      </div>

      {/* Add Member Modal */}
      <AddMemberModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        projects={projects}
        onMemberAdded={() => {
          onMemberAdded?.();
          onMemberUpdated?.();
        }}
      />

      {/* Edit Member Modal */}
      {editingMember && (
        <EditMemberModal
          isOpen={Boolean(editingMember)}
          onClose={() => setEditingMember(null)}
          member={editingMember}
          allProjects={projects}
          onMemberUpdated={() => {
            setEditingMember(null);
            onMemberUpdated?.();
            onMemberAdded?.();
          }}
        />
      )}

      {/* Delete Member Confirmation Dialog */}
      {deletingMember && (
        <ConfirmDialog
          isOpen={Boolean(deletingMember)}
          title={isAr ? 'تأكيد إزالة العضو' : 'Confirm Member Removal'}
          message={
            isAr
              ? `هل أنت متأكد من إزالة العضو "${deletingMember.displayName}" (${deletingMember.email}) من كافة المشاريع المعين بها؟`
              : `Are you sure you want to remove "${deletingMember.displayName}" from all assigned projects?`
          }
          confirmLabel={isDeleting ? (isAr ? 'جاري الإزالة...' : 'Removing...') : (isAr ? 'نعم، إزالة العضو' : 'Yes, Remove')}
          cancelLabel={isAr ? 'إلغاء' : 'Cancel'}
          isDangerous={true}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingMember(null)}
        />
      )}
    </div>
  );
}
