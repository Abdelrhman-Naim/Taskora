import React, { useState } from 'react';
import { ChartTooltip } from './ChartTooltip';
import styles from './ColumnChart.module.css';

export interface ColumnBucket {
  id: string;
  label: string;
  value: number;
  highlight?: boolean;
  tone?: 'neutral' | 'overdue';
}

export interface ColumnChartProps {
  buckets: ColumnBucket[];
  ariaLabel: string;
  valueLabel: string;
}

function formatDisplayValue(val: number): string {
  if (val >= 1000) {
    return (val / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return String(val);
}

export function ColumnChart({
  buckets,
  ariaLabel,
  valueLabel,
}: ColumnChartProps): React.ReactElement {
  const [activeTooltip, setActiveTooltip] = useState<{
    text: string;
    rect: DOMRect | null;
  } | null>(null);

  const allZero = buckets.length === 0 || buckets.every((b) => b.value === 0);

  if (allZero) {
    return (
      <div className={styles.container} role="region" aria-label={ariaLabel}>
        <div className={styles.empty}>
          <p>No upcoming tasks in the next 14 days</p>
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...buckets.map((b) => b.value), 1);

  return (
    <div className={styles.container} role="region" aria-label={ariaLabel}>
      <div className={styles.chartArea}>
        {buckets.map((b) => {
          const heightPercent = b.value === 0 ? 0 : Math.max(6, (b.value / maxValue) * 100);
          const fullNumber = new Intl.NumberFormat('en-US').format(b.value);
          const barAriaLabel = `${b.label}: ${fullNumber} ${valueLabel}`;

          const handleFocusOrHover = (e: React.SyntheticEvent<HTMLElement>) => {
            const rect = e.currentTarget.getBoundingClientRect();
            setActiveTooltip({
              text: barAriaLabel,
              rect,
            });
          };

          const handleBlurOrLeave = () => {
            setActiveTooltip(null);
          };

          const barToneClass =
            b.tone === 'overdue'
              ? styles.overdue
              : b.highlight
              ? styles.highlight
              : '';

          return (
            <div
              key={b.id}
              tabIndex={0}
              className={styles.colWrapper}
              aria-label={barAriaLabel}
              onMouseEnter={handleFocusOrHover}
              onMouseLeave={handleBlurOrLeave}
              onFocus={handleFocusOrHover}
              onBlur={handleBlurOrLeave}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setActiveTooltip(null);
                }
              }}
            >
              {b.value > 0 ? (
                <span className={styles.valueText} aria-hidden="true">
                  {formatDisplayValue(b.value)}
                </span>
              ) : null}

              <div className={styles.barTrack}>
                <div
                  className={`${styles.bar} ${barToneClass}`}
                  style={{
                    blockSize: `${heightPercent}%`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.axisLabels} aria-hidden="true">
        {buckets.map((b) => (
          <span
            key={b.id}
            className={`${styles.axisLabel} ${b.highlight ? styles.highlightLabel : ''}`}
            title={b.label}
          >
            {b.label}
          </span>
        ))}
      </div>

      <ChartTooltip
        visible={Boolean(activeTooltip)}
        content={activeTooltip?.text}
        anchorRect={activeTooltip?.rect || null}
        onClose={() => setActiveTooltip(null)}
      />
    </div>
  );
}
