import React from 'react';
import styles from './Skeleton.module.css';

export interface SkeletonProps {
  width?: string;
  height?: string;
  className?: string;
}

export function Skeleton({
  width = '100%',
  height = '20px',
  className = '',
}: SkeletonProps): React.ReactElement {
  return (
    <span
      className={`${styles.skeleton} ${className}`.trim()}
      style={{ inlineSize: width, blockSize: height }}
      aria-hidden="true"
    />
  );
}
