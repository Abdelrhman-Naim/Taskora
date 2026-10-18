import React from 'react';
import { Metrics } from '@/lib/dashboardMetrics';
import { useI18n } from '@/i18n/I18nProvider';
import { Icon } from '@/components/ui/Icon';
import styles from './KpiStrip.module.css';

export interface KpiStripProps {
  metrics: Metrics;
}

export function KpiStrip({ metrics }: KpiStripProps): React.ReactElement {
  const { t } = useI18n();

  return (
    <div
      data-testid="kpi-strip"
      className={styles.kpiStrip}
      role="region"
      aria-label={t('dashboard.kpi.region')}
    >
      {/* 1: Open Tasks */}
      <div className={styles.cell}>
        <div className={styles.cellHeader}>
          <span className={styles.cellLabel}>{t('dashboard.kpi.open')}</span>
        </div>
        <div className={styles.cellBody}>
          <span className={`${styles.cellValue} num`}>{metrics.open}</span>
          <span className={styles.cellSub}>
            {t('dashboard.kpi.ofTotal', { total: metrics.total.toString() })}
          </span>
        </div>
      </div>

      {/* 2: In Progress */}
      <div className={styles.cell}>
        <div className={styles.cellHeader}>
          <span className={styles.cellLabel}>{t('dashboard.kpi.inProgress')}</span>
        </div>
        <div className={styles.cellBody}>
          <span className={`${styles.cellValue} num`}>{metrics.inProgress}</span>
        </div>
      </div>

      {/* 3: Completed */}
      <div className={styles.cell}>
        <div className={styles.cellHeader}>
          <span className={styles.cellLabel}>{t('dashboard.kpi.completed')}</span>
        </div>
        <div className={styles.cellBody}>
          <span className={`${styles.cellValue} num`}>{metrics.completed}</span>
          <span className={styles.cellSub}>
            {t('dashboard.kpi.doneRate', { rate: metrics.completionRate.toString() })}
          </span>
        </div>
      </div>

      {/* 4: Overdue */}
      <div className={styles.cell} aria-label={t('dashboard.kpi.overdue')}>
        <div className={styles.cellHeader}>
          <span className={styles.cellLabel}>{t('dashboard.kpi.overdue')}</span>
          {metrics.overdue > 0 && (
            <span className={styles.alertIcon} aria-hidden="true">
              <Icon name="alert" size={16} />
            </span>
          )}
        </div>
        <div className={styles.cellBody}>
          <span className={`${styles.cellValue} num`}>{metrics.overdue}</span>
        </div>
        {metrics.overdue > 0 && (
          <div className={styles.alertBadge}>
            <span aria-hidden="true">⚠</span>
            <span>{t('dashboard.kpi.attention')}</span>
          </div>
        )}
      </div>

      {/* 5: Due This Week */}
      <div className={styles.cell}>
        <div className={styles.cellHeader}>
          <span className={styles.cellLabel}>{t('dashboard.kpi.dueThisWeek')}</span>
        </div>
        <div className={styles.cellBody}>
          <span className={`${styles.cellValue} num`}>{metrics.dueThisWeek}</span>
        </div>
      </div>
    </div>
  );
}
