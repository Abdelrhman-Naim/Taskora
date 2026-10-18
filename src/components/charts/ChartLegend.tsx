import React from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import styles from './ChartLegend.module.css';

export interface LegendSeries {
  key: string;
  label: string;
  color: string;
}

export interface ChartLegendProps {
  series: LegendSeries[];
  ariaLabel?: string;
}

export function ChartLegend({ series, ariaLabel }: ChartLegendProps): React.ReactElement | null {
  const { t } = useI18n();
  if (!series || series.length === 0) return null;

  return (
    <div className={styles.legend} role="list" aria-label={ariaLabel || t('dashboard.chartLegend')}>
      {series.map((s) => (
        <div key={s.key} className={styles.item} role="listitem">
          <span
            className={styles.swatch}
            style={{ backgroundColor: s.color }}
            aria-hidden="true"
          />
          <span>{s.label}</span>
        </div>
      ))}
    </div>
  );
}
