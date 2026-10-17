import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { FilterBar } from '@/components/tasks/FilterBar';
import { TaskFilters, DEFAULT_FILTERS } from '@/lib/taskFilters';

describe('FilterBar Component', () => {
  const members = {
    'user-alice': 'Alice Smith',
    'user-bob': 'Bob Jones',
  };

  const initialFilters: TaskFilters = {
    status: 'all',
    priority: 'all',
    assigneeId: 'all',
    search: '',
    overdueOnly: false,
  };

  it('renders all filter controls with associated accessible labels', () => {
    render(
      <FilterBar
        filters={initialFilters}
        onChange={vi.fn()}
        members={members}
      />
    );

    // Labels
    expect(screen.getByLabelText(/search/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/priority/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/assignee/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/overdue only/i)).toBeInTheDocument();

    // Reset button
    expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument();
  });

  it('populates assignee dropdown with All, Unassigned, and member names', () => {
    render(
      <FilterBar
        filters={initialFilters}
        onChange={vi.fn()}
        members={members}
      />
    );

    const assigneeSelect = screen.getByLabelText(/assignee/i) as HTMLSelectElement;
    const optionValues = Array.from(assigneeSelect.options).map((o) => o.value);
    expect(optionValues).toContain('all');
    expect(optionValues).toContain('unassigned');
    expect(optionValues).toContain('user-alice');
    expect(optionValues).toContain('user-bob');

    expect(screen.getByRole('option', { name: /Alice Smith/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Bob Jones/i })).toBeInTheDocument();
  });

  it('calls onChange with updated search query when input changes', () => {
    const handleChange = vi.fn();
    render(
      <FilterBar
        filters={initialFilters}
        onChange={handleChange}
        members={members}
      />
    );

    const searchInput = screen.getByLabelText(/search/i);
    fireEvent.change(searchInput, { target: { value: 'navbar' } });

    expect(handleChange).toHaveBeenCalledWith({
      ...initialFilters,
      search: 'navbar',
    });
  });

  it('calls onChange with updated status when status dropdown changes', () => {
    const handleChange = vi.fn();
    render(
      <FilterBar
        filters={initialFilters}
        onChange={handleChange}
        members={members}
      />
    );

    const statusSelect = screen.getByLabelText(/status/i);
    fireEvent.change(statusSelect, { target: { value: 'in_progress' } });

    expect(handleChange).toHaveBeenCalledWith({
      ...initialFilters,
      status: 'in_progress',
    });
  });

  it('calls onChange with updated priority when priority dropdown changes', () => {
    const handleChange = vi.fn();
    render(
      <FilterBar
        filters={initialFilters}
        onChange={handleChange}
        members={members}
      />
    );

    const prioritySelect = screen.getByLabelText(/priority/i);
    fireEvent.change(prioritySelect, { target: { value: 'high' } });

    expect(handleChange).toHaveBeenCalledWith({
      ...initialFilters,
      priority: 'high',
    });
  });

  it('calls onChange with updated assigneeId when assignee dropdown changes', () => {
    const handleChange = vi.fn();
    render(
      <FilterBar
        filters={initialFilters}
        onChange={handleChange}
        members={members}
      />
    );

    const assigneeSelect = screen.getByLabelText(/assignee/i);
    fireEvent.change(assigneeSelect, { target: { value: 'unassigned' } });

    expect(handleChange).toHaveBeenCalledWith({
      ...initialFilters,
      assigneeId: 'unassigned',
    });
  });

  it('calls onChange with updated overdueOnly when overdue checkbox toggles', () => {
    const handleChange = vi.fn();
    render(
      <FilterBar
        filters={initialFilters}
        onChange={handleChange}
        members={members}
      />
    );

    const overdueCheckbox = screen.getByLabelText(/overdue only/i);
    fireEvent.click(overdueCheckbox);

    expect(handleChange).toHaveBeenCalledWith({
      ...initialFilters,
      overdueOnly: true,
    });
  });

  it('resets filters to DEFAULT_FILTERS when Reset button is clicked', () => {
    const handleChange = vi.fn();
    const handleReset = vi.fn();

    const modifiedFilters: TaskFilters = {
      status: 'todo',
      priority: 'high',
      assigneeId: 'user-alice',
      search: 'something',
      overdueOnly: true,
    };

    render(
      <FilterBar
        filters={modifiedFilters}
        onChange={handleChange}
        members={members}
        onReset={handleReset}
      />
    );

    const resetBtn = screen.getByRole('button', { name: /reset/i });
    fireEvent.click(resetBtn);

    expect(handleChange).toHaveBeenCalledWith(DEFAULT_FILTERS);
    expect(handleReset).toHaveBeenCalledTimes(1);
  });
});
