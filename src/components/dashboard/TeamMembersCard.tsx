'use client';

// ============================================================================
// ZONE 1: IMPORTS
// ============================================================================
import React, { useState, useMemo } from 'react';
import { Project } from '@/types';
import { useI18n } from '@/i18n/I18nProvider';
import { Icon } from '@/components/ui/Icon';
import { AddMemberModal } from './AddMemberModal';

// ============================================================================
// ZONE 2: CONFIG & STYLES (EASY EDIT ZONE)
// ============================================================================
const CARD_STYLES = {
  container: 'w-full rounded-xl border border-line bg-surface p-5 shadow-sm text-text flex flex-col gap-4',
  header: 'flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-line',
  title: 'text-base font-semibold text-text flex items-center gap-2 m-0',
  addButton: 'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-accent text-on-accent hover:opacity-90 transition-opacity min-h-[36px]',
  memberRow: 'flex items-center justify-between p-3.5 rounded-lg border border-line bg-bg hover:border-line-hover transition-colors flex-wrap gap-3',
  avatar: 'w-9 h-9 rounded-full bg-accent/15 text-accent font-semibold text-xs flex items-center justify-center shrink-0 uppercase',
  jobBadge: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent/10 text-accent border border-accent/20',
  emptyState: 'py-8 text-center text-text-3 text-sm flex flex-col items-center gap-2',
};

// ============================================================================
// ZONE 3: TYPES & INTERFACES
// ============================================================================
export interface TeamMembersCardProps {
  projects: Project[];
  currentUserId?: string;
  onMemberAdded?: () => void;
}

export interface TeamMemberAccount {
  uid: string;
  displayName: string;
  email: string;
  jobTitle: string;
  role: 'owner' | 'member';
  projects: Array<{ id: string; name: string }>;
}

// ============================================================================
// ZONE 4: HELPERS & DERIVED STATE (DEDUPLICATION ENGINE)
// ============================================================================
export function extractTeamMembers(projects: Project[]): TeamMemberAccount[] {
  const map = new Map<string, TeamMemberAccount>();

  for (const proj of projects) {
    if (proj.memberProfiles && proj.memberProfiles.length > 0) {
      for (const prof of proj.memberProfiles) {
        const key = prof.email ? prof.email.toLowerCase().trim() : prof.uid;
        const existing = map.get(key);

        if (existing) {
          if (!existing.projects.some((p) => p.id === proj.id)) {
            existing.projects.push({ id: proj.id, name: proj.name });
          }
          if (prof.jobTitle && prof.jobTitle !== 'Team Member') {
            existing.jobTitle = prof.jobTitle;
          }
          if (prof.role === 'owner') {
            existing.role = 'owner';
          }
        } else {
          map.set(key, {
            uid: prof.uid,
            displayName: prof.displayName,
            email: prof.email,
            jobTitle: prof.jobTitle || 'Team Member',
            role: prof.role,
            projects: [{ id: proj.id, name: proj.name }],
          });
        }
      }
    } else if (proj.memberIds) {
      for (const mId of proj.memberIds) {
        const name = proj.memberNames?.[mId] || 'Team Member';
        const isOwner = mId === proj.ownerId;
        const email = `${name.toLowerCase().replace(/\s+/g, '.')}@taskora.io`;
        const key = mId;
        const existing = map.get(key);

        if (existing) {
          if (!existing.projects.some((p) => p.id === proj.id)) {
            existing.projects.push({ id: proj.id, name: proj.name });
          }
          if (isOwner) existing.role = 'owner';
        } else {
          map.set(key, {
            uid: mId,
            displayName: name,
            email,
            jobTitle: isOwner ? 'Project Manager' : 'Team Member',
            role: isOwner ? 'owner' : 'member',
            projects: [{ id: proj.id, name: proj.name }],
          });
        }
      }
    }
  }

  return Array.from(map.values());
}

// ============================================================================
// ZONE 5: SUB-COMPONENTS
// ============================================================================
function MemberItemRow({ member, isAr }: { member: TeamMemberAccount; isAr: boolean }) {
  const initials = member.displayName
    ? member.displayName.split(' ').map((n) => n[0]).join('').slice(0, 2)
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
        <span className={CARD_STYLES.jobBadge}>{member.jobTitle}</span>
        <span
          className="text-xs text-text-3 bg-surface px-2 py-0.5 rounded border border-line/60"
          title={member.projects.map((p) => p.name).join(', ')}
        >
          {projectSummary}
        </span>
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
}: TeamMembersCardProps): React.ReactElement {
  const { locale } = useI18n();
  const isAr = locale === 'ar';
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Derived state of unique team members (1 person = 1 row)
  const members = useMemo(() => extractTeamMembers(projects), [projects]);

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
          onClick={() => setIsModalOpen(true)}
          className={CARD_STYLES.addButton}
          data-testid="add-team-member-btn"
        >
          <Icon name="plus" size={14} />
          <span>{isAr ? 'إضافة عضو بمسمى وظيفي' : 'Add Team Member'}</span>
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {members.length === 0 ? (
          <div className={CARD_STYLES.emptyState}>
            <Icon name="users" size={28} />
            <span>{isAr ? 'لا يوجد أعضاء مضافين حتى الآن' : 'No team members added yet'}</span>
          </div>
        ) : (
          members.map((m) => <MemberItemRow key={m.email || m.uid} member={m} isAr={isAr} />)
        )}
      </div>

      <AddMemberModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        projects={projects}
        onMemberAdded={onMemberAdded}
      />
    </div>
  );
}
