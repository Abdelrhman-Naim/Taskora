'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Task, TaskStatus } from '@/types';
import { useI18n } from '@/i18n/I18nProvider';
import styles from './StatusMenu.module.css';

const STATUS_OPTIONS: { value: TaskStatus; labelKey: 'task.status.todo' | 'task.status.in_progress' | 'task.status.done' }[] = [
  { value: 'todo', labelKey: 'task.status.todo' },
  { value: 'in_progress', labelKey: 'task.status.in_progress' },
  { value: 'done', labelKey: 'task.status.done' },
];

export interface StatusMenuProps {
  task: Task;
  canChange: boolean;
  onStatusChange: (task: Task, newStatus: TaskStatus) => void;
}

export function StatusMenu({
  task,
  canChange,
  onStatusChange,
}: StatusMenuProps): React.ReactElement {
  const { t } = useI18n();
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [menuCoords, setMenuCoords] = useState<{ top: number; left: number; minWidth: number }>({
    top: 0,
    left: 0,
    minWidth: 140,
  });
  const statusSelectRef = useRef<HTMLSelectElement>(null);
  const statusMenuRef = useRef<HTMLDivElement>(null);

  const openStatusMenu = () => {
    if (!statusSelectRef.current || !canChange) return;
    const rect = statusSelectRef.current.getBoundingClientRect();
    const isRtl = typeof document !== 'undefined' && document.documentElement.dir === 'rtl';
    const menuWidth = Math.max(rect.width, 140);
    const spaceBelow = window.innerHeight - rect.bottom;
    const menuHeight = 135;

    const top =
      spaceBelow < menuHeight && rect.top > menuHeight
        ? rect.top - menuHeight - 4
        : rect.bottom + 4;

    const left = isRtl
      ? Math.max(8, rect.right - menuWidth)
      : Math.min(window.innerWidth - menuWidth - 8, rect.left);

    setMenuCoords({
      top,
      left,
      minWidth: menuWidth,
    });
    setIsStatusOpen(true);
  };

  const handleSelectMouseDown = (e: React.MouseEvent) => {
    if (!canChange) return;
    if (e.button === 0) {
      e.preventDefault();
      if (isStatusOpen) {
        setIsStatusOpen(false);
      } else {
        openStatusMenu();
      }
    }
  };

  const handleSelectKeyDown = (e: React.KeyboardEvent) => {
    if (!canChange) return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (isStatusOpen) {
        setIsStatusOpen(false);
      } else {
        openStatusMenu();
      }
    } else if (e.key === 'Escape') {
      setIsStatusOpen(false);
    }
  };

  useEffect(() => {
    if (!isStatusOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        statusSelectRef.current &&
        !statusSelectRef.current.contains(e.target as Node) &&
        statusMenuRef.current &&
        !statusMenuRef.current.contains(e.target as Node)
      ) {
        setIsStatusOpen(false);
      }
    };
    const handleScroll = () => setIsStatusOpen(false);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsStatusOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isStatusOpen]);

  return (
    <>
      <select
        ref={statusSelectRef}
        id={`status-select-${task.id}`}
        data-testid="task-status-select"
        aria-label={t('task.field.status')}
        value={task.status}
        disabled={!canChange}
        onChange={(e) => onStatusChange(task, e.target.value as TaskStatus)}
        onMouseDown={handleSelectMouseDown}
        onKeyDown={handleSelectKeyDown}
        className={styles.statusSelect}
      >
        <option value="todo">{t('task.status.todo')}</option>
        <option value="in_progress">{t('task.status.in_progress')}</option>
        <option value="done">{t('task.status.done')}</option>
      </select>

      {isStatusOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={statusMenuRef}
            className={styles.statusMenu}
            role="menu"
            style={{
              top: `${menuCoords.top}px`,
              left: `${menuCoords.left}px`,
              minWidth: `${menuCoords.minWidth}px`,
            }}
          >
            {STATUS_OPTIONS.map((opt) => {
              const isActive = task.status === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="menuitem"
                  className={`${styles.statusMenuItem} ${isActive ? styles.statusMenuItemActive : ''}`}
                  onClick={() => {
                    setIsStatusOpen(false);
                    if (task.status !== opt.value) {
                      onStatusChange(task, opt.value);
                    }
                  }}
                >
                  <span>{t(opt.labelKey)}</span>
                  {isActive && (
                    <span className={styles.statusMenuCheck} aria-hidden="true">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                  )}
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </>
  );
}
