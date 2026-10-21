import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { renderWithProviders } from '../helpers/render';
import { Checklist } from '@/components/tasks/Checklist';
import { ChecklistItem } from '@/types';

describe('Checklist Component (Task 56)', () => {
  const initialItems: ChecklistItem[] = [
    { id: 'item-1', text: 'First subtask', done: false },
    { id: 'item-2', text: 'Second subtask', done: true },
  ];

  it('renders items and progress counter', () => {
    renderWithProviders(
      <Checklist items={initialItems} canEdit={true} onChange={vi.fn()} />
    );

    expect(screen.getByTestId('task-checklist')).toBeInTheDocument();
    expect(screen.getByText('First subtask')).toBeInTheDocument();
    expect(screen.getByText('Second subtask')).toBeInTheDocument();
    // Progress counter shows 1/2
    expect(screen.getByText('1/2')).toBeInTheDocument();
  });

  it('pressing Enter in add input calls onChange with new item (done: false, non-empty id)', () => {
    const handleChange = vi.fn();
    renderWithProviders(
      <Checklist items={initialItems} canEdit={true} onChange={handleChange} />
    );

    const input = screen.getByTestId('checklist-add-input');
    fireEvent.change(input, { target: { value: 'New third subtask' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(handleChange).toHaveBeenCalledTimes(1);
    const updated = handleChange.mock.calls[0][0] as ChecklistItem[];
    expect(updated).toHaveLength(3);
    expect(updated[2].text).toBe('New third subtask');
    expect(updated[2].done).toBe(false);
    expect(updated[2].id).toBeTruthy();
  });

  it('clicking checkbox toggles done state', () => {
    const handleChange = vi.fn();
    renderWithProviders(
      <Checklist items={initialItems} canEdit={true} onChange={handleChange} />
    );

    const item1 = screen.getByTestId('checklist-item-item-1');
    const checkbox = item1.querySelector('input[type="checkbox"]')!;
    fireEvent.click(checkbox);

    expect(handleChange).toHaveBeenCalledTimes(1);
    const updated = handleChange.mock.calls[0][0] as ChecklistItem[];
    expect(updated[0].done).toBe(true);
  });

  it('clicking delete button removes the item', () => {
    const handleChange = vi.fn();
    renderWithProviders(
      <Checklist items={initialItems} canEdit={true} onChange={handleChange} />
    );

    const deleteBtn = screen.getByTestId('checklist-delete-item-1');
    fireEvent.click(deleteBtn);

    expect(handleChange).toHaveBeenCalledTimes(1);
    const updated = handleChange.mock.calls[0][0] as ChecklistItem[];
    expect(updated).toHaveLength(1);
    expect(updated[0].id).toBe('item-2');
  });

  it('disables add input when items.length === max (default 20)', () => {
    const twentyItems: ChecklistItem[] = Array.from({ length: 20 }, (_, i) => ({
      id: `c-${i}`,
      text: `Item ${i}`,
      done: false,
    }));

    renderWithProviders(
      <Checklist items={twentyItems} canEdit={true} onChange={vi.fn()} />
    );

    const input = screen.getByTestId('checklist-add-input');
    expect(input).toBeDisabled();
  });

  it('when canEdit=false, all controls are disabled but counter done/total remains visible', () => {
    renderWithProviders(
      <Checklist items={initialItems} canEdit={false} onChange={vi.fn()} />
    );

    // Counter visible
    expect(screen.getByText('1/2')).toBeInTheDocument();

    // Checkboxes disabled
    const checkboxes = screen.getAllByRole('checkbox');
    checkboxes.forEach((cb) => {
      expect(cb).toBeDisabled();
    });

    // Add input is either disabled or absent
    const input = screen.queryByTestId('checklist-add-input');
    if (input) {
      expect(input).toBeDisabled();
    }
  });
});
