import React from 'react';
import { Icon, IconName } from '@/components/ui/Icon';
import styles from './HBars.module.css';

export interface HBarRow {
  id: string;
  label: string;
  value: number;
  icon?: IconName;
}

export interface HBarsProps {
  rows: HBarRow[];
  ariaLabel: string;
}

export function HBars({ rows, ariaLabel }: HBarsProps): React.ReactElement {
  const maxValue = Math.max(...rows.map((r) => r.value), 1);

  return (
    <div className={styles.container} role="region" aria-label={ariaLabel}>
      {rows.map((row) => {
        const widthPercent = (row.value / maxValue) * 100;
        const rowAriaLabel = `${row.label}: ${row.value}`;

        return (
          <div
            key={row.id}
            tabIndex={0}
            role="img"
            className={styles.row}
            aria-label={rowAriaLabel}
          >
            <div className={styles.labelCol}>
              {row.icon && <Icon name={row.icon} size={14} />}
              <bdi>{row.label}</bdi>
            </div>

            <div className={styles.trackContainer}>
              <div
                className={styles.track}
                style={{ inlineSize: `${Math.max(widthPercent, 4)}%` }}
              />
              <span className={styles.total}>{row.value}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
