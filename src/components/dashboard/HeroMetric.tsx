import React from 'react';
import { Metrics } from '@/lib/dashboardMetrics';
import { useI18n } from '@/i18n/I18nProvider';
import styles from './HeroMetric.module.css';

export interface HeroMetricProps {
  metrics: Metrics;
}

export function HeroMetric({ metrics }: HeroMetricProps): React.ReactElement {
  const { t } = useI18n();

  const rate = Number.isFinite(metrics.completionRate) ? metrics.completionRate : 0;

  return (
    <section
      data-testid="hero-metric"
      className={styles.heroMetric}
      aria-label={t('dashboard.kpi.completed')}
    >
      <div className={styles.mainRow}>
        <span className={`${styles.numeral} num`}>{rate}%</span>
        <span className={styles.label}>{t('dashboard.kpi.completed')}</span>
      </div>

      <div className={styles.rule} aria-hidden="true" />

      <div className={styles.breakdown}>
        <div className={styles.breakdownItem}>
          <span>{t('dashboard.kpi.open')}:</span>
          <span className={`${styles.breakdownNum} num`}>{metrics.open}</span>
        </div>
        <div className={styles.breakdownItem}>
          <span>{t('dashboard.kpi.inProgress')}:</span>
          <span className={`${styles.breakdownNum} num`}>{metrics.inProgress}</span>
        </div>
        <div className={`${styles.breakdownItem} ${metrics.overdue > 0 ? styles.overdueItem : ''}`}>
          <span>{t('dashboard.kpi.overdue')}:</span>
          <span className={`${styles.breakdownNum} num`}>{metrics.overdue}</span>
        </div>
        <div className={styles.breakdownItem}>
          <span>{t('dashboard.stats.total')}:</span>
          <span className={`${styles.breakdownNum} num`}>{metrics.total}</span>
        </div>
      </div>
    </section>
  );
}
