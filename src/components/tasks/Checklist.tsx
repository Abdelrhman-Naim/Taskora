'use client';

import React, { useState } from 'react';
import { ChecklistItem } from '@/types';
import { useI18n } from '@/i18n/I18nProvider';
import styles from './Checklist.module.css';

export interface ChecklistProps {
  items: ChecklistItem[];
  canEdit: boolean;
  currentUserId?: string;
  isOwner?: boolean;
  onChange: (items: ChecklistItem[]) => void;
  max?: number;
}

export function Checklist({
  items,
  canEdit,
  currentUserId,
  isOwner = false,
  onChange,
  max = 20,
}: ChecklistProps): React.ReactElement {
  const { t } = useI18n();
  const [newText, setNewText] = useState('');

  const doneCount = items.filter((i) => i.done).length;
  const isLimitReached = items.length >= max;

  // Detect if this checklist is for member assignment (contains member UIDs of length >= 20 without 'c-' prefix)
  const isSharedMemberChecklist = items.some(
    (i) => i.id && i.id.length >= 20 && !i.id.startsWith('c-')
  );

  const isItemTogglable = (item: ChecklistItem) => {
    if (!canEdit) return false;
    if (isOwner) return true;
    if (isSharedMemberChecklist) {
      // In a shared member task, members can ONLY toggle their own item
      return Boolean(currentUserId && item.id === currentUserId);
    }
    return canEdit;
  };

  const canDeleteItem = (_item: ChecklistItem) => {
    if (!canEdit) return false;
    if (isSharedMemberChecklist) {
      // Only owner can delete members from a shared task checklist
      return isOwner;
    }
    return canEdit;
  };

  const canAddItems = canEdit && (isOwner || !isSharedMemberChecklist);

  const handleToggle = (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item || !isItemTogglable(item)) return;
    const updated = items.map((i) =>
      i.id === id ? { ...i, done: !i.done } : i
    );
    onChange(updated);
  };

  const handleDelete = (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item || !canDeleteItem(item)) return;
    const updated = items.filter((i) => i.id !== id);
    onChange(updated);
  };

  const handleAddItem = () => {
    if (!canAddItems || isLimitReached) return;
    const trimmed = newText.trim();
    if (!trimmed) return;

    const newItem: ChecklistItem = {
      id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      text: trimmed,
      done: false,
    };

    onChange([...items, newItem]);
    setNewText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddItem();
    }
  };

  return (
    <div className={styles.checklistContainer} data-testid="task-checklist">
      <div className={styles.header}>
        <h4 className={styles.title}>{t('task.checklist.title')}</h4>
        <span className={styles.counter} dir="ltr">
          {doneCount}/{items.length}
        </span>
      </div>

      {items.length === 0 ? (
        <p className={styles.emptyText}>{t('task.checklist.empty')}</p>
      ) : (
        <ul className={styles.itemsList}>
          {items.map((item) => {
            const togglable = isItemTogglable(item);
            return (
              <li
                key={item.id}
                className={styles.item}
                data-testid={`checklist-item-${item.id}`}
              >
                <div className={styles.itemMain}>
                  <input
                    type="checkbox"
                    checked={item.done}
                    disabled={!togglable}
                    onChange={() => handleToggle(item.id)}
                    className={styles.checkbox}
                    aria-label={item.text}
                    title={!togglable ? t('task.checklist.onlySelf') : undefined}
                  />
                  <span
                    className={`${styles.itemText} ${item.done ? styles.itemDone : ''}`}
                    dir="auto"
                  >
                    <bdi>{item.text}</bdi>
                  </span>
                </div>
                {canDeleteItem(item) && (
                  <button
                    type="button"
                    data-testid={`checklist-delete-${item.id}`}
                    onClick={() => handleDelete(item.id)}
                    className={styles.deleteBtn}
                    aria-label={t('common.delete')}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {canAddItems && (
        <div className={styles.addForm}>
          <input
            type="text"
            data-testid="checklist-add-input"
            placeholder={t('task.checklist.placeholder')}
            value={newText}
            disabled={!canAddItems || isLimitReached}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={handleKeyDown}
            className={styles.addInput}
            maxLength={120}
          />
          <button
            type="button"
            disabled={!canAddItems || isLimitReached || !newText.trim()}
            onClick={handleAddItem}
            className={styles.addBtn}
          >
            {t('task.checklist.addItem')}
          </button>
        </div>
      )}
    </div>
  );
}
