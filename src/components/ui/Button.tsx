'use client';

import React, { forwardRef } from 'react';
import { Icon, IconName } from './Icon';
import styles from './Button.module.css';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
  loading?: boolean;
  icon?: IconName;
  children?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'secondary',
    size = 'md',
    loading = false,
    icon,
    children,
    disabled,
    className = '',
    ...rest
  },
  ref
): React.ReactElement {
  const isDisabled = disabled || loading;
  const classes = `${styles.button} ${styles[variant]} ${styles[size]} ${className}`.trim();

  return (
    <button
      {...rest}
      ref={ref}
      disabled={isDisabled}
      aria-busy={loading ? 'true' : undefined}
      className={classes}
    >
      {loading ? (
        <span className={styles.spinner} aria-hidden="true" />
      ) : icon ? (
        <Icon name={icon} size={size === 'sm' ? 14 : 16} />
      ) : null}
      {children}
    </button>
  );
});
