import React from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import styles from './DashboardSkeleton.module.css';

export function DashboardSkeleton(): React.ReactElement {
  const { t } = useI18n();

  return (
    <div
      className={styles.container}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={t('common.loading')}
    >
      {/* Header skeleton */}
      <div className={styles.headerSkeleton}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div className={styles.bone} style={{ inlineSize: '16rem', blockSize: '2rem' }} />
          <div className={styles.bone} style={{ inlineSize: '10rem', blockSize: '1rem' }} />
        </div>
        <div className={styles.bone} style={{ inlineSize: '8rem', blockSize: '2.5rem' }} />
      </div>

      {/* KPI strip skeleton */}
      <div className={styles.kpiStrip}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className={styles.kpiCell}>
            <div className={styles.bone} style={{ inlineSize: '60%', blockSize: '0.875rem' }} />
            <div className={styles.bone} style={{ inlineSize: '40%', blockSize: '1.75rem' }} />
          </div>
        ))}
      </div>

      {/* Grid: Charts */}
      <div className={styles.grid}>
        <div className={`${styles.col7} ${styles.card}`}>
          <div className={styles.bone} style={{ inlineSize: '40%', blockSize: '1.25rem' }} />
          <div className={styles.bone} style={{ inlineSize: '100%', blockSize: '10rem' }} />
        </div>
        <div className={`${styles.col5} ${styles.card}`}>
          <div className={styles.bone} style={{ inlineSize: '40%', blockSize: '1.25rem' }} />
          <div className={styles.bone} style={{ inlineSize: '100%', blockSize: '10rem' }} />
        </div>

        {/* Attention & My Tasks */}
        <div className={`${styles.col6} ${styles.card}`}>
          <div className={styles.bone} style={{ inlineSize: '35%', blockSize: '1.25rem' }} />
          <div className={styles.bone} style={{ inlineSize: '100%', blockSize: '8rem' }} />
        </div>
        <div className={`${styles.col6} ${styles.card}`}>
          <div className={styles.bone} style={{ inlineSize: '35%', blockSize: '1.25rem' }} />
          <div className={styles.bone} style={{ inlineSize: '100%', blockSize: '8rem' }} />
        </div>

        {/* Projects Table */}
        <div className={`${styles.col12} ${styles.card}`}>
          <div className={styles.bone} style={{ inlineSize: '25%', blockSize: '1.25rem' }} />
          <div className={styles.bone} style={{ inlineSize: '100%', blockSize: '12rem' }} />
        </div>
      </div>
    </div>
  );
}
