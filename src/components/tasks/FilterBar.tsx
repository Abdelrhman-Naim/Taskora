'use client';

import React from 'react';
import { TaskFilters, DEFAULT_FILTERS } from '@/lib/taskFilters';
import { TaskPriority, TaskStatus } from '@/types';
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
}: FilterBarProps) {
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
    <div className={styles.container} role="search" aria-label="Task filters">
      {/* Search Input */}
      <div className={styles.fieldGrow}>
        <label htmlFor="filter-search" className={styles.label}>
          Search
        </label>
        <input
          id="filter-search"
          type="text"
          className={styles.input}
          placeholder="Search tasks by title..."
          value={filters.search}
          onChange={handleSearchChange}
        />
      </div>

      {/* Status Filter */}
      <div className={styles.field}>
        <label htmlFor="filter-status" className={styles.label}>
          Status
        </label>
        <select
          id="filter-status"
          className={styles.select}
          value={filters.status}
          onChange={handleStatusChange}
        >
          <option value="all">All</option>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
        </select>
      </div>

      {/* Priority Filter */}
      <div className={styles.field}>
        <label htmlFor="filter-priority" className={styles.label}>
          Priority
        </label>
        <select
          id="filter-priority"
          className={styles.select}
          value={filters.priority}
          onChange={handlePriorityChange}
        >
          <option value="all">All</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      {/* Assignee Filter */}
      <div className={styles.field}>
        <label htmlFor="filter-assignee" className={styles.label}>
          Assignee
        </label>
        <select
          id="filter-assignee"
          className={styles.select}
          value={filters.assigneeId}
          onChange={handleAssigneeChange}
        >
          <option value="all">All</option>
          <option value="unassigned">Unassigned</option>
          {Object.entries(members).map(([uid, name]) => (
            <option key={uid} value={uid}>
              {name}
            </option>
          ))}
        </select>
      </div>

      {/* Overdue Only Checkbox */}
      <div className={styles.checkboxContainer}>
        <label htmlFor="filter-overdue" className={styles.checkboxLabel}>
          <input
            id="filter-overdue"
            type="checkbox"
            className={styles.checkbox}
            checked={filters.overdueOnly}
            onChange={handleOverdueChange}
          />
          Overdue only
        </label>
      </div>

      {/* Reset Button */}
      <div className={styles.actions}>
        <button
          type="button"
          onClick={handleReset}
          className={styles.resetBtn}
        >
          Reset
        </button>
      </div>
    </div>
  );
}
