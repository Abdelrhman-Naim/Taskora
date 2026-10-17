'use client';

import React from 'react';
import { Icon, IconName } from './Icon';
import styles from './IconButton.module.css';

export interface IconButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'aria-label'> {
  icon: IconName;
  label: string;
  size?: 'sm' | 'md';
  variant?: 'ghost' | 'secondary' | 'danger';
}

export function IconButton({
  icon,
  label,
  size = 'md',
  variant = 'ghost',
  className = '',
  disabled,
  ...rest
}: IconButtonProps): React.ReactElement {
  const classes = `${styles.iconButton} ${styles[size]} ${styles[variant]} ${className}`.trim();

  return (
    <button
      {...rest}
      type="button"
      disabled={disabled}
      aria-label={label}
      title={label}
      className={classes}
    >
      <Icon name={icon} size={size === 'sm' ? 16 : 18} />
    </button>
  );
}
