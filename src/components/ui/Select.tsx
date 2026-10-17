'use client';

import React from 'react';
import styles from './Select.module.css';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  id?: string;
  className?: string;
  children: React.ReactNode;
}

export function Select({ className = '', children, ...rest }: SelectProps): React.ReactElement {
  return (
    <div className={styles.selectWrapper}>
      <select className={`${styles.select} ${className}`.trim()} {...rest}>
        {children}
      </select>
      <svg
        className={styles.icon}
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </div>
  );
}
