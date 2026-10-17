'use client';

import React, { useRef } from 'react';
import { Icon, IconName } from './Icon';
import styles from './Segmented.module.css';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: IconName;
  lang?: string;
}

export interface SegmentedProps<T extends string> {
  value: T;
  options: SegmentedOption<T>[];
  onChange(v: T): void;
  label: string;
  className?: string;
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
  className = '',
}: SegmentedProps<T>): React.ReactElement {
  const buttonsRef = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let nextIndex = index;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      nextIndex = (index + 1) % options.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      nextIndex = (index - 1 + options.length) % options.length;
    }

    if (nextIndex !== index) {
      const nextOpt = options[nextIndex];
      onChange(nextOpt.value);
      buttonsRef.current[nextIndex]?.focus();
    }
  };

  return (
    <div className={`${styles.segmented} ${className}`.trim()} role="radiogroup" aria-label={label}>
      {options.map((opt, i) => {
        const isSelected = value === opt.value;
        return (
          <button
            key={opt.value}
            ref={(el) => {
              buttonsRef.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={opt.label}
            lang={opt.lang}
            tabIndex={isSelected ? 0 : -1}
            className={`${styles.option} ${isSelected ? styles.selected : ''}`}
            onClick={() => onChange(opt.value)}
            onKeyDown={(e) => handleKeyDown(e, i)}
          >
            {opt.icon && <Icon name={opt.icon} size={14} />}
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
