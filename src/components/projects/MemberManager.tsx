'use client';

import React, { useState } from 'react';
import { Project } from '@/types';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { useI18n } from '@/i18n/I18nProvider';
import { useErrorMessage } from '@/i18n/useErrorMessage';

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
}: MemberManagerProps): React.ReactElement {
  const { t } = useI18n();
  const getErrorMessage = useErrorMessage();
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
      setEmailError(t('validation.email.invalid'));
      return;
    }

    setAdding(true);
    try {
      await onAddMember(trimmed);
      setEmail('');
    } catch (err: unknown) {
      setEmailError(getErrorMessage(err));
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
      setEmailError(getErrorMessage(err));
      setMemberToRemove(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} data-testid="member-manager">
      <div>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBlockEnd: '14px', color: 'var(--text)' }}>
          {t('member.title')} ({project.memberIds.length})
        </h3>

        <div
          data-testid="member-list"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            backgroundColor: 'var(--surface-2)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '12px',
          }}
        >
          {project.memberIds.map((uid) => {
            const isOwner = uid === project.ownerId;
            const name = project.memberNames[uid] || uid;

            return (
              <div
                key={uid}
                data-testid="member-row"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingBlock: '10px',
                  paddingInline: '14px',
                  backgroundColor: 'var(--surface)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text)' }}>
                    <bdi>{name}</bdi>
                  </span>
                  {isOwner && (
                    <span
                      style={{
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        paddingBlock: '2px',
                        paddingInline: '8px',
                        borderRadius: '999px',
                        backgroundColor: 'var(--accent-soft)',
                        color: 'var(--accent-text)',
                      }}
                    >
                      {t('member.role.owner')}
                    </span>
                  )}
                </div>

                {!isOwner && (
                  <button
                    type="button"
                    aria-label={`${t('member.remove')} ${name}`}
                    disabled={loadingCount}
                    onClick={() => handleInitiateRemove(uid, name)}
                    style={{
                      paddingBlock: '4px',
                      paddingInline: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      backgroundColor: 'transparent',
                      color: 'var(--st-overdue-fg)',
                      border: '1px solid var(--st-overdue-fg)',
                      borderRadius: 'var(--radius-sm)',
                      cursor: loadingCount ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {t('member.remove')}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }} data-testid="add-member-form">
        <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text)' }}>
          {t('member.add')}
        </h4>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '240px' }}>
            <Field id="member-email" label={t('member.emailLabel')} error={emailError || undefined}>
              {(fieldProps) => (
                <Input
                  {...fieldProps}
                  type="email"
                  dir="ltr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('member.emailPlaceholder')}
                  disabled={adding}
                  autoComplete="email"
                  data-testid="add-member-input"
                />
              )}
            </Field>
          </div>

          <div style={{ marginBlockStart: '24px' }}>
            <Button
              type="submit"
              variant="primary"
              loading={adding}
              disabled={adding}
              data-testid="add-member-btn"
            >
              {t('member.add')}
            </Button>
          </div>
        </div>
      </form>

      {memberToRemove && (
        <Dialog
          isOpen={true}
          title={t('member.removeConfirmTitle')}
          message={t('member.removeConfirmMessage', {
            name: memberToRemove.name,
            count: assignedCount,
          })}
          confirmLabel={t('member.removeConfirmTitle')}
          cancelLabel={t('common.cancel')}
          isDangerous={true}
          onConfirm={handleConfirmRemove}
          onCancel={() => setMemberToRemove(null)}
        />
      )}
    </div>
  );
}
