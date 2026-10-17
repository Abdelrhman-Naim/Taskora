import React, { useState } from 'react';
import { Project } from '@/types';
import { Field } from '@/components/ui/Field';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { AppError } from '@/lib/errors';

interface MemberManagerProps {
  project: Project;
  onAddMember: (email: string) => Promise<void>;
  onRemoveMember: (uid: string) => Promise<{ unassigned: number } | void>;
  getAssignedTaskCount: (uid: string) => Promise<number>;
}

export function MemberManager({
  project,
  onAddMember,
  onRemoveMember,
  getAssignedTaskCount,
}: MemberManagerProps) {
  const [email, setEmail] = useState('');
  const [adding, setAdding] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const [memberToRemove, setMemberToRemove] = useState<{ uid: string; name: string } | null>(null);
  const [assignedCount, setAssignedCount] = useState<number>(0);
  const [loadingCount, setLoadingCount] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);

    const trimmed = email.trim();
    if (!trimmed) {
      setEmailError('Please enter an email address');
      return;
    }

    setAdding(true);
    try {
      await onAddMember(trimmed);
      setEmail('');
    } catch (err: unknown) {
      if (err instanceof AppError) {
        setEmailError(err.message);
      } else if (err && typeof err === 'object' && 'message' in err) {
        setEmailError((err as { message: string }).message);
      } else {
        setEmailError('Failed to add member');
      }
    } finally {
      setAdding(false);
    }
  };

  const handleInitiateRemove = async (uid: string, name: string) => {
    setLoadingCount(true);
    try {
      const count = await getAssignedTaskCount(uid);
      setAssignedCount(count);
      setMemberToRemove({ uid, name });
    } catch {
      setAssignedCount(0);
      setMemberToRemove({ uid, name });
    } finally {
      setLoadingCount(false);
    }
  };

  const handleConfirmRemove = async () => {
    if (!memberToRemove) return;
    try {
      await onRemoveMember(memberToRemove.uid);
      setMemberToRemove(null);
    } catch (err) {
      if (err instanceof AppError) {
        setEmailError(err.message);
      }
      setMemberToRemove(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '14px', color: 'var(--text-primary)' }}>
          Project Members ({project.memberIds.length})
        </h3>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '12px',
          }}
        >
          {project.memberIds.map((uid) => {
            const isOwner = uid === project.ownerId;
            const name = project.memberNames[uid] || uid;

            return (
              <div
                key={uid}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  backgroundColor: 'var(--bg)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>
                    {name}
                  </span>
                  {isOwner && (
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        padding: '2px 8px',
                        borderRadius: '999px',
                        backgroundColor: 'rgba(56, 189, 248, 0.15)',
                        color: 'var(--primary)',
                      }}
                    >
                      Owner
                    </span>
                  )}
                </div>

                {!isOwner && (
                  <button
                    type="button"
                    aria-label={`Remove ${name}`}
                    disabled={loadingCount}
                    onClick={() => handleInitiateRemove(uid, name)}
                    style={{
                      padding: '4px 12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      backgroundColor: 'transparent',
                      color: 'var(--danger)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: 'var(--radius-sm)',
                      cursor: loadingCount ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h4 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
          Add New Member
        </h4>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '240px' }}>
            <Field id="member-email" label="Member Email" error={emailError || undefined}>
              <input
                id="member-email"
                aria-label="Member Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@example.com"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                }}
              />
            </Field>
          </div>

          <button
            type="submit"
            disabled={adding}
            style={{
              padding: '10px 20px',
              backgroundColor: 'var(--primary)',
              color: 'var(--primary-fg)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 600,
              fontSize: '14px',
              cursor: adding ? 'not-allowed' : 'pointer',
              marginTop: '28px',
              opacity: adding ? 0.7 : 1,
            }}
          >
            {adding ? 'Adding...' : 'Add Member'}
          </button>
        </div>
      </form>

      {memberToRemove && (
        <ConfirmDialog
          isOpen={true}
          title="Remove Member"
          message={`Are you sure you want to remove ${memberToRemove.name}? ${assignedCount} assigned tasks will be unassigned.`}
          confirmLabel="Remove Member"
          isDangerous={true}
          onConfirm={handleConfirmRemove}
          onCancel={() => setMemberToRemove(null)}
        />
      )}
    </div>
  );
}
