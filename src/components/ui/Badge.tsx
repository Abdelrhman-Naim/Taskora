'use client';

import React from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import { Icon } from './Icon';
import styles from './Badge.module.css';

export type BadgeKind = 'todo' | 'in_progress' | 'done' | 'overdue' | 'low' | 'medium' | 'high' | 'scheduled';

export interface BadgeProps {
  kind: BadgeKind;
  className?: string;
}

export function Badge({ kind, className = '' }: BadgeProps): React.ReactElement {
  const { t } = useI18n();

  const getDetails = () => {
    switch (kind) {
      case 'todo':
        return {
          text: t('task.status.todo'),
          icon: <span style={{ inlineSize: 6, blockSize: 6, borderRadius: '50%', backgroundColor: 'currentColor', display: 'inline-block' }} aria-hidden="true" />,
        };
      case 'in_progress':
        return {
          text: t('task.status.in_progress'),
          icon: <span style={{ inlineSize: 6, blockSize: 6, borderRadius: '50%', border: '1.5px solid currentColor', display: 'inline-block' }} aria-hidden="true" />,
        };
      case 'done':
        return {
          text: t('task.status.done'),
          icon: <Icon name="check" size={12} />,
        };
      case 'scheduled':
        return {
          text: t('task.recurrence.scheduledBadge'),
          icon: <Icon name="clock" size={12} />,
        };
      case 'overdue':
        return {
          text: t('task.status.overdue'),
          icon: <Icon name="clock" size={12} />,
        };
      case 'low':
        return {
          text: t('task.priority.low'),
          icon: <Icon name="bars" size={12} barsCount={1} />,
        };
      case 'medium':
        return {
          text: t('task.priority.medium'),
          icon: <Icon name="bars" size={12} barsCount={2} />,
        };
      case 'high':
        return {
          text: t('task.priority.high'),
          icon: <Icon name="bars" size={12} barsCount={3} />,
        };
    }
  };

  const { text, icon } = getDetails();

  return (
    <span className={`${styles.badge} ${styles[kind]} ${className}`.trim()}>
      <span className={styles.icon}>{icon}</span>
      <span>{text}</span>
    </span>
  );
}
