'use client';

import React from 'react';
import styles from './Textarea.module.css';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  id?: string;
  className?: string;
}

export function Textarea({ className = '', dir = 'auto', ...rest }: TextareaProps): React.ReactElement {
  return (
    <textarea
      dir={dir}
      className={`${styles.textarea} ${className}`.trim()}
      {...rest}
    />
  );
}
