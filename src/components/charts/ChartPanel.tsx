import React, { useState } from 'react';
import { ChartLegend, LegendSeries } from './ChartLegend';
import { ChartTable, ChartTableData } from './ChartTable';
import { useI18n } from '@/i18n/I18nProvider';
import styles from './ChartPanel.module.css';

export interface ChartPanelProps {
  title: string;
  subtitle?: string;
  legend?: LegendSeries[];
  table: ChartTableData;
  children: React.ReactNode;
}

export function ChartPanel({
  title,
  subtitle,
  legend,
  table,
  children,
}: ChartPanelProps): React.ReactElement {
  const { t } = useI18n();
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');

  const viewAsTableText = t('dashboard.viewAsTable') || 'View as table';
  const viewAsChartText = t('dashboard.viewAsChart') || 'View as chart';

  return (
    <section className={styles.panel} aria-label={title}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <h3 className={styles.title}>{title}</h3>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>

        <div className={styles.controls}>
          {legend && viewMode === 'chart' && <ChartLegend series={legend} />}

          <button
            type="button"
            className={styles.toggleBtn}
            onClick={() => setViewMode(viewMode === 'chart' ? 'table' : 'chart')}
            aria-label={viewMode === 'chart' ? viewAsTableText : viewAsChartText}
          >
            {viewMode === 'chart' ? viewAsTableText : viewAsChartText}
          </button>
        </div>
      </div>

      <div className={styles.content}>
        {viewMode === 'chart' ? children : <ChartTable data={table} caption={title} />}
      </div>
    </section>
  );
}
