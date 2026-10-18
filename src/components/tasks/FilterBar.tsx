'use client';

import React from 'react';
import { TaskFilters, DEFAULT_FILTERS } from '@/lib/taskFilters';
import { TaskPriority, TaskStatus } from '@/types';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { useI18n } from '@/i18n/I18nProvider';
import styles from './FilterBar.module.css';

export interface FilterBarProps {
  filters: TaskFilters;
  onChange: (filters: TaskFilters) => void;
  members: Record<string, string>;
  onReset?: () => void;
}

export function FilterBar({
  filters,
  onChange,
  members,
  onReset,
}: FilterBarProps): React.ReactElement {
  const { t } = useI18n();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...filters, search: e.target.value });
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...filters, status: e.target.value as TaskStatus | 'all' });
  };

  const handlePriorityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...filters, priority: e.target.value as TaskPriority | 'all' });
  };

  const handleAssigneeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...filters, assigneeId: e.target.value });
  };

  const handleOverdueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...filters, overdueOnly: e.target.checked });
  };

  const handleReset = () => {
    onChange(DEFAULT_FILTERS);
    if (onReset) {
      onReset();
    }
  };

  return (
    <div className={styles.container} role="search" aria-label={t('filter.label')} data-testid="filter-bar">
      {/* Search Input */}
      <div className={styles.field}>
        <label htmlFor="filter-search" className={styles.label}>
          {t('filter.searchLabel')}
        </label>
        <input
          id="filter-search"
          type="search"
          inputMode="search"
          dir="auto"
          className={styles.input}
          placeholder={t('filter.search')}
          value={filters.search}
          onChange={handleSearchChange}
        />
      </div>

      {/* Status Filter */}
      <div className={styles.field}>
        <label htmlFor="filter-status" className={styles.label}>
          {t('task.field.status')}
        </label>
        <select
          id="filter-status"
          className={styles.select}
          value={filters.status}
          onChange={handleStatusChange}
        >
          <option value="all">{t('common.all')}</option>
          <option value="todo">{t('task.status.todo')}</option>
          <option value="in_progress">{t('task.status.in_progress')}</option>
          <option value="done">{t('task.status.done')}</option>
        </select>
      </div>

      {/* Priority Filter */}
      <div className={styles.field}>
        <label htmlFor="filter-priority" className={styles.label}>
          {t('task.field.priority')}
        </label>
        <select
          id="filter-priority"
          className={styles.select}
          value={filters.priority}
          onChange={handlePriorityChange}
        >
          <option value="all">{t('common.all')}</option>
          <option value="low">{t('task.priority.low')}</option>
          <option value="medium">{t('task.priority.medium')}</option>
          <option value="high">{t('task.priority.high')}</option>
        </select>
      </div>

      {/* Assignee Filter */}
      <div className={styles.field}>
        <label htmlFor="filter-assignee" className={styles.label}>
          {t('task.field.assignee')}
        </label>
        <select
          id="filter-assignee"
          className={styles.select}
          value={filters.assigneeId}
          onChange={handleAssigneeChange}
        >
          <option value="all">{t('common.all')}</option>
          <option value="unassigned">{t('task.assignee.unassigned')}</option>
          {Object.entries(members).map(([uid, name]) => (
            <option key={uid} value={uid}>
              {name}
            </option>
          ))}
        </select>
      </div>

      {/* Overdue Only Checkbox */}
      <div className={styles.checkboxContainer}>
        <Checkbox
          id="filter-overdue"
          label={t('filter.overdueOnly')}
          checked={filters.overdueOnly}
          onChange={handleOverdueChange}
        />
      </div>

      {/* Reset Button */}
      <div className={styles.actions}>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleReset}
        >
          {t('filter.clear')}
        </Button>
      </div>
    </div>
  );
}
