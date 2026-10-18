import React, { useState } from 'react';
import Link from 'next/link';
import { ChartTooltip } from './ChartTooltip';
import styles from './StackedBars.module.css';

export interface Series {
  key: string;
  label: string;
  color: string;
}

export interface StackedBarRow {
  id: string;
  label: string;
  href?: string;
  values: Record<string, number>;
}

export interface StackedBarsProps {
  rows: StackedBarRow[];
  series: Series[];
  ariaLabel: string;
}

export function StackedBars({
  rows,
  series,
  ariaLabel,
}: StackedBarsProps): React.ReactElement {
  const [activeTooltip, setActiveTooltip] = useState<{
    text: string;
    rect: DOMRect | null;
  } | null>(null);

  const totals = rows.map((r) =>
    series.reduce((sum, s) => sum + (r.values[s.key] || 0), 0)
  );
  const maxTotal = Math.max(...totals, 1);

  return (
    <div
      className={styles.container}
      role="region"
      aria-label={ariaLabel}
    >
      {rows.map((row, idx) => {
        const rowTotal = totals[idx];
        const barWidthPercent = (rowTotal / maxTotal) * 100;

        const details = series
          .filter((s) => (row.values[s.key] || 0) > 0)
          .map((s) => `${row.values[s.key]} ${s.label}`);

        const rowAriaLabel = `${row.label}: ${details.join(', ') || '0 tasks'}`;

        const handleFocusOrHover = (e: React.SyntheticEvent<HTMLElement>) => {
          const rect = e.currentTarget.getBoundingClientRect();
          setActiveTooltip({
            text: rowAriaLabel,
            rect,
          });
        };

        const handleBlurOrLeave = () => {
          setActiveTooltip(null);
        };

        return (
          <div
            key={row.id}
            tabIndex={0}
            className={styles.row}
            aria-label={rowAriaLabel}
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
            <div className={styles.labelCol} title={row.label}>
              {row.href ? (
                <Link href={row.href} className={styles.labelLink}>
                  <bdi>{row.label}</bdi>
                </Link>
              ) : (
                <bdi>{row.label}</bdi>
              )}
            </div>

            <div className={styles.trackContainer}>
              <div
                className={styles.track}
                style={{ inlineSize: `${Math.max(barWidthPercent, 4)}%` }}
              >
                {series.map((s) => {
                  const val = row.values[s.key] || 0;
                  if (val <= 0 || rowTotal <= 0) return null;
                  const slicePercent = (val / rowTotal) * 100;

                  return (
                    <div
                      key={s.key}
                      className={styles.slice}
                      style={{
                        inlineSize: `${slicePercent}%`,
                        backgroundColor: s.color,
                      }}
                      title={`${s.label}: ${val}`}
                    />
                  );
                })}
              </div>

              <span className={styles.total}>{rowTotal}</span>
            </div>
          </div>
        );
      })}

      <ChartTooltip
        visible={Boolean(activeTooltip)}
        content={activeTooltip?.text}
        anchorRect={activeTooltip?.rect || null}
        onClose={() => setActiveTooltip(null)}
      />
    </div>
  );
}
