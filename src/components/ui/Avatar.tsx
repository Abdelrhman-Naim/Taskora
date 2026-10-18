import React from 'react';
import styles from './Avatar.module.css';

export interface AvatarProps {
  name: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function getInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '?';
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    const chars = Array.from(parts[0]);
    return (chars[0] || '?').toUpperCase();
  }
  const first = Array.from(parts[0])[0] || '';
  const last = Array.from(parts[parts.length - 1])[0] || '';
  return (first + last).toUpperCase();
}

export function Avatar({ name, size = 'md', className }: AvatarProps): React.ReactElement {
  const initials = getInitials(name);
  const sizeClass = size === 'sm' ? styles.sm : styles.md;
  const classes = [styles.avatar, sizeClass, className].filter(Boolean).join(' ');

  return (
    <span
      className={classes}
      aria-hidden="true"
      title={name}
    >
      <bdi>{initials}</bdi>
    </span>
  );
}
