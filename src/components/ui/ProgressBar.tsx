import React from 'react';
import styles from './ProgressBar.module.css';

export interface ProgressBarProps {
  value: number;
  max: number;
  label: string;
  className?: string;
}

export function ProgressBar({
  value,
  max,
  label,
  className = '',
}: ProgressBarProps): React.ReactElement {
  const safeMax = max > 0 ? max : 1;
  const percentage = Math.min(100, Math.max(0, Math.round((value / safeMax) * 100)));

  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
      className={`${styles.track} ${className}`.trim()}
    >
      <div className={styles.fill} style={{ inlineSize: `${percentage}%` }} />
    </div>
  );
}
