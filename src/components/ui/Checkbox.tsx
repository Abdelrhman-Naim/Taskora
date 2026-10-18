import React, { InputHTMLAttributes, forwardRef } from 'react';
import styles from './Checkbox.module.css';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { id, label, className = '', disabled, ...rest },
  ref
) {
  return (
    <label
      htmlFor={id}
      className={`${styles.container} ${disabled ? styles.disabled : ''} ${className}`}
    >
      <input
        ref={ref}
        id={id}
        type="checkbox"
        disabled={disabled}
        className={styles.input}
        {...rest}
      />
      <span className={styles.box} aria-hidden="true">
        <svg
          className={styles.checkIcon}
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="2.5 6 4.8 8.5 9.5 3.5" />
        </svg>
      </span>
      {label && <span className={styles.label}>{label}</span>}
    </label>
  );
});
