'use client';

import React from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { useI18n } from '@/i18n/I18nProvider';
import styles from './ShortcutsDialog.module.css';

export interface ShortcutsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShortcutsDialog({ isOpen, onClose }: ShortcutsDialogProps): React.ReactElement | null {
  const { t } = useI18n();

  const shortcuts = [
    { key: 'N', desc: t('shortcuts.newTask') },
    { key: '/', desc: t('shortcuts.search') },
    { key: '?', desc: t('shortcuts.showShortcuts') },
    { key: '1', desc: t('shortcuts.listView') },
    { key: '2', desc: t('shortcuts.boardView') },
    { key: '3', desc: t('shortcuts.calendarView') },
    { key: 'Esc', desc: t('shortcuts.closeDialog') },
  ];

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={t('shortcuts.title')}
      size="md"
    >
      <div className={styles.container} data-testid="shortcuts-dialog">
        <ul className={styles.list}>
          {shortcuts.map(({ key, desc }) => (
            <li key={key} className={styles.item}>
              <span className={styles.description}>{desc}</span>
              <kbd className={styles.kbd}>{key}</kbd>
            </li>
          ))}
        </ul>
      </div>
    </Dialog>
  );
}
