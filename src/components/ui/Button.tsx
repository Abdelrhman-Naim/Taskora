'use client';

import React, { forwardRef } from 'react';
import Link from 'next/link';
import { Icon, IconName } from './Icon';
import styles from './Button.module.css';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
  loading?: boolean;
  icon?: IconName;
  children?: React.ReactNode;
  href?: string;
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
    href,
    ...rest
  },
  ref
): React.ReactElement {
  const isDisabled = disabled || loading;
  const classes = `${styles.button} ${styles[variant]} ${styles[size]} ${className}`.trim();

  if (href) {
    return (
      <Link href={href} className={classes} style={rest.style}>
        {icon ? <Icon name={icon} size={size === 'sm' ? 14 : 16} /> : null}
        {children}
      </Link>
    );
  }

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
