'use client';

import React from 'react';
import styles from './Input.module.css';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id?: string;
  className?: string;
}

export function Input({ className = '', type, dir, ...rest }: InputProps): React.ReactElement {
  const isEmail = type === 'email';
  const effectiveDir = dir ?? (isEmail ? 'ltr' : undefined);

  return (
    <input
      type={type}
      dir={effectiveDir}
      className={`${styles.input} ${className}`.trim()}
      {...rest}
    />
  );
}
