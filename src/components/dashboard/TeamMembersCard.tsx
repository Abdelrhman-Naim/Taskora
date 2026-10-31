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
  addButton: 'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-accent text-on-accent hover:opacity-90 transition-opacity',
  memberRow: 'flex items-center justify-between p-3 rounded-lg border border-line bg-bg hover:border-line-hover transition-colors flex-wrap gap-2',
  avatar: 'w-8 h-8 rounded-full bg-accent/15 text-accent font-semibold text-xs flex items-center justify-center shrink-0 uppercase',
  jobBadge: 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-accent/10 text-accent border border-accent/20',
  emptyState: 'py-8 text-center text-text-3 text-sm flex flex-col items-center gap-2',
};

// ============================================================================
// ZONE 3: TYPES & INTERFACES
// ============================================================================
export interface TeamMembersCardProps {
  projects: Project[];
  currentUserId: string;
  onMemberAdded?: () => void;
}

interface FlattenedMember {
  uid: string;
  displayName: string;
  email: string;
  jobTitle: string;
  role: 'owner' | 'member';
  projectName: string;
}

// ============================================================================
// ZONE 4: HELPERS & DERIVED STATE
// ============================================================================
function extractTeamMembers(projects: Project[]): FlattenedMember[] {
  const map = new Map<string, FlattenedMember>();

  for (const proj of projects) {
    if (proj.memberProfiles && proj.memberProfiles.length > 0) {
      for (const prof of proj.memberProfiles) {
        if (!map.has(prof.uid)) {
          map.set(prof.uid, {
            uid: prof.uid,
            displayName: prof.displayName,
            email: prof.email,
            jobTitle: prof.jobTitle,
            role: prof.role,
            projectName: proj.name,
          });
        }
      }
    } else if (proj.memberIds) {
      for (const mId of proj.memberIds) {
        if (!map.has(mId)) {
          const name = proj.memberNames?.[mId] || 'Team Member';
          map.set(mId, {
            uid: mId,
            displayName: name,
            email: `${name.toLowerCase().replace(/\s+/g, '.')}@taskora.io`,
            jobTitle: mId === proj.ownerId ? 'Project Manager' : 'Team Member',
            role: mId === proj.ownerId ? 'owner' : 'member',
            projectName: proj.name,
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
function MemberItemRow({ member }: { member: FlattenedMember }) {
  const initials = member.displayName
    ? member.displayName.split(' ').map((n) => n[0]).join('').slice(0, 2)
    : 'TM';

  return (
    <div className={CARD_STYLES.memberRow}>
      <div className="flex items-center gap-3">
        <div className={CARD_STYLES.avatar}>{initials}</div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-text">{member.displayName}</span>
            {member.role === 'owner' && (
              <span className="text-[10px] uppercase font-bold text-accent bg-accent/15 px-1.5 py-0.5 rounded">
                Owner
              </span>
            )}
          </div>
          <span className="text-xs text-text-3">{member.email}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className={CARD_STYLES.jobBadge}>{member.jobTitle}</span>
        <span className="text-xs text-text-3 hidden sm:inline">({member.projectName})</span>
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
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Derived state of team members
  const members = useMemo(() => extractTeamMembers(projects), [projects]);

  return (
    <div className={CARD_STYLES.container} data-testid="team-members-card">
      <div className={CARD_STYLES.header}>
        <div className="flex items-center gap-2">
          <Icon name="users" size={18} />
          <h3 className={CARD_STYLES.title}>
            {locale === 'ar' ? 'أعضاء الفريق والمسؤوليات الوظيفية' : 'Team Directory & Job Roles'}
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
          <span>{locale === 'ar' ? 'إضافة عضو بمسمى وظيفي' : 'Add Team Member'}</span>
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {members.length === 0 ? (
          <div className={CARD_STYLES.emptyState}>
            <Icon name="users" size={28} />
            <span>{locale === 'ar' ? 'لا يوجد أعضاء مضافين حتى الآن' : 'No team members added yet'}</span>
          </div>
        ) : (
          members.map((m) => <MemberItemRow key={m.uid} member={m} />)
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
