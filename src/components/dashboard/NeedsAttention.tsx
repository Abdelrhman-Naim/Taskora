import React from 'react';
import Link from 'next/link';
import { needsAttention } from '@/lib/dashboardMetrics';
import { useI18n } from '@/i18n/I18nProvider';
import { Icon } from '@/components/ui/Icon';
import styles from './NeedsAttention.module.css';

export interface NeedsAttentionProps {
  items: ReturnType<typeof needsAttention>;
  projectName: (id: string) => string;
}

export function NeedsAttention({
  items,
  projectName,
}: NeedsAttentionProps): React.ReactElement {
  const { t, tp } = useI18n();

  return (
    <div
      data-testid="needs-attention"
      className={styles.panel}
      role="region"
      aria-label={t('dashboard.attention.title')}
    >
      <div className={styles.header}>
        <div className={styles.title}>
          <Icon name="alert" size={18} className={styles.alertIcon} />
          <span>{t('dashboard.attention.title')}</span>
          {items.length > 0 && (
            <span className={`${styles.countBadge} num`}>{items.length}</span>
          )}
        </div>
      </div>

      {items.length === 0 ? (
        <div className={styles.empty}>{t('dashboard.attention.empty')}</div>
      ) : (
        <ul className={styles.list}>
          {items.map((item) => {
            let badgeClass = styles.badgeTomorrow;
            let labelText = '';

            if (item.kind === 'overdue') {
              badgeClass = styles.badgeOverdue;
              labelText = tp('relative.overdueDays', item.days, {
                count: item.days.toString(),
              });
            } else if (item.kind === 'today') {
              badgeClass = styles.badgeToday;
              labelText = t('dashboard.attention.dueToday');
            } else {
              badgeClass = styles.badgeTomorrow;
              labelText = t('dashboard.attention.dueTomorrow');
            }

            return (
              <li key={item.task.id}>
                <Link
                  href={`/projects/${item.task.projectId}`}
                  className={styles.item}
                >
                  <div className={styles.itemMain}>
                    <span className={styles.taskTitle}>
                      <bdi dir="auto">{item.task.title}</bdi>
                    </span>
                    <div className={styles.taskMeta}>
                      <span className={styles.projectName}>
                        <bdi>{projectName(item.task.projectId)}</bdi>
                      </span>
                    </div>
                  </div>
                  <span className={`${styles.badge} ${badgeClass}`}>
                    {item.kind === 'overdue' && <span aria-hidden="true">⚠ </span>}
                    <span className="num">{labelText}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
